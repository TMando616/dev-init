# Tasks: Phase 5 - 学習資料機能

## 1. Backend: DB・モデル
- [ ] 1.1 `materials` テーブルのマイグレーション作成
  - カラム: `id`, `title`, `content`(TEXT), `category_id`(FK nullable), `order`(int default 0), timestamps
- [ ] 1.2 `Material` モデルの作成
  - `$fillable`, `category()` リレーション, `scopeOrdered()` スコープ
- [ ] 1.3 `Category` モデルに `materials()` hasMany リレーションを追加

## 2. Backend: Service・Controller・ルート
- [ ] 2.1 `MaterialService` の作成
  - `getAllMaterials()`, `getMaterialById()` (prev/next付き), `getMaterialsByCategoryId()`, `createMaterial()`, `updateMaterial()`, `deleteMaterial()`
- [ ] 2.2 `MaterialController` の作成
  - `index()`, `show()`, `store()`, `update()`, `destroy()`
- [ ] 2.3 `CategoryController` の `show()` を更新し、レスポンスに `materials` を含める
- [ ] 2.4 `routes/api.php` にMaterialルートを追加
  - 一般: GET `/materials`, GET `/materials/{id}`
  - 管理者: POST/PUT/DELETE `/materials`

## 3. Backend: テスト・シーダー
- [ ] 3.1 `MaterialTest.php` のフィーチャーテスト作成
  - 7ケース（一覧・詳細・CRUD・権限チェック）
- [ ] 3.2 `MaterialSeeder.php` の作成（JS基礎10本 + PHP基礎10本、各Markdownコンテンツ付き）
- [ ] 3.3 `LessonSeeder.php` の作成（JS・PHP各10本の演習問題、カテゴリ紐付け）
- [ ] 3.4 `DatabaseSeeder.php` を更新し `MaterialSeeder`・`LessonSeeder` を呼び出す

## 4. Frontend: パッケージ・共通コンポーネント
- [ ] 4.1 必要パッケージのインストール
  - `react-markdown`, `remark-gfm`, `rehype-highlight`, `rehype-sanitize`, `@tailwindcss/typography`
- [ ] 4.2 `tailwind.config.ts` に `typography` プラグインを追加
- [ ] 4.3 `MarkdownRenderer.tsx` 共通コンポーネントの作成
  - `react-markdown` + `rehype-sanitize` + `rehype-highlight` + proseクラス

## 5. Frontend: 資料閲覧ページ
- [ ] 5.1 資料詳細ページ (`/materials/[id]/page.tsx`) の作成
  - Markdownレンダリング、パンくずリスト、前後ナビゲーション、演習へのCTAボタン

## 6. Frontend: カテゴリページ・サイドバー更新
- [ ] 6.1 カテゴリページ (`/categories/[id]/page.tsx`) に「学習資料」セクションを追加
  - 資料カードをorder順に表示、Lessonsセクションの上に配置
- [ ] 6.2 `Sidebar.tsx` に管理者向け「学習資料管理」リンクを追加

## 7. Frontend: 管理画面
- [ ] 7.1 管理トップ (`/admin/page.tsx`) に学習資料一覧テーブルと「新規作成」ボタンを追加
- [ ] 7.2 資料エディタ (`/admin/materials/[id]/page.tsx`) の作成
  - 左: Monacoエディタ（markdown）、右: MarkdownRendererプレビュー
  - タイトル・カテゴリ・表示順の入力欄

## 8. 動作確認・lint
- [ ] 8.1 バックエンドテスト実行（`php artisan test`）
- [ ] 8.2 フロントエンドlint実行（`npm run lint`）
- [ ] 8.3 シーダー実行確認（`php artisan migrate:fresh --seed`）
- [ ] 8.4 ブラウザで学習→演習フローの動作確認
