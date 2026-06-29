# DevInit

プログラミング初学者向けのブラウザ完結型コード演習プラットフォーム。環境構築なしで、ブラウザ上でコードを書いて実行できる。

## 対応言語

PHP 8.4 / Python 3.12 / JavaScript (Node 22) / Ruby 3.3 / Java

## 技術スタック

| 領域 | 技術 |
|------|------|
| フロントエンド | Next.js 16 / React 19 / TypeScript / Tailwind CSS |
| バックエンド | Laravel 13 / PHP 8.3+ |
| データベース | PostgreSQL 16 |
| 認証 | Laravel Sanctum (Bearer token) |
| コード実行 | Docker-in-Docker（各言語コンテナで隔離実行） |
| インフラ | Docker Compose / nginx |

## セットアップ

### 前提条件

- Docker Desktop（または Docker Engine + Docker Compose）
- Git

### 手順

```bash
# 1. リポジトリをクローン
git clone https://github.com/mandokoro/dev-init.git
cd dev-init

# 2. 環境変数ファイルを作成
cp .env.example .env

# 3. コンテナをビルド・起動
docker compose up -d --build

# 4. DB マイグレーションとシードを実行
docker compose exec php php artisan migrate:fresh --seed
```

起動後、http://localhost でアクセスできる。

### デフォルトの接続情報

| 項目 | 値 |
|------|-----|
| アプリ URL | http://localhost |
| フロントエンド開発サーバー | http://localhost:3000 |
| PostgreSQL（ホストから接続） | localhost:5432 |
| DB 名 / ユーザー / パスワード | devinit / user / password |

`.env` で `APP_PORT`・`DB_DATABASE`・`DB_USERNAME`・`DB_PASSWORD` を変更できる。

## 主要コマンド

```bash
# コンテナ起動 / 停止
docker compose up -d
docker compose down

# バックエンドテスト
docker compose exec php php artisan test

# フロントエンド lint / ビルド
docker compose exec node npm run lint
docker compose exec node npm run build

# DB リセット（シード込み）
docker compose exec php php artisan migrate:fresh --seed
```

## アーキテクチャ

```
ブラウザ
  └─ nginx (:80)
       ├─ /api/* → php-fpm (Laravel)
       │              └─ コード実行: Docker ソケット経由で言語コンテナを起動
       └─ /*    → node (Next.js)
```

バックエンドは `Controller → Service → Repository` の一方向依存で構成。コード実行はホストの Docker ソケットをマウントし、各言語の Alpine イメージをコンテナとして起動・即破棄する（`--network none` / `--memory 128m` / 5秒タイムアウトで隔離）。

## 画面構成

- `/login` `/register` — 学習者の認証
- `/lessons` — レッスン一覧・詳細
- `/categories` — カテゴリ一覧
- `/materials` — 学習資料の閲覧・コード演習
- `/admin/*` — 管理者画面（教材・ユーザー管理）
