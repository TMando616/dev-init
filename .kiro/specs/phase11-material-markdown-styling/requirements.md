# 要件定義: Phase 11 - 学習資料Markdown表示のリッチ化

> **注記**: 本ドキュメントは実装後に事後作成したものである。本来はcc-sddフロー（ステアリング→要件→設計→タスク→実装）に沿って要件定義を先に行うべきところ、相談ベースの依頼をそのまま実装まで進めてしまったため、内容と経緯を後追いで記録する。今後同様の依頼は、実装前に本フローへ乗せることを徹底する。

## 概要

**目的**: 学習資料（`MarkdownRenderer`）・レッスン本文のMarkdown表示を、QiitaやBacklogのような可読性の高い見た目に近づける。

**背景・課題**:
- 受講生から「マークダウン表示をもう少しリッチにできないか（`#`見出しの下線、`` ` ``で囲ったインラインコードの背景色など）」と相談を受けた。
- 調査の結果、`frontend`は`@tailwindcss/typography`（`prose`クラス）を導入済みだったが、Tailwind CSS v4移行時の設定漏れにより**実質何も効いていなかった**ことが判明した。
  - `tailwind.config.ts`の`plugins: [typography]`はTailwind v3方式の登録方法であり、v4では`@plugin`／`@config`ディレクティブをCSSエントリポイント（`globals.css`）に書かない限り読み込まれない。
  - そのため、`MarkdownRenderer.tsx`の`prose prose-neutral dark:prose-invert`クラスはコンパイル後のCSSに一切のスタイルを生成しておらず、見出し・段落・コードなどのタイポグラフィは未装飾のまま表示されていた。

**今回の方針決定（確定事項）**:
- まず`@tailwindcss/typography`の配線を修正し、既存の`prose`指定が実際に機能する状態に戻す（バグ修正）。
- その上で、見た目の方向性はQiita風（見出しに細い下線、インラインコードは薄いグレー背景＋角丸、コードブロックは既存のシンタックスハイライトを維持）を採用する（ユーザーへの選択肢提示の結果）。
- 対象は`MarkdownRenderer`を利用する全画面（学習資料モーダル、レッスン本文表示）。コンポーネント自体の呼び出し方は変更しない。

---

## ユーザーストーリー

### US-1: `@tailwindcss/typography`を正しく有効化する
> As a 開発者 / I want to Tailwind v4環境で`prose`クラスが意図通りにスタイルを生成する状態にしたい / So that 今後`prose`関連のクラスを追加・調整した際に確実に反映される。

受け入れ条件:
- [x] `frontend/src/app/globals.css`に`@plugin "@tailwindcss/typography";`を追加する
- [x] `frontend/src/app/globals.css`に`@config "../../tailwind.config.ts";`を追加し、`tailwind.config.ts`のテーマ拡張（US-2）を読み込む
- [x] `tailwind.config.ts`から重複登録となる`plugins: [typography]`を削除する（プラグイン登録は`@plugin`ディレクティブ側に一本化）
- [x] コンパイル後のCSSに`--tw-prose-*`変数および`prose`関連のセレクタが出力されることを確認する

### US-2: 見出し・インラインコードをQiita風に装飾する
> As a 受講生 / I want to 学習資料・レッスン本文の見出しやインラインコードが視覚的に区別しやすい見た目になってほしい / So that 長文の資料でも構造や強調箇所を把握しやすくなる。

受け入れ条件:
- [x] `h1`・`h2`に下線（`border-bottom`）が付く（ライト: `slate-200`、ダーク: `slate-700`）
- [x] インラインコード（`` `code` ``）に背景色・角丸・パディングが付く（ライト: `slate-100`背景+`slate-800`文字、ダーク: `slate-800`背景+`slate-200`文字）
- [x] コードブロック（```` ``` ````）内の`<code>`は上記の背景色装飾の対象外とし、既存の`rehype-highlight`によるシンタックスハイライト（`github-dark`テーマ）の見た目を変えない
- [x] インラインコードのデフォルトのバッククォート表示（`` `code` ``のような疑似要素）は、背景色装飾と重複するため非表示にする

---

## ギャップ分析（既存コードとの乖離）

| 領域 | 現状（修正前） | 本要件での変更 |
|------|------|----------------|
| `frontend/src/app/globals.css` | `@import "tailwindcss";`のみ。プラグイン登録なし | `@plugin`・`@config`ディレクティブを追加（US-1） |
| `frontend/tailwind.config.ts` | `plugins: [typography]`（v4では無効）、テーマ拡張なし | プラグイン登録を削除し、`theme.extend.typography`でCSSカスタマイズを追加（US-1, US-2） |
| `MarkdownRenderer.tsx` | `prose prose-neutral dark:prose-invert max-w-none`を指定しているが、プラグイン未配線のためスタイル未反映 | コンポーネント自体は変更なし。土台の`prose`が機能する状態にする（US-1） |
| 学習資料モーダル・レッスン本文の見た目 | 見出し・インラインコードとも無装飾（ブラウザデフォルト相当） | Qiita風の下線・背景色装飾が適用される（US-2） |

---

## 検証

- [x] `docker compose exec node npm run lint` がパスすることを確認
- [x] `docker compose exec node npm run build` の型チェック相当が今回の変更に起因するエラーを出さないことを確認（`/admin/admins`のプリレンダリングエラーは本変更と無関係な既存の別問題であることを、変更を一時退避した状態でも同じエラーが再現することで確認済み）
- [x] コンパイル後のCSS（`_next/static/css/app/layout.css`）を直接取得し、`--tw-prose-*`変数・`h1, h2`の`border-bottom`・インラインコードの`background-color`・`pre code`のリセットが出力されていることを確認
- [ ] ブラウザでの目視確認（本環境にはchromium-cli等のブラウザ操作ツールがなく未実施。次回、環境が整い次第または手動で確認する）

---

## スコープ外（今回やらない）

- 見出し（h3以降）・リスト・テーブル・引用（blockquote）など、`prose`デフォルトスタイルで概ね許容範囲のその他要素の追加カスタマイズ
- コードブロックへの言語名バッジ表示など、Qiita的なコードブロック自体の追加装飾（今回はインラインコードと見出しの2点に限定）
- ダークモード切り替えUIの追加（`dark:prose-invert`は既存のCSSメディアクエリ相当の仕組みに準拠するのみ）
