# 技術設計: Phase 17 - 本番環境への初回デプロイ

## 設計方針の要点

- **既存のdocker composeモデルをできるだけ崩さない**。イメージにコードを焼き込む方式（CI/CDビルド）ではなく、**VM上のgit checkoutをbind-mountする現行の開発フローをそのまま踏襲**する。差分は「開発用コマンド（`next dev`）→本番用コマンド（`next build && next start`）」「Mailpit→Resend」「ポート80直接公開→Caddy経由のTLS終端」の3点に絞る。理由: 新しい失敗パターン（イメージビルドパイプライン、レジストリ管理）を持ち込まず、ロールバックも `git checkout` + `docker compose restart` で完結させたいため。
- **`docker-compose.prod.yml` は既存の `docker-compose.yml` への上書き（override）ではなく、独立した完結ファイルとして新設する**。Mailpitの除外・Caddyの追加・複数サービスのcommand変更など差分が大きく、部分マージだと可読性が落ちるため。
- **TLS終端はCaddy 1台に集約し、nginxの役割は変えない**。既存の `docker/nginx/default.conf`（`/`→node, `/api`→php-fpm）はそのまま使い、Caddyをその手前に置いて自動HTTPS化のみを担わせる。nginx設定を触らないことで、開発環境で検証済みのルーティング挙動を本番でも保証する。
- **ドメインは取得せず `sslip.io` を使う**。VMのグローバルIPをそのままホスト名に埋め込める（例: `140-238-10-20.sslip.io` は `140.238.10.20` を指す）ため、DNS登録なしで実在ホスト名としてLet's Encrypt証明書を発行できる。
- **秘密情報は全てVM上にのみ存在させる**。リポジトリの `.gitignore` は既に `.env` / `.env.*` を除外済み（backendは `.env.production` も明示除外済み）なので、本番用の値をそのままVM上のファイルとして作成すればよい。

---

## 1. インフラ構成

### 1.1 VM

| 項目 | 値 |
|---|---|
| プロバイダ | Oracle Cloud Infrastructure（OCI） |
| シェイプ | VM.Standard.A1.Flex（Always Free Ampere ARM） |
| スペック | 4 OCPU / 24GB RAM（Always Freeの上限をフル割り当て。無料枠内で最大の余裕を持たせる） |
| OS | Ubuntu 22.04 LTS（ARM64） |
| ブートボリューム | 100GB（Always Free上限200GBの範囲内） |
| リージョン/AD | 作成時に空き容量のあるものを選ぶ（Always Free ARMは在庫切れで作成できないことがあるため、必要なら別ADやリージョンで再試行） |

### 1.2 ネットワーク

```
Internet
   │  :80 (ACME challenge + リダイレクト), :443 (HTTPS)
   ▼
[Caddy]  ── 自動でLet's Encrypt証明書を取得・更新
   │  :80 (docker内部ネットワークのみ)
   ▼
[nginx]  ── 既存のdefault.confそのまま
   ├── /        → [node]  :3000  (Next.js本番サーバー)
   └── /api,*.php → [php] :9000  (PHP-FPM)
                        │
                        ├─ [db] :5432 (PostgreSQL、ボリューム永続化)
                        └─ docker.sock 経由で `docker run` によるコード実行
                            （言語ごとの使い捨てコンテナ、--network none）

外部SMTP: Resend（メール送信のみ、アプリからのアウトバウンド接続）
```

**OCI固有の注意（見落としやすい）**: OCIは「クラウド側のセキュリティリスト/NSG」と「VMのOS内ファイアウォール（Ubuntuの `iptables`/`ufw`）」の**二重の壁**がある。80/443を通すには両方に穴を開ける必要がある。片方だけ開けて「繋がらない」と詰まるのが典型的な失敗パターンなので、tasks.mdで両方を明示する。

---

## 2. Docker構成（`docker-compose.prod.yml`）

新規ファイル。既存の `docker-compose.yml` とは独立させる（1章の方針参照）。

### 2.1 サービス一覧

| サービス | イメージ/Dockerfile | 役割 | 公開ポート |
|---|---|---|---|
| `caddy` | `caddy:2-alpine` | TLS終端・自動証明書更新・リバースプロキシ | 80, 443 → ホスト |
| `nginx` | 既存 `nginx:alpine` + `docker/nginx/default.conf`（変更なし） | ルーティング（`/`→node, `/api`→php） | 非公開（docker内部ネットワークのみ） |
| `node` | 新規 `docker/node/Dockerfile.prod` | Next.js本番サーバー | 非公開 |
| `php` | 既存 `docker/php/Dockerfile`（変更なし） | Laravel（php-fpm）+ コード実行の起点 | 非公開 |
| `db` | `postgres:16-alpine`（変更なし） | PostgreSQL | 非公開（デバッグ時のみ一時的にSSHトンネルで接続） |
| `scheduler` | 既存 `docker/php/Dockerfile`（変更なし） | `php artisan schedule:work`（`users:purge-deleted` の日次実行） | 非公開 |

