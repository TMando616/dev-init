# 技術設計: Phase 10 - 受講生向けレッスンUX改善

## 変更ファイル一覧

| 種別 | ファイル | 変更内容 |
|------|----------|----------|
| Model | `Lesson.php` | `getNextLessonIdAttribute()` アクセサ追加（US-2） |
| Repository | `LessonRepository.php` | `find()` で `next_lesson_id` を `append()`（US-2） |
| Repository | `SubmissionRepository.php` | `completedLessonIds(int $userId): array` 追加（US-1） |
| Service | `SubmissionService.php` | `getCompletedLessonIds(int $userId): array` 追加（US-1） |
| Controller | `SubmissionController.php` | `completedLessonIds()` アクション追加（US-1） |
| Routes | `api.php` | `GET /submissions/completed-lesson-ids` 追加（US-1） |
| フロント | `lessons/list/page.tsx` | 完了マーク表示（US-1） |
| フロント | `categories/[id]/page.tsx` | 完了マーク表示（US-1） |
| フロント | `lessons/[id]/page.tsx` | 「次のレッスンへ」ボタン追加、レッスン遷移時の状態リセット（US-2） |
| フロント | `Sidebar.tsx` | カテゴリ一覧の動的表示（US-3） |

マイグレーションの変更はなし（`lessons` テーブルに `order` 列は追加しない。理由はUS-2参照）。

---

## US-1: レッスン一覧で完了済みレッスンに完了マークを表示する

### 方式決定

`GET /lessons` / `GET /categories/{id}` のレスポンスは変更せず、完了済みレッスンIDの一覧を返す専用エンドポイントを新設し、フロントエンドで突き合わせる。

**理由**:
- `GET /lessons` と `GET /categories/{id}` は管理画面（admin）とも共有しているエンドポイント（`auth:sanctum,admin` ミドルウェア）。ここに「認証ユーザーの完了状況」を混ぜると、admin側のレスポンス構造にも意味のないフィールドが常に含まれることになり、関心事が混ざる。
- 完了状況は `Submission`（学習進捗ドメイン）の関心事であり、`Lesson`/`Category` のレスポンス形状を変えずに済む方が既存の管理画面コードへの影響がゼロになる。

### バックエンド

**`SubmissionRepository.php`** に追加:
```php
public function completedLessonIds(int $userId): array
{
    return Submission::where('user_id', $userId)
        ->where('status', 'completed')
        ->pluck('lesson_id')
        ->toArray();
}
```

**`SubmissionService.php`** に追加:
```php
public function getCompletedLessonIds(int $userId): array
{
    return $this->repository->completedLessonIds($userId);
}
```

**`SubmissionController.php`** に追加:
```php
public function completedLessonIds(Request $request)
{
    return response()->json([
        'lesson_ids' => $this->service->getCompletedLessonIds($request->user()->id),
    ]);
}
```

**`routes/api.php`**（student-only グループ、既存の submissions ルート群の直後）:
```php
Route::get('/submissions/completed-lesson-ids', [SubmissionController::class, 'completedLessonIds']);
```

### フロントエンド

`lessons/list/page.tsx` と `categories/[id]/page.tsx` それぞれで、既存の `Promise.all` に並行して取得を追加する。

`lessons/list/page.tsx`:
```typescript
const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());

// fetchData 内
const [categoriesRes, lessonsRes, completedRes] = await Promise.all([
  api.get('/categories'),
  api.get('/lessons'),
  api.get('/submissions/completed-lesson-ids'),
]);
setCompletedLessonIds(new Set(completedRes.data.lesson_ids));
```

`categories/[id]/page.tsx` も同様に `api.get('/submissions/completed-lesson-ids')` を `Promise.all` に追加し、`completedLessonIds: Set<number>` を state に持つ。

**`LessonCard` への完了マーク表示**（両ファイルで同一パターン。`lucide-react` の `CheckCircle2` を使用、`lessons/[id]/page.tsx` で既に使われているアイコンと統一）:
```tsx
{completedLessonIds.has(lesson.id) && (
  <span className="flex items-center gap-1 text-emerald-600 text-xs font-bold">
    <CheckCircle2 size={16} />
    完了
  </span>
)}
```
配置場所: レッスンタイトルの右、`ChevronRight` アイコンの左（カード右端）。未完了レッスンはこの要素自体を描画しない（受け入れ条件どおり）。

---

## US-2: レッスン画面から次のレッスンへ遷移する

### 「次」の順序基準の決定

**採用**: `id` 昇順によるレッスン全体（カテゴリ非依存）の順序。`lessons` テーブルへの `order` 列追加は行わない。

**理由**:
- レッスンはカテゴリと多対多（0〜複数）の関係にあり、「同一カテゴリ内での順序」はレッスンが複数カテゴリに属する場合や無所属の場合に基準が破綻する。全体順であれば曖昧さがない。
- `order` 列を追加すると、要件のスコープ外である「並び順編集UI」を作らない限り常に挿入順と同じ値になり実質的な意味を持たない。マイグレーション・シーダー修正のコストに見合わない。
- 将来的に本当のカスタム順序が必要になった場合は、その時点で `order` 列を追加する別要件として切り出せる（スコープ外に明記済み）。

### バックエンド

**`Lesson.php`** にアクセサを追加:
```php
public function getNextLessonIdAttribute(): ?int
{
    return static::where('id', '>', $this->id)->orderBy('id')->value('id');
}
```

**`LessonRepository.php`** の `find()` のみ変更（`all()` は変更しない。一覧取得のたびに全レッスン分のクエリが走る N+1 を避けるため、詳細取得時のみ `append` する）:
```php
public function find(int $id): ?Lesson
{
    $lesson = Lesson::with(['categories', 'materials'])->find($id);
    $lesson?->append('next_lesson_id');

    return $lesson;
}
```

