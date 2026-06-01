# 設計書: Phase 5 - 学習資料機能

## 1. データモデル

### 新規テーブル: `materials`

```
materials
├── id            BIGINT PK AUTO_INCREMENT
├── title         VARCHAR(255) NOT NULL
├── content       TEXT NOT NULL          -- Markdown本文
├── category_id   BIGINT FK → categories.id (NULL許可)
├── order         INT NOT NULL DEFAULT 0 -- カテゴリ内表示順
├── created_at    TIMESTAMP
└── updated_at    TIMESTAMP
```

**リレーション**: `Material` belongsTo `Category` / `Category` hasMany `Material`

既存テーブルへの変更はなし。

---

## 2. バックエンド設計

### 2.1 レイヤー構成

```
MaterialController → MaterialService → (Eloquent直接)
```

Repository層は省略（Lessonと同様、Serviceが直接Eloquentを操作）。

### 2.2 Model: `app/Models/Material.php`

```php
protected $fillable = ['title', 'content', 'category_id', 'order'];

public function category(): BelongsTo
public function scopeOrdered($query): // order ASCでソート
```

### 2.3 Service: `app/Services/MaterialService.php`

| メソッド | 概要 |
|---|---|
| `getAllMaterials()` | 全資料をorder順で取得（category付き） |
| `getMaterialById(int $id)` | 詳細取得。同カテゴリの前後資料(prev/next)も付与 |
| `getMaterialsByCategoryId(int $id)` | カテゴリ別一覧 |
| `createMaterial(array $data)` | 資料作成 |
| `updateMaterial(int $id, array $data)` | 資料更新 |
| `deleteMaterial(int $id)` | 資料削除 |

### 2.4 Controller: `app/Http/Controllers/MaterialController.php`

| メソッド | 概要 |
|---|---|
| `index()` | 全資料一覧 |
| `show(int $id)` | 詳細（prev/next含む） |
| `store(Request)` | 作成（adminのみ） |
| `update(Request, int $id)` | 更新（adminのみ） |
| `destroy(int $id)` | 削除（adminのみ） |

### 2.5 APIルート追加 (`routes/api.php`)

```php
// 認証済みユーザー
Route::get('/materials', [MaterialController::class, 'index']);
Route::get('/materials/{id}', [MaterialController::class, 'show']);

// 管理者のみ
Route::middleware('admin')->group(function () {
    Route::post('/materials', [MaterialController::class, 'store']);
    Route::put('/materials/{id}', [MaterialController::class, 'update']);
    Route::delete('/materials/{id}', [MaterialController::class, 'destroy']);
});
```

### 2.6 APIレスポンス仕様

**GET /api/materials/{id}**
```json
{
  "id": 1,
  "title": "変数とデータ型",
  "content": "# 変数とデータ型\n\n...",
  "order": 1,
  "category": { "id": 1, "name": "JavaScript基礎" },
  "prev": { "id": null },
  "next": { "id": 2, "title": "演算子" }
}
```

**GET /api/categories/{id}** (既存エンドポイントを拡張)
```json
{
  "id": 1,
  "name": "JavaScript基礎",
  "description": "...",
  "materials": [
    { "id": 1, "title": "変数とデータ型", "order": 1 }
  ],
  "lessons": [...]
}
```

### 2.7 バリデーション

```php
'title'       => 'required|string|max:255'
'content'     => 'required|string'
'category_id' => 'nullable|exists:categories,id'
'order'       => 'integer|min:0'
```

---

## 3. フロントエンド設計

### 3.1 新規ページ・コンポーネント

```
frontend/src/
├── app/
│   ├── materials/
│   │   └── [id]/page.tsx          -- 資料詳細（Markdownレンダリング）
│   └── admin/
│       └── materials/
│           └── [id]/page.tsx      -- 資料作成・編集（Monacoエディタ）
└── components/
    └── MarkdownRenderer.tsx       -- react-markdown共通コンポーネント
```

### 3.2 既存ページの変更

| ファイル | 変更内容 |
|---|---|
| `app/categories/[id]/page.tsx` | 「学習資料」セクションをLessons一覧の上部に追加 |
| `components/Sidebar.tsx` | 管理者向け「学習資料管理」リンクを追加 |
| `app/admin/page.tsx` | 学習資料一覧テーブルと「新規作成」ボタンを追加 |

### 3.3 MarkdownRenderer コンポーネント

```tsx
// 使用パッケージ
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';

// Tailwind proseクラスで包む
<div className="prose prose-slate max-w-none">
  <ReactMarkdown
    remarkPlugins={[remarkGfm]}
    rehypePlugins={[rehypeSanitize, rehypeHighlight]}
  >
    {content}
  </ReactMarkdown>
</div>
```

### 3.4 資料詳細ページ (`/materials/[id]`) の構成

```
[ヘッダー: カテゴリ名 / 資料タイトル パンくずリスト]
[Markdownコンテンツ (proseスタイル)]
[フッター]
  ← 前の資料    次の資料 →
  [このカテゴリの演習問題を解く →]
```

### 3.5 資料管理画面 (`/admin/materials/[id]`) の構成

レッスンエディタ（`/admin/lessons/[id]`）と同じ構成で、Monacoエディタ（markdown）＋リアルタイムプレビューパネルを並列表示する。

```
[左ペイン: Monacoエディタ (markdown)]  [右ペイン: MarkdownRendererプレビュー]
タイトル / カテゴリ / 表示順 入力欄
```

### 3.6 カテゴリページの変更 (`/categories/[id]`)

```
[カテゴリ名・説明]

## 学習資料  ← 新規追加セクション（GraduationCapアイコン）
  [資料カード × n]（order順）

## 演習問題  ← 既存（BookOpenアイコン）
  [レッスンカード × n]
```

---

## 4. 追加パッケージ (frontend)

```bash
npm install react-markdown remark-gfm rehype-highlight rehype-sanitize
npm install @tailwindcss/typography
```

`tailwind.config.ts` に `typography` プラグインを追加。

---

## 5. シーダー設計

### ファイル構成

```
backend/database/seeders/
├── DatabaseSeeder.php           -- 既存（MaterialSeederを呼び出すよう更新）
├── MaterialSeeder.php           -- 新規（JS・PHP各10本+）
└── LessonSeeder.php             -- 新規（JS・PHP対応演習問題を分離）
```

### カテゴリ対応

| カテゴリ | 既存ID想定 | 資料数 | 演習数 |
|---|---|---|---|
| JavaScript基礎 | 1 | 10本 | 10本 |
| PHP基礎 (新規) | 新規 | 10本 | 10本 |

### 資料コンテンツの品質基準

各資料のMarkdownは以下を含む:
- 概念の説明（文章）
- コードブロック（シンタックスハイライト対象）
- 実行結果コメント
- まとめ（箇条書き）

---

## 6. テスト設計

```
tests/Feature/MaterialTest.php
├── test_guest_cannot_access_materials()
├── test_user_can_list_materials()
├── test_user_can_view_material_with_prev_next()
├── test_admin_can_create_material()
├── test_admin_can_update_material()
├── test_admin_can_delete_material()
└── test_non_admin_cannot_create_material()
```