Mailpitは含めない（開発専用のため）。`scheduler` は開発用composeでは誤操作防止のため `profiles` でopt-in扱いだが、本番では退会済みアカウントの保持期限超過パージ（`ACCOUNT_RETENTION_DAYS`）が実際に必要な機能のため、**常時起動サービスとして含める**。

### 2.2 Caddy

```
# docker/caddy/Caddyfile
{$SITE_ADDRESS} {
    reverse_proxy nginx:80
}
```

`SITE_ADDRESS` はルートの `.env`（後述）で `140-238-10-20.sslip.io` のように渡す。Caddyは起動時にこのアドレス宛のACME HTTP-01チャレンジを自動処理し、証明書を取得・自動更新する（追加のcertbot設定は不要）。証明書データは名前付きボリューム `caddy_data` で永続化し、コンテナ再作成のたびに再発行されてLet's Encryptのレート制限に触れるのを防ぐ。

### 2.3 nginx

`docker/nginx/default.conf` は無変更。`docker-compose.prod.yml` 側でホストへの `ports:` 公開をやめ、Caddyからの内部リバースプロキシのみを受け付ける。

### 2.4 php

`docker/php/Dockerfile` は無変更（`docker-cli` 同梱・entrypointのsocket GID自動検出は本番でもそのまま有効）。`docker-compose.prod.yml` でも開発と同様に `./backend:/var/www/backend` をbind-mountし、`/var/run/docker.sock` と `DOCKER_HOST_PATH` を渡す。

**追加の運用手順（イメージ変更ではなくデプロイ時の手作業）**:
- 初回・依存追加時: `docker compose -f docker-compose.prod.yml exec php composer install --no-dev --optimize-autoloader`
- デプロイのたびに: `docker compose -f docker-compose.prod.yml exec php php artisan migrate --force`
- `docker compose -f docker-compose.prod.yml exec php php artisan config:cache route:cache` は**行わない**方針とする。理由: config/routeキャッシュは`.env`の値をコンパイル時に固定するため、bind-mount運用でVM上の`.env`を直接編集する今回の運用（4章）と相性が悪く、キャッシュの消し忘れで「.envを直したのに反映されない」事故を誘発しやすい。個人開発規模のトラフィックであればキャッシュ無しの性能差は無視できるため、シンプルさを優先する。

### 2.5 node（新規: `docker/node/Dockerfile.prod`）

```dockerfile
FROM node:20-slim

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .

EXPOSE 3000

CMD ["sh", "-c", "rm -rf .next && npm run build && npx next start -H 0.0.0.0"]
```

**`.next` はビルド前に必ず削除する**。phase16で、Next.jsのビルドキャッシュ（`.next`）が実体のないmiddleware（`proxy.ts`相当）をコンパイル済みのまま残し続け、公開パス判定が効かず本番導線を壊しかけた実例を踏まえた対応（`.kiro/specs/phase16-admin-account-management/design.md` §13）。フルビルドのたびにキャッシュを無効化するコストより、staleなビルド成果物による事故を防ぐことを優先する。

既存の `docker/node/Dockerfile`（開発用、`next dev`）とは別ファイルにする。理由: 開発用Dockerfileを本番仕様に書き換えると開発体験（ホットリロード等）が壊れるため。

`docker-compose.prod.yml` 側で開発と同様に `./frontend:/app/frontend` をbind-mountし、匿名ボリュームで `node_modules` を隠す（`- /app/frontend/node_modules`）。**コンテナ起動のたびに `npm run build` を実行してから起動する**設計にすることで、「ビルドし忘れて古いバンドルが動き続ける」事故を防ぐ（個人開発規模のトラフィックでは再起動頻度が低く、ビルド時間（1〜2分程度）のコストは許容できる）。

**`NEXT_PUBLIC_API_URL` の扱いに注意**: Next.jsは `NEXT_PUBLIC_*` 環境変数をビルド時にクライアントバンドルへ埋め込む。実行時に環境変数を変えても反映されない。そのため `frontend/.env.production`（4.2節）に本番URLを書いておき、`npm run build` 実行時（＝コンテナ起動時）に毎回読み込ませる。sslip.ioのホスト名はVMのIPが決まった時点で確定するため、**VMのIPが分かってから最初のビルドを行う**（tasks.mdで順序を明示）。

