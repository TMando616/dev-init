# Phase 14: バリデーション契約の整備とAPIハードニング

## 概要

Obsidian の「Laravel API プロジェクト 監査チェックリスト」に基づく監査（2026-07-26 実施）で見つかった重大項目のうち、次の3つを対象とする。

| チェックリスト番号 | 内容 |
|------------------|------|
| 04-1 / 04-2 / 04-3 | 全書き込み系エンドポイントの FormRequest 化（`language` 握り潰しバグの修正を含む） |
| 02-7 / 20-4 | レート制限の適用 |
| 07-2 / 07-3 | 模範解答（`model_answer`）が学生のペイロードに常時含まれる問題の解消 |

対象ユーザーは受講生・管理者の両方。ユーザーに見える機能追加ではなく、既存機能の正しさと堅牢性を上げる回である。

## 前提: 監査で実証済みの事実

要件の根拠として、監査時に実APIで確認した挙動を記録する。

- `POST /api/admin/lessons` に `{"language":"ruby"}` を送っても、作成されたレッスンの `language` は `NULL` になる（レスポンスに `language` キー自体が現れない）
- `language` が `NULL` のレッスンは、実行ボタンが送る `{"language":null}` に対し `/api/execute` が **422 `The language field is required.`** を返す → **実行が一切できない**
- 同レッスンはダッシュボードの言語別セクションに `{"language":"", "completed":0, "total":1}` として現れ、**名前も画像もないカード**が描画される
- 誤ったパスワードで `/api/login` に10回連続リクエストしても、全て 422 が返り 429 は発生しない
- 学生トークンで `GET /api/lessons/1` を叩くと、レスポンスに `model_answer` が含まれる（`"console.log('Hello, World!');"`）

---

## ユーザーストーリー

### US-1: 管理画面で設定した言語が保存される

> As a 管理者 / I want レッスン作成・編集画面で選んだ言語が正しく保存されてほしい / So that 作成したレッスンを受講生が実行でき、言語別の表示（Phase 13 で導入）も正しく機能する。

受け入れ条件:
- [x] `POST /admin/lessons` と `PUT /admin/lessons/{id}` が `language` を受け付け、DBに保存する
- [x] `language` は対応5言語（`php` / `python` / `javascript` / `ruby` / `java`）のみを許可し、それ以外は 422 で拒否する
- [x] `language` は新規作成時は必須とする（`NULL` のレッスンを新たに作れないようにする）
- [ ] 管理画面から作成したレッスンが、受講生側で実行できる（`/execute` が 422 にならない） ← 手動確認待ち
- [ ] 管理画面から作成したレッスンが、レッスン一覧で言語サムネイル付きで表示される ← 手動確認待ち
- [x] 上記を検証する回帰テストを追加する（「送った `language` が保存されて返ってくる」ことをアサートする）

### US-2: バリデーションが FormRequest に集約される

> As a 開発者 / I want 書き込み系エンドポイントのバリデーション規則が FormRequest に集約されてほしい / So that US-1 のような「規則の書き漏れで入力が黙って消える」事故を構造的に防げる。

対象エンドポイント（全15件。ボディを持たない DELETE は対象外）:

| # | エンドポイント | 現在の規則の場所 |
|---|--------------|----------------|
| 1 | `POST /register` | `AuthController::register` |
| 2 | `POST /login` | `AuthController::login` |
| 3 | `POST /admin/login` | `AdminAuthController::login` |
| 4 | `POST /execute` | `ExecutionController::__invoke` |
| 5 | `POST /submissions` | `SubmissionController::store` |
| 6 | `POST /submissions/complete` | `SubmissionController::complete` |
| 7 | `POST /admin/admins` | `Admin\AdminController::store` |
| 8 | `POST /admin/users` | `Admin\UserController::store` |
| 9 | `PUT /admin/users/{id}` | `Admin\UserController::update` |
| 10 | `POST /admin/lessons` | `LessonController::store` |
| 11 | `PUT /admin/lessons/{id}` | `LessonController::update` |
| 12 | `POST /admin/categories` | `CategoryController::store` |
| 13 | `PUT /admin/categories/{id}` | `CategoryController::update` |
| 14 | `POST /admin/materials` | `MaterialController::store` |
| 15 | `PUT /admin/materials/{id}` | `MaterialController::update` |

受け入れ条件:
- [x] 上記15件すべてが FormRequest クラスを持ち、Controller から `$request->validate([...])` の直書きが消える
- [x] 各 FormRequest の `authorize()` に明示的な判断を書く（ルート側の `auth:` ミドルウェアで担保済みの場合は `true` を返す理由をコメントで残し、素通りとの区別をつける）
- [x] バリデーション失敗時のレスポンスが 422＋既存と同じ JSON 構造（`message` / `errors`）を保つ
- [x] 既存の全テスト（57件）が通り続ける
- [x] `/execute` の `language` を対応5言語に限定する（現状は `required|string` で何でも通り、Service 側で弾いている）
- [x] 更新系の `required` / `sometimes` の不整合を洗い出して揃える
  - 例: `PUT /admin/lessons/{id}` は `title`/`content` が `sometimes` なのに `category_ids` は `required`
  - 例: `PUT /admin/materials/{id}` は `title`/`content` が `sometimes` なのに `lesson_id` は `required`
  - どちらに揃えるかは設計フェーズで決定する

