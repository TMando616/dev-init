# 実装タスク: Phase 15 - 学生アカウント機能の整備

design.md の章番号を各タスクに併記する。原則としてタスク1つ完了ごとにコミットする。

**推奨順序**: 1（基盤）→ 2（US-1/US-2/US-4）→ 3（US-3）→ 4（US-5）→ 5（US-6）→ 6（US-7）→ 7（フロント）→ 8（仕上げ）。
2〜6 はバックエンドを先に閉じてからフロントに入る構成にしてある。7-a〜7-c は対応するバックエンドタスクが終わっていれば先に着手してもよい。

---

## 1. 基盤整備（SoftDeletes・設定・メール環境）

- [x] 1-1. Mailpit と scheduler サービスを docker-compose に追加
  - `docker-compose.yml`: `mailpit`（`axllent/mailpit`, SMTP 1025 / UI 8025）を追加
  - `docker-compose.yml`: `scheduler` サービスを `profiles: ["scheduler"]` 付きで追加（`php artisan schedule:work`、Dockerソケットはマウントしない）
  - `backend/.env.example`: `MAIL_MAILER=smtp` / `MAIL_HOST=mailpit` / `MAIL_PORT=1025` / `MAIL_FROM_ADDRESS` / `MAIL_FROM_NAME` / `FRONTEND_URL` / `ACCOUNT_RETENTION_DAYS` を更新・追加
  - ローカルの `backend/.env` にも同じ値を反映し、`http://localhost:8025` が開けることを確認する
  - 参照: design.md §8.3, §11

- [x] 1-2. `users` へのソフトデリート導入
  - `backend/database/migrations/2026_08_05_000000_add_deleted_at_to_users_table.php` を新規作成（`softDeletes()`）
  - `backend/app/Models/User.php` に `SoftDeletes` トレイトを追加
  - `docker compose exec php php artisan migrate` で適用
  - 参照: design.md §1.1, §1.2

- [x] 1-3. 設定ファイルの追加
  - `backend/config/account.php` を新規作成（`retention_days` / `reactivation_token_expire`）
  - `backend/config/app.php` に `frontend_url` を追加
  - 参照: design.md §1.3

- [x] 1-4. `UserRepository` にメソッドを追加
  - `findByEmail` / `findTrashedByEmail` / `allTrashed` / `findWithTrashed` / `restore` / `forceDelete` / `trashedOlderThan`
  - 参照: design.md §5.3

---

## 2. 自分のアカウント操作（US-1 プロフィール / US-2 パスワード変更 / US-4 退会）

- [x] 2-1. FormRequest 3件を追加
  - `backend/app/Http/Requests/UpdateProfileRequest.php`
  - `backend/app/Http/Requests/UpdatePasswordRequest.php`（`current_password:sanctum` を使う）
  - `backend/app/Http/Requests/DeleteAccountRequest.php`
  - `authorize()` は Phase 14 と同じ方針でコメントを残す
  - 参照: design.md §2.2

- [x] 2-2. `AccountService` を実装
  - `backend/app/Services/AccountService.php`: `updateProfile` / `changePassword` / `delete`
  - `changePassword` は現在のトークン以外を失効させる（`TransientToken` 対策の分岐を入れる）
  - `delete` は全トークン失効 → `$user->delete()`
  - 参照: design.md §5.2

- [x] 2-3. `AccountController` とルートを追加
  - `backend/app/Http/Controllers/AccountController.php`: `updateProfile` / `updatePassword` / `destroy`
  - `backend/app/Providers/AppServiceProvider.php` に `account` リミッターを追加
  - `backend/routes/api.php` に3ルートを追加（profile は `throttle:api`、password / delete は `throttle:account`）
  - 参照: design.md §3.1, §3.2, §7

- [x] 2-4. `tests/Feature/AccountTest.php` を作成
  - プロフィール更新成功 / 自分の現在のメールのまま保存できる / 他人のメールで422 / 未認証401
  - パスワード変更成功 / 現在パスワード誤りで422 / 変更後に他端末トークンが失効し操作端末は生存（実トークンを2本取得して検証）
  - 退会で `deleted_at` がセットされ全トークン失効 / 退会後にログイン不可 / 退会前トークンで401 / `submissions` が残る
  - 参照: design.md §12

---

## 3. パスワードリセット（US-3）

- [x] 3-1. `ResetPasswordNotification` を追加
  - `backend/app/Notifications/ResetPasswordNotification.php`（日本語・リンク先は `config('app.frontend_url')`）
  - `User::sendPasswordResetNotification()` をオーバーライドして差し替え
  - 参照: design.md §1.2, §6

