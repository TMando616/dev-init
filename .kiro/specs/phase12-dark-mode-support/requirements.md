# 要件定義: Phase 12 - ダークモード対応

## 概要

**目的**: OS/ブラウザがダークモード設定になっている場合でも、アプリ全体で適切なコントラストを保った表示になるようにする。

**背景・課題**:
- ユーザーからの報告: 「PCの設定でダークモードにしていると、文字が背景色と同化してしまう」
- 原因調査（Phase 11で判明）: `MarkdownRenderer.tsx`にのみ`dark:prose-invert`が指定されているが、それ以外のUI（サイドバー・カード・フォーム部品・レイアウト全般）はライト固定の配色（`bg-white`・`bg-slate-50`・`text-slate-900`等）で、`dark:`バリアントを一切持たない。
- 結果として、OSがダークモードのユーザーは、学習資料・レッスン本文のテキスト部分だけがダーク配色に反転し、白い背景の上に薄い文字が乗って読めなくなる不具合が発生している。
- 調査時点で、`slate`/`white`系の固定配色クラスを使用しているファイルは22件確認しており、`dark:`バリアントを持つのは`MarkdownRenderer.tsx`のみだった。

**今回の方針決定（確定事項）**:
- 場当たり的な個別修正ではなく、アプリ全体に本格的なダークモードを実装する（ユーザーとの合意事項）。
- 対応範囲は受講生側・管理者側の両方とする（`MarkdownRenderer`は管理画面の学習資料プレビュー `/admin/materials/[id]` でも使用されているため）。
- ダークモードの発火条件はTailwind標準の`prefers-color-scheme`メディアクエリ（OS設定への自動追随）とし、アプリ内に手動切り替えUIは追加しない。手動トグルが必要になった場合は別要件として切り出す。
- 共通UIプリミティブ（`components/ui/index.tsx`）とレイアウト（`Sidebar.tsx` / `AdminSidebar.tsx` / `MainLayout.tsx` / `AdminLayout.tsx`）を土台として先に対応し、各ページはそれに準じた配色パターンを踏襲する。

---

## ユーザーストーリー

### US-1: OSがダークモードでもテキストが読める
> As a 受講生・管理者 / I want to OSをダークモードに設定していてもアプリ内のテキストと背景が適切なコントラストで表示されてほしい / So that 現状のように文字が背景色に同化して読めなくなる不具合を避けられる。

受け入れ条件:
- [x] `MarkdownRenderer`を使用する画面（学習資料モーダル `MaterialModal.tsx`、レッスン本文 `lessons/[id]`、資料詳細 `materials/[id]`、管理画面の資料プレビュー `admin/materials/[id]`）は、ダーク時に文字色だけでなく背景色も追随して反転する
- [x] 共通UIコンポーネント（`Input` / `Select` / `Button`、`components/ui/index.tsx`）に`dark:`バリアントを追加する
- [x] 主要レイアウト（`Sidebar.tsx` / `AdminSidebar.tsx` / `MainLayout.tsx` / `AdminLayout.tsx`）の背景色・境界線・テキスト色に`dark:`バリアントを追加する
- [x] ダッシュボード（`(student)/page.tsx`）・レッスン一覧・カテゴリ一覧・管理画面各ページ（admins / categories / lessons / materials / users）の主要な背景・カード・テキスト色に`dark:`バリアントを追加する
- [x] レッスンエディタ画面（`lessons/[id]`）は現状すでにダーク基調の配色（`bg-slate-900`）のため、既存の見た目を維持しつつ、OSがライト/ダークいずれの設定でも表示が破綻しないことを確認する
- [x] コードエディタ（Monaco、`vs-dark`テーマ固定）・`Console.tsx`は現状の配色を維持してよい（元々ダーク基調のため対応優先度は低い）

### US-2: ダークモード対応の範囲を明確にする
> As a 開発者 / I want to ダークモードの適用範囲がOS設定への自動追随に閉じていることを明確にしたい / So that 手動切り替えの要望が出た際に本要件と区別して扱える。

受け入れ条件:
- [x] Tailwind標準の`prefers-color-scheme`メディアクエリベースの`dark:`バリアントをそのまま利用する（`next-themes`等によるクラスベースの手動切り替えは本要件では導入しない）
- [x] アプリ内にライト/ダークを手動切り替えるUIは追加しない（スコープ外）

---

## ギャップ分析（既存コードとの乖離）

| 領域 | 現状 | 本要件での変更 |
|------|------|----------------|
| `MarkdownRenderer.tsx` | `dark:prose-invert`のみ指定。呼び出し元の背景色は追随しない | 呼び出し元（`MaterialModal.tsx`他）の背景・枠色に`dark:`バリアントを追加（US-1） |
| `components/ui/index.tsx`（`Input`/`Select`/`Button`） | `dark:`バリアントなし。`bg-white`/`border-slate-200`等が固定 | `dark:`バリアントを追加（US-1） |
| `Sidebar.tsx` / `AdminSidebar.tsx` | `bg-white border-slate-200`固定 | `dark:`バリアントを追加（US-1） |
| `MainLayout.tsx` / `AdminLayout.tsx` | `bg-slate-50`固定 | `dark:`バリアントを追加（US-1） |
| 各ページ（`slate`/`white`系配色を使う22ファイル） | 固定ライト配色 | 主要な背景・カード・テキストに`dark:`バリアントを追加（設計フェーズでページ単位のタスクに分解） |
| `tailwind.config.ts` | `darkMode`設定なし（デフォルトの`prefers-color-scheme`メディアクエリ方式） | 変更なし（US-2でこの挙動を維持することを明示的に決定） |

---

## スコープ外（今回やらない）

- 手動ダークモード切り替えUI・`localStorage`等での設定永続化（US-2でOS設定への自動追随に限定することを決定）
- Monaco Editor / `Console.tsx`のテーマ切り替え（既にダーク基調のため対象外）
- カラーパレット自体の再設計（既存の`slate`パレットをベースに`dark:`バリアントを追加するのみで、新しい配色は導入しない）
