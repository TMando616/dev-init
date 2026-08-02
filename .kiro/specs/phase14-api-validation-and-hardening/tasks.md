# Tasks: Phase 14 - バリデーション契約の整備とAPIハードニング

実装は `design.md` の章立て（言語列挙 → FormRequest導入 → レート制限 → model_answer秘匿 → 既存テスト調整）の順で進める。各サブタスク完了ごとにコミットする。

## 1. 対応言語の一元化（design §2）

- [x] 1.1 `App\Enums\Language`を新規作成する
  - 対象: `backend/app/Enums/Language.php`（design §2のコード例通り、`php`/`python`/`javascript`/`ruby`/`java`のbacked enum、`values()`ヘルパー付き）

## 2. FormRequestの導入（design §1）

- [x] 2.1 認証系3件のFormRequestを作成し、Controllerを差し替える
  - 対象: `backend/app/Http/Requests/RegisterRequest.php`, `LoginRequest.php`, `AdminLoginRequest.php`
  - `authorize()`は`true`（公開エンドポイント、誰でも叩ける前提とコメント）
  - `AuthController::register/login`, `AdminAuthController::login`の型ヒントを差し替え、`$request->validated()`を使う
- [x] 2.2 コード実行のFormRequestを作成する（`Language` enum利用）
  - 対象: `backend/app/Http/Requests/ExecuteRequest.php`
  - `language`に`Rule::in(Language::values())`を追加（design §2, §3）
  - `authorize()`は`true`（`auth:sanctum`ミドルウェアで担保済みとコメント）
  - `ExecutionController::__invoke`の型ヒントを差し替える
  - Docker復旧後にテスト実行し、想定通り`test_returns_error_for_unsupported_language`のみ失敗することを確認済み（§5.1で対応）
- [x] 2.3 提出系2件のFormRequestを作成する
  - 対象: `backend/app/Http/Requests/StoreSubmissionRequest.php`, `CompleteSubmissionRequest.php`
  - `SubmissionController::store/complete`の型ヒントを差し替える
- [x] 2.4 管理者アカウント管理系のFormRequestを作成する
  - 対象: `backend/app/Http/Requests/Admin/StoreAdminRequest.php`, `StoreUserRequest.php`, `UpdateUserRequest.php`
  - `UpdateUserRequest`は現行の`sometimes`規則をそのまま踏襲（既にsometimes運用のため変更なし）
  - `Admin\AdminController::store`, `Admin\UserController::store/update`の型ヒントを差し替える
- [x] 2.5 レッスンのFormRequestを作成し、`language`必須化・`sometimes`統一を反映する
  - 対象: `backend/app/Http/Requests/StoreLessonRequest.php`, `UpdateLessonRequest.php`
  - `StoreLessonRequest`: `language`を`required` + `Rule::in(Language::values())`で追加（design §3, US-1対応）
  - `UpdateLessonRequest`: `language`を`sometimes|required|...`、`category_ids`を`required`→`sometimes|array|min:1`に変更（design §1.3）
  - `LessonController::store/update`の型ヒントを差し替える
  - 【design §6からの差分】`LessonTest::test_admin_can_create_lesson`が`language`を送っていなかったため422で失敗。`language`送信を追加し、`language`必須・不正値拒否の新規テスト2件を追加した（US-1検証）
- [x] 2.6 カテゴリのFormRequestを作成する
  - 対象: `backend/app/Http/Requests/StoreCategoryRequest.php`, `UpdateCategoryRequest.php`
  - `CategoryController::store/update`の型ヒントを差し替える
- [x] 2.7 マテリアルのFormRequestを作成し、`sometimes`統一を反映する
  - 対象: `backend/app/Http/Requests/StoreMaterialRequest.php`, `UpdateMaterialRequest.php`
  - `UpdateMaterialRequest`: `lesson_id`を`required`→`sometimes|exists:lessons,id`に変更（design §1.3）
  - `MaterialController::store/update`の型ヒントを差し替える
- [x] 2.8 バックエンドの既存テストが全て通ることを確認する
  - `docker compose exec php php artisan test`
  - 全59件・144アサーション通過（2.5で追加した`language`関連テスト2件を含む）
  - Controller内の`$request->validate([...])`直書きが全廃されたことをgrepで確認済み

## 3. レート制限（design §4）

- [x] 3.1 `AppServiceProvider::boot()`に名前付きリミッター4種を定義する
  - 対象: `backend/app/Providers/AppServiceProvider.php`（design §4.1のコード例通り、`auth`/`execute`/`submissions`/`api`）
- [x] 3.2 `routes/api.php`の各ルートグループに`throttle:`ミドルウェアを適用する
  - 対象: `backend/routes/api.php`（design §4.2の対応表通り）
  - `/register`, `/login`, `/admin/login` → `throttle:auth`
  - `/execute` → `throttle:execute`
  - `/submissions`, `/submissions/complete` → `throttle:submissions`
  - 共有readグループ・学生専用グループ・管理者専用グループ → `throttle:api`
