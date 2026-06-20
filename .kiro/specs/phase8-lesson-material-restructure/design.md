# 技術設計: Phase 8 - 学習資料のレッスン紐づけとコンテンツ階層の再整理

## 変更ファイル一覧

| 種別 | ファイル | 変更内容 |
|------|----------|----------|
| マイグレーション | 新規作成 | `materials` テーブル再構成 |
| Model | `Material.php` | `belongsTo(Lesson)` に変更 |
| Model | `Lesson.php` | `hasMany(Material)` を追加 |
| Model | `Category.php` | `hasMany(Material)` を削除 |
| Repository | `MaterialRepository.php` | `lesson_id` ベースに全面変更 |
| Repository | `LessonRepository.php` | `find()` の eager load 変更 |
| Repository | `CategoryRepository.php` | `all()` に `withCount('lessons')` 追加; `find()` から materials を削除 |
| Controller | `MaterialController.php` | バリデーション `lesson_id: required` に変更 |
| Controller | `LessonController.php` | バリデーション `category_ids: required|min:1` に変更 |
| Admin フロント | `admin/page.tsx` | カテゴリ列追加 |
| Admin フロント | `admin/lessons/[id]/page.tsx` | カテゴリ未選択のフロント検証追加 |
| Admin フロント | `admin/materials/page.tsx` | カテゴリ列→レッスン列に変更 |
| Admin フロント | `admin/materials/[id]/page.tsx` | カテゴリ選択→レッスン選択に変更 |
| Admin フロント | `admin/categories/page.tsx` | レッスン数列 + インライン展開追加 |
| 生徒フロント | `(student)/lessons/[id]/page.tsx` | `lesson.materials` 直接参照に変更 |
| 生徒フロント | `(student)/categories/[id]/page.tsx` | materials セクション削除 |

---

## 1. データモデル変更

### 1-1. マイグレーション

新規ファイル: `2026_06_21_000000_restructure_materials_to_lesson.php`

```php
public function up(): void
{
    Schema::table('materials', function (Blueprint $table) {
        // 既存の FK・インデックスを削除してから列を変更する
        $table->dropIndex(['category_id', 'order', 'id']);
        $table->dropConstrainedForeignId('category_id');

        // 新列: lesson_id（必須・カスケード削除）
        $table->foreignId('lesson_id')->constrained()->cascadeOnDelete();

        // 新インデックス
        $table->index(['lesson_id', 'order', 'id']);
    });
}

public function down(): void
{
    Schema::table('materials', function (Blueprint $table) {
        $table->dropIndex(['lesson_id', 'order', 'id']);
        $table->dropConstrainedForeignId('lesson_id');

        $table->foreignId('category_id')->nullable()->constrained()->nullOnDelete();
        $table->index(['category_id', 'order', 'id']);
    });
}
```

**注意**: `lesson_id` は `NOT NULL` で追加するため、`php artisan migrate:fresh --seed` での実行を前提とする（既存の本番データは空のため問題なし）。

---

## 2. バックエンド変更

### 2-1. モデル

**`Material.php`**
- `$fillable`: `category_id` → `lesson_id`
- リレーション: `category()` を `lesson()` に置換
  ```php
  public function lesson() { return $this->belongsTo(Lesson::class); }
  ```

**`Lesson.php`**
- リレーション追加:
  ```php
  public function materials() { return $this->hasMany(Material::class)->orderBy('order')->orderBy('id'); }
  ```

**`Category.php`**（現状の実装確認が必要だが）
- `hasMany(Material::class)` のリレーションが定義されていれば削除する。

### 2-2. MaterialRepository

```php
private const LIST_COLUMNS = ['id', 'title', 'lesson_id', 'order', 'created_at', 'updated_at'];

public function all(): Collection
{
    return Material::with('lesson:id,title')->ordered()->get(self::LIST_COLUMNS);
}

public function find(int $id): ?Material
{
    return Material::with('lesson:id,title')->find($id);
}

public function findByLesson(int $lessonId): Collection
{
    return Material::with('lesson:id,title')
        ->where('lesson_id', $lessonId)
        ->ordered()
        ->get(self::LIST_COLUMNS);
}

public function findPrevNext(Material $material): array
{
    // category_id → lesson_id に差し替え（ロジック構造は同じ）
    $base = Material::query()->where('lesson_id', $material->lesson_id);
    // ... prev/next ロジックは現行と同じ
}
```

