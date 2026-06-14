# 設計書: Phase 6 - 管理者と生徒の完全分離

本設計は要件定義（`requirements.md`）の US-1〜US-6 と非機能要件を実装に落とすための技術設計である。
ステアリングの依存方向（Controller → Service → Repository、下位は上位を知らない）と Contract-First を厳守する。

## 0. 設計方針サマリ

| 観点 | 決定 |
|------|------|
| 認証分離 | `admins` テーブル＋Sanctum `admin` ガード（provider=`admins`）を新設。生徒は従来の `auth:sanctum`（users provider）のまま |
| トークン隔離 | Sanctum のトークンは発行元モデル（`tokenable_type`）に紐づくため、管理者トークン（`Admin`）と生徒トークン（`User`）は別系統。ガードの provider モデル不一致で相互拒否される |
| バックエンド層 | 既存リソース（Lesson 等）に倣い、管理者ドメインも Controller → Service → Repository で構成。生徒CRUDも `UserService`/`UserRepository` を新設して `AuthController` のベタ書きを解消 |
| フロント分離 | App Router の **route group** `(student)` / `(admin)` で別レイアウト・別ナビゲーション・別 AuthContext に分離 |
| エッジ保護 | 管理者トークンを **Cookie** にも保持し、`middleware.ts` が `/admin/*` への未認証アクセスを `/admin/login` へリダイレクト（粗いゲート）。最終的な認可はバックエンド `auth:admin` が担保 |
| 併せて対応 | 未使用デッドコード `frontend/src/lib/codeRunner.ts` を削除 |

---

## 1. データモデル

### 1.1 新規テーブル: `admins`

```
admins
├── id            BIGINT PK AUTO_INCREMENT
├── name          VARCHAR(255) NOT NULL
├── email         VARCHAR(255) NOT NULL UNIQUE   -- ログインID
├── password      VARCHAR(255) NOT NULL          -- bcrypt ハッシュ
├── remember_token VARCHAR(100) NULL
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP
```

- カリキュラム系リレーション（`submissions` 等）は **持たない**。
- 管理者間の権限差は設けない（単一レベル）。RBAC 列は追加しない（スコープ外）。

### 1.2 既存テーブル変更: `users`

- `role` 列を **削除**。以後 `users` は生徒専用。
- 既存リレーション（`submissions`）は維持。

### 1.3 トークンテーブル: `personal_access_tokens`（変更なし）

- Sanctum のポリモーフィック `tokenable_type` / `tokenable_id` をそのまま利用。
- 管理者トークンは `tokenable_type = App\Models\Admin`、生徒トークンは `App\Models\User` で区別される。スキーマ変更不要。

---

## 2. バックエンド設計

### 2.1 認証ガード設定 (`config/auth.php`)

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    // 追加: 管理者用 Sanctum ガード
    'admin' => [
        'driver' => 'sanctum',
        'provider' => 'admins',
    ],
],

'providers' => [
    'users' => [
        'driver' => 'eloquent',
        'model' => env('AUTH_MODEL', App\Models\User::class),
    ],
    // 追加
    'admins' => [
        'driver' => 'eloquent',
        'model' => App\Models\Admin::class,
    ],
],
```

- 生徒ルートは従来どおり `auth:sanctum`（既定 provider=`users`）。
- 管理ルートは `auth:admin`。Sanctum 4 のガードは provider のモデルとトークンの `tokenable` 型が一致するかを検証するため、**生徒トークンで `auth:admin` を通過できない**（US-1 / US-5 を満たす）。この相互拒否はテストで保証する（§6）。

### 2.2 Model: `app/Models/Admin.php`（新規）

```php
#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class Admin extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected function casts(): array
    {
        return ['password' => 'hashed'];
    }
}
```

- `isAdmin()` のようなロール判定は持たない（型そのものが管理者であることを表す）。
- `submissions()` リレーションは定義しない。

### 2.3 Model 変更: `app/Models/User.php`

- `#[Fillable(['name', 'email', 'password', 'role'])]` から `'role'` を除去。
- `isAdmin()` メソッドを **削除**。
- `submissions()` は維持。

