# 実装タスク: Phase 16 - 管理者アカウント機能の整備

design.md の章番号を各タスクに併記する。原則としてタスク1つ完了ごとにコミットする。

**推奨順序**: 1（基盤）→ 2（US-1/US-2）→ 3（US-3）→ 4（US-4）→ 5（フロント）→ 6（仕上げ）。
1-4（リミッターのキー修正）は 2-3 でルートを追加する前に必ず入れる。5-1（公開パスの一元化）は 5-3・5-4 の画面追加より先に行う。

---

## 1. 基盤整備（リセットブローカー・通知・リミッター）

- [x] 1-1. 管理者用リセットトークンテーブルを追加
  - `backend/database/migrations/2026_08_21_000000_create_admin_password_reset_tokens_table.php` を新規作成
  - `email` 主キー / `token` / `created_at` nullable（Laravel標準の `password_reset_tokens` と同一構造にする。`DatabaseTokenRepository` がこの3カラムを前提にしている）
  - `docker compose exec php php artisan migrate` を実行し、`migrate:status` で適用済みになったことを確認する（phase15 §15.5 の適用漏れを繰り返さないため）
  - 参照: design.md §1.1, §11

- [x] 1-2. `config/auth.php` に `admins` ブローカーを追加
  - `passwords.admins`: `provider => 'admins'` / `table => 'admin_password_reset_tokens'` / `expire => 60` / `throttle => 60`
  - `AUTH_PASSWORD_BROKER` は `users` のまま変更しない（管理者側は `Password::broker('admins')` と明示取得する）
  - 参照: design.md §1.2

- [x] 1-3. `AdminResetPasswordNotification` を追加し `Admin` に接続
  - `backend/app/Notifications/AdminResetPasswordNotification.php`（日本語・リンク先は `config('app.frontend_url') . '/admin/reset-password'`）
  - 件名に「管理者アカウント」を含める（同じメールアドレスに受講生向け通知が届いても取り違えないため。US-3 の受け入れ条件）
  - `Admin::sendPasswordResetNotification()` をオーバーライドして差し替え
  - 参照: design.md §1.3, §6

- [ ] 1-4. `account` リミッターのキーを修正
  - `backend/app/Providers/AppServiceProvider.php`: `by($request->user()?->id ?: $request->ip())` を `by($user ? $user->getMorphClass() . ':' . $user->id : $request->ip())` に変更
  - **2-3 でルートを追加する前に入れること**。id だけのキーだと admin#1 と user#1 が同じバケットを共有する
  - 参照: design.md §7.1, §11 #1

- [ ] 1-5. `AdminRepository` に `update` を追加
  - `public function update(Admin $admin, array $data): bool`
  - 参照: design.md §5.4

---

## 2. 管理者の自己操作（US-1 プロフィール / US-2 パスワード変更）

- [ ] 2-1. FormRequest 2件を追加
  - `backend/app/Http/Requests/Admin/UpdateProfileRequest.php`
    - `email` の unique 対象は **`admins` テーブルのみ**（`users` との重複は許容する。US-1）
    - `current_password` は `Rule::requiredIf()` で**メールを実際に変更するときだけ**必須。ガード指定は `current_password:admin`
  - `backend/app/Http/Requests/Admin/UpdatePasswordRequest.php`（`current_password:admin` / `password` は `min:8|confirmed`）
  - `authorize()` は既存方針どおり `true` + コメント
  - 参照: design.md §2.2

- [ ] 2-2. `AdminAccountService` を実装
  - `backend/app/Services/AdminAccountService.php`: `updateProfile` / `changePassword`
  - `changePassword` は現在のトークン以外を失効させる（`TransientToken` 対策の分岐を入れる）
  - 参照: design.md §5.1

