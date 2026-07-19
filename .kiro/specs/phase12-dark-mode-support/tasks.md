# Tasks: Phase 12 - ダークモード対応

実装は `design.md` の「グループA〜E」の順（共通基盤 → 受講生側/管理者側ページ群 → MarkdownRenderer仕上げ → lessons/[id]整合性確認）で進める。
配色の変換は `design.md` §1 の対応表（slate階調・アクセントカラー）を機械的に適用する。各サブタスク完了ごとにコミットする。

## 1. 共通基盤（グループA）

- [ ] 1.1 `components/ui/index.tsx`（Input / Select / Button）に`dark:`バリアントを追加する（design §2.1）
  - 対象: `frontend/src/components/ui/index.tsx`
  - Input/Selectに`dark:border-slate-700 dark:bg-slate-900 dark:ring-offset-slate-900 dark:focus-visible:ring-slate-300`と明示的な`text-slate-900 dark:text-slate-100`を追加
  - Buttonの`default`/`outline`/`ghost`各variantに対応する`dark:`クラスを追加（`default`はダーク時に白反転）

- [ ] 1.2 `app/layout.tsx`のbodyに`dark:`バリアントを追加する（design §2.4）
  - 対象: `frontend/src/app/layout.tsx`
  - `bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100`を追加（ログイン/登録ページの外枠に影響）

- [ ] 1.3 `Sidebar.tsx` / `AdminSidebar.tsx`に`dark:`バリアントを追加する（design §2.2）
  - 対象: `frontend/src/components/Sidebar.tsx`, `frontend/src/components/AdminSidebar.tsx`
  - 外枠・ナビ項目（非アクティブ/アクティブ）・アイコン・フッター（ユーザー名/アバター/ログアウトボタン）・折りたたみボタンに対応表通りの`dark:`クラスを追加

- [ ] 1.4 `MainLayout.tsx` / `AdminLayout.tsx`に`dark:`バリアントを追加する（design §2.3）
  - 対象: `frontend/src/components/MainLayout.tsx`, `frontend/src/components/AdminLayout.tsx`
  - 外枠コンテナに`dark:bg-slate-950`を追加

- [ ] 1.5 `MarkdownRenderer.tsx`に`invertOnDark`propを追加する（design §4.2）
  - 対象: `frontend/src/components/MarkdownRenderer.tsx`
  - `invertOnDark?: boolean`（既定`true`）を追加し、`false`の場合`dark:prose-invert`を付与しない
  - 呼び出し元の書き換えは3章・5章で実施（既定値により既存呼び出しは無変更で動作継続）

## 2. 受講生側ページ群（グループB）

- [ ] 2.1 `(student)/page.tsx`（ダッシュボード）に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(student)/page.tsx`

- [ ] 2.2 `(student)/lessons/list/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(student)/lessons/list/page.tsx`

- [ ] 2.3 `(student)/categories/[id]/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(student)/categories/[id]/page.tsx`

- [ ] 2.4 `(student)/materials/[id]/page.tsx`に`dark:`バリアントを追加する（design §1・§3.1）
  - 対象: `frontend/src/app/(student)/materials/[id]/page.tsx`
  - 本文カードに`bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700`を適用（`MarkdownRenderer`は既定`invertOnDark`のまま）

- [ ] 2.5 `(student)/login/page.tsx` / `(student)/register/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(student)/login/page.tsx`, `frontend/src/app/(student)/register/page.tsx`

## 3. 管理者側ページ群（グループC）

- [ ] 3.1 `(admin)/admin/page.tsx`（レッスン管理・テーブル）に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(admin)/admin/page.tsx`

- [ ] 3.2 `(admin)/admin/materials/page.tsx` / `(admin)/admin/categories/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(admin)/admin/materials/page.tsx`, `frontend/src/app/(admin)/admin/categories/page.tsx`

- [ ] 3.3 `(admin)/admin/users/page.tsx` / `(admin)/admin/admins/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(admin)/admin/users/page.tsx`, `frontend/src/app/(admin)/admin/admins/page.tsx`

- [ ] 3.4 `(admin)/admin/login/page.tsx`に`dark:`バリアントを追加する（design §1・§5）
  - 対象: `frontend/src/app/(admin)/admin/login/page.tsx`

- [ ] 3.5 `(admin)/admin/lessons/[id]/page.tsx`に`dark:`バリアントを追加する（design §1・§4.3）
  - 対象: `frontend/src/app/(admin)/admin/lessons/[id]/page.tsx`
  - ページ本体（`bg-slate-50`/`bg-white`カード）は標準ルールを適用。「期待される出力」欄（`bg-slate-900 text-slate-100`固定）は対象外とし変更しない

