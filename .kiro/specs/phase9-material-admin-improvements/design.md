# 技術設計: Phase 9 - 学習資料管理画面の改善

## 変更ファイル一覧

| 種別 | ファイル | 変更内容 |
|------|----------|----------|
| Repository | `MaterialRepository.php` | `all()` / `find()` の eager load に `lesson.categories` を追加（US-2） |
| Admin フロント | `admin/materials/[id]/page.tsx` | カテゴリ絞り込みセレクト追加（US-1）、order重複のインラインバリデーション追加（US-4） |
| Admin フロント | `admin/materials/page.tsx` | カテゴリ列追加（US-2）、検索・絞り込みUI追加（US-3） |
| Seeder | `DatabaseSeeder.php` | 「Python基礎」「Java基礎」カテゴリ追加（US-5） |
| Seeder | `LessonSeeder.php` | Python・Java 用レッスン各10件追加（US-5） |
| Seeder | `MaterialSeeder.php` | Python・Java 用学習資料各10件追加（US-5） |

バックエンドのバリデーション（`MaterialController`）・ルーティング（`api.php`）・マイグレーションの変更はなし。

---

## US-1: 学習資料エディタでカテゴリからレッスンを絞り込む

対象: `admin/materials/[id]/page.tsx`

`GET /lessons` は既に `categories:id,name` を返すため、フロントエンドのみで完結する。

**型変更**:
```typescript
interface Category { id: number; name: string; }
interface Lesson { id: number; title: string; categories: Category[]; }
```

**状態追加**:
```typescript
const [categories, setCategories] = useState<Category[]>([]);
const [categoryFilterId, setCategoryFilterId] = useState<string>(''); // '' = 未選択(全件)
```

`fetchLessons` と並行して `GET /categories` を取得し `categories` にセットする（`admin/lessons/[id]/page.tsx` と同じ取得パターン）。

**絞り込みロジック**:
```typescript
const filteredLessons = categoryFilterId
  ? lessons.filter(l => l.categories.some(c => String(c.id) === categoryFilterId))
  : lessons;
```

カテゴリ選択が変わった際、現在選択中のレッスンが `filteredLessons` に含まれなくなったらレッスン選択をリセットする:
```typescript
useEffect(() => {
  if (lessonId && !filteredLessons.some(l => String(l.id) === lessonId)) {
    setLessonId('');
  }
}, [categoryFilterId]);
```

**UI**: レッスン選択の左に「カテゴリで絞り込む」`<Select>` を追加（未選択時は「— すべて —」）。レッスン `<Select>` の選択肢を `lessons` → `filteredLessons` に差し替える。既存の必須バリデーション（未選択で保存拒否）は変更しない。

---

## US-2: 学習資料一覧でカテゴリを確認する

### バックエンド: `MaterialRepository.php`

`lesson:id,title` に加えて `lesson.categories:id,name` をネストで eager load する（`LessonRepository::all()` の `categories:id,name` と同じ指定方法）。

```php
public function all(): Collection
{
    return Material::with(['lesson:id,title', 'lesson.categories:id,name'])
        ->ordered()->get(self::LIST_COLUMNS);
}

public function find(int $id): ?Material
{
    return Material::with(['lesson:id,title', 'lesson.categories:id,name'])->find($id);
}
```

`findByLesson()` は管理画面では未使用のため変更しない。

### フロントエンド: `admin/materials/page.tsx`

**型変更**:
```typescript
interface Material {
  id: number;
  title: string;
  order: number;
  lesson: { id: number; title: string; categories: { id: number; name: string }[] } | null;
  created_at: string;
}
```

テーブルに「カテゴリ」列を追加し、phase8 の `admin/page.tsx` と同じタグ表示パターンを再利用する:
```tsx
<td className="px-6 py-4">
  <div className="flex flex-wrap gap-1">
    {material.lesson?.categories.length
      ? material.lesson.categories.map(c => (
          <span key={c.id} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {c.name}
          </span>
        ))
      : <span className="text-slate-400 text-sm">—</span>}
  </div>
</td>
```

---

## US-3: 学習資料一覧で検索・絞り込みができる

対象: `admin/materials/page.tsx`（US-2 と同じ画面、追加のAPI呼び出しなし）

**状態追加**:
```typescript
const [titleQuery, setTitleQuery] = useState('');
const [lessonFilterId, setLessonFilterId] = useState<string>('');
const [categoryFilterId, setCategoryFilterId] = useState<string>('');
```

**フィルタ選択肢**: 追加APIを呼ばず、取得済みの `materials` から重複排除して導出する。
```typescript
const lessonOptions = Array.from(
  new Map(materials.filter(m => m.lesson).map(m => [m.lesson!.id, m.lesson!])).values()
);
const categoryOptions = Array.from(
  new Map(materials.flatMap(m => m.lesson?.categories ?? []).map(c => [c.id, c])).values()
);
```

**絞り込み（AND条件）**:
```typescript
const filteredMaterials = materials.filter(m =>
  (!titleQuery || m.title.includes(titleQuery)) &&
  (!lessonFilterId || String(m.lesson?.id) === lessonFilterId) &&
  (!categoryFilterId || (m.lesson?.categories ?? []).some(c => String(c.id) === categoryFilterId))
);
```