- [ ] 2-3. `Admin\AccountController` とルートを追加
  - `backend/app/Http/Controllers/Admin/AccountController.php`: `updateProfile` / `updatePassword`
  - `updateProfile` は `$request->safe()->only(['name', 'email'])` を Service に渡す（`current_password` は本人確認でありプロフィール項目ではない）
  - `backend/routes/api.php` の `auth:admin` グループに2ルートを追加。パスワード変更は `->withoutMiddleware('throttle:api')->middleware('throttle:account')` とし、**グループ構造は組み替えない**（既存18ルートに影響を出さないため）
  - 参照: design.md §3.1, §3.2, §7.3

- [ ] 2-4. `tests/Feature/AdminAccountTest.php` を作成
  - プロフィール更新成功 / 現在のメールのまま保存できる / 他の管理者のメールで422 / **受講生と同じメールには変更できる**
  - メール変更に `current_password` が要る / 誤りで422 / 改名だけなら不要
  - 未認証401 / **受講生トークンで401**
  - パスワード変更成功 / 現在パスワード誤りで422 / 変更後に他端末トークンが失効し操作端末は生存（`/api/admin/login` で実トークンを2本取得して検証）
  - 参照: design.md §10

---

## 3. 管理者のパスワードリセット（US-3）

- [ ] 3-1. リセット系の FormRequest / Service / Controller / ルートを追加
  - `AdminForgotPasswordRequest` / `AdminResetPasswordRequest`
  - `backend/app/Services/AdminPasswordResetService.php`（`Password::broker('admins')` のラップ、ステータス変換）
    - `reset` のコールバックで `$admin->tokens()->delete()` を行う（漏洩を疑って踏む導線のため。phase15 §15.4 #2 の対応を最初から織り込む）
  - `backend/app/Http/Controllers/AdminPasswordResetController.php`: `sendResetLink` / `reset`
  - `routes/api.php` の `throttle:auth` グループに2ルートを追加
  - 送信結果によらず同一メッセージを返すこと
  - 参照: design.md §3.2, §5.2, §7.2

- [ ] 3-2. `tests/Feature/AdminPasswordResetTest.php` を作成
  - 登録済み / 未登録で同一メッセージ・通知の有無 / リセット成功後に新パスワードでログイン可
  - リセットで既存トークンが全失効 / トークン再利用で422 / 改ざんトークンで422 / 期限切れで422
  - 参照: design.md §10

- [ ] 3-3. `tests/Feature/AdminPasswordResetIsolationTest.php` を作成
  - **同一メールアドレスの受講生と管理者を併存させた状態**で以下を検証する（本フェーズ固有のリスクのため専用ファイルに切る）
    - 管理者のリセットで受講生のパスワードが変わらない
    - 受講生のリセットで管理者のパスワードが変わらない
    - `/api/forgot-password` に管理者のメールを送っても管理者宛に通知が飛ばない
    - `/api/admin/forgot-password` に受講生のメールを送っても受講生宛に通知が飛ばない
  - 参照: design.md §4.1, §10

- [ ] 3-4. Mailpit で実際のメール受信を手動確認
  - `/api/admin/forgot-password` を叩き、`http://localhost:8025` で件名・本文・リンク先URLを確認する
  - 件名に「管理者アカウント」が入っていること、リンクが `http://localhost:3000/admin/reset-password?token=..&email=..` になっていること

---

## 4. 管理者削除時のあと片付け（US-4）

- [ ] 4-1. `AdminPasswordResetTokenRepository` を追加し `AdminService::delete` に接続
  - `backend/app/Repositories/AdminPasswordResetTokenRepository.php`: `delete(string $email): void` のみ（発行・照合はブローカーが握るため掃除だけを持つ）
  - `AdminService::delete` に全トークン失効とリセットトークン行の削除を追加。戻り値の契約（`'self' | 'not_found' | 'deleted'`）は変えない
  - 参照: design.md §5.3, §5.4, §8

- [ ] 4-2. `AdminManagementTest` にケースを追加
  - 削除された管理者のトークンで管理者APIを叩くと401
  - 削除で `admin_password_reset_tokens` の該当行が消える
  - 自己削除禁止（400）の既存挙動が変わっていないこと
  - 参照: design.md §10

