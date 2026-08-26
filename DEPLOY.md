# 本番デプロイ手順（Oracle Cloud Always Free）

設計の背景・判断理由は `.kiro/specs/phase17-production-deployment/design.md` を参照。
このファイルは「実行するコマンド」だけに絞ったランブック。

---

## 0. 前提

- OCI Always Free の Ampere A1インスタンス（Ubuntu 22.04 ARM64）が作成済み、SSH接続できる
- VMのグローバルIPが分かっている（以下 `<VM_IP>` = 例 `140.238.10.20`）
- OCI側のセキュリティリスト/NSGと、VM内のUFWの**両方**で 80/443 を開放済み

```bash
# VM内での確認例
sudo ufw allow 80,443/tcp
sudo ufw status
```

---

## 1. Docker Engineのインストール（VM上、初回のみ）

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo systemctl enable docker
# ここで一度ログインしなおす（dockerグループ反映のため）
```

---

## 2. リポジトリの取得

```bash
sudo mkdir -p /opt/dev-init && sudo chown $USER:$USER /opt/dev-init
git clone https://github.com/TMando616/dev-init.git /opt/dev-init
cd /opt/dev-init
```

---

## 3. SITE_ADDRESS の確定

```bash
# <VM_IP> のドットをハイフンに置き換えるだけ
echo "<VM_IPのドットをハイフンに置換>.sslip.io"
# 例: 140.238.10.20 -> 140-238-10-20.sslip.io
```

以降、このホスト名を `<SITE_ADDRESS>` と表記する。

---

## 4. `.env` ファイルの作成（3ファイル、VM上にのみ作成しGitにコミットしない）

### 4-1. ルート `.env`

```bash
cat > /opt/dev-init/.env <<'EOF'
DB_DATABASE=devinit
DB_USERNAME=<本番用ユーザー名>
DB_PASSWORD=<本番用の強固なパスワード>
SITE_ADDRESS=<SITE_ADDRESS>
ACME_EMAIL=<証明書失効通知を受け取るメールアドレス>
EOF
```

### 4-2. `backend/.env`

`backend/.env.example` をコピーしてから、以下の値を上書きする。

```bash
cp backend/.env.example backend/.env
```

`backend/.env` を編集し、以下を反映（他はexample通りでよい）:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://<SITE_ADDRESS>
FRONTEND_URL=https://<SITE_ADDRESS>

DB_DATABASE=devinit
DB_USERNAME=<本番用ユーザー名>      # ルート.envと同じ値
DB_PASSWORD=<本番用の強固なパスワード> # ルート.envと同じ値

LOG_LEVEL=error

MAIL_MAILER=smtp
MAIL_SCHEME=null
MAIL_HOST=smtp.resend.com
MAIL_PORT=587
MAIL_USERNAME=resend
MAIL_PASSWORD=<ResendのAPIキー>
MAIL_FROM_ADDRESS=<Resendで検証済みの送信元アドレス>
MAIL_FROM_NAME="DevInit"
```

`APP_KEY` はこのあとコンテナ起動後に生成する（4-4参照）。

### 4-3. `frontend/.env.production`

```bash
cat > /opt/dev-init/frontend/.env.production <<EOF
NEXT_PUBLIC_API_URL=https://<SITE_ADDRESS>/api
EOF
```

### 4-4. APP_KEY の生成

コンテナ起動（次章）が終わってから実行する。

```bash
docker compose -f docker-compose.prod.yml exec php php artisan key:generate
```

---

## 5. 初回起動

```bash
cd /opt/dev-init
docker compose -f docker-compose.prod.yml up -d --build
```

数分待ってから状態確認:

```bash
docker compose -f docker-compose.prod.yml ps
```

全サービスが `running`/`Up` になっていること。

`APP_KEY` を未生成の場合はここで4-4を実行してから、php/nginxを再起動:

```bash
docker compose -f docker-compose.prod.yml restart php nginx
```

---

## 6. 依存関係・マイグレーション

```bash
docker compose -f docker-compose.prod.yml exec php composer install --no-dev --optimize-autoloader
docker compose -f docker-compose.prod.yml exec php php artisan migrate --force
```

---

## 7. 初期管理者アカウントの作成

```bash
docker compose -f docker-compose.prod.yml exec php php artisan tinker --execute="
App\Models\Admin::create(['name' => '<氏名>', 'email' => '<本番メール>', 'password' => Hash::make('<強固な初期パスワード>')]);
"
```

`https://<SITE_ADDRESS>/admin/login` からログインし、`/admin/settings` で初期パスワードを変更する。

---

## 8. 動作確認

```bash
curl -I https://<SITE_ADDRESS>
```

- ブラウザで `https://<SITE_ADDRESS>` にアクセスし証明書エラーが出ないこと
- 受講生登録・ログインができること
- コード実行（PHP/Python/JavaScript/Ruby/Javaのうち最低限1件ずつ）が成功すること
- 管理者のパスワードリセット（`/admin/forgot-password`）で、Resend経由の実メールが届くこと

---

## 9. バックアップ

```bash
# 手動実行して疎通確認
./scripts/backup-db.sh
ls -la backups/

# リストア確認（初回のみ、動作検証として）
gunzip -c backups/devinit-<timestamp>.sql.gz | \
  docker compose -f docker-compose.prod.yml exec -T db psql -U "$DB_USERNAME" "$DB_DATABASE"
```

crontabへの登録:

```bash
crontab -e
# 以下を追加
0 4 * * * /opt/dev-init/scripts/backup-db.sh >> /var/log/devinit-backup.log 2>&1
```

---

## 更新デプロイ（2回目以降）

```bash
cd /opt/dev-init
git pull

# 依存追加時のみ
docker compose -f docker-compose.prod.yml exec php composer install --no-dev --optimize-autoloader

# マイグレーション追加時のみ
docker compose -f docker-compose.prod.yml exec php php artisan migrate --force

# フロント変更を反映（起動のたびに rm -rf .next && npm run build する設計）
docker compose -f docker-compose.prod.yml restart node

# バックエンド変更を反映（bind-mountなので即反映。configキャッシュは使っていないためrestartのみで十分）
docker compose -f docker-compose.prod.yml restart php nginx

# Dockerfile自体やpackage.json/composer.jsonの依存が変わった場合のみ
docker compose -f docker-compose.prod.yml up -d --build
```

---

## トラブルシューティング

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100        # 全体ログ
docker compose -f docker-compose.prod.yml logs -f caddy              # 証明書取得に失敗する場合はまずここ
docker compose -f docker-compose.prod.yml logs -f php                # 500エラー等
docker compose -f docker-compose.prod.yml exec php php artisan tinker # DB接続確認等
```

- **証明書が取得できない**: 80番ポートが外部から到達できているか確認（OCIセキュリティリスト・UFWの両方）。`curl -I http://<SITE_ADDRESS>` が到達すればHTTP-01チャレンジも通るはず。
- **フロントのビルドが失敗する**: `NEXT_PUBLIC_API_URL` が `frontend/.env.production` に正しく設定されているか確認。
- **コード実行が失敗する**: `docker compose -f docker-compose.prod.yml exec php docker ps` でphpコンテナからdocker.sockに到達できているか確認。