これにより `GET /lessons/{id}` のレスポンスに `next_lesson_id`（次のレッスンが存在しない場合は `null`）が追加される。

### フロントエンド（`lessons/[id]/page.tsx`）

**型変更**:
```typescript
interface Lesson {
  // ...既存フィールド
  next_lesson_id: number | null;
}
```

**ヘッダーに「次のレッスンへ」ボタンを追加**（`完了にする` ボタンの右）:
```tsx
import { ChevronRight } from 'lucide-react'; // 既存 import に追加

{lesson.next_lesson_id !== null && (
  <Button
    variant="ghost"
    size="sm"
    className="text-slate-300 hover:bg-slate-700 hover:text-white"
    onClick={() => router.push(`/lessons/${lesson.next_lesson_id}`)}
  >
    次のレッスンへ
    <ChevronRight size={18} className="ml-2" />
  </Button>
)}
```
次のレッスンが存在しない（`null`）場合はボタン自体を描画しない（非表示方式を採用）。完了状態・保存状態に関わらず常に活性。

**重要: レッスン間の状態リセット**

Next.js App Router の動的セグメント（`/lessons/[id]`）は、同じ `page.tsx` 内での遷移だとコンポーネントがアンマウントされずに再利用されるため、`id` が変わっても `logs` / `judgeResult` / `showModelAnswer` / `selectedMaterial` 等のローカル state がそのまま次のレッスンに引き継がれてしまう（前のレッスンの実行結果や模範解答表示が残ったまま次のレッスンが表示される不具合になる）。

既存の `fetchLessonAndSubmission` の `useEffect`（`[id, authLoading, user]` 依存）の先頭で、`id` が変わるたびに以下をリセットしてから取得処理に入る:
```typescript
useEffect(() => {
  const fetchLessonAndSubmission = async () => {
    // 既存の取得処理はそのまま
  };

  if (!authLoading && user) {
    setLogs([]);
    setError(undefined);
    setJudgeResult(null);
    setShowModelAnswer(false);
    setSelectedMaterial(null);
    setIsLoading(true);
    fetchLessonAndSubmission();
  }
}, [id, authLoading, user]);
```
`code` / `lastSavedCode` / `isCompleted` は既存の取得処理内で毎回上書きされるためリセット不要。

---

## US-3: ユーザーサイドバーにカテゴリを表示する

対象: `Sidebar.tsx`

**データ取得追加**:
```typescript
import api from '@/lib/api';
import { Tag } from 'lucide-react'; // 既存 import に追加

const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

useEffect(() => {
  if (!user) return;
  api.get('/categories')
    .then(res => setCategories(res.data))
    .catch(() => {});
}, [user]);
```

**`isActive` の対象拡張**: 現状 `allHrefs` は `navItems` の href のみから作られているため、カテゴリリンクの href も含める:
```typescript
const categoryHrefs = categories.map(c => `/categories/${c.id}`);
const allHrefs = [...navItems.map((item) => item.href), ...categoryHrefs];
```

**描画**: 既存の `navItems` の `<div className="space-y-1">...</div>` ブロックの直後、`categories.length > 0` の場合のみセクションを追加。既存ナビ項目と同じ `Link` 構造・`isActive` ロジック・折りたたみ（`isCollapsed`）挙動を再利用する:
```tsx
{categories.length > 0 && (
  <div className="space-y-1 mt-4">
    {!isCollapsed && (
      <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider">カテゴリ</p>
    )}
    {categories.map((cat) => {
      const href = `/categories/${cat.id}`;
      return (
        <Link
          key={cat.id}
          href={href}
          className={classNames(
            "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
            isActive(href)
              ? "bg-slate-900 text-white"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          )}
        >
          <Tag size={20} className={classNames(
            isActive(href) ? "text-white" : "text-slate-400 group-hover:text-slate-600"
          )} />
          {!isCollapsed && <span className="font-medium">{cat.name}</span>}
        </Link>
      );
    })}
  </div>
)}
```
カテゴリが0件の場合はこのブロック自体が描画されないため、追加の空状態UIは不要（受け入れ条件どおり）。

---

## 実装順序

依存関係に基づき以下の順で進める:

1. **US-1 バックエンド**（`SubmissionRepository` → `SubmissionService` → `SubmissionController` → `api.php`）— フロント実装より先にAPIレスポンスを確定させる
2. **US-2 バックエンド**（`Lesson.php` → `LessonRepository.php`）— 同上
3. **US-1 フロント**（`lessons/list/page.tsx`, `categories/[id]/page.tsx`）
4. **US-2 フロント**（`lessons/[id]/page.tsx`）— 状態リセットも含めて一括対応
5. **US-3**（`Sidebar.tsx`）— 他のUSと独立して並行実装可能

---

## 影響範囲外の確認

- `GET /lessons` `GET /categories/{id}` のレスポンス形状は変更しないため、管理画面（`admin/lessons/*`, `admin/materials/*`）は無影響。
- `GET /lessons/{id}` に `next_lesson_id` が追加されるのみで既存フィールドは変わらないため、admin側で同エンドポイントを利用している画面（`admin/lessons/[id]/page.tsx`）は追加フィールドを無視し破壊されない。
- `lessons` テーブルへのマイグレーションはないため、既存データ・Phase 9までのシーダーに影響しない。
- 新設する `GET /submissions/completed-lesson-ids` は student-only ミドルウェア配下（`auth:sanctum`）にのみ追加し、admin ガードには含めない。
