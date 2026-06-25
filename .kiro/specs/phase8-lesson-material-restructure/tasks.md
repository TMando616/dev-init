# Tasks: Phase 8 - 学習資料のレッスン紐づけとコンテンツ階層の再整理

実装は `design.md` §5 の依存順（マイグレーション → モデル → Repository → Service → Controller → 管理UI → 生徒UI → 検証）で進める。
各サブタスク完了ごとにコミットする。`design.md` / `requirements.md` の §番号・US番号を適宜参照。

## 1. Backend: マイグレーション

- [x] 1.1 `materials` を `lesson_id` ベースに再構成するマイグレーションを作成する（design §1-1）
  - 新規: `backend/database/migrations/2026_06_21_000000_restructure_materials_to_lesson.php`
  - up: `(category_id, order, id)` インデックスと `category_id` FK を削除 → `lesson_id`（`constrained`, `cascadeOnDelete`）追加 → `(lesson_id, order, id)` インデックス追加
  - down: 逆操作（`category_id` は `nullable` + `nullOnDelete` で復元）
  - `lesson_id` は NOT NULL のため `migrate:fresh --seed` 前提

## 2. Backend: モデル

- [x] 2.1 `Material` モデルを `belongsTo(Lesson)` に変更する（design §2-1）
  - 対象: `backend/app/Models/Material.php`
  - `$fillable`: `category_id` → `lesson_id`
  - `category()` リレーションを `lesson()` に置換

- [x] 2.2 `Lesson` モデルに `hasMany(Material)` を追加する（design §2-1）
  - 対象: `backend/app/Models/Lesson.php`
  - `materials()`: `hasMany(Material::class)->orderBy('order')->orderBy('id')`

- [x] 2.3 `Category` モデルから materials リレーションを削除する（design §2-1）
  - 対象: `backend/app/Models/Category.php`
  - `hasMany(Material::class)` が定義されていれば削除（現状確認のうえ）

## 3. Backend: Repository

- [x] 3.1 `MaterialRepository` を `lesson_id` ベースに全面変更する（design §2-2）
  - 対象: `backend/app/Repositories/MaterialRepository.php`
  - `LIST_COLUMNS` の `category_id` → `lesson_id`
  - `all()` / `find()` の eager load を `lesson:id,title` に変更
  - `findByCategory()` を削除し `findByLesson(int $lessonId)` に置換
  - `findPrevNext()` の絞り込みを `category_id` → `lesson_id` に差し替え

- [x] 3.2 `LessonRepository::find()` / `all()` の eager load を調整する（design §2-3）
  - 対象: `backend/app/Repositories/LessonRepository.php`
  - `find()`: `with(['categories', 'materials'])`（`categories.materials` ネストを廃止）
  - `all()`: 管理一覧用に `with('categories:id,name')` を付与

- [x] 3.3 `CategoryRepository` の `all()` / `find()` を変更する（design §2-4）
  - 対象: `backend/app/Repositories/CategoryRepository.php`
  - `all()`: `withCount('lessons')` を追加（US-4 のレッスン数）
  - `find()`: materials の eager load を削除。`select([... 'category_id' ...])` が残っていれば `category_id` 指定を必ず削除

## 4. Backend: Service

- [x] 4.1 `MaterialService` を `lesson_id` ベースに変更する（design §2-5）
  - 対象: `backend/app/Services/MaterialService.php`
  - `getMaterialsByCategoryId()` → `getMaterialsByLessonId()` に名称・実装変更
  - リポジトリ呼び出しを `findByLesson` に合わせる

## 5. Backend: Controller（バリデーション）

- [x] 5.1 `MaterialController` のバリデーションを `lesson_id` 必須に変更する（US-3、design §2-6）
  - 対象: `backend/app/Http/Controllers/.../MaterialController.php`
  - store / update: `'lesson_id' => 'required|exists:lessons,id'`、`category_id` 行を削除
  - レスポンスの `load('category')` → `load('lesson:id,title')`

- [x] 5.2 `LessonController` のカテゴリ選択を必須化する（US-2、design §2-7）
  - 対象: `backend/app/Http/Controllers/.../LessonController.php`
  - store / update: `'category_ids' => 'required|array|min:1'`、`'category_ids.*' => 'exists:categories,id'`

## 6. Backend: シーダー

