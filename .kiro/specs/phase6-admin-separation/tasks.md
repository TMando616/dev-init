# Tasks: Phase 6 - 管理者と生徒の完全分離

実装は依存順（DB/モデル → ガード → バックエンドAPI → 移行/シーダー → バックエンドテスト → フロント分離 → フロントUI → 検証）で進める。
各サブタスク完了ごとにコミットする。`design.md` の §番号を適宜参照。

## 1. Backend: モデル・DB（admins 新設）
- [x] 1.1 `admins` テーブルのマイグレーション作成（`create_admins_table`）
  - カラム: `id`, `name`, `email`(unique), `password`, `remember_token`(nullable), timestamps（design §1.1）
- [x] 1.2 `Admin` モデルの作成（`app/Models/Admin.php`）
  - `Authenticatable` 継承＋`HasApiTokens, HasFactory, Notifiable`、`#[Fillable(['name','email','password'])]`、`#[Hidden([...])]`、`casts: password=>hashed`
  - submissions リレーション・role 判定は **持たない**（design §2.2）
- [x] 1.3 `AdminFactory` の作成（`database/factories/AdminFactory.php`）
  - email ユニーク、password はデフォルトハッシュ

## 2. Backend: 認証ガード
- [x] 2.1 `config/auth.php` に `admins` provider と `admin` ガード（driver=sanctum, provider=admins）を追加（design §2.1）

## 3. Backend: Repository・Service
- [x] 3.1 `AdminRepository` 作成（all/find/findByEmail/create/delete）
- [x] 3.2 `UserRepository` 作成（all/find/create/update/delete）— AuthController のベタ書きCRUDを移設する受け皿
- [x] 3.3 `AdminService` 作成（list/create〔Hash::make〕/delete〔self-delete 防止〕）（design §2.6）
- [x] 3.4 `UserService` 作成（list/create/update/delete、パスワードは値があるときのみ Hash::make）

## 4. Backend: Controller・ルート
- [x] 4.1 `AdminAuthController` 作成（login / logout / me）。register は設けない（design §2.7）
- [x] 4.2 `Admin\AdminController` 作成（index / store / destroy）— 管理者アカウント管理（US-4）
- [x] 4.3 `Admin\UserController` 作成（index / store / update / destroy）— 生徒アカウント管理（US-3、`role` 無し）
- [x] 4.4 `AuthController` を生徒用に縮小（register/login/logout/user のみ、`role` 除去、CRUD系メソッド削除）
- [x] 4.5 `User` モデルから `role`（Fillable）と `isAdmin()` を削除（design §2.3）
- [x] 4.6 `routes/api.php` 再編（design §2.8）
  - `POST /admin/login` 公開追加
  - `auth:admin` prefix `admin` グループ: me/logout、`/admins` CRUD、`/users` CRUD、lessons/categories/materials の書き込み系を移設
  - 参照系 GET（lessons/categories/materials index・show）を `auth:sanctum,admin` の複数ガードに変更
  - 旧 `admin` ミドルウェア配下の CRUD ブロックを撤去
- [x] 4.7 `AdminMiddleware` 削除＋`bootstrap/app.php` の `admin` alias 削除（design §2.4）

## 5. Backend: 移行・シーダー
- [x] 5.1 `remove_role_from_users` マイグレーション作成（design §2.10）
  - up: `users.role='admin'` を `admins` へコピー（**パスワードハッシュそのまま・再ハッシュしない**、email 重複skip）→ 該当 user 行削除 → `role` 列 drop
  - down: `users.role`(string default 'user') を再追加
- [x] 5.2 `DatabaseSeeder` 更新（admin を `Admin::factory()` で作成、生徒の `->admin()` state 利用を除去）（design §2.11）
- [x] 5.3 `UserFactory` から `admin()` state を削除

## 6. Backend: テスト
- [ ] 6.1 既存テスト更新（`role` 前提・`User::factory()->admin()`・旧 `/users` を新方式へ）（design §6.1）
- [ ] 6.2 `AdminAuthTest`（管理者ログイン成功 / 生徒資格情報での管理者ログイン拒否）
- [ ] 6.3 `AdminGuardIsolationTest`（生徒トークン→管理API 401 / 管理者トークン→生徒専用API 401）
- [ ] 6.4 `AdminManagementTest`（管理者作成 / `/admin/register` が404 / self-delete 400）
- [ ] 6.5 `StudentManagementTest`（生徒CRUD、一覧に管理者が混ざらない）
- [ ] 6.6 （任意）`MigrationTest`（`migrate:fresh --seed` 後 admin が admins に存在・users に role 列が無い）

## 7. Frontend: 認証・APIクライアント分離
- [ ] 7.1 `src/lib/adminApi.ts` 作成（`admin_token` を Bearer 付与、401→`/admin/login`）（design §3.4）
- [ ] 7.2 `AdminAuthContext.tsx` 作成（login/logout/me、localStorage `admin_token` ＋ Cookie `admin_token` 保存、`/admin/me` 取得）（design §3.2）
- [ ] 7.3 `AuthContext.tsx` から `role` を除去（`User` 型を `{id,name,email}` に）
- [ ] 7.4 `src/middleware.ts` 作成（`/admin/:path*` で Cookie `admin_token` 無→`/admin/login` リダイレクト、`/admin/login` は除外）（design §3.3）

## 8. Frontend: route group 再編
- [ ] 8.1 ルート `layout.tsx` を html/body/globals のみに縮小（Provider を各 group へ移譲）（design §3.1）
- [ ] 8.2 `(student)` group 作成＋既存生徒ページ移設（page/login/register/lessons/categories/materials）、`(student)/layout.tsx` に AuthProvider+MainLayout
- [ ] 8.3 `(admin)` group 作成＋既存管理ページ移設、`(admin)/admin/layout.tsx` に AdminAuthProvider+Adminシェルをラップ。URL が変わらないこと（group 名は括弧でURLに出ない）を確認

## 9. Frontend: 管理シェル・UI
- [ ] 9.1 `AdminSidebar`（または AdminLayout 内ナビ）作成。メニューは管理機能のみ（生徒導線を置かない）（design §3.5）
- [ ] 9.2 `src/app/(admin)/admin/login/page.tsx` 作成（管理者ログイン、AdminAuthProvider 保護外）
- [ ] 9.3 `src/app/(admin)/admin/admins/page.tsx` 作成（管理者一覧＋招待作成フォーム、自分の削除ボタン無効化）（design §3.7）
- [ ] 9.4 既存管理ページの API 呼び出しを `adminApi` ＋新URL（`/admin/...`）に差し替え（users 管理含む）
- [ ] 9.5 `Sidebar.tsx` から `adminItems`・`user.role==='admin'` 分岐を削除（生徒メニューのみ）（design §3.6）

## 10. クリーンアップ（技術的負債）
- [ ] 10.1 `frontend/src/lib/codeRunner.ts` 削除（事前に `grep -rn "codeRunner\|CodeRunner\|runner" frontend/src` で参照ゼロ確認）（design §4）

## 11. 動作確認・lint
- [ ] 11.1 バックエンドテスト実行（`php artisan test`）— 新規・既存すべてパス
- [ ] 11.2 `php artisan migrate:fresh --seed` が通り、admin が `admins`・生徒が `users` に入ることを確認
- [ ] 11.3 フロントエンド lint・build（`npm run lint` / `npm run build`）
- [ ] 11.4 ブラウザ／API で end-to-end 確認
  - 管理者ログイン→管理画面操作、生徒ログイン→学習フロー
  - 生徒トークンで `/admin/*` 拒否、未認証で `/admin` →`/admin/login` リダイレクト
