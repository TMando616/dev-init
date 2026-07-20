# 技術設計: Phase 12 - ダークモード対応

## 設計方針の要点

- Tailwind標準の `prefers-color-scheme` メディアクエリ（`dark:` バリアント）のみを使用し、JSによるテーマ切り替えロジックは一切追加しない。
- 新しい色は導入せず、既存の `slate` パレット内で「ライト時の階調」と「ダーク時の階調」を対応付けるルールを1つ決め、全ファイルに機械的に適用する。
- `components/ui/index.tsx` とレイアウト4ファイル（`Sidebar.tsx` / `AdminSidebar.tsx` / `MainLayout.tsx` / `AdminLayout.tsx`）を「土台」として最初に対応し、以降の各ページはこの土台と同じ変換ルールを踏襲するだけで済むようにする。
- `lessons/[id]`（受講生側）は既存のダーク基調UIを崩さないことを最優先し、共通コンポーネント側の変更がこの画面の固定配色領域に副作用を及ぼさないように設計する。

---

## 1. 配色コンバージョンルール（slate階調対応表）

### 1.1 基本テーブル

意味的役割ごとに「ライト時のクラス → ダーク時に追加する `dark:` クラス」を固定する。以降、全ファイルはこの表の組み合わせ以外を新規に作らない。

| 意味的役割 | ライト時（既存） | 追加する`dark:`クラス | 備考 |
|---|---|---|---|
| ページ背景（最下層） | `bg-slate-50` | `dark:bg-slate-950` | `MainLayout`/`AdminLayout`、各ページの `min-h-screen` コンテナ |
| ルートbody背景 | `bg-slate-50`（`layout.tsx`） | `dark:bg-slate-950` | ログイン/登録ページの背景にもなる最外殻 |
| カード/パネル背景 | `bg-white` | `dark:bg-slate-900` | カード、ヘッダーバー、テーブルコンテナ、モーダル本体 |
| 二次パネル背景（カード内の入れ子） | `bg-slate-50` | `dark:bg-slate-800/60` | 統計チップ、テーブルthead、コード表示枠など、カード(`bg-white`)の上にさらに1段薄く敷く領域 |
| 強い塗りつぶし（ダーク基調ブロック） | `bg-slate-900` | `dark:bg-slate-800` | ダッシュボードの「学習を再開」カードのようにライト時から既に濃色で塗る箇所。ダーク時はさらに沈まないよう1段明るい`slate-800`に留める |
| 薄い塗りつぶし（バッジ非アクティブ/プログレスバー背景） | `bg-slate-100` | `dark:bg-slate-800` | バッジ、プログレスバーのトラック |
| 見出しテキスト | `text-slate-900` | `dark:text-slate-100` | h1〜h3、カードタイトル、テーブルの主要セル |
| ラベル/準見出しテキスト | `text-slate-700` | `dark:text-slate-300` | フォームラベル、テーブルヘッダー文字 |
| 本文/補助テキスト | `text-slate-600` | `dark:text-slate-400` | 説明文、サブテキスト |
| メタ/キャプションテキスト | `text-slate-500` | `dark:text-slate-500` | 日時、件数など最弱の情報。ダーク背景でも`slate-500`は十分視認できるため据え置き |
| アイコン/プレースホルダーテキスト | `text-slate-400` | `dark:text-slate-500` | 非アクティブアイコン、`placeholder:text-slate-500` |
| 濃色ブロック上の白文字 | `text-white` | （変更なし） | `bg-slate-900`系ブロック上の文字は元々白固定なのでダーク時もそのまま |
| 境界線（標準） | `border-slate-200` | `dark:border-slate-700` | カード枠、ヘッダー下線、テーブル罫線 |
| 境界線（サブトル） | `border-slate-100` | `dark:border-slate-800` | サイドバーフッター区切りなど、より弱い境界線 |
| 境界線（破線・空状態） | `border-slate-300`（`border-dashed`） | `dark:border-slate-600` | 空状態プレースホルダー |
| divide（テーブル行区切り） | `divide-slate-100` | `dark:divide-slate-800` | `tbody`の行間線 |
| hover背景（ニュートラル） | `hover:bg-slate-100` | `dark:hover:bg-slate-800` | サイドバー非アクティブ項目、ゴーストボタン |
| hover背景（サブトル） | `hover:bg-slate-50` | `dark:hover:bg-slate-800/60` | テーブル行hover |
| アクティブ項目（濃色反転） | `bg-slate-900 text-white` | `dark:bg-slate-100 dark:text-slate-900` | サイドバーのアクティブナビ項目。ダーク時は白系反転にして「選択中」であることのコントラストを維持する |
| フォーカスリング | `focus-visible:ring-slate-950` | `dark:focus-visible:ring-slate-300` | Input/Select/Buttonの共通フォーカス環 |
| ring-offset | `ring-offset-white` | `dark:ring-offset-slate-900` | フォーカスリングの背景合わせ |

