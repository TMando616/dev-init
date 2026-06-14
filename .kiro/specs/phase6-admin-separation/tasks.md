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
- [x] 6.1 既存テスト更新（`role` 前提・`User::factory()->admin()`・旧 `/users` を新方式へ）（design §6.1）
  - Lesson/Category/MaterialTest: admin を `Admin::factory()`＋`actingAs(...,'admin')`、書き込みを `/api/admin/*` に、生徒の不可テストは 401 に更新
- [x] 6.2 `AdminAuthTest`（管理者ログイン成功 / 生徒資格情報での管理者ログイン拒否 / me / logout）
- [x] 6.3 `AdminGuardIsolationTest`（生徒トークン→管理API 401 / 管理者トークン→生徒専用API 401 / 共有GETは両方200）
- [x] 6.4 `AdminManagementTest`（管理者作成 / `/admin/register` が404 / self-delete 400）
- [x] 6.5 `StudentManagementTest`（生徒CRUD、一覧に管理者が混ざらない）
- [ ] 6.6 （任意）`MigrationTest` — 未着手（任意のため後回し可）
- [ ] ⚠️ テスト実行は環境準備待ち（ホストPHPに `pdo_sqlite` 無し／Docker未起動）。`php8.4-sqlite3` 導入後 or docker で要実行（→ 11.1）

## 7. Frontend: 認証・APIクライアント分離
- [x] 7.1 `src/lib/adminApi.ts` 作成（`admin_token` を Bearer 付与、401→`/admin/login`）（design §3.4）
- [x] 7.2 `AdminAuthContext.tsx` 作成（login/logout/me、localStorage `admin_token` ＋ Cookie `admin_token` 保存、`/admin/me` 取得）（design §3.2）
- [x] 7.3 `AuthContext.tsx` から `role` を除去（`User` 型を `{id,name,email}` に）
- [x] 7.4 `src/proxy.ts` 作成（design §3.3）。※Next.js 16 で `middleware` 規約は `proxy` に改称されたため `middleware.ts` ではなく `proxy.ts` を採用

## 8. Frontend: route group 再編
- [x] 8.1 ルート `layout.tsx` を html/body/globals のみに縮小（Provider を各 group へ移譲）（design §3.1）
- [x] 8.2 `(student)` group 作成＋既存生徒ページ移設（page/login/register/lessons/categories/materials）、`(student)/layout.tsx` に AuthProvider+MainLayout
- [x] 8.3 `(admin)` group 作成＋既存管理ページ移設、`(admin)/admin/layout.tsx` に AdminAuthProvider+AdminLayout をラップ。URL不変（group 名は括弧）

## 9. Frontend: 管理シェル・UI
- [x] 9.1 `AdminSidebar` ＋ `AdminLayout` 作成。メニューは管理機能のみ（生徒導線を置かない）（design §3.5）
- [x] 9.2 `src/app/(admin)/admin/login/page.tsx` 作成（管理者ログイン、AdminLayout がシェルを出さない）
- [x] 9.3 `src/app/(admin)/admin/admins/page.tsx` 作成（管理者一覧＋招待作成、自分の削除ボタン無効化）（design §3.7）
- [x] 9.4 既存管理ページの API 呼び出しを `adminApi` ＋新URL（`/admin/...`）に差し替え（users→生徒管理含む、role UI 撤去）
- [x] 9.5 `Sidebar.tsx` から `adminItems`・`user.role==='admin'` 分岐を削除（生徒メニューのみ）（design §3.6）

## 10. クリーンアップ（技術的負債）
- [x] 10.1 `frontend/src/lib/codeRunner.ts` 削除（参照ゼロ確認済み）（design §4）

## 11. 動作確認・lint
- [ ] 11.1 バックエンドテスト実行（`php artisan test`）— ⚠️ 環境ブロック中（ホストPHPに `pdo_sqlite` 無し／Docker未起動）。`php8.4-sqlite3` 導入 or docker で要実行
- [ ] 11.2 `php artisan migrate:fresh --seed` が通り、admin が `admins`・生徒が `users` に入ることを確認 — ⚠️ 同上（要DB環境）
- [x] 11.3 フロントエンド lint（`npm run lint`）パス。build は ⚠️ 環境ブロック（`next build` が WSL2 で Bus error／`.next` が稼働中 dev サーバ所有でクリーン不可）。要クリーン環境で `npm run build`
- [ ] 11.4 ブラウザ／API で end-to-end 確認 — 環境準備後に実施
  - 管理者ログイン→管理画面操作、生徒ログイン→学習フロー
  - 生徒トークンで `/admin/*` 拒否、未認証で `/admin` →`/admin/login` リダイレクト