- [ ] 4-3. `RateLimitingTest` にケースを追加
  - 同じ id を持つ管理者と受講生が、`throttle:account` で互いに429にならないこと（1-4 のキー修正の裏付け）
  - 参照: design.md §7.1, §10

---

## 5. フロントエンド

- [ ] 5-1. 管理者側の公開パス定義を一元化
  - `frontend/src/lib/adminRoutes.ts` を新規作成（`ADMIN_PUBLIC_PATHS` / `isAdminPublicPath`）
  - `lib/adminApi.ts` の401リダイレクト除外、`context/AdminAuthContext.tsx` の `publicPaths`、`components/AdminLayout.tsx` の判定をすべて差し替える
  - **5-3・5-4 の画面追加より先に行う**。ここを直さないと古いトークンを持つ端末でリセットリンクが使い切れない（phase15 §15.4 #1 と同じ不具合）
  - 参照: design.md §9.2

- [ ] 5-2. `AdminAuthContext` と `AdminSidebar` の変更
  - `AdminAuthContext` に `refreshAdmin`（`checkAuth` の公開）を追加
  - `AdminSidebar` に「設定」(`/admin/settings`) を追加。`Settings` アイコンは「レッスン管理」が使用済みのため別アイコン（`UserCog` 等）を充てる
  - 参照: design.md §9.3

- [ ] 5-3. `/admin/settings` を実装（US-1 / US-2）
  - `frontend/src/app/(admin)/admin/settings/page.tsx`
  - プロフィール / パスワード変更 の2カード。それぞれ独立フォーム（**退会カードは作らない**）
  - メール欄が現在値と変わったときだけ「現在のパスワード」欄を表示し `current_password` として送る
  - 保存後に `refreshAdmin()`、422 の `errors.email` / `errors.current_password` を各フィールド下に表示
  - すべて `dark:` バリアント付きで実装
  - 参照: design.md §9.1, §9.4

- [ ] 5-4. 管理者パスワードリセットの画面を実装（US-3）
  - `frontend/src/app/(admin)/admin/forgot-password/page.tsx`
  - `frontend/src/app/(admin)/admin/reset-password/page.tsx`（`useSearchParams` は `<Suspense>` で包む）
  - `app/(admin)/admin/login/page.tsx` に「パスワードをお忘れの方」リンクを追加
  - 実装前に `frontend/node_modules/next/dist/docs/` で現行APIを確認する
  - 参照: design.md §9.1, §9.3

---

## 6. 仕上げ

- [ ] 6-1. テストとLintを通す
  - `docker compose exec php php artisan test`（既存テストの回帰を含めて全緑にする）
  - `docker compose exec node npm run lint` と `npx tsc --noEmit`
  - 参照: design.md §10

- [ ] 6-2. 手動での通し確認
  - 管理者を新規招待 → その管理者でログイン → `/admin/settings` で改名（サイドバー名が即反映されるか）
  - メールアドレス変更（パスワード欄が出るか、誤ったパスワードで弾かれるか）→ 変更後のメールでログイン
  - パスワード変更を2端末（通常ウィンドウ + シークレットウィンドウ）で確認（他端末が401、操作端末は継続）
  - `/admin/login` →「パスワードをお忘れの方」→ Mailpit のリンク → 再設定 → 新パスワードでログイン
  - **古い `admin_token` が残った状態でリセットリンクを開いても `/admin/login` に飛ばされないこと**（5-1 の裏付け）
  - 管理者を削除 → その管理者のトークンで管理者APIが401になること
  - ダークモードで新規3画面の表示崩れがないか確認

- [ ] 6-3. スペックのクローズ
  - `requirements.md` の受け入れ条件チェックボックスを埋める
  - `design.md` §13「実装時に判明した設計との差分」を追記する
  - `/code-review` を実行して受け入れ条件との整合を確認する
