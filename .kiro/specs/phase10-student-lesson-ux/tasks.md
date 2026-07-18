# Tasks: Phase 10 - 受講生向けレッスンUX改善

実装は `design.md` の「実装順序」（US-1バックエンド → US-2バックエンド → US-1フロント → US-2フロント → US-3 → 検証）で進める。
各サブタスク完了ごとにコミットする。`design.md` / `requirements.md` の US 番号を適宜参照。

## 1. Backend: 完了済みレッスンID取得API（US-1）

- [x] 1.1 `SubmissionRepository::completedLessonIds()` を追加する（design §US-1）
  - 対象: `backend/app/Repositories/SubmissionRepository.php`
  - `Submission::where('user_id', $userId)->where('status', 'completed')->pluck('lesson_id')->toArray()`

- [x] 1.2 `SubmissionService::getCompletedLessonIds()` を追加する（design §US-1）
  - 対象: `backend/app/Services/SubmissionService.php`
  - repository呼び出しのみの薄いラッパー

- [x] 1.3 `SubmissionController::completedLessonIds()` アクションとルートを追加する（design §US-1）
  - 対象: `backend/app/Http/Controllers/SubmissionController.php`, `backend/routes/api.php`
  - `GET /submissions/completed-lesson-ids` を student-only（`auth:sanctum`）グループに追加し `{ lesson_ids: number[] }` を返す
  - adminガードには含めない

## 2. Backend: 次レッスンID（US-2）

- [x] 2.1 `Lesson::getNextLessonIdAttribute()` アクセサを追加する（design §US-2）
  - 対象: `backend/app/Models/Lesson.php`
  - `id` 昇順・全体順（カテゴリ非依存）で自分より大きい最小の `id` を返す。存在しなければ `null`

- [x] 2.2 `LessonRepository::find()` で `next_lesson_id` を append する（design §US-2）
  - 対象: `backend/app/Repositories/LessonRepository.php`
  - `find()` のみ変更する（`all()` は一覧取得時のN+1回避のため変更しない）

## 3. Frontend: レッスン一覧・カテゴリ別一覧に完了マーク（US-1）

- [x] 3.1 `lessons/list/page.tsx` に完了マークを表示する（design §US-1）
  - 対象: `frontend/src/app/(student)/lessons/list/page.tsx`
  - `completedLessonIds: Set<number>` state を追加し、既存の `Promise.all` に `GET /submissions/completed-lesson-ids` を追加
  - `LessonCard` 内、タイトル右・`ChevronRight` の左に `CheckCircle2` ＋「完了」を条件描画する（未完了レッスンは要素ごと非描画）

- [x] 3.2 `categories/[id]/page.tsx` に完了マークを表示する（design §US-1）
  - 対象: `frontend/src/app/(student)/categories/[id]/page.tsx`
  - 3.1 と同一パターンを適用する

## 4. Frontend: レッスン詳細画面の次レッスン遷移（US-2）

- [x] 4.1 「次のレッスンへ」ボタンを追加する（design §US-2）
  - 対象: `frontend/src/app/(student)/lessons/[id]/page.tsx`
  - `Lesson` interface に `next_lesson_id: number | null` を追加
  - `next_lesson_id !== null` の場合のみ「完了にする」ボタンの右に表示し、押下で `/lessons/{next_lesson_id}` へ `router.push`

- [x] 4.2 レッスン遷移時のローカルstateリセットを追加する（design §US-2）
  - 対象: 同上
  - `fetchLessonAndSubmission` の `useEffect`（`[id, authLoading, user]` 依存）先頭で `logs` / `error` / `judgeResult` / `showModelAnswer` / `selectedMaterial` をリセットしてから取得処理に入る

## 5. Frontend: サイドバーへのカテゴリ表示（US-3）

- [x] 5.1 `Sidebar.tsx` にカテゴリ一覧を動的表示する（design §US-3）
  - 対象: `frontend/src/components/Sidebar.tsx`
  - `categories` state を追加し `GET /categories` を取得
  - `allHrefs` にカテゴリの href を含めて `isActive` ロジックに反映
  - 既存 `navItems` ブロックの直後に、`categories.length > 0` の場合のみカテゴリセクションを描画する（`Tag` アイコン、折りたたみ `isCollapsed` 対応）

## 6. 検証

- [x] 6.1 バックエンドテスト全パス（`docker compose exec php php artisan test`）
- [x] 6.2 フロントエンド lint パス（`docker compose exec node npm run lint`）
- [ ] 6.3 動作確認チェックリスト（ブラウザでの目視確認）
  - [ ] レッスン一覧・カテゴリ別一覧で完了済みレッスンに完了マークが表示される（US-1）
  - [ ] 未完了のレッスンには完了マークが表示されない（US-1）
  - [ ] レッスン詳細画面で「次のレッスンへ」ボタンが表示され、正しく遷移する（US-2）
  - [ ] 最後のレッスンでは「次のレッスンへ」ボタンが表示されない（US-2）
  - [ ] 次のレッスンに遷移した際、前のレッスンの実行結果・模範解答表示が残っていない（US-2）
  - [ ] サイドバーにカテゴリ一覧が表示され、クリックで該当カテゴリ一覧に遷移する（US-3）
  - [ ] 現在表示中のカテゴリがサイドバーでハイライトされる（US-3）
  - [ ] サイドバー折りたたみ時もカテゴリ項目が既存ナビと同様に表示される（US-3）
  - [ ] 既存の管理画面（レッスン一覧・学習資料関連）に回帰がない（US-1・US-2で変更したAPIレスポンスの影響確認）
