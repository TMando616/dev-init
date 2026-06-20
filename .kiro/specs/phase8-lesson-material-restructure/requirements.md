# 要件定義: Phase 8 - 学習資料のレッスン紐づけとコンテンツ階層の再整理

## 概要

**目的**: 現状は「学習資料（material）がカテゴリに紐づく」構造になっているが、これを「学習資料がレッスンに紐づく」構造に変更する。カリキュラムの意味論として「レッスンに付随する参考資料がある」というモデルの方が自然なため、データモデルをその実態に合わせる。

**背景・課題**:
- `materials.category_id` という現構造では、「あるレッスンの参考資料」を取得するために `categories.materials` という迂回が必要。Phase 7 でも `lesson.categories.flatMap(c => c.materials)` という不自然な導出が残った。
- 管理者がレッスンを登録する際にカテゴリ選択が任意になっており、カテゴリなしのレッスンが混入できる。
- 管理者のレッスン一覧にカテゴリが表示されないため、どのレッスンがどこに属するか一覧では把握できない。
- 管理者のカテゴリ一覧から「そのカテゴリのレッスン」が確認できない。

**今回の方針決定（確定事項）**:
- `materials` テーブルの `category_id` を `lesson_id` に変更（マイグレーションで対応）。
- カテゴリ↔レッスンの多対多（`category_lesson` pivot）はそのまま維持する。カテゴリ選択を「1件以上必須」に強化する。
- 登録の推奨フロー: **カテゴリ登録 → レッスン登録（カテゴリ必須）→ 学習資料登録（レッスン必須）**。

---

## ユーザーストーリー

### 管理者向け

**US-1: レッスン一覧でカテゴリを確認する**
> As a 管理者 / I want to レッスン一覧画面で各レッスンがどのカテゴリに属するかを確認したい / So that コンテンツの整理状況を一目で把握できる。

受け入れ条件:
- [ ] 管理ダッシュボード（`/admin`）のレッスン一覧テーブルに「カテゴリ」列が追加されている
- [ ] 各レッスン行に、紐づいているカテゴリ名がタグ形式で表示される
- [ ] カテゴリ未設定のレッスンは「—」または空欄で表示される（移行期の救済）

**US-2: レッスン登録時にカテゴリ選択を必須にする**
> As a 管理者 / I want to レッスンを作成・編集する際にカテゴリを必ず1件以上選択したい / So that カテゴリ未分類のレッスンが混入するのを防げる。

受け入れ条件:
- [ ] レッスン作成・編集フォームでカテゴリが1件も選択されていない場合、保存できない（バリデーションエラー）
- [ ] フロントエンドでも「1件以上選択してください」のインラインエラーを表示する
- [ ] バックエンドの `LessonService` / バリデーションルールで `category_ids` を `required|array|min:1` に更新する

**US-3: 学習資料をレッスンに紐づけて登録する**
> As a 管理者 / I want to 学習資料を登録する際に「どのレッスンの参考資料か」を必ず指定したい / So that 資料とレッスンの関係が明確になる。

受け入れ条件:
- [ ] 学習資料の作成・編集フォームに「カテゴリ」選択の代わりに「レッスン」選択が表示される
- [ ] レッスン選択は必須（未選択での保存を拒否する）
- [ ] バックエンドで `materials.lesson_id` が `required|exists:lessons,id` でバリデートされる
- [ ] 学習資料一覧テーブルの「カテゴリ」列が「レッスン」列に変わり、紐づくレッスンタイトルが表示される

**US-4: カテゴリ一覧から配下のレッスンを確認する**
> As a 管理者 / I want to カテゴリ一覧画面で各カテゴリに何件のレッスンが紐づいているかを確認したい / So that カリキュラム構成をカテゴリ単位で把握できる。

受け入れ条件:
- [ ] 管理カテゴリ一覧（`/admin/categories`）に「レッスン数」列が追加される
- [ ] レッスン数の数字をクリックまたはカテゴリ名クリックで、そのカテゴリに属するレッスン一覧が表示される（同ページ内の展開 or 別ページ — 設計フェーズで決定）

### ユーザー（生徒）向け