### 1.2 アクセントカラー（blue/red/emerald/amber）の扱い

カラーパレット自体の再設計は行わないため、色相は変えず「背景の薄い塗り」と「hover背景」のみダーク用に薄暗い塗りへ差し替える。文字色（`-500`〜`-700`）はそのままでも十分なコントラストが確保できるため据え置きを基本とする。

| 用途 | ライト時 | 追加する`dark:` | 対象例 |
|---|---|---|---|
| 危険系バッジ/hover | `bg-red-50 text-red-600` | `dark:bg-red-950/40 dark:text-red-400` | 削除ボタン、エラーメッセージ枠 |
| エラーメッセージ枠のボーダー | `border-red-200` | `dark:border-red-900/60` | ログインエラー表示 |
| 情報/編集系バッジ/hover | `bg-blue-50 text-blue-600` | `dark:bg-blue-950/40 dark:text-blue-400` | 編集ボタン、アバター |
| 完了/成功系 | `text-emerald-600` | `dark:text-emerald-400` | 完了マーク、保存済み表示 |
| 警告系 | `text-amber-500` | `dark:text-amber-400` | 模範解答ラベル |

判定・実行結果バナー（`bg-emerald-600 text-white` / `bg-red-600 text-white`）のような「濃色塗り＋白文字」パターンは、既に十分なコントラストを持つため `dark:` 追加不要（既存のまま両モードで成立する）。

### 1.3 適用時の機械的手順

各ファイルで `bg-slate-50` / `bg-white` / `bg-slate-900`（薄塗り文脈）/ `bg-slate-100` / `text-slate-900` / `text-slate-700` / `text-slate-600` / `text-slate-500` / `text-slate-400` / `border-slate-200` / `border-slate-100` / `border-slate-300` / `divide-slate-100` / `hover:bg-slate-100` / `hover:bg-slate-50` を見つけたら、上表の対応する `dark:` クラスを同じ要素の `className` に追記する。`clsx`/テンプレートリテラルいずれの箇所でも、既存のクラス文字列に `dark:` クラスを並べて追加するだけで良く、構造やロジックの変更は不要。

---

## 2. 共通UIプリミティブ / レイアウトへの適用

### 2.1 `components/ui/index.tsx`

**Input**（該当行のクラス文字列に追記）:
```
border border-slate-200 dark:border-slate-700
bg-white dark:bg-slate-900
ring-offset-white dark:ring-offset-slate-900
placeholder:text-slate-500 dark:placeholder:text-slate-500
focus-visible:ring-slate-950 dark:focus-visible:ring-slate-300
text-slate-900 dark:text-slate-100   ← 現状text色未指定のため明示追加が必要（ブラウザ既定の黒文字がダーク背景で読めなくなるため）
```

**Select**（Inputと同じ構成、加えて `<option>` はブラウザネイティブレンダリングのため通常dark:対応は不要だが、Chromium系ブラウザはOSダークモード時に自動でネイティブ配色に切り替わるため許容する）。