`findByCategory()` は削除し `findByLesson()` に置換する。

### 2-3. LessonRepository::find()

```php
public function find(int $id): ?Lesson
{
    // categories.materials ネストをなくし、materials を直接 eager load
    return Lesson::with(['categories', 'materials'])->find($id);
}
```

`all()` は変更なし（管理画面一覧は `with('categories')` を追加する）:
```php
public function all(): Collection
{
    return Lesson::with('categories:id,name')->get();
}
```

### 2-4. CategoryRepository

**`all()`** — カテゴリ一覧にレッスン数を付与:
```php
public function all(): Collection
{
    return Category::withCount('lessons')->get();
}
```

**`find()`** — materials の eager load を削除:
```php
public function find(int $id): ?Category
{
    return Category::with(['lessons.categories'])->find($id);
}
```

`select(['id', 'title', 'category_id', 'order'])` の `category_id` 指定は Phase 8 後に存在しないカラムを参照するため、必ず削除すること。

### 2-5. MaterialService

`getMaterialsByCategoryId()` を `getMaterialsByLessonId()` に名称・実装ともに変更。

### 2-6. MaterialController（バリデーション変更）

```php
// store / update 共通
'lesson_id' => 'required|exists:lessons,id',
// category_id 行を削除
```

レスポンスも `load('category')` → `load('lesson:id,title')` に変更。

### 2-7. LessonController（バリデーション変更）

```php
// store / update 共通
'category_ids' => 'required|array|min:1',
'category_ids.*' => 'exists:categories,id',
```

`nullable` を `required` に変更するだけ。

---

## 3. 管理画面フロントエンド

### 3-1. レッスン一覧 `admin/page.tsx`

```typescript
interface Category { id: number; name: string; }
interface Lesson {
  id: number; title: string; created_at: string;
  categories: Category[];
}
```

テーブルヘッダに「カテゴリ」列を追加:
```tsx
<th className="px-6 py-4 font-semibold text-slate-700">カテゴリ</th>
```

各行にタグ表示:
```tsx
<td className="px-6 py-4">
  <div className="flex flex-wrap gap-1">
    {lesson.categories.length > 0
      ? lesson.categories.map(c => (
          <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {c.name}
          </span>
        ))
      : <span className="text-slate-400 text-sm">—</span>
    }
  </div>
</td>
```

### 3-2. レッスンエディタ `admin/lessons/[id]/page.tsx`

`handleSubmit` に追加:
```typescript
if (selectedCategoryIds.length === 0) {
  alert('カテゴリを1件以上選択してください。');
  setIsSaving(false);
  return;
}
```

カテゴリチェックボックスエリアに `min:1` を示すヒント文言を追加:
```tsx
<label className="block text-sm font-semibold text-slate-700 mb-2">
  カテゴリ <span className="text-red-500">*</span>
</label>
```

### 3-3. 学習資料一覧 `admin/materials/page.tsx`

```typescript
interface Material {
  id: number; title: string; order: number;
  lesson: { id: number; title: string } | null;  // category → lesson
  created_at: string;
}
```

列ヘッダを「カテゴリ」→「レッスン」に変更、値を `material.lesson?.title ?? '—'` に変更。

### 3-4. 学習資料エディタ `admin/materials/[id]/page.tsx`

`categoryId/categories` → `lessonId/lessons` に全面置換:

```typescript
const [lessonId, setLessonId] = useState<string>('');
const [lessons, setLessons] = useState<{id: number; title: string}[]>([]);
```

fetch 先を `/categories` → `/lessons` に変更。

既存資料取得:
```typescript
setLessonId(material.lesson_id ? String(material.lesson_id) : '');
```

送信ペイロード:
```typescript
const payload = { title, content, order, lesson_id: lessonId ? Number(lessonId) : null };
```

フォームUI:
```tsx
<label>レッスン <span className="text-red-500">*</span></label>
<Select value={lessonId} onChange={(e) => setLessonId(e.target.value)} required>
  <option value="" disabled>— レッスンを選択 —</option>
  {lessons.map((l) => (
    <option key={l.id} value={String(l.id)}>{l.title}</option>
  ))}
</Select>
```

### 3-5. カテゴリ一覧 `admin/categories/page.tsx`

**インターフェース追加**:
```typescript
interface Category {
  id: number; name: string; description: string | null;
  lessons_count: number;  // 追加
  created_at: string;
}
```