- [x] 3-2. リセット系の FormRequest / Service / Controller / ルートを追加
  - `ForgotPasswordRequest` / `ResetPasswordRequest`
  - `backend/app/Services/PasswordResetService.php`（`Password` ファサードのラップ、ステータス変換）
  - `backend/app/Http/Controllers/PasswordResetController.php`: `sendResetLink` / `reset`
  - `routes/api.php` の `throttle:auth` グループに2ルートを追加
  - 送信結果によらず同一メッセージを返すこと
  - 参照: design.md §3.2, §7

- [x] 3-3. `tests/Feature/PasswordResetTest.php` を作成
  - 登録済み / 未登録で同一メッセージ・通知の有無 / リセット成功後に新パスワードでログイン可
  - トークン再利用で422 / 改ざんトークンで422 / 退会済みには送信されない
  - 参照: design.md §12

- [x] 3-4. Mailpit で実際のメール受信を手動確認
  - `/api/forgot-password` を叩き、`http://localhost:8025` で本文とリンク先URLを確認する
  - リンクが `http://localhost:3000/reset-password?token=..&email=..` になっていること

---

## 4. 復会（US-5）

- [x] 4-1. 復会トークンのテーブルとリポジトリを追加
  - `backend/database/migrations/2026_08_05_000001_create_account_reactivation_tokens_table.php`
  - `backend/app/Repositories/ReactivationTokenRepository.php`（発行・取得・削除。トークンはハッシュ保存）
  - 参照: design.md §1.1, §5.1

- [x] 4-2. `ReactivateAccountNotification` を追加
  - `backend/app/Notifications/ReactivateAccountNotification.php`（日本語・有効期限60分・進捗引き継ぎと氏名据え置きの説明を含める）
  - 参照: design.md §6

- [x] 4-3. `ReactivationService` を実装
  - `resolveRegistration()`: 退会済み（保持期間内）→ 復会メール送信で `null` を返す / 保持期間超過 → `forceDelete()` して通常登録 / 未登録 → 通常登録
  - `reactivate()`: トークン照合・期限・保持期間を検証 → `restore()` + パスワード更新 + トークン行削除。失敗は `ValidationException` で422
  - 復会時に氏名は上書きしない
  - 参照: design.md §5.1

- [x] 4-4. 登録フローと復会エンドポイントを接続
  - `RegisterRequest` の `email` を `Rule::unique('users')->whereNull('deleted_at')` に変更
  - `AuthController::register` を `ReactivationService::resolveRegistration()` 経由に変更（`null` なら202 + 案内メッセージ）
  - `ReactivateAccountRequest` / `ReactivationController` を追加し、`throttle:auth` グループに `POST /reactivate` を追加
  - 参照: design.md §2.2, §3.2, §4.1, §7

- [x] 4-5. `tests/Feature/ReactivationTest.php` を作成
  - 退会済みメールで登録してもユーザーが増えず202 / 復会通知が送られる
  - 復会で `deleted_at` がクリアされ新パスワードでログイン可 / 退会前の `submissions` を引き継ぐ
  - トークン再利用で422 / 30日超過は復会不可 / 30日超過レコードがある状態での新規登録は成功する
  - 有効なメールでの登録は従来どおり422 / 未登録メールは従来どおり200+トークン
  - 参照: design.md §12

---

## 5. 保持期間超過アカウントの自動削除（US-6）

- [x] 5-1. `PurgeDeletedUsers` コマンドを実装
  - `backend/app/Console/Commands/PurgeDeletedUsers.php`（`users:purge-deleted {--days=} {--dry-run}`）
  - `forceDelete()` で `users` と連鎖する `submissions` を物理削除。`account_reactivation_tokens` の残骸も削除
  - 件数を `Log::info` とコンソールに出力
  - 参照: design.md §8.1

- [x] 5-2. スケジュール登録
  - `backend/routes/console.php` に `Schedule::command('users:purge-deleted')->dailyAt('03:00')->withoutOverlapping()`
  - 参照: design.md §8.2

- [x] 5-3. `tests/Feature/PurgeDeletedUsersTest.php` を作成
  - 30日超過は削除される（submissions も連鎖削除）/ 29日目は削除されない / 未退会は削除されない
  - `--dry-run` では削除されない / 件数がログ出力される
  - 参照: design.md §12

- [x] 5-4. scheduler サービスの動作確認
  - `docker compose --profile scheduler up scheduler` で起動し、`schedule:list` にコマンドが載ることを確認する