**US-5: 演習ページで参考資料をシンプルに参照する**
> As a 生徒 / I want to 演習中に「このレッスンの参考資料」を直接参照したい / So that カテゴリ経由の迂回なく関連資料を読める。

受け入れ条件:
- [ ] 演習ページ（`/lessons/{id}`）の参考資料セクションが `lesson.categories.flatMap(c => c.materials)` ではなく `lesson.materials` を使用する
- [ ] バックエンド `GET /lessons/{id}` のレスポンスに `materials` が直接含まれる
- [ ] 動作は Phase 7 時と同じ（カードクリックでモーダル表示）

**US-6: カテゴリ詳細ページでレッスン一覧を確認する（ユーザー画面）**
> As a 生徒 / I want to カテゴリを選んだときにそのカテゴリのレッスン一覧が表示されたい / So that 「何を学ぶか」をカテゴリ起点で選べる。

受け入れ条件:
- [ ] ユーザー画面のカテゴリ詳細ページ（`/categories/{id}`）が、そのカテゴリに属するレッスン一覧を表示する（現状の実装を確認・必要に応じて修正）
- [ ] 各レッスンカードをクリックすると演習ページへ遷移する

---

## データモデル変更

### `materials` テーブル（変更）

| カラム | 変更内容 |
|--------|----------|
| `category_id` | 削除 |
| `lesson_id` | 新規追加（`foreignId`, `constrained`, `cascadeOnDelete`） |
| `order` | 維持（レッスン内での表示順） |
| インデックス | `(category_id, order, id)` → `(lesson_id, order, id)` に変更 |

### `lessons` テーブル / `category_lesson` pivot（変更なし）

- 多対多のまま維持する
- `category_ids` バリデーションを `min:1` に強化するのみ

### APIレスポンスの変化

**`GET /lessons/{id}`（変更あり）**:
```json
{
  "id": 1,
  "title": "変数を使ってみよう",
  "categories": [...],
  "materials": [
    { "id": 1, "title": "変数と型", "content": "..." },
    { "id": 2, "title": "関数の基礎", "content": "..." }
  ]
}
```
`categories.materials` のネストがなくなり、`lesson.materials` でフラットに取得できる。

**`GET /materials`（変更あり）**:
レスポンスの各要素が `category` の代わりに `lesson: { id, title }` を返す。

**`POST|PUT /admin/materials`（変更あり）**:
`category_id` → `lesson_id` に変更。

---

## ギャップ分析（既存コードとの乖離）

| 領域 | 現状 | 本要件での変更 |
|------|------|----------------|
| DB | `materials.category_id` | `materials.lesson_id` に変更（マイグレーション） |
| Model | `Material` belongsTo `Category`; `Category` hasMany `Material` | `Material` belongsTo `Lesson`; `Lesson` hasMany `Material` |
| Repository | `MaterialRepository` が `category_id` で絞り込み・ソート | `lesson_id` ベースに変更 |
| `LessonRepository::find()` | `categories.materials` eager load | `materials` を直接 eager load |
| バリデーション | `category_ids`: 任意 / `category_id`(material): nullable | `category_ids`: `min:1` / `lesson_id`(material): required |
| 管理UI (lesson list) | カテゴリ列なし | カテゴリタグ列を追加 |
| 管理UI (material editor) | カテゴリ選択ドロップダウン | レッスン選択ドロップダウンに変更（必須） |
| 管理UI (material list) | 「カテゴリ」列 | 「レッスン」列に変更 |
| 管理UI (category list) | レッスン数・紐づき情報なし | レッスン数列を追加 |
| フロント (exercise page) | `lesson.categories.flatMap(c => c.materials)` | `lesson.materials` に簡略化 |
| フロント (categories/{id}) | 現状確認が必要 | レッスン一覧表示を保証 |

---

## スコープ外（今回やらない）

- 学習資料の複数レッスンへの紐づけ（many-to-many）。1資料:1レッスンの単純な FK で十分。
- カテゴリ↔レッスンを1対多に変更すること（pivot 維持）。
- 管理カテゴリ画面の完全なドリルダウンページ新設（レッスン数の表示のみ。詳細リストは設計フェーズで判断）。
- 既存資料の `category_id` データの保全（シーダーで再投入できるため、マイグレーションは up のみ対応）。