**Button variants**:
```
default: 'bg-slate-900 text-slate-50 hover:bg-slate-900/90
          dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90'
outline: 'border border-slate-200 bg-white hover:bg-slate-100 hover:text-slate-900
          dark:border-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100'
ghost:   'hover:bg-slate-100 hover:text-slate-900
          dark:hover:bg-slate-800 dark:hover:text-slate-100'
```
`default`（黒背景の主要ボタン）はダーク時にサイドバーのアクティブ項目と同じ「白反転」ルールを適用し、暗い画面の中で埋没しないようにする。`ring-offset-white` / `focus-visible:ring-slate-950` にも上記フォーカス系の`dark:`を追加する。

`lessons/[id]`（受講生側）で `Button` に個別の `className`（`text-slate-300 hover:bg-slate-700` 等の固定ダーク色）を上書き指定している箇所は、`cn()`（`twMerge`）により最終的に上書き側が優先されるため、`components/ui/index.tsx` 側に `dark:` を追加しても衝突しない（既存の上書きクラスがそのまま勝つ）。

### 2.2 `Sidebar.tsx` / `AdminSidebar.tsx`（共通パターン、両ファイル同一差分）

- 外枠: `bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700`
- ヘッダー下境界: `border-b border-slate-50 dark:border-slate-800`
- ロゴアイコン背景（`bg-slate-900`/`bg-blue-600`）は元々濃色塗り＋白文字のため変更不要
- ロゴ横の `DevInit` タイトル文字: `<aside>` 直下に `text-slate-900 dark:text-slate-100` を明示追加（bodyのdark対応と連動させず、コンポーネント単体の可搬性のため明示する）
- ナビ項目 非アクティブ: `text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100`
- ナビ項目 アクティブ: `bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900`
- アイコン 非アクティブ: `text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300`
- アイコン アクティブ: `text-white dark:text-slate-900`（既存の三項演算に`dark:`を追加するだけ）
- カテゴリ見出し（Sidebar.tsxのみ）: `text-slate-400 dark:text-slate-500`
- フッター境界: `border-t border-slate-100 dark:border-slate-800`
- ユーザー名: `text-slate-900 dark:text-slate-100`、メール: `text-slate-500 dark:text-slate-500`
- アバター（`bg-blue-100 text-blue-700`）: `dark:bg-blue-950/40 dark:text-blue-400`
- ログアウトボタン: `text-slate-600 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400`、アイコン `text-slate-400 dark:text-slate-500 group-hover:text-red-500 dark:group-hover:text-red-400`
- 折りたたみボタン: `text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800`

### 2.3 `MainLayout.tsx` / `AdminLayout.tsx`

外枠コンテナのみ変更:
```
className="flex min-h-screen bg-slate-50 dark:bg-slate-950"
```
`Sidebar`/`AdminSidebar`自体は2.2で対応済みのため、レイアウト側はページ背景色1箇所の追加で完結する。

### 2.4 ルート `layout.tsx`（body）

土台の一部として、`app/layout.tsx` の `body` クラスにも追加する（ログイン/登録ページなど `MainLayout` を経由しないルートの背景・文字色に直接影響するため）:
```
className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100"
```
**実装時に判明した修正点**: `globals.css` の `body { background: var(--background); color: var(--foreground); }` は `@layer` の外に書かれた素のCSSであり、Tailwind v4のユーティリティクラス（`@layer utilities` 内）よりCSS Cascade Layersの規定で常に優先されてしまう。そのため当初の想定（クラスセレクタが上書きするので変更不要）は誤りで、この`body{}`ルールが`<body>`の`dark:bg-slate-950 dark:text-slate-100`を無効化し、ログイン/登録ページの見出し（`DevInit`）等が実質的に読めなくなる不具合が発生した。`globals.css`から`background`/`color`の宣言を削除し、`<body>`のクラスに一本化することで解消した（ブラウザでの`prefers-color-scheme: dark`エミュレーション確認時に発見）。

---

## 3. `MarkdownRenderer` 利用箇所の背景色対応

### 3.1 標準パターン（3箇所）

以下は「ページ全体がダーク対応される」通常ページなので、ラッパー要素にカード背景ルール（2.1の `bg-white → dark:bg-slate-900`、`border-slate-200 → dark:border-slate-700`）をそのまま適用すれば、既存の `dark:prose-invert` と自然に整合する。