### 2.6 db

既存の `postgres:16-alpine` のまま。`db-data` 名前付きボリュームで永続化（既存と同じ仕組み）。認証情報は本番用の値をルート `.env` に設定する（4.3節）。

---

## 3. 環境変数・シークレット設計

すべてVM上にのみ作成し、Gitには一切コミットしない（`.gitignore` で既に除外済みのパスに配置するだけでよい）。

### 3.1 `backend/.env`（本番用の実体。ローカルの `.env.example` をベースに作成）

`.env.example` からの差分のみ記載する。

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<sslip.ioホスト名>
APP_KEY=                      # `php artisan key:generate` で本番用に新規生成する（開発用と共用しない）

FRONTEND_URL=https://<sslip.ioホスト名>

DB_HOST=db
DB_DATABASE=devinit
DB_USERNAME=<本番用ユーザー名>       # user/password の既定値から変更する
DB_PASSWORD=<本番用の強固なパスワード>

LOG_LEVEL=error                # debugではなくerrorに絞る

# Resend SMTP
MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<ResendのAPIキー>
MAIL_FROM_ADDRESS=<Resendで検証済みの送信元アドレス>
MAIL_FROM_NAME="DevInit"
```

### 3.2 `frontend/.env.production`（新規作成。Next.jsが `NODE_ENV=production` 時に自動読込）

```env
NEXT_PUBLIC_API_URL=https://<sslip.ioホスト名>/api
```

### 3.3 ルート `.env`（`docker-compose.prod.yml` の変数展開用。既存の開発用ルート `.env` とは別物として扱う）

```env
DB_DATABASE=devinit
DB_USERNAME=<本番用ユーザー名>
DB_PASSWORD=<本番用の強固なパスワード>   # backend/.env と同じ値に揃える

SITE_ADDRESS=<sslip.ioホスト名>          # 例: 140-238-10-20.sslip.io
ACME_EMAIL=<証明書失効通知を受け取るメールアドレス>
```

`DB_USERNAME` / `DB_PASSWORD` はルートの `.env`（db起動時の初期化に使う）と `backend/.env`（アプリの接続に使う）の**両方**に同じ値を置く必要がある（既存の開発環境と同じ構造）。

---

## 4. TLS/ドメイン設計

- `sslip.io` はDNSを持たず、ホスト名自体にIPアドレスを埋め込んで解決する無料サービス（例: `140-238-10-20.sslip.io` → `140.238.10.20`）。何の登録も不要で、VMのグローバルIPさえ分かればその場で使える。
- Caddyの `Caddyfile` に `{$SITE_ADDRESS}` としてこのホスト名を渡すと、Caddyが自動でLet's Encryptから証明書を取得する（HTTP-01チャレンジのため、外部から80番ポートに到達できる必要がある＝1.2節のファイアウォール設定が前提）。
- 将来的に独自ドメインへ切り替える場合は、DNSのAレコードをVMのIPに向けたうえで `SITE_ADDRESS` を差し替えるだけでよい（Caddy・アプリ側の変更は最小限）。

---

## 5. バックアップ設計

### 5.1 スクリプト（新規: `scripts/backup-db.sh`、VM上に配置。リポジトリにも雛形をコミットする）

```bash
#!/bin/sh
set -eu
cd "$(dirname "$0")/.."

# docker compose自体は./.envを自動で読むが、このスクリプト内で$DB_USERNAME等を
# そのまま使うにはシェル側にも明示的に読み込む必要がある。
set -a
. ./.env
set +a

BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"
STAMP=$(date +%Y%m%d-%H%M%S)
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "$DB_USERNAME" "$DB_DATABASE" | gzip > "$BACKUP_DIR/devinit-${STAMP}.sql.gz"