- [ ] 3.6 `(admin)/admin/materials/[id]/page.tsx`に`dark:`バリアントを追加する（design §1・§3.1）
  - 対象: `frontend/src/app/(admin)/admin/materials/[id]/page.tsx`
  - プレビューカードに`bg-white dark:bg-slate-900`、見出し帯に`dark:bg-slate-800/60`を適用（`MarkdownRenderer`は既定`invertOnDark`のまま）

## 4. MarkdownRenderer利用箇所の仕上げ（グループD）

- [ ] 4.1 `MaterialModal.tsx`に`dark:`バリアントを追加する（design §3.1）
  - 対象: `frontend/src/components/MaterialModal.tsx`
  - モーダル本体`bg-white dark:bg-slate-900`、ヘッダー境界`dark:border-slate-700`、タイトル`dark:text-slate-100`、閉じるボタンに対応表通りの`dark:`クラスを追加

- [ ] 4.2 2章・3章で対応した`MarkdownRenderer`呼び出し4箇所の背景色連動を再確認する（design §3.1）
  - 対象: `MaterialModal.tsx`, `(student)/materials/[id]/page.tsx`, `(admin)/admin/materials/[id]/page.tsx`（`lessons/[id]`は5章で対応するため対象外）
  - `dark:prose-invert`（本文の文字反転）とラッパー背景色（`dark:bg-slate-900`）が同時に切り替わり、白背景に暗い文字/黒背景に黒文字のような組み合わせが発生しないことをコードレビューで確認

## 5. lessons/[id]（受講生側）の整合性確認（グループE）

- [ ] 5.1 `(student)/lessons/[id]/page.tsx`の左ペインで`MarkdownRenderer`に`invertOnDark={false}`を指定する（design §4.2）
  - 対象: `frontend/src/app/(student)/lessons/[id]/page.tsx`
  - 左ペイン（説明パネル）内のレッスン本文呼び出しのみ変更。左ペインから開く`MaterialModal`は対象外（既定`invertOnDark=true`のまま、OS設定に追随してよい）

- [ ] 5.2 左ペイン・右ペイン・ヘッダーの固定色に意図しない`dark:`が混入していないことをレビューする（design §4.1）
  - 対象: `frontend/src/app/(student)/lessons/[id]/page.tsx`
  - 右ペイン（エディタ/コンソール）・ヘッダーは常時ダーク固定、左ペインは常時ライト固定のまま変化しないことを確認

## 6. 検証

- [ ] 6.1 フロントエンド lint パス（`docker compose exec node npm run lint`）
- [ ] 6.2 フロントエンド ビルド確認（`docker compose exec node npm run build`）
  - `dark:`クラスが動的文字列結合（`dark:${variable}`等）で生成されておらず、Tailwind v4のコンテンツスキャンでパージされずに出力されることを確認
- [ ] 6.3 動作確認チェックリスト（Chrome DevTools「レンダリング」タブの`prefers-color-scheme`エミュレーションでlight/dark切り替え、ブラウザでの目視確認）
  - [ ] グループA: Sidebar/AdminSidebar/MainLayout/AdminLayoutの文字・アイコンが両モードで背景から十分なコントラストを保つ（US-1）
  - [ ] グループA: Input/Select/Buttonが両モードで枠線・背景・文字色とも破綻しない（US-1）
  - [ ] グループB: 受講生側の全ページ（ダッシュボード/レッスン一覧/カテゴリ一覧/資料詳細/ログイン/登録）が両モードで表示崩れなし（US-1）
  - [ ] グループC: 管理者側の全ページ（レッスン/資料/カテゴリ/ユーザー/管理者/ログイン管理、レッスン編集、資料プレビュー）が両モードで表示崩れなし（US-1）
  - [ ] グループD: `MaterialModal`を両モードで開き、モーダル背景とMarkdown本文（見出し・コードブロック・リンク）が読める（US-1）
  - [ ] グループE: `(student)/lessons/[id]`で右ペイン（エディタ/コンソール）が常にダーク固定、左ペイン（説明パネル・本文）が常にライト固定のまま読めることを確認（US-1）
  - [ ] グループE: 左ペインから開く`MaterialModal`はOS設定に追随してダーク表示されることを確認（US-1）
  - [ ] `(admin)/admin/lessons/[id]`の「期待される出力」欄がページ全体のダーク対応後も周囲のカードと視覚的に破綻しない（US-1）
  - [ ] Monaco Editor（`vs-dark`固定）・`Console.tsx`の表示に回帰がない（US-1、対応不要範囲の確認）
  - [ ] OS実機でダーク/ライトを切り替え、ログイン画面（`app/layout.tsx`のbody背景が直接見える画面）を含め代表画面で最終確認（US-1）
- [ ] 6.4 既存のバックエンド/フロントエンドテストに回帰がないことを確認（`docker compose exec php php artisan test`）