---

## 6. 管理者側の対応（US-7）

- [x] 6-1. 一覧フィルタと完全削除をバックエンドに追加
  - `backend/app/Http/Requests/Admin/IndexUserRequest.php`（`status: sometimes|in:active,deleted`）
  - `UserService::list(string $status)` / `UserService::forceDelete(int $id)` を追加
  - `UserService::delete` を「全トークン失効 + ソフトデリート」に揃える
  - `Admin\UserController::index` を `IndexUserRequest` 対応に、`forceDestroy` を追加
  - `routes/api.php` に `DELETE /admin/users/{id}/force` を追加
  - `Admin\StoreUserRequest` の `messages()` に退会済み衝突時の説明を追加
  - 参照: design.md §2.2, §9

- [x] 6-2. `StudentManagementTest` を更新・拡充
  - `test_admin_can_delete_student`（`tests/Feature/StudentManagementTest.php:89`）の `assertDatabaseMissing` を `assertSoftDeleted` に変更
  - 完全削除で `assertDatabaseMissing` になるケースを追加
  - 退会済みが既定の一覧に出ない / `?status=deleted` で出るケースを追加
  - 参照: design.md §12

---

## 7. フロントエンド

- [x] 7-1. 公開パス定義の一元化と設定画面への導線
  - `frontend/src/lib/routes.ts` を新規作成（`PUBLIC_PATHS` / `isPublicPath`）
  - `context/AuthContext.tsx` と `components/MainLayout.tsx` の公開パス配列を差し替え
  - `AuthContext` に `refreshUser`（`checkAuth` の公開）と `clearSession()` を追加
  - `components/Sidebar.tsx` に「設定」ナビ項目を追加
  - 参照: design.md §10.2, §10.3

- [x] 7-2. `/settings` を実装（US-1 / US-2 / US-4）
  - `frontend/src/app/(student)/settings/page.tsx`
  - プロフィール / パスワード変更 / 退会 の3カード。それぞれ独立フォーム
  - プロフィール保存後に `refreshUser()`、422 の `errors.email` をフィールド下に表示
  - 退会は保持期間30日の説明を常時表示し、パスワード入力 + `confirm()` の二段階 → `clearSession()`
  - すべて `dark:` バリアント付きで実装
  - 参照: design.md §10.1, §10.4

- [x] 7-3. パスワードリセットの画面を実装（US-3）
  - `frontend/src/app/(student)/forgot-password/page.tsx`
  - `frontend/src/app/(student)/reset-password/page.tsx`（`useSearchParams` は `<Suspense>` で包む）
  - `app/(student)/login/page.tsx` に「パスワードをお忘れの方」リンクを追加
  - 実装前に `frontend/node_modules/next/dist/docs/` で現行APIを確認する
  - 参照: design.md §10.1, §10.3

- [x] 7-4. 復会の画面と登録画面の分岐を実装（US-5）
  - `frontend/src/app/(student)/reactivate/page.tsx`
  - `app/(student)/register/page.tsx`: `access_token` があれば `login()`、無ければ（202）案内メッセージを表示
  - 参照: design.md §10.1, §10.3

- [x] 7-5. 管理画面に退会済みタブと完全削除を追加（US-7）
  - `frontend/src/app/(admin)/admin/users/page.tsx`
  - 「有効 / 退会済み」タブ、退会済みタブでは操作を「完全削除」のみに
  - 完全削除は「この操作は取り消せません」の `confirm()` を挟んで `DELETE /admin/users/{id}/force`
  - 参照: design.md §9.2, §10.4

---

## 8. 仕上げ

- [x] 8-1. テストとLintを通す
  - `docker compose exec php php artisan test`（既存テストの回帰を含めて全緑にする）
  - `docker compose exec node npm run lint`
  - `RateLimitingTest` に `throttle:account` の429ケースを1件追加
  - 参照: design.md §12

- [ ] 8-2. 手動での通し確認
  - 登録 → 退会 → 同じメールで登録 → Mailpit の復会リンク → 復会 → ログイン → 退会前の進捗が残っている
  - パスワードリセットの通し確認（Mailpit経由）
  - 2端末（通常ウィンドウ + シークレットウィンドウ）でパスワード変更時のトークン失効を確認
  - ダークモードで新規4画面の表示崩れがないか確認

- [ ] 8-3. スペックのクローズ
  - `requirements.md` の受け入れ条件チェックボックスを埋める
  - `design.md` §15「実装時に判明した設計との差分」を追記する
  - `/code-review` を実行して受け入れ条件との整合を確認する
