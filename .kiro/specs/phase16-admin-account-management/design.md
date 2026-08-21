# 技術設計: Phase 16 - 管理者アカウント機能の整備

## 設計方針の要点

- **Phase 15 の形をなぞり、コードは共有しない**。ガードが `sanctum`（`users`）と `admin`（`admins`）で分かれており、`current_password` の照合ガード・トークン失効の対象・リセットのブローカーがすべて別物になる。抽象化して1本にまとめると分岐だらけになるため、クラスは分けたうえで**設計の形（Controller → Service → Repository、FormRequest、レート制限、通知）だけを揃える**。
- **リセットトークンは `admins` 専用テーブルを新設する**。Laravel 標準の `password_reset_tokens` は email が主キーで、`users` と `admins` は別テーブルゆえ同じメールアドレスが両方に存在しうる。共用すると片方のリセット要求がもう片方の行を上書きし、**リンクの取り違えが起きる**。Phase 15 で復会トークンを別テーブルにしたのと同じ判断。
- **`account` リミッターのキーにモデルを混ぜる**。現在の `by($request->user()?->id)` は id だけをキーにしているため、`throttle:account` を管理者ルートにも付けた瞬間に **admin#1 と user#1 が同じバケットを共有する**。本フェーズで初めて実害が出るので、ここで直す（§7）。
- **管理者の自己削除は作らない**。他の管理者が削除する運用のままにし、`AdminService::delete` にあと片付け（トークン失効・リセットトークン削除）だけを足す。
- 管理者側の公開パス（`/admin/login` + 新規2画面）を `lib/adminRoutes.ts` に一元化する。Phase 15 で `api.ts` の除外パス漏れによりワンタイムリンクが使えなくなる不具合を踏んでおり、**同じ形の不具合を作らないための予防措置**（§10.2）。

---

## 1. データモデル

### 1.1 マイグレーション

| ファイル（新規） | 内容 |
|---|---|
| `2026_08_21_000000_create_admin_password_reset_tokens_table.php` | 管理者用リセットトークンの保管テーブル |

```php
Schema::create('admin_password_reset_tokens', function (Blueprint $table) {
    $table->string('email')->primary();
    $table->string('token');            // ブローカーが Hash::make() 済みの値を入れる
    $table->timestamp('created_at')->nullable();
});
```

Laravel 標準の `password_reset_tokens` と同一構造にする。`Password` ブローカーの `DatabaseTokenRepository` がこの3カラムを前提にしているため、構造を変えると標準実装が使えなくなる。

`admins` テーブル自体は**変更しない**（ソフトデリートを入れないため `deleted_at` も不要）。

### 1.2 `config/auth.php`

```php
'passwords' => [
    'users' => [ /* 既存のまま */ ],

    // admins 専用ブローカー。users と同じメールアドレスが両テーブルに
    // 存在しうるため、トークンテーブルを分けないとリンクを取り違える。
    'admins' => [
        'provider' => 'admins',
        'table' => 'admin_password_reset_tokens',
        'expire' => 60,
        'throttle' => 60,
    ],
],
```

`providers.admins`（`App\Models\Admin`）は phase6 で定義済みのため追加不要。既定ブローカーを指す `AUTH_PASSWORD_BROKER` も `users` のまま変えない（管理者側は `Password::broker('admins')` と明示的に取得する）。

### 1.3 `app/Models/Admin.php`

```php
// 管理者向けの日本語通知に差し替える（User と同じ形）
public function sendPasswordResetNotification($token): void
{
    $this->notify(new AdminResetPasswordNotification($token));
}
```

`Admin` は `Illuminate\Foundation\Auth\User` を継承しており、`CanResetPassword` の契約とトレイトを既に満たしている。`Notifiable` も付いているため、追加は上記オーバーライドのみ。

---

## 2. バックエンドのレイヤー配置

### 2.1 新規クラス一覧

