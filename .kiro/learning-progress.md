# DevInit コードベース理解セッション 進捗

> mandokoro が VibeCoding で作った DevInit を「自分の言葉で説明できる」状態にするための学習セッションの進捗管理ファイル。`/clear` 後はこのファイルを読んで続きから再開する。

## セッションの目的・進め方

- **ゴール**: DevInit に対してどんな質問が来ても答えられる状態になる（面接対策も兼ねる）。
- **方式**: Claude が1モジュールずつ「何のため・どう動く・どこにあるか」を構造立てて説明 → ユーザーが実コードを VSCode で見ながら質問 → 納得したら次へ。**上から下（全体像→レイヤー詳細→機能ごと）**の順。
- **重要な参考資料**: `/dev/atama-interview-prep/dev-init_技術解説.md`（面接対策として既に「何を・なぜ」を整理済み。これを骨格に使い、実コード確認と自問チェックで補強する）。
- **ユーザーの前提レベル**: Docker と Web のリクエスト/レスポンスは「何となく」理解。細かい内部は要丁寧説明。初心者目線・前提の用語から噛み砕く説明が刺さる。理解度を「100点満点で何点」と聞いてくる傾向あり。
- **学習記録**: 各 Step 完了ごとに Obsidian `02_アウトプット` に記事原稿を作成する（ユーザー希望）。

## ロードマップ

| 回 | テーマ | 実コードで確認するもの | 状態 |
|---|---|---|---|
| 1 | 全体構成・インフラ | docker-compose.yml / nginx default.conf / php Dockerfile / entrypoint.sh | ✅ 完了 |
| 2 | バックエンド レイヤード構成 | LessonController / LessonService / LessonRepository | ✅ 完了 |
| 3 | 認証（Sanctum） | AuthController / AdminMiddleware / AuthContext / api.ts | ✅ 完了 |
| 4 | コード実行エンジン（核心） | CodeExecutionService.php / codeRunner.ts | ✅ 完了 |
| 5 | DB設計 | マイグレーションファイル群 | ✅ 完了 |
| 6 | フロントエンド | ルーティング / MarkdownRenderer / Monaco Editor | ✅ 完了 |
| 7 | テスト・CI | CodeExecutionTest / ci.yml | ✅ 完了 |
| 8 | 現在の課題と改善案 | 自問チェック総仕上げ | ⬜ 次回ここから |

## Step1 で扱った内容（完了）

インフラ全般を網羅。詳細は Obsidian `02_アウトプット/DevInit インフラ・Docker構成を初心者目線で理解する.md` に記事化済み。カバー範囲:
- Docker基礎（イメージ vs コンテナ、料理の例え）
- Dockerfile と docker-compose.yml の役割分担
- なぜ nginx が入口か（CORS回避・リバースプロキシ）
- ポートマッピング 8080:80 の意味、ports: は外部公開専用
- php のポートが 9000 と分かる理由（php-fpm デフォルト、EXPOSE）
- nginx default.conf の location 振り分け、/api の try_files 2段階（フロントコントローラ）
- コンテナ間の内部ネットワーク（自動生成、サービス名で名前解決）
- volumes（ホスト⇔コンテナ同期、named volume）
- DooD と docker.sock（コード実行の核心）
- Linux の www-data / dockerグループ / 権限、entrypoint.sh の GID 動的検出
- DOCKER_HOST_PATH のパスズレ吸収
- 主要 docker コマンド、リクエストの旅まとめ

## Step2 で扱った内容（完了）

レイヤード構成を網羅。詳細は Obsidian `02_アウトプット/DevInit バックエンドのレイヤード構成を初心者目線で理解する.md` に記事化済み。カバー範囲:
- なぜ3層に分けるか（変更理由ごとに分離＝単一責任）、依存は一方通行・下は上を知らない
- Controller = HTTP 通訳（validate→Service→JSON、(int)$id の型境界、201/204/404 の使い分け）
- Service = 業務手順（find→update→fresh、`?Lesson` で「無い可能性」を型表明、fresh と refresh の違い）
- Repository = Eloquent 封じ込め（with() の eager load と N+1、unset の理由）
- 多対多と中間テーブル `category_lesson`、`sync()` =「最終形に揃える」（attach/detach との対比、更新画面と相性が良い理由）→ ユーザーがここを重点的に確認し納得
- DI はしている / DIP はしていない（具象依存、interface・bind 無し）、DIP 導入4ステップ、MVP 段階では意図的に未導入という判断、「レイヤードは古い？」への返し

