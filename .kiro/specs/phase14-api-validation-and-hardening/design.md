# 技術設計: Phase 14 - バリデーション契約の整備とAPIハードニング

## 設計方針の要点

- 書き込み系15エンドポイントに対応するFormRequestを`app/Http/Requests/`配下に新設し、Controller内の`$request->validate([...])`直書きを全廃する。ディレクトリ構成は既存の`Controllers`と対称にする（アカウント管理系のみ`Admin/`サブ名前空間、それ以外はフラット）。
- 対応言語の許可リストは`App\Enums\Language`（PHPネイティブbacked enum）に一元化し、`StoreLessonRequest`・`UpdateLessonRequest`・`ExecuteRequest`の3箇所が共有する。フロントの`frontend/src/lib/languages.ts`の`SupportedLanguage`と値を対にする（自動同期はしない。将来ズレたらphase13同様に手動で揃える運用）。
- `CodeExecutionService::$languages`との統合（Strategy/Factoryパターンへのリファクタ）は`tech.md`に書かれた将来課題であり、今回はスコープ外。バリデーション層のみを一元化する。
- レート制限はLaravel 11+の構成（`RouteServiceProvider`が存在しない）に合わせ、`AppServiceProvider::boot()`で`RateLimiter::for()`により名前付きリミッターを定義し、`routes/api.php`側で`throttle:名前`をルートグループに付与する。429レスポンスはLaravelの`ThrottleRequests`ミドルウェアの標準動作（`Retry-After`ヘッダ付き）をそのまま使い、カスタム実装はしない。
- `model_answer`の秘匿は`App\Http\Resources\LessonResource`（JsonResource）を新設し、認証ガードで出し分ける。学生向けの「模範解答を見る」は新規エンドポイント`GET /lessons/{id}/model-answer`から取得する形にフロントを変更する。
- 更新系（PUT）の`required`/`sometimes`不整合は、**全フィールドを`sometimes`に統一**する。管理画面は既に全フィールドを送っているため実UXへの影響はなく（フロントコード確認済み）、部分更新を許容する一貫したAPI契約にする。
- `CodeExecutionTest::test_returns_error_for_unsupported_language`は現在「200 + Service側エラー」を期待しているが、本設計により「422 + FormRequestバリデーションエラー」に変わる。**これは意図的な仕様変更**（要件US-2の「対応5言語に限定する」に明記）であり、テスト側を更新する。

---

## 1. FormRequestの導入

### 1.1 対象一覧とクラス配置

| # | エンドポイント | 新規FormRequestクラス |
|---|---|---|
| 1 | `POST /register` | `App\Http\Requests\RegisterRequest` |
| 2 | `POST /login` | `App\Http\Requests\LoginRequest` |
| 3 | `POST /admin/login` | `App\Http\Requests\AdminLoginRequest` |
| 4 | `POST /execute` | `App\Http\Requests\ExecuteRequest` |
| 5 | `POST /submissions` | `App\Http\Requests\StoreSubmissionRequest` |
| 6 | `POST /submissions/complete` | `App\Http\Requests\CompleteSubmissionRequest` |
| 7 | `POST /admin/admins` | `App\Http\Requests\Admin\StoreAdminRequest` |
| 8 | `POST /admin/users` | `App\Http\Requests\Admin\StoreUserRequest` |
| 9 | `PUT /admin/users/{id}` | `App\Http\Requests\Admin\UpdateUserRequest` |
| 10 | `POST /admin/lessons` | `App\Http\Requests\StoreLessonRequest` |
| 11 | `PUT /admin/lessons/{id}` | `App\Http\Requests\UpdateLessonRequest` |
| 12 | `POST /admin/categories` | `App\Http\Requests\StoreCategoryRequest` |
| 13 | `PUT /admin/categories/{id}` | `App\Http\Requests\UpdateCategoryRequest` |
| 14 | `POST /admin/materials` | `App\Http\Requests\StoreMaterialRequest` |
| 15 | `PUT /admin/materials/{id}` | `App\Http\Requests\UpdateMaterialRequest` |

Controller側は型ヒントを`Illuminate\Http\Request`から各FormRequestに差し替え、`$request->validated()`を使う。バリデーション失敗時の挙動（422 + `message`/`errors`構造）は`$request->validate()`と同じ`ValidationException`経路のため、現状のJSON構造は変わらない。

### 1.2 `authorize()`の方針

- **公開エンドポイント**（register / login / admin-login）: `authorize()`は`true`を返し、「未認証で誰でも叩けるのは意図通り」とコメントを残す。
- **認証必須エンドポイント**（それ以外14件）: ルート側の`auth:sanctum` / `auth:admin`ミドルウェアが既に認可を担保しているため、`authorize()`は`true`を返し、「認可はルートミドルウェアで担保済み、ここでは素通り」とコメントを残す。FormRequest内でユーザー単位の追加認可（所有者チェック等）が必要なケースは今回の15件には無い（`submissions`系は`$request->user()->id`をService側で使っており、Requestの`authorize()`では判定不要）。