### US-3: 認証とコード実行にレート制限がかかる

> As a サービス運営者 / I want ログイン試行とコード実行に回数制限をかけたい / So that ブルートフォース攻撃とコンテナ起動によるリソース枯渇を防げる。

受け入れ条件:
- [x] `POST /login` / `POST /admin/login` / `POST /register` にレート制限を適用する（推奨値: 6回/分。キーは IP＋メールアドレスの組）
- [x] `POST /execute` にレート制限を適用する（推奨値: 20回/分・ユーザー単位。1リクエストがDockerコンテナ1つと最大5秒を消費するため）
- [x] その他の認証済みAPIに既定のレート制限を適用する（推奨値: 60回/分・ユーザー単位）
- [x] **【重要】受講生のエディタは2秒デバウンスで `POST /submissions` に自動保存するため、この自動保存が制限に掛からない閾値にする**（入力と停止を繰り返すと理論上30回/分に達しうる）
- [x] 制限超過時のレスポンスが 429＋JSON で、`Retry-After` ヘッダを含む
- [x] 制限が効くことと、正常利用が阻害されないことをテストで検証する

### US-4: 模範解答が学生のペイロードに含まれない

> As a 受講生 / I want 模範解答が「見る」を押すまで手元に来ないでほしい / So that 演習に取り組む前に答えが目に入らず、学習として成立する。

現状 `GET /lessons` と `GET /lessons/{id}` は Eloquent モデルをそのまま返しており、`model_answer` が常にペイロードに含まれる。UI のトグルは表示を切り替えているだけで、DevTools からは最初から読める。

受け入れ条件:
- [x] 受講生向けの `GET /lessons` / `GET /lessons/{id}` のレスポンスから `model_answer` を除外する
- [x] 管理者は同じエンドポイントで従来どおり `model_answer` を取得できる（管理画面の編集フォームが `GET /lessons/{id}` を使っているため）
- [x] 受講生が「模範解答を見る」を押したときに、専用エンドポイントから `model_answer` を取得して表示する
- [x] レスポンス整形に `JsonResource` を導入し、公開フィールドを明示する（07-1 / 07-2）
- [x] `expected_output` は今回は据え置く（理由は「スコープ外」参照）
- [x] 受講生のレスポンスに `model_answer` が含まれないことをテストで検証する

**注記**: これはセキュリティ境界ではない。専用エンドポイントを叩けば受講生も模範解答を取得できるが、それは「見る」ボタンを押すのと同じ意図的な行為であり、既存のUX意図と一致する。目的は「意図せず目に入る／取れてしまう」状態の解消である。

---

## スコープ外（今回やらない）

- **`expected_output` の隠蔽と正誤判定のサーバー移設**: 現在の判定はクライアント側で `expected_output` と比較している（`(student)/lessons/[id]/page.tsx:165-167`）。これを隠すには判定を `/execute` 側へ移す必要があり、実行APIの契約変更を伴うため別フェーズとする
- Policy / Gate の導入（チェックリスト 06。現状 submissions は `$request->user()->id` スコープ、管理系は `auth:admin` で守られており実害がないため）
- 依存パッケージの脆弱性対応（チェックリスト 01-2。`composer audit` で22件・high 3件。独立して実施可能なため別枠）
- ページネーション導入（21-2）、OpenAPI（25-1）、PHPStan 導入（24-2）
- `submissions` の unique 制約追加（10-3）
- フロントエンドのテスト整備

## ギャップ分析（既存コードとの乖離）

| 領域 | 現状 | 本要件での変更 |
|------|------|----------------|
| `LessonController::store/update` | 規則に `language` が無く、送信値が黙って捨てられる | FormRequest 化し `language` を `Rule::in()` 付きで受け付ける（US-1, US-2） |
| 書き込み系15エンドポイント | 全て Controller 内に `$request->validate([...])` を直書き | FormRequest クラスに集約（US-2） |
| `ExecutionController` | `language` が `required|string`。不正値は Service が文字列で弾く | FormRequest で対応5言語に限定（US-2） |
| `app/Http/Requests/` | ディレクトリ自体が存在しない | 新規作成（US-2） |
| レート制限 | `bootstrap/app.php` の `withMiddleware` が空。`throttle` の指定がどこにも無い | 認証系・実行系・既定の3系統を定義（US-3） |
| `LessonRepository::all()/find()` | `Lesson` モデルを無加工で返却（`model_answer` 含む） | `JsonResource` を導入し、ガードに応じて出し分け（US-4） |
| `app/Http/Resources/` | ディレクトリ自体が存在しない | 新規作成（US-4） |
| 管理画面のレッスン編集 | 学生と共通の `GET /lessons/{id}` から `model_answer` を取得 | 管理者ガードでは従来どおり返す（US-4） |
| 受講生の模範解答トグル | ページ読み込み時のペイロードに含まれる値を出し分けているだけ | 押下時に専用エンドポイントから取得（US-4） |

---

**承認済み**: 設計（`design.md`）・タスク分解（`tasks.md`）へ進み、実装済み。未チェックの2項目はブラウザでの手動確認待ち。