`Admin\` 名前空間は `auth:admin` グループ配下の Controller、トップレベルの `Admin*Controller` は公開ルートという既存の使い分け（`Admin\AdminController` / `Admin\UserController` に対する `AdminAuthController`）に従う。

| レイヤー | クラス | 責務 |
|---|---|---|
| Controller | `App\Http\Controllers\Admin\AccountController` | 自分のプロフィール更新 / パスワード変更（`auth:admin`） |
| Controller | `App\Http\Controllers\AdminPasswordResetController` | リセットリンク送信 / パスワード再設定（公開） |
| Service | `App\Services\AdminAccountService` | プロフィール更新・パスワード変更のドメインロジック |
| Service | `App\Services\AdminPasswordResetService` | `Password::broker('admins')` のラップ、ステータス変換 |
| Repository | `App\Repositories\AdminPasswordResetTokenRepository` | `admin_password_reset_tokens` の掃除（US-4） |
| Notification | `App\Notifications\AdminResetPasswordNotification` | 管理者向けリセットメール（日本語） |

`AdminAuthController`（`login` / `logout` / `me`）と `Admin\AdminController`（他の管理者の招待・削除）は**責務を増やさない**。Phase 15 で `AuthController` を太らせなかったのと同じ方針。

### 2.2 FormRequest

| クラス（新規） | 対象 | ルール要点 |
|---|---|---|
| `Admin\UpdateProfileRequest` | `PUT /admin/account/profile` | `name`: `sometimes`, `required`, `string`, `max:255`<br>`email`: `sometimes`, `required`, `email`, `max:255`, `Rule::unique('admins')->ignore($this->user()->id)`<br>`current_password`: `Rule::requiredIf(メールを実際に変更するとき)`, `string`, `current_password:admin` |
| `Admin\UpdatePasswordRequest` | `PUT /admin/account/password` | `current_password`: `required`, `string`, `current_password:admin`<br>`password`: `required`, `string`, `min:8`, `confirmed` |
| `AdminForgotPasswordRequest` | `POST /admin/forgot-password` | `email`: `required`, `email` |
| `AdminResetPasswordRequest` | `POST /admin/reset-password` | `token`: `required`, `string`<br>`email`: `required`, `email`<br>`password`: `required`, `string`, `min:8`, `confirmed` |

**`unique` の対象は `admins` テーブルのみ**にする。`users` との重複を弾かないのは要件どおり（US-1）で、同一人物が受講生アカウントと管理者アカウントを両方持つ運用を妨げないため。

**`current_password:admin`** は照合ガードの指定。Phase 15 の受講生側が `current_password:sanctum` だったのと同じ理由で、ガードを省くとセッションベースの `web` ガードを見にいって常に失敗する。

**メール変更時のみ `current_password` を要求する**のは Phase 15 §15.4 #5 と同じ判断。トークンを盗まれた場合に「メール変更 → リセット」で乗っ取りが完結するのを防ぐ。改名だけなら不要。

`authorize()` は既存方針どおり `true` を返し、ルートミドルウェアで担保している旨をコメントで残す。

---

## 3. API設計

### 3.1 エンドポイント一覧

| # | メソッド | パス | 認証 | リミッター | 概要 |
|---|---|---|---|---|---|
| 1 | PUT | `/api/admin/account/profile` | `auth:admin` | `throttle:api` | 名前・メールの更新 |
| 2 | PUT | `/api/admin/account/password` | `auth:admin` | `throttle:account` | パスワード変更 |
| 3 | POST | `/api/admin/forgot-password` | なし | `throttle:auth` | リセットリンク送信 |
| 4 | POST | `/api/admin/reset-password` | なし | `throttle:auth` | パスワード再設定 |

`/admin/account/*` は「ログイン中の管理者自身」を指し、`/admin/admins/*`（他の管理者）と URL 上で区別する。受講生側の `/account/*` と `/admin/users/*` の関係と対になる。

**`DELETE /api/admin/account` は作らない**（自己削除は対象外）。

### 3.2 リクエスト / レスポンス

#### 1. `PUT /api/admin/account/profile`

```jsonc
// Request（メール変更なし）
{ "name": "運営 太郎" }
// Request（メール変更あり）
{ "name": "運営 太郎", "email": "admin@example.com", "current_password": "current-pass" }
// 200
{ "id": 1, "name": "運営 太郎", "email": "admin@example.com", "created_at": "...", "updated_at": "..." }
// 422: メール重複 / current_password 未入力・誤り  401: 未認証・受講生トークン
```

#### 2. `PUT /api/admin/account/password`

```jsonc
// Request
{ "current_password": "old-pass", "password": "new-pass", "password_confirmation": "new-pass" }
// 200
{ "message": "パスワードを変更しました。他の端末は再ログインが必要です。" }
// 422: 現在のパスワード誤り / 新パスワードのルール違反
```

#### 3. `POST /api/admin/forgot-password` / 4. `POST /api/admin/reset-password`

```jsonc
// forgot-password Request: { "email": "admin@example.com" }
// 200（登録有無にかかわらず常に同一）
{ "message": "メールアドレスが登録されている場合、パスワード再設定用のリンクを送信しました。" }

// reset-password Request: { "token": "...", "email": "...", "password": "...", "password_confirmation": "..." }
// 200
{ "message": "パスワードを再設定しました。新しいパスワードでログインしてください。" }
// 422: トークン不正・期限切れ・使用済み（errors.email に格納）
```

レスポンス文面は受講生側と同一でよい。**画面が別（`/admin/*`）なので取り違えが起きず**、文面を変える理由がない。

---

## 4. 主要フローのシーケンス

### 4.1 管理者のパスワードリセット

```
[管理者] --POST /api/admin/forgot-password {email}-->
    AdminPasswordResetController@sendResetLink
        └─ AdminPasswordResetService::sendResetLink()
             └─ Password::broker('admins')->sendResetLink(['email' => ...])
                  ├─ providers.admins から Admin を取得（見つからなければ何もしない）
                  ├─ admin_password_reset_tokens に行を作成
                  └─ Admin::sendPasswordResetNotification()
                       └─ AdminResetPasswordNotification（→ Mailpit）
    <-- 200 常に同一メッセージ

[管理者] --メール内リンク--> /admin/reset-password?token=..&email=..
[管理者] --POST /api/admin/reset-password {token,email,password}-->
    AdminPasswordResetController@reset
        └─ AdminPasswordResetService::reset()
             └─ Password::broker('admins')->reset(...)
                  ├─ トークン照合・期限確認
                  ├─ コールバック: password 更新 + $admin->tokens()->delete()
                  └─ トークン行を削除（単回使用）
    <-- 200 / 422（errors.email）
```

**受講生との分離**: `broker('admins')` は `providers.admins` 経由で `Admin` しか引かず、`admin_password_reset_tokens` しか読み書きしない。逆に受講生側の `broker()`（既定 = `users`）は `Admin` を引けない。同じメールアドレスが両テーブルにあっても、互いのパスワードには到達できない。

### 4.2 管理者のメールアドレス変更

```
[管理者] --PUT /api/admin/account/profile {name, email, current_password}-->
    Admin\UpdateProfileRequest
        ├─ email が現在値と異なる → current_password を必須化
        └─ current_password:admin で照合（失敗なら 422）
    Admin\AccountController@updateProfile
        └─ AdminAccountService::updateProfile()
             └─ AdminRepository::update()   ※ current_password は渡さない
    <-- 200 更新後の Admin
```

---

## 5. Service 実装方針

### 5.1 `AdminAccountService`

```php
public function updateProfile(Admin $admin, array $data): Admin
{
    $this->repository->update($admin, $data);

    return $admin->fresh();
}

/**
 * $current は Sanctum::actingAs() 経由だと TransientToken（id を持たない）
 * になるため、PersonalAccessToken かどうかで分岐する。
 */
