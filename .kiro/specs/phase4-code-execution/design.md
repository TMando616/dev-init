# Design: Phase 4 - Multi-Language Code Execution

## 1. System Architecture
既存のバックエンド（Laravel）がホストの Docker デーモンを操作し、安全な隔離環境内でコードを実行する「DooD (Docker out of Docker)」アーキテクチャを採用します。

### 1.1 Execution Flow
1. **Frontend**: ユーザーが「実行」ボタンをクリックし、エディタ内のコードと指定言語を `POST /api/execute` に送信する。
2. **Backend (Laravel)**:
   - リクエストを受信し、一時ファイルとしてコードを保存する。
   - ホストのDockerソケット (`/var/run/docker.sock`) を利用して、言語ごとのDockerコンテナを起動するコマンドを生成・実行する。
3. **Docker Container**:
   - 一時ファイルを読み取り専用でマウントし、指定された言語のランタイムで実行する。
   - メモリ制限、ネットワーク切断、タイムアウト処理を適用する。
4. **Backend**: 実行結果（標準出力・標準エラー出力）を取得し、一時ファイルを削除する。
5. **Frontend**: 結果を受け取り、コンソールUIに表示する。

### 1.2 Execution Environments (Docker Images)
各言語ごとに公式の Alpine イメージを使用し、軽量かつ高速な起動を実現します。
- **PHP**: `php:8.4-cli-alpine`
- **Python**: `python:3.12-alpine`
- **JavaScript**: `node:22-alpine`
- **Ruby**: `ruby:3.3-alpine`
- **Java**: `amazoncorretto:21-alpine`

## 2. API Design
**`POST /api/execute`**
```json
// Request
{
  "language": "python",
  "code": "print('Hello World')"
}

// Response
{
  "status": "success", // "success", "error", "timeout"
  "stdout": "Hello World\n",
  "stderr": "",
  "execution_time_ms": 150
}
```

## 3. Database Changes
- `lessons` テーブルに `language` カラム (string, nullable) を追加。デフォルトは `php` または null。

## 4. Frontend Design
- **Admin**: レッスン作成・編集画面に「言語選択」プルダウンを追加。
- **User**: 演習画面の下部に実行結果を表示する黒背景の「コンソールエリア」と「実行ボタン」を配置。選択言語に合わせて Monaco Editor のシンタックスハイライトを切り替える。

## 5. Security & Limitations
- **タイムアウト**: Laravel 側でプロセスを 3秒で強制終了。
- **Docker 制限**:
  - `--network none` (外部通信遮断)
  - `--memory="128m"` (過剰なメモリ消費を防止)
  - `--read-only` (ファイルシステムの改ざん防止)