- [x] 3.3 レート制限のテストを追加する
  - 対象: `backend/tests/Feature/RateLimitingTest.php`（新規、7件）
  - 認証系: 6回/分の閾値超過で429＋`Retry-After`、閾値内は429にならないこと、キーがメールアドレス単位で分離されていること
  - 実行系: 20回/分の閾値超過で429になること
  - 提出系: 40回/分の閾値超過で429になること、autosave想定の30回/分では429にならないこと、`api`枠を使い切っても提出は通ること（US-3【重要】要件の直接検証）
  - 【design §4.4からの差分】ログイン失敗は401ではなく422（`ValidationException`）を返すため、テストの期待値を422にした
  - throttleミドルウェアはController到達前に実行されるため、`/execute`は不正ペイロード（422）でカウントを消費させDocker実行を回避している
- [x] 3.4 既存テストがレート制限の追加で新たに失敗しないことを確認する
  - 全66件・258アサーション通過。テスト環境は`CACHE_STORE=array`かつテストメソッドごとにアプリが再生成されるため、リミッターのカウントはメソッド間に持ち越されない

## 4. model_answerの秘匿（design §5）

- [x] 4.1 `LessonResource`を新規作成し、`LessonController::index/show`に適用する
  - 対象: `backend/app/Http/Resources/LessonResource.php`
  - `backend/app/Http/Controllers/LessonController.php`の`index`/`show`を`LessonResource`経由のレスポンスに差し替える
  - 【design §5.1からの差分1】`created_at`/`updated_at`をフィールドに追加。管理ダッシュボード（`(admin)/admin/page.tsx`）が一覧の`created_at`を表示しているため
  - 【design §5.1からの差分2】`next_lesson_id`は`offsetExists`ではなく`whenAppended('next_lesson_id')`で出し分ける。`offsetExists`はアクセサを実行してしまい、一覧側で常にキーが出る＋N+1クエリになるため
  - 【design §5.1からの差分3】`LessonResource::collection()`をそのまま返すと`{"data": [...]}`にラップされ既存フロント・テストが壊れるため、従来どおり`response()->json(...)`で包んで返している（`jsonSerialize()`経由になりラップされない）
- [x] 4.2 模範解答専用エンドポイントを追加する
  - 対象: `backend/app/Http/Controllers/LessonController.php`（`modelAnswer`メソッド新設）, `backend/routes/api.php`（`GET /lessons/{id}/model-answer`を共有readグループに追加、`throttle:api`）
- [x] 4.3 学生向けレッスンページの模範解答トグルを専用エンドポイント呼び出しに変更する
  - 対象: `frontend/src/app/(student)/lessons/[id]/page.tsx`
  - `Lesson`インターフェースから`model_answer`を削除し、`modelAnswer`state（`string | null`）と`isLoadingModelAnswer`を追加
  - `toggleModelAnswer`を新設。初回オープン時のみ`GET /lessons/{id}/model-answer`を呼び、以後はキャッシュを再利用。レッスン切り替え時は`modelAnswer`をリセット
  - エディタの`value`参照先を`modelAnswer`に変更（取得中は「読み込み中...」を表示）
  - `npm run lint` / `npx tsc --noEmit` ともにエラーなし
- [x] 4.4 `model_answer`秘匿のテストを追加する
  - 対象: `backend/tests/Feature/LessonTest.php`（5件追加）
  - 学生ガードで`GET /lessons/{id}`・`GET /lessons`のレスポンスに`model_answer`キーが含まれないこと
  - 管理者ガードで`GET /lessons/{id}`に`model_answer`が従来どおり含まれること
  - `GET /lessons/{id}/model-answer`が学生ガードでも`model_answer`を返すこと、存在しないIDで404になること
  - `test_user_can_show_lesson`に`assertJsonStructure`を足し、`LessonResource`導入でレスポンス形状が退行していないことを固定した

## 5. 既存テストの仕様変更対応（design §6）

- [x] 5.1 `CodeExecutionTest::test_returns_error_for_unsupported_language`を422期待に更新する
  - 対象: `backend/tests/Feature/CodeExecutionTest.php`
  - 不正`language`送信時のレスポンスを`200+{status:error}`から`422+バリデーションエラー`のアサーションに変更（design §6, US-2で明記された意図的仕様変更）
  - テスト名も`test_returns_validation_error_for_unsupported_language`に変更。全57件（アサーション数は模範解答除外テスト未追加のため138件）通過確認済み

## 6. 動作確認・仕上げ

- [x] 6.1 バックエンド全テスト・lintを実行する
  - 全73件・283アサーション通過
- [x] 6.2 フロントエンドのlint・型チェック・buildを実行する
  - `npm run lint` エラーなし、`npx tsc --noEmit` エラーなし
  - `npm run build` は`/admin/admins`のprerenderで`TypeError: Cannot read properties of null (reading 'useContext')`。phase13で記録済みの既知事象と同一で、phase14の変更に起因する新規エラーではない
- [x] 6.3 手動確認: 管理画面でレッスンの`language`を設定→保存→受講生側で実行できることを確認する（US-1のブラウザ確認）
  - 2026-08-02 ブラウザで確認済み
- [x] 6.4 手動確認: 学生アカウントで「模範解答を見る」を押した時だけ`model-answer`エンドポイントが呼ばれ、初期ロード時のレスポンスに含まれないことをDevToolsのNetworkタブで確認する
  - 2026-08-02 ブラウザで確認済み
- [x] 6.5 `requirements.md`の受け入れ条件を全てチェックし、`design.md`末尾の「承認待ち」を解消する
  - 手動確認待ちの2項目（US-1の実行確認・サムネイル表示）を除き全てチェック済み
  - `design.md`に §7「実装時に判明した設計との差分」を追記した