public function changePassword(Admin $admin, string $password, ?PersonalAccessToken $current): void
{
    $admin->forceFill(['password' => $password])->save();   // casts の 'hashed' が効く

    $admin->tokens()
        ->when($current, fn ($q) => $q->where('id', '!=', $current->id))
        ->delete();
}
```

Phase 15 の `AccountService` と同じ形。`Admin` にも `casts()` で `'password' => 'hashed'` が入っているため、`forceFill` でハッシュ化される。

Controller 側は `$request->safe()->only(['name', 'email'])` を渡し、**`current_password` を Service に流さない**（本人確認であってプロフィール項目ではない。Phase 15 §15.4 #5 と同じ）。

### 5.2 `AdminPasswordResetService`

```php
public function sendResetLink(string $email): void
{
    // 結果を見ずに投げる。未登録でも同じメッセージを返すため。
    Password::broker('admins')->sendResetLink(['email' => $email]);
}

public function reset(array $data): void
{
    $status = Password::broker('admins')->reset(
        $data,
        function (Admin $admin, string $password) {
            $admin->forceFill(['password' => $password])->save();

            // リセットは漏洩を疑って踏む導線なので、既存セッションは全て切る。
            $admin->tokens()->delete();
        }
    );

    if ($status !== Password::PASSWORD_RESET) {
        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
```

トークン失効は Phase 15 §15.4 #2 で受講生側に入れた対応を最初から織り込む。

### 5.3 `AdminService::delete` の変更（US-4）

```php
public function delete(int $id, int $currentId): string
{
    if ($id === $currentId) {
        return 'self';
    }

    $admin = $this->repository->find($id);
    if (!$admin) {
        return 'not_found';
    }

    $admin->tokens()->delete();
    $this->resetTokens->delete($admin->email);   // admins への外部キーが無く連鎖しない

    $this->repository->delete($admin);

    return 'deleted';
}
```

戻り値の契約（`'self' | 'not_found' | 'deleted'`）は変えないので、Controller と既存テストはそのまま通る。

### 5.4 リポジトリの追加

```php
// AdminRepository（追加）
public function update(Admin $admin, array $data): bool;

// AdminPasswordResetTokenRepository（新規）
public function delete(string $email): void;   // 該当行を削除するだけ
```

トークンの発行・照合は `Password` ブローカーが握るため、リポジトリは**掃除だけ**を持つ。Phase 15 の `PasswordResetTokenRepository` と同じ役割・同じ理由。

---

## 6. 通知（メール）設計

`App\Notifications\AdminResetPasswordNotification`

```php
$url = config('app.frontend_url') . '/admin/reset-password?token=' . $this->token
    . '&email=' . urlencode($notifiable->getEmailForPasswordReset());

return (new MailMessage)
    ->subject('【DevInit】管理者アカウントのパスワード再設定のご案内')
    ->line('DevInit 管理画面のパスワード再設定のリクエストを受け付けました。')
    ->action('パスワードを再設定する', $url)
    ->line('このリンクの有効期限は60分です。')
    ->line('心当たりがない場合は、このメールを破棄してください。');
```

受講生向け `ResetPasswordNotification` とはリンク先（`/admin/reset-password`）と件名が異なる。**件名に「管理者アカウント」を含める**ことで、同じメールアドレスに両方の通知が届いても取り違えない（US-3 の受け入れ条件）。

---

## 7. レート制限

### 7.1 既存 `account` リミッターのキー修正（必須）

```php
// 現在
RateLimiter::for('account', fn (Request $request) =>
    Limit::perMinute(6)->by($request->user()?->id ?: $request->ip()));
```

このキーは id だけを見ているため、`throttle:account` を管理者ルートにも付けると **admin#1 と user#1 が同じ 6回/分 のバケットを共有する**。片方の操作でもう片方が429になるうえ、id は連番なので衝突は例外ではなく常態になる。

```php
// 修正後
RateLimiter::for('account', function (Request $request) {
    $user = $request->user();

    // ガードをまたいで使うため、id だけでは admins と users が衝突する。
    return Limit::perMinute(6)->by(
        $user ? $user->getMorphClass() . ':' . $user->id : $request->ip()
    );
});
```

`getMorphClass()` はモデルのクラス名（またはモーフマップの別名）を返すので、`App\Models\Admin:1` と `App\Models\User:1` が別バケットになる。リミッターを2本に増やすより、既存の1本を正しくする方が設定の重複が減る。

`auth:admin` ミドルウェアは認証時に `Auth::shouldUse('admin')` を呼ぶため、`$request->user()` は `Admin` を返す。ミドルウェア優先度も `Authenticate` → `ThrottleRequests` の順であり、キー生成時点で解決済み。

### 7.2 `auth` リミッターは変更しない

`/admin/forgot-password` `/admin/reset-password` は既存の `auth` リミッター（`ip|email` で 6回/分）をそのまま使う。受講生と管理者が同じメールアドレスを持つ場合、両者が同じバケットを共有するが、**同一人物である可能性が高く、分ける実益がない**ため許容する。

### 7.3 `routes/api.php` への追加

```php
// 公開グループ（既存の throttle:auth グループに追加）
Route::post('/admin/forgot-password', [AdminPasswordResetController::class, 'sendResetLink']);
Route::post('/admin/reset-password', [AdminPasswordResetController::class, 'reset']);

// auth:admin グループ内（既存は全体に throttle:api が掛かっている）
Route::put('/account/profile', [Admin\AccountController::class, 'updateProfile']);
Route::put('/account/password', [Admin\AccountController::class, 'updatePassword'])
    ->withoutMiddleware('throttle:api')
    ->middleware('throttle:account');
```

管理者グループは `Route::middleware(['auth:admin', 'throttle:api'])` でまとめて `throttle:api` が掛かっている。パスワード変更だけ厳しくしたいので、そのルートで `throttle:api` を外して `throttle:account` を付ける。**グループの構造を組み替えない**ことで、既存18ルートへの影響をゼロにする。

---

## 8. 管理者削除時のあと片付け（US-4）

| 操作 | エンドポイント | 挙動 |
|---|---|---|
| 削除 | `DELETE /api/admin/admins/{id}` | 全トークン失効 → `admin_password_reset_tokens` の該当行削除 → 物理削除 |

`admins` にソフトデリートを入れないため、Phase 15 のような保持期間・purge コマンドは不要。削除は即時・完全で、これは要件（削除請求への即応）とも合っている。

---

## 9. フロントエンド設計

### 9.1 新規ページ

| パス | 配置 | 認証 | 概要 |
|---|---|---|---|
| `/admin/settings` | `src/app/(admin)/admin/settings/page.tsx` | 要 | プロフィール / パスワード変更の2カード |
| `/admin/forgot-password` | `src/app/(admin)/admin/forgot-password/page.tsx` | 不要 | メール送信フォーム |
| `/admin/reset-password` | `src/app/(admin)/admin/reset-password/page.tsx` | 不要 | 新パスワード設定 |

`/admin/reset-password` は `token` / `email` をクエリから読むためクライアントコンポーネントとし、`useSearchParams()` を使う箇所は `<Suspense>` で包む。実装前に `frontend/node_modules/next/dist/docs/` で現行APIを確認する。

3画面とも `dark:` バリアントを最初から付け、`@/components/ui` の `Input` / `Button` を使う。

**退会カードは作らない**（自己削除は対象外）。受講生の `/settings` が3カードなのに対し、`/admin/settings` は2カードになる。

### 9.2 公開パス定義の一元化

現在、管理者側の公開パス判定が3箇所にハードコードされている。

| ファイル | 現在の判定 |
|---|---|
| `lib/adminApi.ts:29` | `!pathname.includes('/admin/login')` |
| `context/AdminAuthContext.tsx:78` | `const publicPaths = ['/admin/login']` |
| `components/AdminLayout.tsx:13` | `pathname === '/admin/login'` |

公開パスが3つに増えるため、受講生側の `lib/routes.ts` と同じ形で切り出す。

```ts
// src/lib/adminRoutes.ts
export const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
] as const;

export const isAdminPublicPath = (pathname: string): boolean =>
  (ADMIN_PUBLIC_PATHS as readonly string[]).includes(pathname);
```

**`adminApi.ts` の差し替えは必須**。ここを直さないと、古い `admin_token` を持つ端末でリセットリンクを開いたとき `GET /admin/me` が401を返し、`/admin/login` へ飛ばされてワンタイムリンクを使い切れない。Phase 15 で受講生側がまさにこの状態だった（§15.4 #1）。

`AdminLayout` も差し替えて、リセット画面がサイドバー無しで描画されるようにする。

### 9.3 既存コンポーネントの変更

| ファイル | 変更内容 |
|---|---|
| `context/AdminAuthContext.tsx` | `checkAuth` を `refreshAdmin` としても公開（プロフィール更新後の再取得用）。公開パス判定を `lib/adminRoutes.ts` に差し替え |
| `components/AdminSidebar.tsx` | ナビゲーションに「設定」(`/admin/settings`, `Settings` アイコン) を追加。ただし `Settings` アイコンは既に「レッスン管理」(`/admin`) が使っているため、設定側は別アイコン（`UserCog` 等）を充てる |
| `components/AdminLayout.tsx` | 公開パス判定を `lib/adminRoutes.ts` に差し替え |
| `lib/adminApi.ts` | 401時のリダイレクト除外を `isAdminPublicPath()` に差し替え |
| `app/(admin)/admin/login/page.tsx` | 「パスワードをお忘れの方」リンク（`/admin/forgot-password`）を追加 |

### 9.4 `/admin/settings` の構成

2つのカードを縦に並べ、それぞれ独立したフォームとして送信する。

1. **プロフィール** — 名前・メールアドレス。初期値は `useAdminAuth().admin`。メール欄が現在値と変わったときだけ「現在のパスワード」欄を表示し、その値を `current_password` として送る。保存成功時に `refreshAdmin()` を呼びサイドバーの表示も更新する。422 の `errors.email` / `errors.current_password` をそれぞれのフィールド下に表示する。
2. **パスワード変更** — 現在のパスワード / 新しいパスワード / 確認。成功時は入力欄をクリアし、「他の端末は再ログインが必要です」と表示する（ログアウトはしない）。

---

## 10. テスト設計

`phpunit.xml` の SQLite インメモリ設定をそのまま使う。メール送信は `Notification::fake()` で検証する。

| ファイル（新規） | 主なケース |
|---|---|
| `tests/Feature/AdminAccountTest.php` | プロフィール更新成功 / 現在のメールのまま保存できる / 他の管理者のメールで422 / **受講生と同じメールには変更できる** / メール変更に `current_password` が要る・誤りで422 / 改名だけなら不要 / 未認証401 / **受講生トークンで401** / パスワード変更成功 / 現在パスワード誤りで422 / 変更後に他端末トークンが失効し操作端末は生存（実トークンを2本取得して検証） |
| `tests/Feature/AdminPasswordResetTest.php` | 登録済み/未登録で同一メッセージ / 通知が送られる・送られない / リセット成功後に新パスワードでログイン可 / リセットで既存トークンが全失効 / トークン再利用で422 / 改ざん・期限切れトークンで422 |
| `tests/Feature/AdminPasswordResetIsolationTest.php` | **同一メールの受講生と管理者が併存する状態**で、(a) 管理者のリセットで受講生のパスワードが変わらない、(b) 受講生のリセットで管理者のパスワードが変わらない、(c) `/api/forgot-password` に管理者のメールを送っても管理者宛に通知が飛ばない、(d) `/api/admin/forgot-password` に受講生のメールを送っても受講生宛に通知が飛ばない |

**既存テストへの影響**

| ファイル | 影響 |
|---|---|
| `AdminManagementTest` | 削除時のトークン失効・リセットトークン行削除のケースを追加（US-4）。既存5ケースは戻り値の契約を変えないため無変更 |
| `RateLimitingTest` | `account` リミッターのキー変更に伴い、**管理者と受講生が同じidでも互いに429にしない**ケースを1件追加する |
| `AdminAuthTest` / `AdminGuardIsolationTest` | 影響なし（ログイン・ガード分離の挙動は変えない） |

パスワード変更テストでは `Sanctum::actingAs()` を使わず、`POST /api/admin/login` で実トークンを2本取得してから変更を実行する（§5.1 の `TransientToken` 問題を踏むため）。Phase 15 と同じ。

---

## 11. 既存挙動の変更点と互換性

| # | 変更 | 影響 | 判断 |
|---|---|---|---|
| 1 | `account` リミッターのキーに `getMorphClass()` を混ぜる | 受講生の `throttle:account` バケットのキー文字列が変わる。デプロイ直後は各ユーザーのカウントがリセットされる | 実害なし。むしろ id 衝突というバグを塞ぐ変更で、管理者ルートを足す前に入れる必要がある |
| 2 | `AdminService::delete` がトークン失効とリセットトークン削除を行うようになる | 削除された管理者の古いトークンが即座に無効になる | US-4 の要求どおり。戻り値の契約は不変なので既存テストは無変更 |
| 3 | 管理者グループ内でパスワード変更ルートだけ `throttle:api` を外す | 該当ルートの budget が 60/分 → 6/分 に厳しくなる | 意図どおり。他の18ルートには影響しない |
| 4 | `admin_password_reset_tokens` テーブルが増える | 新規テーブルのため既存への影響なし | — |

**マイグレーション適用漏れに注意**: Phase 15 の 8-2 で、テストが全緑でも開発用 PostgreSQL に未適用という状態を踏んだ（phase15 design.md §15.5）。本フェーズもテーブルを追加するため、実装後に `docker compose exec php php artisan migrate` を実行し、`migrate:status` で確認するところまでをタスクに含める。

---

## 12. 個人情報の取り扱い（requirements.md の注記への対応状況）

本フェーズで扱うのは管理者自身の氏名・メールアドレスのみ。requirements.md の注記のうち、以下は**未整備のまま残る**。

- プライバシーポリシーページが存在しない（Phase 15 から変わらず）。管理者は運営側の人間のため受講生向けポリシーとは別整理が要る。
- 管理者の削除は他の管理者経由でのみ可能。本人が自分の意思で即座に消す手段はない（US-4 で削除時のあと片付けは担保する）。

---

## 13. 実装時に判明した設計との差分

> 実装完了後に追記する（Phase 14・15 と同じ運用）。