- `MaterialModal.tsx`
  - オーバーレイ: `bg-black/50`（変更不要。両モードで機能する半透明黒）
  - モーダル本体: `bg-white dark:bg-slate-900`
  - ヘッダー境界: `border-slate-200 dark:border-slate-700`
  - タイトル: `text-slate-900 dark:text-slate-100`
  - 閉じるボタン: `text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800`
- `(student)/materials/[id]/page.tsx` 本文カード: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`
- `(admin)/admin/materials/[id]/page.tsx` プレビューカード: `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`（見出しの `bg-slate-50` 帯にも `dark:bg-slate-800/60` を追加）

### 3.2 `(student)/lessons/[id]/page.tsx` の左ペイン（例外パターン）

こちらは4章で詳述する「常時ライト固定の島」であるため、ラッパーには `dark:` を追加せず、代わりに `MarkdownRenderer` 側に「ダーク反転を無効化するオプション」を設ける（詳細は4.2）。

### 3.3 コードハイライト（補足・変更不要の確認事項）

`MarkdownRenderer.tsx` は `highlight.js/styles/github-dark.css` を常時importしており、Markdown本文中のコードブロックは元々ライト/ダークいずれのモードでも「濃色背景＋明るい文字」で固定表示される（`prose-invert`の`code`/`pre code`上書きは`tailwind.config.ts`の`typography`カスタマイズで透過・継承に設定済み）。これは今回のスコープ（本文の地の色）とは独立した既存仕様であり、変更不要。設計上の確認事項として明記するに留める。

---

## 4. `lessons/[id]`（受講生側）のダーク基調領域との衝突回避

### 4.1 画面構造の整理

`(student)/lessons/[id]/page.tsx` は次の3領域から成る:

1. 外枠・ヘッダー・右ペイン（エディタ/コンソール）: `bg-slate-900` / `bg-slate-800` 等、**常時ダーク固定**（`dark:`バリアントを持たず、OS設定に関わらず同じ見た目）。Monaco（`vs-dark`固定）・`Console.tsx`も同様、対応不要。
2. 左ペイン（説明パネル）: `bg-white text-slate-900 border-r border-slate-200`、**常時ライト固定**の「島」。参考資料ボタン（`border-slate-200 hover:bg-blue-50 text-slate-700`）も同様に固定。
3. 左ペインの内部に埋め込まれた `MarkdownRenderer`（レッスン本文）。

要件上、この画面は「現状維持」が確定事項であり、2の左ペインに `dark:bg-slate-900` 等を追加して他ページと同じ挙動にすることは行わない（エディタ画面のレイアウトはこのままにする）。

### 4.2 衝突点と解決方法

`MarkdownRenderer` は現在 `dark:prose-invert` を無条件に付与している。OSがダークモードの場合、左ペインの背景は `bg-white` のまま変化しないのに、内部の本文テキストだけが `prose-invert`（明るい文字色）に反転し、白背景に薄い文字が乗って読めなくなる — これは今回の不具合報告そのものの構図が、左ペインという「常時ライトの島」の中で再発する形になる。

**採用する解決策**: `MarkdownRenderer` に `invertOnDark`（既定 `true`）という描画時Propを追加し、呼び出し元が静的に「このMarkdownRenderer配置先はダーク反転してよいか」を宣言できるようにする。

```tsx
interface MarkdownRendererProps {
  content: string;
  className?: string;
  invertOnDark?: boolean; // 既定 true。false の場合 dark:prose-invert を付与しない
}