### 2.4 レイヤー構成（新規・変更クラス一覧）

| レイヤー | クラス | 役割 |
|----------|--------|------|
| Repository | `AdminRepository`（新規） | `admins` の永続化（all/find/findByEmail/create/delete） |
| Repository | `UserRepository`（新規） | `users` の永続化（AuthController のベタ書きを移設） |
| Service | `AdminService`（新規） | 管理者の一覧・作成・削除。self-delete 防止のドメインルール |
| Service | `UserService`（新規） | 生徒の一覧・作成・更新・削除 |
| Controller | `AdminAuthController`（新規） | 管理者の login / logout / me |
| Controller | `Admin\AdminController`（新規） | 管理者アカウントの index / store / destroy（`auth:admin`） |
| Controller | `Admin\UserController`（新規） | 生徒アカウントの index / store / update / destroy（`auth:admin`） |
| Controller | `AuthController`（変更） | 生徒の register / login / logout / user のみに縮小。CRUD系メソッド削除 |
| Middleware | `AdminMiddleware`（削除） | `auth:admin` ガードに置換し不要化。`bootstrap/app.php` の alias も削除 |

> 認証ロジック（トークン発行・検証）は既存 `AuthController` の流儀に合わせ Controller 内に保持する（Service 化しない）。データ CRUD のみ Service/Repository 経由とする。

### 2.5 Repository 例: `app/Repositories/AdminRepository.php`

```php
class AdminRepository
{
    public function all(): Collection { return Admin::all(); }
    public function find(int $id): ?Admin { return Admin::find($id); }
    public function findByEmail(string $email): ?Admin { return Admin::where('email', $email)->first(); }
    public function create(array $data): Admin { return Admin::create($data); }
    public function delete(Admin $admin): bool { return (bool) $admin->delete(); }
}
```

`UserRepository` も同形（`all/find/create/update/delete`）。既存 `LessonRepository` の流儀に合わせる。

### 2.6 Service 例: `app/Services/AdminService.php`

```php
class AdminService
{
    public function __construct(protected AdminRepository $repository) {}

    public function list(): Collection { return $this->repository->all(); }

    public function create(array $data): Admin
    {
        $data['password'] = Hash::make($data['password']);
        return $this->repository->create($data);
    }

    /** self-delete を禁止。$currentId は呼び出し元（Controller）が auth から渡す */
    public function delete(int $id, int $currentId): string
    {
        if ($id === $currentId) return 'self';
        $admin = $this->repository->find($id);
        if (!$admin) return 'not_found';
        $this->repository->delete($admin);
        return 'deleted';
    }
}
```

`UserService` は `create`/`update` でパスワードを `Hash::make`（更新時は値があるときのみ）。

### 2.7 Controller: `app/Http/Controllers/AdminAuthController.php`

`AuthController::login` と同じ流儀。`Admin` モデルに対して認証しトークンを発行する。

```php
public function login(Request $request)
{
    $request->validate(['email' => 'required|email', 'password' => 'required']);

    $admin = $this->repository->findByEmail($request->email); // AdminRepository
    if (!$admin || !Hash::check($request->password, $admin->password)) {
        throw ValidationException::withMessages(['email' => ['The provided credentials are incorrect.']]);
    }

    $token = $admin->createToken('admin_auth_token')->plainTextToken;
    return response()->json(['admin' => $admin, 'access_token' => $token, 'token_type' => 'Bearer']);
}

public function logout(Request $request) { $request->user()->currentAccessToken()->delete(); /* ... */ }
public function me(Request $request)     { return response()->json($request->user()); }
```

- `register` 系メソッドは **設けない**（公開登録不可 / US-4・非機能要件）。

### 2.8 API ルート設計 (`routes/api.php`)

