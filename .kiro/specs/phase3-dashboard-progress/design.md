# Design: Phase 3 - Dashboard, Progress & Categories

## 1. データベース設計

### 1.1 `categories` テーブル (新規)
- `id`: Primary Key
- `name`: string (カテゴリ名, 必須)
- `description`: text (説明, 任意)
- `timestamps`

### 1.2 `lessons` テーブル (変更)
- 追加: `category_id`: foreignId (categories テーブルへの外部キー, 必須)
- *マイグレーション戦略*: 既存のレッスンがある場合、デフォルトカテゴリ（例："Uncategorized"）を作成し、そこに紐付ける。

### 1.3 進捗管理 (`submissions` テーブルの活用)
既存の `submissions` テーブルの `status` カラムを使用して進捗を管理する。
- `status = 'saved'`: 学習中（コードを保存した状態）
- `status = 'completed'`: 完了（ユーザーが完了ボタンを押した状態）

## 2. API エンドポイント

### 2.1 Category API (管理者専用)
- `GET /api/categories`: 一覧取得
- `POST /api/categories`: 作成
- `PUT /api/categories/{id}`: 更新
- `DELETE /api/categories/{id}`: 削除

### 2.2 Lesson API (変更)
- `GET /api/lessons`: レスポンスに `category` オブジェクトを含める。
- `POST/PUT /api/lessons`: リクエストパラメータに `category_id` を追加。

### 2.3 Dashboard API (新規)
- `GET /api/dashboard`: ユーザーのダッシュボード用データを返す。
  - レスポンス例:
    ```json
    {
      "overall_progress": {
        "completed": 5,
        "total": 20,
        "percentage": 25
      },
      "category_progress": [
        {
          "category_id": 1,
          "name": "JavaScript基礎",
          "completed": 3,
          "total": 5
        }
      ],
      "recent_lesson": {
        "id": 2,
        "title": "変数の使い方",
        "last_accessed": "2026-05-08T12:00:00Z"
      }
    }
    ```

## 3. フロントエンド (UI)

### 3.1 管理者画面
- サイドバーに「カテゴリ管理」を追加。
- カテゴリの CRUD 画面を作成。
- レッスン作成/編集フォームにカテゴリ選択のプルダウンを追加。

### 3.2 ユーザーダッシュボード (`/`)
- ログイン直後のトップページをダッシュボードに変更。
- 全体進捗率を円グラフ等で表示。
- カテゴリごとの進捗バーを表示し、クリックでそのカテゴリのレッスン一覧へ遷移。
- 「学習を再開する」ボタン（直近のレッスンへ遷移）。

### 3.3 演習画面 (`/lessons/[id]`)
- ヘッダーに「完了にする」ボタンを追加。
- 既に完了している場合は「完了済み」バッジを表示。