- [x] 6.1 `MaterialSeeder` を `lesson_id` ベースに変更する（design §6）
  - 対象: `backend/database/seeders/MaterialSeeder.php`
  - `category_id => $category->id` を、レッスンを検索して `lesson_id => $lesson->id` に変更
  - 例: `Lesson::where('language', 'javascript')->first()` で対象レッスンを取得
  - `migrate:fresh --seed` が通ることを確認

## 7. Frontend: 管理画面

- [x] 7.1 レッスン一覧にカテゴリ列を追加する（US-1、design §3-1）
  - 対象: `frontend/.../admin/page.tsx`
  - `Lesson` interface に `categories: Category[]` を追加
  - 「カテゴリ」列ヘッダ + 各行にカテゴリ名タグ表示（0件は「—」）

- [x] 7.2 レッスンエディタにカテゴリ必須のフロント検証を追加する（US-2、design §3-2）
  - 対象: `frontend/.../admin/lessons/[id]/page.tsx`
  - `handleSubmit` で `selectedCategoryIds.length === 0` のとき保存中断 + インラインエラー
  - ラベルに必須マーク（`*`）を表示

- [x] 7.3 学習資料一覧の列を「カテゴリ」→「レッスン」に変更する（US-3、design §3-3）
  - 対象: `frontend/.../admin/materials/page.tsx`
  - `Material` interface の `category` → `lesson: { id; title } | null`
  - 列ヘッダと値（`material.lesson?.title ?? '—'`）を変更

- [x] 7.4 学習資料エディタをレッスン選択に変更する（US-3、design §3-4）
  - 対象: `frontend/.../admin/materials/[id]/page.tsx`
  - `categoryId/categories` → `lessonId/lessons` に全面置換、fetch 先を `/lessons` に
  - 既存資料取得・送信ペイロードを `lesson_id` に変更
  - レッスン選択 `<Select required>`（未選択は disabled プレースホルダ）

- [x] 7.5 カテゴリ一覧にレッスン数列とインライン展開を追加する（US-4、design §3-5）
  - 対象: `frontend/.../admin/categories/page.tsx`
  - `Category` interface に `lessons_count` を追加
  - state: `expandedId` / `expandedLessons`、`handleToggleExpand`（`/categories/{id}` を取得）
  - レッスン数バッジ列 + クリックで配下レッスンを展開する `<tr>`

## 8. Frontend: 生徒画面

- [x] 8.1 演習ページを `lesson.materials` 直接参照に変更する（US-5、design §4-1）
  - 対象: `frontend/.../(student)/lessons/[id]/page.tsx`
  - `Category` から materials を削除、`Lesson` に `materials: Material[]` を追加
  - `relatedMaterials = lesson.categories.flatMap(c => c.materials)` → `lesson.materials`
  - その他のモーダル動作は Phase 7 と同一に維持

- [x] 8.2 カテゴリ詳細から materials セクションを削除する（US-6、design §4-2）
  - 対象: `frontend/.../(student)/categories/[id]/page.tsx`
  - `Category` から `materials` フィールド、`Material` interface、学習資料セクションを削除
  - レッスン一覧表示は現行のまま維持（各カードクリックで演習ページへ）

## 9. 検証

- [x] 9.1 `migrate:fresh --seed` が成功することを確認（`docker compose exec backend php artisan migrate:fresh --seed`）
- [x] 9.2 バックエンドテスト全パス（`docker compose exec backend php artisan test`）— material 関連テストの `category_id` 依存を修正
- [x] 9.3 フロントエンド lint パス（`docker compose exec frontend npm run lint`）
- [ ] 9.4 動作確認チェックリスト
  - [ ] 管理: レッスン一覧にカテゴリ列が表示される（0件は「—」）
  - [ ] 管理: カテゴリ未選択でレッスン保存が拒否される（フロント/バック両方）
  - [ ] 管理: 学習資料エディタでレッスンを選択して保存できる／未選択は拒否
  - [ ] 管理: 学習資料一覧に「レッスン」列が表示される
  - [ ] 管理: カテゴリ一覧にレッスン数が表示され、クリックで配下レッスンが展開する
  - [ ] 生徒: 演習ページの参考資料が `lesson.materials` で表示される（モーダル動作）
  - [ ] 生徒: カテゴリ詳細ページがレッスン一覧を表示する（materials セクションなし）