**UI**: ヘッダ下に検索ボックス（タイトル部分一致）＋ レッスン絞り込み `<Select>` ＋ カテゴリ絞り込み `<Select>` を横並びで追加。テーブル本体は `materials` の代わりに `filteredMaterials` をマップする。0件時は既存の空メッセージ文言を「条件に一致する学習資料がありません。」に出し分ける（`materials.length === 0` と `filteredMaterials.length === 0` を区別）。

---

## US-4: 学習資料の表示順（order）の重複・欠番を防ぐ

対象: `admin/materials/[id]/page.tsx`

**方式決定**: インラインエラーによる保存前検知を採用する。

**理由**:
- フロントエンドに `dnd-kit` 等のドラッグ&ドロップライブラリが未導入で、今回のために新規依存を追加するほどの規模ではない。
- 自動採番は「意図しない並び順になることを防ぐ」という要件の意図（管理者が指定した値をそのまま尊重しつつ重複だけ弾く）に対して過剰。
- マイグレーション不要で既存データへの影響がない。

**状態・データ取得追加**:
```typescript
const [allMaterials, setAllMaterials] = useState<{ id: number; lesson_id: number; order: number }[]>([]);
const [orderError, setOrderError] = useState('');
```
`fetchLessons` と並行して `GET /materials` を取得し `allMaterials` にセットする。

**同一レッスン内の既存order一覧（自分自身は除く）**:
```typescript
const siblingOrders = allMaterials
  .filter(m => String(m.lesson_id) === lessonId && (isNew || m.id !== Number(id)))
  .map(m => m.order)
  .sort((a, b) => a - b);
```

**UI**: 表示順入力の下に既存order一覧をヒント表示する:
```tsx
{lessonId && (
  <p className="mt-1 text-xs text-slate-500">
    このレッスン内の既存の表示順: {siblingOrders.length ? siblingOrders.join(', ') : 'なし'}
  </p>
)}
```

**保存前バリデーション**（`handleSubmit` 冒頭、レッスン未選択チェックの直後に追加）:
```typescript
if (siblingOrders.includes(order)) {
  setOrderError(`表示順 ${order} は同じレッスン内の他の資料と重複しています。`);
  return;
}
setOrderError('');
```
エラー時は保存APIを呼ばずに中断し、表示順入力欄の下（ヒントの下）に赤字でエラーメッセージを表示する。

---

## US-5: Python・Java のレッスン・学習資料・カテゴリをシーダーで追加する

### `DatabaseSeeder.php`
既存の4カテゴリ定義に続けて追加:
```php
Category::create(['name' => 'Python基礎', 'description' => 'Pythonの基本的な文法と実践的な使い方を学びます。']);
Category::create(['name' => 'Java基礎', 'description' => 'Javaの基本的な文法とオブジェクト指向の考え方を学びます。']);
```

### `LessonSeeder.php`
`$jsLessons` / `$phpLessons` と同じ配列構造で `$pythonLessons` / `$javaLessons`（各10件、`language: 'python'` / `'java'`）を追加し、既存のループ処理と同じパターンで `Python基礎` / `Java基礎` カテゴリに `sync` する。トピック構成は要件定義の通り: Hello World → 変数 → 算術演算 → 条件分岐 → ループ → 関数 → 配列/リスト → 辞書 → クラス → 応用（1トピック）。

**Java実装上の注意**: `CodeExecutionService` は `java /tmp/code.java` という単一ファイルソースコード起動（JEP 330、Java 11+）で実行するため、クラス名がファイル名と一致している必要はない。`public static void main(String[] args)` を持つトップレベルクラス1つで完結させる（`public class` である必要もない）。

### `MaterialSeeder.php`
`$jsMaterials` / `$phpMaterials` と同じ構造で `$pythonMaterials` / `$javaMaterials`（各10件、`title` / `order` / `content` MDのMarkdown）を追加し、既存パターンに倣い `Lesson::where('language', 'python')->first()` / `'java'` の最初のレッスンに `lesson_id` として紐づける。

実際のレッスン本文・模範解答・学習資料コンテンツの文面は実装フェーズで作成する（本設計では構造とパターンの踏襲のみを定義する）。

---

## 実装順序

依存関係に基づき以下の順で進める:

1. **`MaterialRepository.php`**（US-2 バックエンド）— フロント実装より先にAPIレスポンスを確定させる
2. **`admin/materials/[id]/page.tsx`**（US-1 + US-4）— 同一ファイルのため一括で対応
3. **`admin/materials/page.tsx`**（US-2 フロント + US-3）— 同一ファイルのため一括で対応
4. **シーダー3ファイル**（US-5）— 他のUS群と独立して並行実装可能。最後に `docker compose exec php php artisan migrate:fresh --seed` で結合確認する

---

## 影響範囲外の確認

- `GET /materials` および `GET /materials/{id}` のレスポンスは `lesson.categories` が追加されるのみで既存フィールドは変わらないため、`(student)/materials/[id]/page.tsx` など他の消費箇所は追加フィールドを無視し破壊されない。
- `order` 列にマイグレーション変更はなく、Phase 8 までの既存データ・インデックスに影響しない。
- 既存の JavaScript・PHP のカテゴリ・レッスン・学習資料はシーダーに追記するのみで、件数・内容とも変更されない。