**状態追加**:
```typescript
const [expandedId, setExpandedId] = useState<number | null>(null);
const [expandedLessons, setExpandedLessons] = useState<{id: number; title: string}[]>([]);
```

**展開ハンドラ**:
```typescript
const handleToggleExpand = async (categoryId: number) => {
  if (expandedId === categoryId) {
    setExpandedId(null);
    setExpandedLessons([]);
    return;
  }
  const response = await adminApi.get(`/categories/${categoryId}`);
  setExpandedLessons(response.data.lessons ?? []);
  setExpandedId(categoryId);
};
```

**テーブル変更**:
- ヘッダに「レッスン数」列を追加
- `lessons_count` をバッジとして表示。クリックで `handleToggleExpand`
- 展開時は行の下にコラプスする `<tr>` を追加して `expandedLessons` の一覧を表示

```tsx
<td className="px-6 py-4 text-center">
  <button
    onClick={() => handleToggleExpand(c.id)}
    className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-700 text-sm font-bold transition-colors"
  >
    {c.lessons_count}
  </button>
</td>
// 展開行（カテゴリ行の直後）
{expandedId === c.id && (
  <tr>
    <td colSpan={4} className="px-8 py-3 bg-blue-50 border-t border-blue-100">
      <ul className="flex flex-col gap-1">
        {expandedLessons.length > 0
          ? expandedLessons.map(l => (
              <li key={l.id} className="text-sm text-slate-700">• {l.title}</li>
            ))
          : <li className="text-sm text-slate-400">レッスンなし</li>
        }
      </ul>
    </td>
  </tr>
)}
```

---

## 4. 生徒画面フロントエンド

### 4-1. 演習ページ `(student)/lessons/[id]/page.tsx`

**インターフェース変更**:
```typescript
// Category から materials を削除
interface Category { id: number; name: string; }

// Lesson に materials を直接追加
interface Lesson {
  id: number; title: string; language: string;
  content: string; model_answer?: string; expected_output?: string;
  categories: Category[];
  materials: Material[];  // 追加（categories.materials から移動）
}
```

**derived value 変更**:
```typescript
// Before:
const relatedMaterials = lesson.categories.flatMap(c => c.materials);
// After:
const relatedMaterials = lesson.materials;
```

その他の UI・ロジックは変更なし。

### 4-2. カテゴリ詳細 `(student)/categories/[id]/page.tsx`

**インターフェース変更**:
```typescript
// materials フィールドを削除
interface Category {
  id: number; name: string; description: string | null;
  lessons: Lesson[];
  // materials: Material[];  ← 削除
}
```

**UI 変更**: 「学習資料セクション」（`{category.materials && ...}` ブロック）を削除。`Material` interfaceも削除。
レッスン一覧の表示は現行のまま維持する。

---

## 5. 変更の依存順序

実装は以下の順で進める（依存関係あり）:

1. **マイグレーション** → DB スキーマを先に確定する
2. **モデル** (Material, Lesson, Category) → ORM が正しく動く状態にする
3. **MaterialRepository** → `lesson_id` ベースに変更
4. **LessonRepository::find() / all()** → `materials` と `categories` の eager load 調整
5. **CategoryRepository::all() / find()** → `withCount`, materials 削除
6. **MaterialService** → `findByLesson` に対応
7. **MaterialController / LessonController** → バリデーション変更
8. **管理 UI** (5 ファイル) → バックエンドが完成してから変更
9. **生徒 UI** (2 ファイル) → 最後に整合確認

---

## 6. 影響範囲外の確認

- `GET /categories`（一覧）: レスポンスに `lessons_count` が追加されるが、既存の利用箇所（フロント student 側ホーム）は追加フィールドを無視するため破壊的変更なし。
- `GET /categories/{id}`（詳細）: `materials` フィールドがなくなる。student の `categories/[id]` ページは materials セクション自体を削除するため整合する。
- `GET /lessons/{id}`: `categories.materials` ネストがなくなり `materials` 直接フィールドが追加される。student の `lessons/[id]` ページを同時に変更するため整合する。
- シーダー: `MaterialSeeder` が `category_id => $js?->id`（カテゴリID）で資料を作成している。Phase 8 ではレッスンIDが必要なため、シーダー内でレッスンを検索して `lesson_id` に変更する（例: `$jsLesson = Lesson::where('language', 'javascript')->first()`）。
