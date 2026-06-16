# 設計書: Phase 7 - 学習資料ナビゲーション改善

本設計は `requirements.md` の US-1〜US-3 を実装に落とすための技術設計。
ステアリングの依存方向（Controller → Service → Repository）および Contract-First を厳守する。

## 0. 設計方針サマリ

| 観点 | 決定 |
|------|------|
| バックエンド変更範囲 | `LessonRepository::find()` の eager load 拡張のみ（1箇所）。API レスポンス形状の変化は後方互換 |
| フロント変更範囲 | 演習ページ（参考資料セクション・Backボタン）、レッスン一覧ページ（グルーピング）、新規 `MaterialModal` コンポーネント |
| 資料データの取得方法 | `GET /lessons/{id}` のレスポンスに `categories.materials` を含める。追加APIコール不要 |
| モーダル実装方針 | 専用コンポーネント `MaterialModal.tsx` を作成。Portal は使わず、演習ページ内の `fixed` 要素として実装 |
| レッスン一覧グルーピング | `GET /categories`（順序基準）と `GET /lessons`（資料付き）を並列フェッチし、フロントで結合。バックエンド変更なし |

---

## 1. バックエンド設計

### 1.1 LessonRepository の変更

**対象ファイル**: `backend/app/Repositories/LessonRepository.php`

`find()` の eager load を `categories` から `categories.materials` に変更する。
`all()` は一覧表示用（資料データは不要）のため変更しない。

```php
// Before
public function find(int $id): ?Lesson
{
    return Lesson::with('categories')->find($id);
}

// After
public function find(int $id): ?Lesson
{
    return Lesson::with(['categories.materials'])->find($id);
}
```

**レスポンス変化（`GET /lessons/{id}`）**:

```json
{
  "id": 1,
  "title": "変数を使ってみよう",
  "language": "javascript",
  "content": "...",
  "model_answer": "...",
  "categories": [
    {
      "id": 1,
      "name": "JS基礎",
      "materials": [
        { "id": 1, "title": "変数と型", "content": "..." },
        { "id": 2, "title": "関数の基礎", "content": "..." }
      ]
    }
  ]
}
```

既存の `categories` フィールドは引き続き返却されるため、後方互換。

---

## 2. フロントエンド設計

### 2.1 型定義の更新

**対象ファイル**: `(student)/lessons/[id]/page.tsx` 内 `Lesson` interface

```typescript
// 追加
interface Material {
  id: number;
  title: string;
  content: string;
}

interface Category {
  id: number;
  name: string;
  materials: Material[];
}

// 変更
interface Lesson {
  id: number;
  title: string;
  language: string;
  content: string;
  model_answer?: string;
  expected_output?: string;
  categories: Category[];  // 追加
}
```

### 2.2 MaterialModal コンポーネント

**新規ファイル**: `frontend/src/components/MaterialModal.tsx`

- props: `material: Material | null`, `onClose: () => void`
- `material` が `null` の場合は何も描画しない
- 背景（backdrop）クリックで `onClose` を呼ぶ
- 内部スクロール可能（資料が長い場合を考慮）
- `MarkdownRenderer` で本文を表示

```
┌─────────────────────────────────────┐  ← fixed overlay (bg-black/50)
│  ┌───────────────────────────────┐  │
│  │ タイトル              [× 閉じる] │  │  ← sticky header
│  ├───────────────────────────────┤  │
│  │                               │  │
│  │  <MarkdownRenderer />         │  │  ← overflow-y-auto
│  │                               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2.3 演習ページの変更

**対象ファイル**: `(student)/lessons/[id]/page.tsx`

#### 2.3.1 参考資料セクション（US-1）

左ペインの `<MarkdownRenderer>` の直前に参考資料セクションを追加。

```
左ペイン（白背景、overflow-y-auto）
├── [参考資料セクション]  ← 新規追加（資料が1件以上の場合のみ表示）
│   ├── セクション見出し: "参考資料"（FileText アイコン）
│   └── 資料カード × n（クリックでモーダルを開く）
└── [問題文]
    └── <MarkdownRenderer content={lesson.content} />
```

資料カードのクリックハンドラ:
```typescript
const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
// カードクリック → setSelectedMaterial(material)
// モーダル閉じる → setSelectedMaterial(null)
```

関連資料の導出:
```typescript
const relatedMaterials = lesson.categories.flatMap(c => c.materials);
```

（材料は `category_id` FK で1カテゴリに属するため、カテゴリをまたいだ重複は発生しない）

#### 2.3.2 Backボタンのリンク先修正（US-2）

```typescript
// Before
<Link href="/" ...>

// After
const backHref = lesson.categories.length > 0
  ? `/categories/${lesson.categories[0].id}`
  : '/';

<Link href={backHref} ...>
```

#### 2.3.3 初期状態の注意点

`lesson` が `null`（ローディング中）の段階では `categories` にアクセスしないよう、既存の `isLoading` ガードを活用する。

### 2.4 レッスン一覧ページの変更（US-3）

**対象ファイル**: `(student)/lessons/list/page.tsx`

#### データフェッチ

`/categories`（順序基準）と `/lessons`（カテゴリ付き）を並列フェッチ。

```typescript
const [categoriesRes, lessonsRes] = await Promise.all([
  api.get('/categories'),
  api.get('/lessons'),
]);
```

#### グルーピングロジック

```typescript
// カテゴリ順にセクションを構築（重複あり）
const grouped = categories.map(cat => ({
  category: cat,
  lessons: lessons.filter(l => l.categories.some((c: {id: number}) => c.id === cat.id)),
}));

// どのカテゴリにも属さないレッスン
const uncategorized = lessons.filter(l => l.categories.length === 0);
```

#### 表示構造

```
カテゴリ名（セクション見出し）
  └── レッスンカード × n（既存と同形式）

...繰り返し

その他（uncategorized.length > 0 の場合のみ）
  └── レッスンカード × n

--- フォールバック（categories.length === 0 の場合）---
全レッスンをフラット表示（現行と同じ）
```

---

## 3. ファイル変更・新規作成一覧

| ファイル | 種別 | 変更内容 |
|----------|------|----------|
| `backend/app/Repositories/LessonRepository.php` | 変更 | `find()` の with を `categories.materials` に拡張 |
| `frontend/src/components/MaterialModal.tsx` | 新規 | 資料モーダルコンポーネント |
| `frontend/src/app/(student)/lessons/[id]/page.tsx` | 変更 | 型定義拡張・参考資料セクション追加・Backボタン修正 |
| `frontend/src/app/(student)/lessons/list/page.tsx` | 変更 | カテゴリ別グルーピング表示 |
