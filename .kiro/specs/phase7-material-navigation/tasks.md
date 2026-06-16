# Tasks: Phase 7 - 学習資料ナビゲーション改善

実装は依存順（バックエンド → 新規コンポーネント → 演習ページ → 一覧ページ → 検証）で進める。
各サブタスク完了ごとにコミットする。`design.md` の §番号を適宜参照。

## 1. Backend: LessonRepository の拡張

- [ ] 1.1 `LessonRepository::find()` の eager load を `categories` → `categories.materials` に変更する（design §1.1）
  - 対象: `backend/app/Repositories/LessonRepository.php`
  - `Lesson::with(['categories.materials'])->find($id)`
  - `all()` は変更しない

## 2. Frontend: MaterialModal コンポーネント新規作成

- [ ] 2.1 `MaterialModal.tsx` を作成する（design §2.2）
  - 対象: `frontend/src/components/MaterialModal.tsx`
  - props: `material: { id: number; title: string; content: string } | null`, `onClose: () => void`
  - `material === null` のとき何も返さない
  - fixed overlay（`bg-black/50`）＋内部スクロール可能なパネル
  - 閉じるボタン（X）＋backdrop クリックで `onClose`
  - `MarkdownRenderer` で `material.content` を表示

## 3. Frontend: 演習ページの変更

- [ ] 3.1 `Lesson` interface を拡張する（design §2.1）
  - 対象: `(student)/lessons/[id]/page.tsx`
  - `Material` / `Category` interface を追加
  - `Lesson.categories: Category[]` フィールドを追加

- [ ] 3.2 参考資料セクションを左ペイン上部に追加する（US-1、design §2.3.1）
  - `relatedMaterials = lesson.categories.flatMap(c => c.materials)` を導出
  - `relatedMaterials.length > 0` のときのみセクションを描画
  - 資料カードクリックで `setSelectedMaterial(material)`
  - `MaterialModal` を描画（`selectedMaterial` が null でなければ表示）

- [ ] 3.3 Backボタンのリンク先をカテゴリページに修正する（US-2、design §2.3.2）
  - `lesson.categories[0]` が存在する場合は `/categories/${lesson.categories[0].id}` へ
  - 存在しない場合は `/` へ（フォールバック）

## 4. Frontend: レッスン一覧ページの変更

- [ ] 4.1 `/categories` と `/lessons` を並列フェッチする（design §2.4）
  - 対象: `(student)/lessons/list/page.tsx`
  - `Promise.all([api.get('/categories'), api.get('/lessons')])`
  - state: `categories` と `lessons` を分けて管理

- [ ] 4.2 カテゴリ別グルーピングロジックを実装する（US-3、design §2.4）
  - `grouped`: カテゴリ順に並んだ `{ category, lessons[] }` の配列
  - `uncategorized`: `categories` が空のレッスン
  - `categories.length === 0` のときはフラット表示にフォールバック

- [ ] 4.3 カテゴリ別セクション UI を実装する（US-3）
  - カテゴリ見出し（カテゴリ名）→ レッスンカード一覧（既存カードデザインを再利用）
  - `uncategorized.length > 0` のとき「その他」セクションを末尾に追加
  - 空のカテゴリセクション（対象レッスン0件）は表示しない

## 5. 検証

- [ ] 5.1 バックエンドテスト実行（`docker compose exec backend php artisan test`）— 既存テスト全パスを確認
- [ ] 5.2 フロントエンド lint パス（`docker compose exec frontend npm run lint`）
- [ ] 5.3 動作確認チェックリスト
  - [ ] 演習ページ: 関連資料がある場合に「参考資料」セクションが表示される
  - [ ] 演習ページ: 資料カードクリックでモーダルが開き、本文が表示される
  - [ ] 演習ページ: モーダルを閉じるボタン・backdrop クリックで閉じる
  - [ ] 演習ページ: 関連資料がない場合はセクション自体が非表示
  - [ ] 演習ページ: Backボタンがカテゴリページへ遷移する
  - [ ] 演習ページ: カテゴリなしレッスンの Backボタンがダッシュボードへ遷移する
  - [ ] レッスン一覧: カテゴリ別セクションが表示される
  - [ ] レッスン一覧: 複数カテゴリのレッスンが複数セクションに重複表示される
  - [ ] レッスン一覧: カテゴリなしレッスンが「その他」セクションに表示される