```php
// 生徒（従来どおり）
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// 管理者ログイン（公開エンドポイントは login のみ。register は無し）
Route::post('/admin/login', [AdminAuthController::class, 'login']);

// 生徒向け保護ルート（auth:sanctum）
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user',   [AuthController::class, 'user']);
    Route::post('/logout',[AuthController::class, 'logout']);
    // lessons / categories / materials の参照系（GET）
    // dashboard / execute / submissions ... 既存のまま
});

// 管理者向け保護ルート（auth:admin）
Route::middleware('auth:admin')->prefix('admin')->group(function () {
    Route::get('/me',      [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);

    // 管理者アカウント管理（US-4）
    Route::get('/admins',        [Admin\AdminController::class, 'index']);
    Route::post('/admins',       [Admin\AdminController::class, 'store']);
    Route::delete('/admins/{id}',[Admin\AdminController::class, 'destroy']);

    // 生徒アカウント管理（US-3）
    Route::get('/users',         [Admin\UserController::class, 'index']);
    Route::post('/users',        [Admin\UserController::class, 'store']);
    Route::put('/users/{id}',    [Admin\UserController::class, 'update']);
    Route::delete('/users/{id}', [Admin\UserController::class, 'destroy']);

    // コンテンツ管理（既存の admin 限定 CRUD を移設）
    Route::post('/lessons', [LessonController::class, 'store']);
    Route::put('/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('/lessons/{id}', [LessonController::class, 'destroy']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::post('/materials', [MaterialController::class, 'store']);
    Route::put('/materials/{id}', [MaterialController::class, 'update']);
    Route::delete('/materials/{id}', [MaterialController::class, 'destroy']);
});
```

**URL 変更点（フロント影響）**:
- 旧 `POST/PUT/DELETE /api/{lessons|categories|materials}` → `…/api/admin/{…}` に移動。
- 旧 `GET/POST/PUT/DELETE /api/users`（admin ミドルウェア下）→ `…/api/admin/users`。
- コンテンツの **参照系 GET**（`/lessons`・`/categories`・`/materials` の index/show）は生徒も使うため `auth:sanctum` 側に据え置き。管理画面は別トークンで同じ GET を叩く必要がある → §3.4 で `adminApi` の扱いを定義。

> 管理画面でコンテンツ一覧を表示するための GET も `auth:admin` 配下に複製するか検討したが、参照系は生徒・管理双方が使う共通読み取りであり、二重定義は保守コストが高い。**読み取り GET は両ガードで許可**する方針とし、該当 GET ルートのみ `auth:sanctum,admin`（複数ガード）で保護する。

```php
// 例: 読み取りは両ガードで許可
Route::middleware('auth:sanctum,admin')->group(function () {
    Route::get('/lessons', [LessonController::class, 'index']);
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::get('/categories', ...); Route::get('/categories/{id}', ...);
    Route::get('/materials', ...);  Route::get('/materials/{id}', ...);
});
```

### 2.9 バリデーション

| エンドポイント | ルール |
|----------------|--------|
| `POST /admin/login` | `email: required|email`, `password: required` |
| `POST /admin/admins` | `name: required|max:255`, `email: required|email|unique:admins`, `password: required|min:8|confirmed` |
| `POST /admin/users` | `name`, `email: required|email|unique:users`, `password: required|min:8|confirmed`（`role` 無し） |
| `PUT /admin/users/{id}` | `name|email|password` は `sometimes`。email の unique は `unique:users,email,{id}`（`role` 無し） |

### 2.10 移行（マイグレーション）

要件 US-6 の通り、`migrate:fresh --seed` と既存DBの両方で成立させる。

1. **`create_admins_table`**（新規テーブル作成）
2. **`remove_role_from_users`**（データ移行＋列削除を同一マイグレーションで実施）
   - `up()`:
     1. `users` の `role = 'admin'` 行を読み出し、`admins` に同名・同 email・**同パスワードハッシュ**で挿入（email 重複時はスキップ）。
     2. 当該 admin 行を `users` から削除。
     3. `users.role` 列を `dropColumn`。
   - `down()`: `users.role` を `string default 'user'` で再追加（厳密な逆移行は対象外。最低限スキーマを戻す）。