## Step3 で扱った内容（完了）

認証（Laravel Sanctum）を網羅。詳細は Obsidian `02_アウトプット/DevInit 認証（Laravel Sanctum）を初心者目線で理解する.md` に記事化済み。カバー範囲:
- ログインの流れ①〜⑦（Hash::check、ユーザー列挙対策、createToken は HasApiTokens トレイト由来）
- トークンの正体（オペーク文字列、personal_access_tokens に SHA-256 保存＝ステートフル）
- JWT との違い（署名検証ステートレス vs DB照合ステートフル、即時失効）→ **JWT 内部の深掘りは保留**（メモリ jwt-followup に記録、現時点はステートレス判断でOK）
- logout＝DB行削除で即失効、401（未認証）と 403（権限不足）の違い
- ルート保護2段（auth:sanctum / admin の入れ子）、Bearer＝持参人（RFC6750）
- ミドルウェア名の登録場所: auth は組み込み、**sanctum ガードは config/auth.php に無く Sanctum の ServiceProvider が自動登録**（前回の誤説明を訂正済み）、admin は bootstrap/app.php で自分が登録
- **Breeze ≠ 常にSanctum**（API スタック選択時のみ Sanctum、訂正済み）
- **Laravel 11+ で Kernel.php → bootstrap/app.php に移行したが移行は任意**。Laravel12 でも Kernel.php 継続使用は問題なし（ユーザーの現場が Kernel.php 継続のため重点確認）
- 弱点: localStorage の XSS リスク、改善は httpOnly Cookie

## Step4 で扱った内容（完了）

コード実行エンジンを網羅。詳細は Obsidian `02_アウトプット/DevInit コード実行エンジンを初心者目線で理解する.md` に記事化済み。カバー範囲:
- 性悪説の多層防御（--network none / --memory 128m / --read-only+:ro / 5秒タイムアウト / --rm 使い捨て が各々防ぐ攻撃）
- ExecutionController は __invoke の単一アクションコントローラ（メソッド名固定、PHP の __invoke マジックメソッド由来）
- DOCKER_HOST_PATH は .env でなく **docker-compose.yml の environment** で指定（${PWD}でホスト実パス）、env() はプロセス環境変数を読む
- new Process は **Symfony Process コンポーネント**（汎用コマンド実行、Docker専用ではない）
- タイムアウト孤児化の罠（SIGKILLだと--rm不発→先にdocker kill→自然終了で--rm発火、docker killにもタイムアウト）
- **重要発見: iframe（codeRunner.ts）はデッドコード**。全言語が /execute 経由で Docker に一本化（判定をサーバーに寄せるため）。→ phase6 にクリーンアップ項目を追記済み
- 実行環境の選択肢（直接実行/言語サンドボックス/Docker/microVM/マネージドJudge0）、DinD vs DooD（DevInitはDooD、DinDは--privilegedで危険）、Theia はエディタ基盤で別レイヤー
- Monaco Editor（VS Code のエディタ部品、@monaco-editor/react、value/onChange の制御コンポーネントで code state と一致）→ Step6 の先取り

## Step5 で扱った内容（完了）

DB設計を網羅。詳細は Obsidian `02_アウトプット/DevInit DB設計を初心者目線で理解する.md` に記事化済み。カバー範囲:
- マイグレーション＝設計図のコード管理、up/down、ファイル名日時＝設計の歴史
- 各テーブル（users.role、submissions の foreignId/constrained/cascadeOnDelete・status、materials の order）
- **1:N → N:N の設計変更の物語**（5/15 category_id追加 → 5/16 中間テーブル作成＋旧列削除）、category_lesson の複合主キー＝重複防止、Step2 の sync() と接続
- **複合インデックス (category_id, order, id)**：絞り込み列→並び替え列の順で効く（電話帳の比喩）、列順が逆だと効かない
- constrained() は**糖衣構文**（シンタックスシュガー＝同じことを短く書く簡略記法）の概念を別途解説
- パフォーマンス改善: 一覧APIで content 列除外（必要な列だけ取る）

