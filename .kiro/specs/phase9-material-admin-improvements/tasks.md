# Tasks: Phase 9 - 学習資料管理画面の改善

実装は `design.md` の「実装順序」（Repository → 学習資料エディタ → 学習資料一覧 → シーダー → 検証）で進める。
各サブタスク完了ごとにコミットする。`design.md` / `requirements.md` の US 番号を適宜参照。

## 1. Backend: Repository（US-2）

- [x] 1.1 `MaterialRepository` の eager load に `lesson.categories` を追加する（design §US-2）
  - 対象: `backend/app/Repositories/MaterialRepository.php`
  - `all()` / `find()` の `with('lesson:id,title')` を `with(['lesson:id,title', 'lesson.categories:id,name'])` に変更
  - `findByLesson()` は管理画面で未使用のため変更しない

## 2. Frontend: 学習資料エディタ（US-1, US-4）

- [x] 2.1 カテゴリ絞り込みセレクトを追加する（US-1、design §US-1）
  - 対象: `frontend/src/app/(admin)/admin/materials/[id]/page.tsx`
  - `Category` / `Lesson`（`categories: Category[]` を含む）の型を追加
  - `categories` / `categoryFilterId` の state を追加し、`GET /categories` を並行取得
  - `filteredLessons`（`categoryFilterId` によるフィルタ）を算出し、レッスン `<Select>` の選択肢を差し替え
  - カテゴリ切り替え時、選択中レッスンが `filteredLessons` から外れたら `lessonId` をリセットする `useEffect` を追加
  - レッスン選択は引き続き必須（未選択時は保存拒否、既存挙動を変更しない）

- [x] 2.2 order重複のインラインバリデーションを追加する（US-4、design §US-4）
  - 対象: `frontend/src/app/(admin)/admin/materials/[id]/page.tsx`
  - `allMaterials` / `orderError` の state を追加し、`GET /materials` を並行取得
  - `siblingOrders`（同一 `lessonId` 内・自分自身を除く既存 order 一覧）を算出し、表示順入力の下にヒント表示
  - `handleSubmit` 冒頭（レッスン未選択チェックの直後）で `siblingOrders.includes(order)` を検証し、重複時はエラーメッセージを表示して保存APIを呼ばずに中断する

## 3. Frontend: 学習資料一覧（US-2, US-3）

- [x] 3.1 カテゴリ列を追加する（US-2、design §US-2）
  - 対象: `frontend/src/app/(admin)/admin/materials/page.tsx`
  - `Material` interface の `lesson` に `categories: { id; name }[]` を追加
  - 「カテゴリ」列を追加し、`admin/page.tsx` と同じタグ表示パターンでカテゴリ名を表示（0件は「—」）

- [x] 3.2 検索・絞り込みUIを追加する（US-3、design §US-3）
  - 対象: `frontend/src/app/(admin)/admin/materials/page.tsx`
  - `titleQuery` / `lessonFilterId` / `categoryFilterId` の state を追加
  - 取得済み `materials` から `lessonOptions` / `categoryOptions` を重複排除して導出（追加API呼び出しなし）
  - `filteredMaterials`（タイトル部分一致 AND レッスン AND カテゴリ）を算出し、テーブルは `filteredMaterials` をマップする
  - ヘッダ下に検索ボックス＋レッスン絞り込み＋カテゴリ絞り込みを横並びで追加
  - `materials.length === 0` と `filteredMaterials.length === 0` を区別し、後者の場合は「条件に一致する学習資料がありません。」を表示

## 4. Backend: シーダー（US-5）

- [x] 4.1 `DatabaseSeeder` に Python基礎・Java基礎カテゴリを追加する（design §US-5）
  - 対象: `backend/database/seeders/DatabaseSeeder.php`
  - 既存4カテゴリに続けて「Python基礎」「Java基礎」を `name` + `description` で追加

- [x] 4.2 `LessonSeeder` に Python・Java レッスンを追加する（design §US-5）
  - 対象: `backend/database/seeders/LessonSeeder.php`
  - `$jsLessons` / `$phpLessons` と同じ構造で `$pythonLessons`（`language: 'python'`）/ `$javaLessons`（`language: 'java'`）を各10件追加
  - トピック構成: Hello World → 変数 → 算術演算 → 条件分岐 → ループ → 関数 → 配列/リスト → 辞書 → クラス → 応用
  - Java は `public static void main(String[] args)` を持つトップレベルクラス1つで完結させる（`CodeExecutionService` の単一ファイル実行に対応するため）
  - 既存ループ処理と同じパターンで「Python基礎」「Java基礎」カテゴリに `sync`

- [x] 4.3 `MaterialSeeder` に Python・Java 学習資料を追加する（design §US-5）
  - 対象: `backend/database/seeders/MaterialSeeder.php`
  - `$jsMaterials` / `$phpMaterials` と同じ構造で `$pythonMaterials` / `$javaMaterials` を各10件追加（`title` / `order` / `content`）
  - 既存パターンに倣い `Lesson::where('language', 'python')->first()` / `'java'` の最初のレッスンに `lesson_id` として紐づける

## 5. 検証

- [x] 5.1 `docker compose exec php php artisan migrate:fresh --seed` が成功することを確認する
- [x] 5.2 バックエンドテスト全パス（`docker compose exec php php artisan test`）
- [x] 5.3 フロントエンド lint パス（`docker compose exec node npm run lint`）
- [x] 5.4 動作確認チェックリスト（US-1〜US-4はブラウザでの目視確認が必要。ユーザーによる確認完了、問題なし）
  - [x] 管理: 学習資料エディタでカテゴリ選択によりレッスン選択肢が絞り込まれる（US-1）
  - [x] 管理: 学習資料一覧にカテゴリ列がタグ表示される（US-2）
  - [x] 管理: 学習資料一覧でタイトル・レッスン・カテゴリの検索・絞り込みが組み合わせで動作する（US-3）
  - [x] 管理: 同一レッスン内でorderが重複する内容の保存が拒否される（US-4）
  - [x] 管理: レッスン一覧・学習資料一覧・カテゴリ一覧に Python・Java のデータが表示される（US-5）— API応答で確認済み
  - [x] 生徒: Python・Java レッスンが実行でき、`expected_output` と一致する（US-5）— 全20件をDocker実行し一致確認済み
  - [x] 既存の JavaScript・PHP のレッスン・資料・カテゴリの内容・件数に回帰がない（US-5）— 各言語10件ずつで回帰なしを確認済み