export default function MarkdownRenderer({
  content,
  className = "",
  invertOnDark = true,
}: MarkdownRendererProps) {
  return (
    <div className={`prose prose-neutral ${invertOnDark ? "dark:prose-invert" : ""} max-w-none ${className}`}>
      ...
```

- `(student)/lessons/[id]/page.tsx` の左ペイン内呼び出しのみ `invertOnDark={false}` を指定する。
- それ以外（`MaterialModal.tsx`、`(student)/materials/[id]`、`(admin)/admin/materials/[id]`）は既定値 `true` のまま変更不要。

このPropは「OS設定を検知してJSでテーマを切り替える」ものではなく、**呼び出し元コンポーネントがビルド時/レンダー時に静的に決める配置文脈のフラグ**であるため、要件で禁止されている「クラスベースの手動切り替え」（`next-themes`等によるランタイムのテーマ状態管理）には該当しない。`dark:` バリアントの発火条件自体は引き続きTailwind標準の `prefers-color-scheme` メディアクエリのみに委ねている。

なお、`(student)/lessons/[id]/page.tsx` から開く `MaterialModal`（参考資料ボタン押下時）は左ペインの子要素ではなく `fixed inset-0` の独立したオーバーレイであるため、3.1の標準パターン（`invertOnDark`既定値のまま）で問題なく、左ペインの固定ライト背景とは無関係にダーク対応してよい。

### 4.3 `(admin)/admin/lessons/[id]/page.tsx` の「期待される出力」欄

この画面自体は他の管理画面と同じ通常のライト基調フォームページ（`bg-slate-50` / `bg-white`カード）であり、標準の変換ルール（1章・5章）をそのまま適用する。ただし「期待される出力」用の `<textarea>` のみ、現状から意図的に `bg-slate-900 text-slate-100`（ターミナル風の固定濃色）でスタイリングされている。これはMonaco（`vs-dark`固定）と同様の「常時ダーク固定の入力欄」であり、対応不要（`dark:`を追加せず据え置き）。ページ本体がダーク対応されても、このtextareaは周囲のカード（ダーク時 `dark:bg-slate-900`）とほぼ同化する形になり視覚的破綻はない点を実装後に目視確認する。

---

## 5. ページ別タスク分解方針

22ファイルへの展開は、依存関係と「衝突リスクの有無」に基づき次の順序でグルーピングする。各グループは独立してレビュー・確認が可能な単位とする。

### グループA: 共通基盤（最優先・他の全グループの前提）
- `components/ui/index.tsx`（Input / Select / Button）
- `app/layout.tsx`（body背景・文字色）
- `components/Sidebar.tsx`
- `components/AdminSidebar.tsx`
- `components/MainLayout.tsx`
- `components/AdminLayout.tsx`
- `components/MarkdownRenderer.tsx`（`invertOnDark` Prop追加のみ、呼び出し元の書き換えは各グループで実施）

### グループB: 受講生側ページ群（グループA完了後、標準ルールを機械的適用）
- `(student)/page.tsx`（ダッシュボード）
- `(student)/lessons/list/page.tsx`
- `(student)/categories/[id]/page.tsx`
- `(student)/materials/[id]/page.tsx`（3.1のパターンでMarkdownRenderer周りも対応）
- `(student)/login/page.tsx`
- `(student)/register/page.tsx`

### グループC: 管理者側ページ群（グループAと並行着手可、グループBと独立）
- `(admin)/admin/page.tsx`（レッスン管理・テーブル）
- `(admin)/admin/materials/page.tsx`
- `(admin)/admin/categories/page.tsx`
- `(admin)/admin/users/page.tsx`
- `(admin)/admin/admins/page.tsx`
- `(admin)/admin/login/page.tsx`
- `(admin)/admin/lessons/[id]/page.tsx`（4.3の「期待される出力」欄は対象外として明示）
- `(admin)/admin/materials/[id]/page.tsx`（3.1のパターン）

### グループD: MarkdownRenderer利用箇所の仕上げ（グループA・B・Cと一部重複するため、横断チェックとして実施）
- `components/MaterialModal.tsx`
- 上記4ファイルでの `MarkdownRenderer` 呼び出し（グループB/Cの一部として既に対応済みのものを再確認）

### グループE: `lessons/[id]`（受講生側）の整合性確認（最後に実施・変更は最小限）
- `(student)/lessons/[id]/page.tsx` の `MarkdownRenderer` 呼び出しに `invertOnDark={false}` を指定
- 左ペイン・右ペイン・ヘッダーの固定色に意図しない `dark:` が混入していないことをレビュー
- OSライト/ダーク双方で目視確認（6章参照）

**グループ順の理由**: A（共通基盤）は他の全ての土台であるため必ず先行させる。B・Cは配色パターンが同一のため並行して着手でき、互いに依存しない。Dは実質的にB・Cの一部（MarkdownRenderer呼び出し元）だが「背景色追随」という要件文言に対応する横断的な確認ステップとして独立させる。Eは「現状維持」が最優先の特殊画面であり、共通コンポーネント（特にMarkdownRenderer）の変更が出揃った後の最終確認として最後に置く。

---

## 6. テスト・検証方法

### 6.1 ビルド確認（Next.js 16 / React 19 / Tailwind v4）

- 実装着手前に `frontend/node_modules/next/dist/docs/` 配下でNext.js 16の破壊的変更（特にCSS/Tailwind関連、`app/`ディレクトリの規約）を確認する。
- 型チェック: `npm run lint` および `tsc --noEmit` でMarkdownRendererの新規Prop（`invertOnDark`）に型エラーがないことを確認する。
- ビルド: `npm run build` を実行し、Tailwind v4の`@plugin "@tailwindcss/typography"`・`dark:`バリアントを含むクラスがパージされずに出力されることを確認する（v4はコンテンツスキャンベースのJITのため、テンプレートリテラルで組み立てている`dark:`クラスも静的文字列である限り検出される。動的に文字列結合で生成する`dark:${variable}`のようなパターンは使わないことを実装時のルールとする）。

### 6.2 ブラウザでのOSダークモード切り替え確認

Chrome DevTools の「レンダリング」タブ → 「CSS media feature `prefers-color-scheme`をエミュレート」で `light` / `dark` を切り替えながら以下を確認する（実OS設定を都度変更しなくて済む）。

1. グループA（Sidebar/AdminSidebar/MainLayout/AdminLayout/UIプリミティブ）: ライト⇄ダーク双方でサイドバーの文字とアイコンが背景から十分なコントラストで視認できること、フォーム部品（Input/Select/Button）が両モードで枠線・背景・文字色とも破綻しないこと。
2. グループB/C: 各ページのカード・テーブル・バッジ・hover状態をライト/ダーク双方で確認。特にテーブル行hover（`dark:hover:bg-slate-800/60`）とバッジ（`dark:bg-*-950/40`）のコントラストを目視確認する。
3. グループD: `MaterialModal`をライト/ダーク双方で開き、モーダル背景とMarkdown本文（見出し・コードブロック・リンク）の可読性を確認する。
4. グループE: `(student)/lessons/[id]`をOSライト/ダーク双方で開き、(a) 右ペイン（エディタ/コンソール）とヘッダーが常に同じダーク配色であること、(b) 左ペイン（説明パネル）が常に白背景・濃色文字のままであること、(c) 左ペイン内のMarkdown本文がダーク反転せず黒文字のまま読めることを確認する。あわせて左ペインから開く`MaterialModal`はOS設定に追随してダーク表示されることも確認する。
5. `(admin)/admin/lessons/[id]`の「期待される出力」欄がページ全体のダーク対応後も周囲のカードと視覚的に破綻しないことを確認する。

OS実機確認（最終確認）: 実際にOSのダーク/ライト設定を切り替え、上記1〜5の代表画面をブラウザで確認する。特にログイン画面（`MainLayout`/`AdminLayout`を経由しない`app/layout.tsx`のbody背景が直接見える唯一の画面群）を明示的に確認する。

### 6.3 回帰確認

- 既存のE2E/単体テストがあれば実行し、クラス名変更（`className`文字列への`dark:`追加）が意図せず失敗しないことを確認する（本設計はクラス追加のみで構造・DOM階層を変えないため、テキストベースのテストへの影響はない想定）。
- `MarkdownRenderer`のProp追加（`invertOnDark`）は後方互換（既定値`true`）のため、既存の呼び出し元（Prop未指定）の挙動は変更されないことをコードレビューで確認する。