### 1.3 `required`/`sometimes`統一

PUT系5件（`UpdateUserRequest` / `UpdateLessonRequest` / `UpdateCategoryRequest` / `UpdateMaterialRequest`、および将来のPUT系）は、全フィールドを`sometimes`に統一する。

- `UpdateLessonRequest`: `category_ids`を`required|array|min:1`→`sometimes|array|min:1`に変更
- `UpdateMaterialRequest`: `lesson_id`を`required|exists:lessons,id`→`sometimes|exists:lessons,id`に変更

既存の管理画面フロントは編集フォームで常に全フィールドを送信しているため（`(admin)/admin/lessons/[id]/page.tsx`・`(admin)/admin/materials/[id]/page.tsx`で確認済み）、この変更によるUI動作の変化はない。既存テスト（`MaterialTest` / `CategoryTest` / `StudentManagementTest`のPUT系）にも「必須フィールド省略時に422を期待する」アサーションは無いため、回帰しない（確認済み）。

---

## 2. 対応言語の一元化

新規: `App\Enums\Language`

```php
namespace App\Enums;

enum Language: string
{
    case Php = 'php';
    case Python = 'python';
    case Javascript = 'javascript';
    case Ruby = 'ruby';
    case Java = 'java';

    /** @return string[] */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

利用箇所:
- `StoreLessonRequest`: `'language' => ['required', 'string', Rule::in(Language::values())]`
- `UpdateLessonRequest`: `'language' => ['sometimes', 'required', 'string', Rule::in(Language::values())]`
- `ExecuteRequest`: `'language' => ['required', 'string', Rule::in(Language::values())]`

`CodeExecutionService::$languages`のキー一覧とは今回同期しない独立データとして残す（同サービスの`isset($this->languages[$language])`ガードは、FormRequestを経由しない直接呼び出しに対する防御的コードとしてそのまま残す）。

---

## 3. `language`必須化（US-1）

- `StoreLessonRequest`で`language`を`required`にすることで、新規作成時にNULLレッスンが作れなくなる。
- 既存の`language`がNULLのレッスン（監査で見つかった実データ）は本設計の対象外。バグ修正後、管理画面から該当レッスンを開いて言語を選び直し保存すれば直る（DBマイグレーションでの一括バックフィルは要件に明記が無く、スコープ外とする）。
- `UpdateLessonRequest`は`sometimes|required`（1.3節の方針通り）とし、更新時に`language`を送らない部分更新は許容しつつ、送る場合は必ず対応5言語のいずれかを要求する。

---

## 4. レート制限（US-3）

### 4.1 名前付きリミッターの定義

`app/Providers/AppServiceProvider.php`の`boot()`に追加する（現状空実装のため新規追加のみ）。

```php
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;