> パスワードは既にハッシュ済みのため再ハッシュしない（生値で `Hash::make` し直すと二重ハッシュになる）。`DB::table('users')->where('role','admin')` の生値をそのまま `admins` に流す。

### 2.11 シーダー (`DatabaseSeeder.php`)

```php
// 変更前: User::factory()->admin()->create([... 'admin@example.com'])
// 変更後:
Admin::factory()->create([
    'name'  => 'Admin User',
    'email' => 'admin@example.com',
]);

// 生徒（Test User）は従来どおり User::factory()->create([...])  ※ admin() state は削除
```

- 新規 `AdminFactory`（`database/factories/AdminFactory.php`）を追加（email ユニーク・password はデフォルトハッシュ）。
- `UserFactory` から `admin()` state を削除（`role` 概念が消えるため）。

---

## 3. フロントエンド設計

### 3.1 ディレクトリ再編（route group 化）

現状はフラットな `src/app/` 直下にページが並ぶ。これを 2 つの route group に再編する（URL は変わらない＝group 名は括弧でURLに出ない）。

```
src/app/
├── layout.tsx                 # ルート: html/body と globals のみ（Provider は各 group へ移譲）
├── (student)/
│   ├── layout.tsx             # AuthProvider + MainLayout(Sidebar)
│   ├── page.tsx               # ダッシュボード（旧 /page.tsx）
│   ├── login/page.tsx
│   ├── register/page.tsx
│   ├── lessons/[id]/page.tsx
│   ├── lessons/list/page.tsx
│   ├── categories/[id]/page.tsx
│   └── materials/[id]/page.tsx
└── (admin)/
    ├── admin/login/page.tsx       # 管理者ログイン（AdminAuthProvider 外でも可）
    └── admin/
        ├── layout.tsx             # AdminAuthProvider + AdminLayout(AdminSidebar)
        ├── page.tsx               # 管理ダッシュボード（旧 /admin/page.tsx）
        ├── lessons/[id]/page.tsx
        ├── categories/page.tsx
        ├── materials/page.tsx
        ├── materials/[id]/page.tsx
        └── users/page.tsx
```

- ルート `layout.tsx` からは `AuthProvider` / `MainLayout` を外し、html・body・フォント・globals のみ担う。
- 生徒の認証・シェルは `(student)/layout.tsx` に集約。管理者は `(admin)/admin/layout.tsx` に集約。
- 管理者ログインページ（`/admin/login`）は AdminAuthProvider の保護外に置く（未ログインで到達できる必要があるため）。

### 3.2 認証コンテキストの分離

| Context | 保存キー | 取得API | リダイレクト先 |
|---------|----------|---------|----------------|
| `AuthContext`（生徒・既存を縮小） | localStorage `token` ＋ Cookie 不要 | `GET /user` | 未認証 → `/login` |
| `AdminAuthContext`（新規） | localStorage `admin_token` ＋ **Cookie `admin_token`** | `GET /admin/me` | 未認証 → `/admin/login` |

- `User` 型から `role` を削除（`{ id, name, email }`）。
- `AdminAuthContext` は `Admin` 型（`{ id, name, email }`）を扱い、ログイン時に localStorage と Cookie の両方へトークンを保存、ログアウト時に両方を破棄する。
  - Cookie は `document.cookie = 'admin_token=...; path=/; SameSite=Lax'`（**httpOnly ではない**）。middleware が存在判定に使う粗いゲート用途。値の機密性は localStorage と同等であり、本フェーズでは httpOnly 化（＝Cookie ベース認証への全面移行）は行わない（§7 将来課題）。

### 3.3 エッジ保護 (`src/middleware.ts` 新規)

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminArea = pathname.startsWith('/admin') && pathname !== '/admin/login';
  if (isAdminArea && !req.cookies.get('admin_token')) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/admin/:path*'] };