## Step6 で扱った内容（完了）

フロントエンドを網羅。詳細は Obsidian `02_アウトプット/DevInit フロントエンド（Next.js）を初心者目線で理解する.md` に記事化済み。カバー範囲:
- App Router（Next.js 13導入、旧Pages Router、フォルダ＝URL、[id]動的セグメント）
- フック概念（React16.8、関数で状態を持てる）、関数 vs クラスコンポーネント（this の複雑さ解消）
- Server/Client Component（「JSを送るか」の違い）、**本プロジェクトのServerは layout.tsx と ui/index.tsx の2つだけ**、ほぼClient
- **なぜClientだらけか＝SPA+API分離＋localStorage認証(Step3)の連鎖**。モノリス/Cookie認証ならServer活用可（重要な気づき）
- layout の入れ子（AuthProvider→MainLayout→children）、MainLayoutの出し分け
- useState（再描画）/useEffect（依存配列＝watchリスト、引数ではない）/onClick（addEventListener相当の宣言的記法）
- Next.js 16 で params が Promise化→use()で解く
- 状態管理: Context API（採用）vs Redux（過剰で未導入）、prop drilling回避
- MarkdownRenderer: サニタイズを最後に＝セキュリティ境界は出口、className許可スキーマ
- 型: interface（オブジェクトの形）vs type（ユニオン等）

## Step7 で扱った内容（完了）

テスト・CIを網羅。詳細は Obsidian `02_アウトプット/DevInit テスト・CIを初心者目線で理解する.md` に記事化済み。カバー範囲:
- Feature/Unit は phpunit.xml で**ディレクトリ＝種類**（命名は規約）、DevInit は実質全部 Feature（結合）
- 結合テストの層（E2E=Playwright / API結合=DevInit / Unit）、他言語も同型（pytest/JUnit/Jest）
- PHPUnit 基本（TestCase継承、test_メソッド、AAA=GWT、actingAs/postJson/assertJson）
- SQLite :memory:（通常はファイルDBだがインメモリモード）、利点/代償、BCRYPT_ROUNDS=4
- **RefreshDatabase はマイグレーション1回＋トランザクション巻き戻し**で軽い（毎回作り直しではない）、setUp はユーザー生成担当
- ファクトリ＋Faker（Factory パターン、state() で admin/unverified バリエーション）
- 異常系テスト（timeout/unsupported）で性悪説の防御を検証
- カバレッジは目標でなく道具（100%狙わない理由3つ）、リスクベース＋回帰テスト
- GitHub Actions 構造（on/jobs/runs-on/steps/uses/run）、flake対策（pull≠run、ウォームアップ）
- npm（ci=再現install、dev=watch、build=本番最適化）、**ci.yml の ci(継続的インテグレーション) と npm ci(clean install) は別物の同名**

## Step8 開始時の最初のアクション（最終回・総仕上げ）

現在の課題と改善案。参考資料 §10「正直に言える現在の課題リスト」を骨格に、Step1〜7 で出てきた**正直ポイント・改善余地**を総ざらいして「自己認識アピール」として語れる形に整理する。主な論点:
- localStorage 認証の XSS リスク → httpOnly Cookie（Step3）
- DI のみで DIP 未導入 → interface 化（Step2、意図的判断）
- iframe デッドコード → 削除（Step4、phase6 に記載済み）
- ほぼ Client Component → モノリス/Cookie 認証なら Server 活用（Step6）
- SQLite と本番 PostgreSQL の差異（Step7）
- role 兼用 → admins 分離（phase6 進行中）
- レイヤード is 伝統的 への返し、Redux/DIP 未導入＝オーバーエンジニアリング回避の判断
**Step1〜8 の自問チェックを通しで確認**し、面接で詰まりやすい所（Sanctum vs JWT、タイムアウト孤児化、サニタイズ順序、flake対策）を総点検する。これが学習セッションの締め。完了後ロードマップ全✅。