public function boot(): void
{
    // ログイン・登録: IP＋メールアドレスの組でブルートフォースを抑止
    RateLimiter::for('auth', function (Request $request) {
        $key = $request->ip() . '|' . strtolower((string) $request->input('email'));
        return Limit::perMinute(6)->by($key);
    });

    // コード実行: 1リクエストがDockerコンテナ1つ+最大5秒を消費するため厳しめ
    RateLimiter::for('execute', function (Request $request) {
        return Limit::perMinute(20)->by($request->user()->id);
    });

    // 自動保存(2秒デバウンス、理論上限30回/分)を阻害しない専用枠
    RateLimiter::for('submissions', function (Request $request) {
        return Limit::perMinute(40)->by($request->user()->id);
    });

    // その他の認証済みAPIの既定値
    RateLimiter::for('api', function (Request $request) {
        return Limit::perMinute(60)->by($request->user()->id);
    });
}
```

### 4.2 ルートへの適用（`routes/api.php`）

| ルートグループ | 適用リミッター |
|---|---|
| `/register`, `/login`, `/admin/login` | `throttle:auth` |
| `/execute` | `throttle:execute` |
| `/submissions`, `/submissions/complete` | `throttle:submissions` |
| 共有readグループ（`/lessons`系, `/categories`系, `/materials`系, `GET`のみ） | `throttle:api` |
| 学生専用グループ（`/user`, `/logout`, `/dashboard`, `/submissions/lesson/{}`, `/submissions/completed-lesson-ids`） | `throttle:api` |
| 管理者専用グループ（`auth:admin`配下全体） | `throttle:api` |

`/submissions`と`/submissions/complete`のみ`throttle:submissions`に分離し、他の学生API（ダッシュボード閲覧等）と同じ枠を食い合わないようにする（US-3の【重要】要件への対応）。

### 4.3 429レスポンス

Laravel標準の`ThrottleRequests`ミドルウェアが自動的に付与する`429` + `Retry-After` / `X-RateLimit-Limit` / `X-RateLimit-Remaining`ヘッダ、および`{"message": "Too Many Attempts."}`ボディをそのまま使う。カスタムハンドリングは追加しない（要件の「429＋JSON＋Retry-Afterヘッダ」を標準動作で満たす）。

### 4.4 テスト方針

- 制限に達すること: 該当エンドポイントに閾値+1回リクエストし、最後のレスポンスが429であることを検証。
- 正常利用が阻害されないこと: 閾値未満の回数で全て2xx/422（バリデーションエラー等、レート制限以外の理由）であることを検証。
- テスト環境は`phpunit.xml`で`CACHE_STORE=array`のため、`RateLimiter`は実際にカウントされる（追加設定不要）。ただし各テストメソッドは`RefreshDatabase`のみで`RateLimiter`の状態はリセットされないため、同一キーを使う既存テスト（例: 複数回`postJson('/api/login', ...)`する既存テストがあれば）がレート制限に引っかからないか実装時に確認する。

---

## 5. `model_answer`の秘匿（US-4）

### 5.1 `LessonResource`

新規: `App\Http\Resources\LessonResource`

```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $isAdmin = $request->user() instanceof \App\Models\Admin;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'language' => $this->language,
            'content' => $this->content,
            'expected_output' => $this->expected_output,
            $this->mergeWhen($isAdmin, [
                'model_answer' => $this->model_answer,
            ]),
            'categories' => $this->whenLoaded('categories'),
            'materials' => $this->whenLoaded('materials'),
            'next_lesson_id' => $this->when(
                $this->resource->offsetExists('next_lesson_id'),
                fn () => $this->next_lesson_id,
            ),
        ];
    }
}
```

- `LessonController::index()` → `LessonResource::collection($this->service->getAllLessons())`
- `LessonController::show()` → `new LessonResource($lesson)`
- 学生ガード（`sanctum`）では`model_answer`キー自体がレスポンスに現れない（`mergeWhen`が偽の場合キーを出力しない）。管理者ガードでは従来どおり出力される。

### 5.2 専用エンドポイント

```
GET /api/lessons/{id}/model-answer
```

- 共有readグループ（`auth:sanctum,admin`）に追加し、`throttle:api`を適用。
- `LessonController::modelAnswer(string $id)`を新設。既存の`getLessonById`を再利用し、`{'model_answer' => $lesson->model_answer}`のみを返す（見つからない場合は既存の404パターンに合わせる）。
- 管理者がこのエンドポイントを叩いても実害はない（`GET /lessons/{id}`で既に取得できるため権限的に問題なし。専用エンドポイント側でガード分岐は不要）。

### 5.3 フロントエンド変更

対象: `frontend/src/app/(student)/lessons/[id]/page.tsx`

- `Lesson`インターフェースから`model_answer?: string`を削除し、別state `const [modelAnswer, setModelAnswer] = useState<string | null>(null);` を追加。
- 模範解答トグルボタンの`onClick`を非同期化。初回オープン時のみ`api.get(`/lessons/${id}/model-answer`)`を呼んで`modelAnswer`にセットし、以後はキャッシュ済みの値を再利用する（開閉のたびに叩き直さない）。
- エディタの`value`は`lesson.model_answer`ではなく`modelAnswer`を参照するよう変更。

対象外: `frontend/src/app/(admin)/admin/lessons/[id]/page.tsx`は無変更（管理者ガードでは`GET /lessons/{id}`に従来どおり`model_answer`が含まれるため）。

---

## 6. 既存テストへの影響整理

| テストファイル | 影響 |
|---|---|
| `CodeExecutionTest::test_returns_error_for_unsupported_language` | **要修正**。`language=cplusplus`の期待値を`200+{status:error}`から`422+バリデーションエラー`に変更する |
| `LessonTest` | 既存テストは全てadminガードでの動作確認のため無変更で通る。US-4検証用に「学生が`GET /lessons/{id}`を叩いても`model_answer`キーが無い」ことを確認する新規テストを追加する |
| `MaterialTest` / `CategoryTest` / `StudentManagementTest` | PUT系で必須フィールド省略時の422を期待するアサーションが無いことを確認済み。`sometimes`統一による回帰なし |
| その他（`AuthTest` / `AdminAuthTest` / `AdminManagementTest` / `AdminGuardIsolationTest` / `DashboardTest` / `SubmissionTest`） | バリデーションの実質的な意味を変えていないため無影響。レート制限追加後、同一テストメソッド内で該当エンドポイントを規定回数超えて連続呼び出していないか実装時に確認する |

新規追加が必要なテスト（US-3, US-4関連）は`tasks.md`側で明細化する。

---

**承認待ち**: 内容をご確認ください。問題なければタスク分解（`tasks.md`）に進みます。