```

- localStorage はエッジで読めないため、**Cookie の存在判定**で粗くゲートする（要件「クライアント側分岐のみに依存しない」を満たす）。
- これはあくまで体験上のガード。**真の認可境界はバックエンド `auth:admin`**（トークン改竄・Cookie 偽装があってもAPIが 401/403 を返す）。

### 3.4 API クライアントの分離 (`src/lib/`)

- 既存 `api.ts`（生徒用）: `localStorage 'token'` を Bearer 付与。401 で `/login` へ。**変更**: 管理 URL を `/login` に飛ばさないよう、リダイレクト判定はそのまま据え置き（生徒 api は生徒画面でのみ使用）。
- 新規 `adminApi.ts`: `localStorage 'admin_token'` を Bearer 付与。401 時は `/admin/login` へ。`baseURL` は同じ（`NEXT_PUBLIC_API_URL`）。

```ts
// adminApi.ts（api.ts と同型、トークンキーとリダイレクト先のみ差し替え）
config.headers.Authorization = `Bearer ${localStorage.getItem('admin_token')}`;
// 401 → window.location.href = '/admin/login'
```

- 管理画面のコンテンツ取得（GET /lessons 等、§2.8 で両ガード許可）も `adminApi` で叩く。管理 CRUD は `adminApi.post('/admin/...')`。

### 3.5 管理シェル UI（新規）

- `AdminSidebar`（または `AdminLayout` 内ナビ）を新設し、メニューは管理機能のみ：
  - 管理ダッシュボード `/admin`
  - レッスン管理 / 学習資料管理 / カテゴリ管理
  - 生徒ユーザー管理 `/admin/users`
  - **管理者管理（新規）** `/admin/admins`（一覧・招待作成）
  - ログアウト
- 生徒向け導線（ダッシュボード進捗・レッスン一覧・演習実行）は **一切置かない**（US-2）。

### 3.6 既存 Sidebar / MainLayout の変更

- `Sidebar.tsx`: `adminItems` と `user.role === 'admin'` 分岐を **削除**。生徒メニュー（ダッシュボード・レッスン一覧）のみに縮小。
- `MainLayout.tsx`: 生徒用シェルとして `(student)/layout.tsx` から利用。public path 判定はそのまま（`/login`,`/register`）。

### 3.7 管理者管理ページ（新規 `/admin/admins`）

- 一覧表示（`GET /admin/admins`）。
- 招待作成フォーム（`POST /admin/admins`：name / email / password / password_confirmation）。
- 自分自身は削除不可（API が `400 self` を返す。UI でも自分の行の削除ボタンを無効化）。

---

## 4. デッドコード削除（技術的負債）

- `frontend/src/lib/codeRunner.ts` を削除。
- 削除前に `grep -rn "codeRunner\|CodeRunner\|runner" frontend/src` で参照ゼロを再確認（要件 §技術的負債）。
- 実行・合否判定はバックエンド `POST /execute`（Docker サンドボックス）に一本化済みのため挙動に影響なし。

---

## 5. シーケンス（主要フロー）

### 5.1 管理者ログイン
```
[Admin UI] /admin/login フォーム送信
  → POST /api/admin/login (email,password)
  → AdminAuthController@login → AdminRepository@findByEmail → Hash::check
  → $admin->createToken() [tokenable_type=Admin]
  → { admin, access_token }
[Admin UI] localStorage['admin_token'] と Cookie['admin_token'] に保存 → /admin へ
```

### 5.2 生徒トークンで管理APIを叩く（拒否）
```
[生徒トークン] GET /api/admin/users  (Authorization: Bearer <user token>)
  → auth:admin ガード: provider=admins, トークンの tokenable=User → 不一致
  → 401 Unauthorized
```

### 5.3 既存管理者の移行（migrate）
```
php artisan migrate
  → create_admins_table
  → remove_role_from_users:
      users.role='admin' を admins へコピー（パスワードハッシュそのまま）
      → users から該当行削除 → users.role 列 drop