# 直近14世代のみ残す
ls -1t "$BACKUP_DIR"/devinit-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm --
```

### 5.2 スケジューリング

VM上のcrontab（コンテナ内ではなくホスト側）で日次実行する。

```
0 4 * * * /opt/dev-init/scripts/backup-db.sh >> /var/log/devinit-backup.log 2>&1
```

### 5.3 保存先・保持期間

- 一次保存先: VMのローカルディスク（`./backups/`）、直近14世代のみ保持
- 個人情報を含むため、VM外への二次保存（Oracle Object Storageの無料枠10GB等）は**任意**とし、本フェーズでは必須にしない（対象外セクション参照）。導入する場合は保持期間・アクセス権をrequirements.mdの個人情報注記に沿って設計し直す。

### 5.4 リストア手順

```bash
gunzip -c backups/devinit-<timestamp>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U "$DB_USERNAME" "$DB_DATABASE"
```

初回デプロイ後、実際に一度ダミーデータでバックアップ→リストアを検証する（tasks.mdに手順を含める）。

---

## 6. 初期管理者アカウントの作成

開発用シーダー（`AdminSeeder`等、存在すれば固定パスワードの可能性がある）は本番でそのまま `db:seed` しない。`php artisan tinker` で直接作成する（phase16の手動確認で使った手順と同じ）。

```bash
docker compose -f docker-compose.prod.yml exec php php artisan tinker --execute="
App\Models\Admin::create(['name' => '<氏名>', 'email' => '<本番メール>', 'password' => Hash::make('<強固な初期パスワード>')]);
"
```

作成後、本番の `/admin/login` からログインし、`/admin/settings` で初期パスワードを変更する（phase16で実装済みの機能をそのまま初回運用手順として使う）。

---

## 7. デプロイ手順の設計

### 7.1 初回デプロイ

1. OCI上にVMを作成（1章）、SSH接続を確認
2. Ubuntu上にDocker Engine + Docker Compose pluginをインストール
3. OCI側セキュリティリスト/NSGで80/443を開放し、UbuntuのUFW/iptablesでも同様に開放
4. VMのグローバルIPを確認し、`SITE_ADDRESS`（sslip.ioホスト名）を確定
5. `git clone` でリポジトリをVMに取得（`/opt/dev-init` 等）
6. 3章の各 `.env` ファイルをVM上に作成（`APP_KEY` はこの時点で生成）
7. `docker compose -f docker-compose.prod.yml up -d --build`
8. `composer install`（2.4節）、`php artisan migrate --force`
9. 6章の手順で初期管理者を作成
10. ブラウザで `https://<SITE_ADDRESS>` にアクセスし、証明書エラーなく表示されることを確認
11. コード実行（複数言語）・パスワードリセットメール（Resend経由）が実際に動くことを確認
12. `scripts/backup-db.sh` の手動実行とリストア検証（5.4節）
13. crontabにバックアップジョブを登録

### 7.2 更新デプロイ（2回目以降）

```bash
cd /opt/dev-init
git pull
docker compose -f docker-compose.prod.yml exec php composer install --no-dev --optimize-autoloader   # 依存追加時のみ
docker compose -f docker-compose.prod.yml exec php php artisan migrate --force                        # マイグレーション追加時のみ
docker compose -f docker-compose.prod.yml restart node   # フロント変更を反映（起動時に毎回ビルドする設計のため）
docker compose -f docker-compose.prod.yml restart php nginx  # バックエンド変更を反映（bind-mountなのでコード自体は即反映、キャッシュ系は使っていないためrestartのみで十分）
```

### 7.3 再起動時の自動復旧

`docker-compose.prod.yml` の全サービスに `restart: unless-stopped` を設定する。加えて、Docker Engine自体をVM起動時に自動起動させる（`systemctl enable docker`。Ubuntu 22.04の公式インストール手順に従えば既定で有効になる）。

---

## 8. ヘルスチェック・ログ確認

```bash
docker compose -f docker-compose.prod.yml ps                 # 全サービスの起動状態
docker compose -f docker-compose.prod.yml logs -f --tail=100 # 直近ログ
docker compose -f docker-compose.prod.yml logs -f php        # サービス個別
curl -I https://<SITE_ADDRESS>                                # 200/301等が返るか
```

---

## 9. 既知のリスク・対象外（requirements.mdからの再掲含む）

| 項目 | 内容 |
|---|---|
| OCI Always Free ARMインスタンスの在庫切れ | 作成時に「Out of capacity」で失敗することがある。ADやリージョンを変えて再試行が必要な場合がある |
| Docker Hub匿名pullのレート制限 | 開発時の検証で実際に遭遇済み（6時間あたりの制限）。VMからのpullは通常問題にならないが、頻繁な `docker compose build` を繰り返すと引っかかる可能性がある |
| Node起動のたびにビルドする設計 | 個人開発規模のトラフィックでは許容できるが、アクセスが増えてきたら「ビルド済みイメージを都度焼く」方式へ見直す余地がある（対象外） |
| 監視・アラート、CI/CD、ステージング環境 | requirements.md記載の通り本フェーズの対象外 |
| バックアップの外部（VM外）保存 | 任意。本フェーズはVMローカル保存のみを必須とする |
