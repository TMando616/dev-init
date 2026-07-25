# Tasks: Phase 13 - ロゴ・言語トップ画像導入

実装は `design.md` の章立て（アセット準備 → 共通基盤 → ロゴ差し替え → レッスンカード → ダッシュボード → レッスン一覧）の順で進める。各サブタスク完了ごとにコミットする。

## 1. アセット準備（design §1）

- [x] 1.1 `sharp`を使った一発リサイズスクリプトで元画像を最適化し、`frontend/public/images/`配下に配置する
  - 元ファイル: `/mnt/c/Users/user/Downloads/dev-init-logo.png`, `{java,javascript,php,python,ruby}-logo.png`, `dev-init-favicon.ico`
  - 出力先: `frontend/public/images/logo/dev-init-logo.png`（1200x459, 97KB）, `frontend/public/images/languages/{php,python,javascript,ruby,java}.png`（幅1600px、278〜458KB）
  - スクリプト自体はリポジトリに残さず使い捨てで実行する（design §1.2）
- [x] 1.2 `frontend/src/app/favicon.ico`を`dev-init-favicon.ico`の内容で上書きする（design §4.3）

## 2. 共通基盤（design §2, §3）

- [x] 2.1 `frontend/src/lib/languages.ts`を新規作成し、`SupportedLanguage`型・`LANGUAGE_ASSETS`マッピング・`getLanguageAsset()`を実装する
  - 対象: `frontend/src/lib/languages.ts`（design §2のコード例通り）
  - キーはシーダー実値の`php`/`python`/`javascript`/`ruby`/`java`と一致させる（`ruby`は現状シーダー未投入だが将来投入時にそのまま反映される想定でマッピングには含める）
- [x] 2.2 `frontend/src/components/Logo.tsx`を新規作成する
  - 対象: `frontend/src/components/Logo.tsx`（design §3のコード例通り、`variant="full"|"icon"`、ダーク時`dark:bg-white`バッジ対応）
  - Next.js 16で`priority`が非推奨のため`preload`に変更（`node_modules/next/dist/docs`で確認済み）

## 3. ロゴ差し替え（design §4）

- [x] 3.1 `Sidebar.tsx`のロゴ部分（`Code2`アイコン+「DevInit」テキスト）を`Logo`コンポーネントに置き換える
  - 対象: `frontend/src/components/Sidebar.tsx`
  - 展開時は`<Logo />`、折りたたみ時（`isCollapsed`）は`<Logo variant="icon" />`
- [x] 3.2 `AdminSidebar.tsx`も同様に置き換え、"Admin"バッジを併記する
  - 対象: `frontend/src/components/AdminSidebar.tsx`（design §4.1のパターン通り）
- [x] 3.3 学生ログイン・登録画面の見出しをロゴ画像に差し替える
  - 対象: `frontend/src/app/(student)/login/page.tsx`, `frontend/src/app/(student)/register/page.tsx`
  - `<h1>DevInit</h1>` → `<Logo className="mx-auto h-10" />`
  - `Logo`の`className`は画像自体（`h-8 w-auto`とマージ）に適用する実装に変更し、`h-10`指定が実際に効くようにした
- [x] 3.4 管理者ログイン画面の見出しをロゴ画像+"Admin"バッジに差し替える（`ShieldCheck`アイコンは維持）
  - 対象: `frontend/src/app/(admin)/admin/login/page.tsx`

## 4. レッスンカードの言語サムネイル（design §5）

- [x] 4.1 `Lesson`インターフェースに`language`フィールドを追加する
  - 対象: `frontend/src/app/(student)/lessons/list/page.tsx`
- [x] 4.2 `LessonCard`の`BookOpen`アイコンボックスを言語画像サムネイル（`object-cover object-left`）に置き換え、未知言語時は`BookOpen`にフォールバックする
  - 対象: 同上（design §5のコード例通り）

## 5. ダッシュボードの「言語別」セクション（design §6）

- [x] 5.1 バックエンド: `DashboardService::getDashboardData`に`language_progress`を追加する
  - 対象: `backend/app/Services/DashboardService.php`
  - `Lesson::select('id', 'language')->get()->groupBy('language')`で集計し、`completed`/`total`を算出する（design §6.1のコード例通り）
- [x] 5.2 バックエンドテストを追加・実行し、`language_progress`のレスポンス形状を確認する
  - 対象: `backend/tests/Feature/DashboardTest.php`（`test_dashboard_returns_language_progress`を追加）
  - `docker compose exec php php artisan test --filter=DashboardTest`で3件PASS確認。全体テストスイート（`php artisan test`）も57件全PASS確認済み
- [x] 5.3 フロントエンド: `DashboardData`型に`language_progress`を追加し、「言語別」セクションをカテゴリ別進捗の直後に新設する
  - 対象: `frontend/src/app/(student)/page.tsx`
  - `total > 0`でフィルタし0件言語は非表示（design §6.2のコード例通り）

## 6. レッスン一覧の言語グルーピング（design §7）

- [x] 6.1 「言語から探す」チップ行を追加し、`selectedLanguage`で既存のカテゴリ別/未分類表示をフィルタする
  - 対象: `frontend/src/app/(student)/lessons/list/page.tsx`
  - `grouped`/`uncategorized`の計算元を`lessons`→`visibleLessons`に差し替え（既存ロジックは再利用）。選択言語で0件になった場合の「該当するレッスンがありません」表示も追加
- [x] 6.2 `useSearchParams`で`?language=xxx`クエリを初期状態に反映する（ダッシュボードカードからの遷移用）
  - 対象: 同上
  - `useSearchParams`はNext.js 16のApp Routerでも本番ビルド時に`Suspense`境界が必須のため、`LessonsList`を`Suspense`でラップする構成に変更（`node_modules/next/dist/docs`で確認済み）

## 7. 動作確認・仕上げ

- [ ] 7.1 ダークモード（`prefers-color-scheme: dark`）でロゴ・言語画像の視認性を確認する
  - **未実施（要ユーザー確認）**: Docker Desktop再起動でWSL統合を復旧し`docker compose exec php`でのバックエンドテストは実行できたが、ヘッドレスブラウザ（Playwright）は共有ライブラリ（libnspr4等）不足でこの環境では起動できず、インストールにsudoパスワードが必要なため断念。`http://localhost:8080`（nginx経由）または`:3000`をブラウザで開いて目視確認してください
- [ ] 7.2 サイドバー折りたたみ時のロゴ表示、未知言語値時のフォールバック表示を確認する
  - **未実施（要ユーザー確認）**: 7.1と同じ理由。コードレビュー上は`getLanguageAsset`が`null`を返すケースで`BookOpen`にフォールバックする実装を確認済み
- [x] 7.3 `frontend`の`npm run lint`はエラーなしを確認。`npm run build`は`/admin/admins`ページで`TypeError: Cannot read properties of null (reading 'useContext')`によるprerenderエラーが発生するが、**phase13の変更前（コミット539901e）でも同一エラーが再現するため既存の別問題**（本フェーズのファイルは無関係）。`tsc --noEmit`では変更ファイルに型エラーなし
- [ ] 7.4 `requirements.md`の受け入れ条件を全てチェックし、`design.md`末尾の「承認待ち」を解消する
  - ブラウザでの動作確認（7.1, 7.2）完了後に実施