```

---

## 6. テスト設計

`role` 廃止に伴い既存テストを更新し、分離を保証する新規テストを追加する。

### 6.1 既存テスト更新
- `AdminUserManagementTest` 等：`actingAs($admin)` を **`admin` ガード**（`actingAs($admin, 'admin')` ／ Sanctum なら `Sanctum::actingAs($admin, [], 'admin')`）に変更。エンドポイントを `/api/admin/users` に更新。`role` を使うアサーションを除去。
- `User::factory()->admin()` を使うテストを `Admin::factory()` に置換。

### 6.2 新規テスト
| テスト | 検証内容（受け入れ条件対応） |
|--------|------------------------------|
| `AdminAuthTest::admin_can_login` | `/admin/login` で管理者トークン発行（US-1） |
| `AdminAuthTest::student_credentials_rejected_on_admin_login` | 生徒の email/password では `/admin/login` 失敗（US-1） |
| `AdminGuardIsolationTest::student_token_cannot_access_admin_api` | 生徒トークンで `/admin/*` が 401（US-5） |
| `AdminGuardIsolationTest::admin_token_cannot_access_student_api` | 管理者トークンで生徒専用 API（例 `/submissions`）が 401（US-2） |
| `AdminManagementTest::admin_can_create_admin` | `/admin/admins` で管理者作成（US-4） |
| `AdminManagementTest::no_public_admin_register_route` | `/admin/register` が存在しない（404）（US-4 / 非機能） |
| `AdminManagementTest::cannot_delete_self` | 自分自身の削除が 400（US-4） |
| `StudentManagementTest` | `/admin/users` の生徒 CRUD、一覧に管理者が混ざらない（US-3） |
| `MigrationTest`（任意） | `migrate:fresh --seed` 後、admin が `admins` に存在し `users` に role 列が無い（US-6） |

- DB は既存どおり SQLite インメモリ（`phpunit.xml`）。`RefreshDatabase` を使用。

---

## 7. 範囲外・将来課題（本設計で対応しないこと）

- 管理者トークンの **httpOnly Cookie 化／Sanctum SPA Cookie 認証への全面移行**（XSS 耐性向上）。本フェーズの middleware は Cookie 存在判定の粗いゲートに留め、真の認可はバックエンドが担う。全面 Cookie 認証は別フェーズ。
- 管理者間の RBAC（権限レベル分離）。
- 管理者のパスワードリセット・MFA。
- 管理用の独立 Next.js アプリ／別デプロイ（route group 内分離に留める）。

---

## 8. 影響ファイル一覧（実装時のチェックリスト用）

**バックエンド（新規）**: `app/Models/Admin.php`, `app/Repositories/AdminRepository.php`, `app/Repositories/UserRepository.php`, `app/Services/AdminService.php`, `app/Services/UserService.php`, `app/Http/Controllers/AdminAuthController.php`, `app/Http/Controllers/Admin/AdminController.php`, `app/Http/Controllers/Admin/UserController.php`, `database/factories/AdminFactory.php`, migration `create_admins_table`, migration `remove_role_from_users`

**バックエンド（変更）**: `config/auth.php`, `app/Models/User.php`, `app/Http/Controllers/AuthController.php`, `routes/api.php`, `database/seeders/DatabaseSeeder.php`, `database/factories/UserFactory.php`, `bootstrap/app.php`（admin alias 削除）

**バックエンド（削除）**: `app/Http/Middleware/AdminMiddleware.php`

**フロントエンド（新規）**: `src/app/(student)/layout.tsx`, `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/login/page.tsx`, `src/app/(admin)/admin/admins/page.tsx`, `src/context/AdminAuthContext.tsx`, `src/lib/adminApi.ts`, `src/components/AdminSidebar.tsx`（または AdminLayout）, `src/middleware.ts`

**フロントエンド（移動・変更）**: 既存ページの `(student)` / `(admin)` への移設、`src/app/layout.tsx`, `src/context/AuthContext.tsx`（role 削除）, `src/components/Sidebar.tsx`（admin 分岐削除）, `src/components/MainLayout.tsx`

**フロントエンド（削除）**: `src/lib/codeRunner.ts`
