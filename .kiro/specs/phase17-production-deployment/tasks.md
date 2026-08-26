# 実装タスク: Phase 17 - 本番環境への初回デプロイ

design.md の章番号を各タスクに併記する。原則としてタスク1つ完了ごとにコミットする。
各タスクの担当（🤖 = リポジトリ内で完結、私が今すぐ実装できる／🧑 = OCIコンソール操作やVMへのSSH等、ユーザー側の実施が必要）を明記する。

**推奨順序**: 1（リポジトリ側の本番構成ファイル）→ 2（ローカルでの検証）→ 3（VM作成・下準備）→ 4（初回デプロイ）→ 5（動作確認・バックアップ運用）→ 6（ランブック整備・クローズ）。

---

## 1. リポジトリ側の本番構成ファイル作成 🤖

- [x] 1-1. `docker-compose.prod.yml` を新規作成
  - caddy / nginx / node / php / db / scheduler の6サービス（design.md §2.1）
  - Mailpitは含めない。schedulerはdevと違い常時起動（`profiles`は付けない）
  - caddy: `caddy:2-alpine`、80/443をホスト公開、`SITE_ADDRESS`/`ACME_EMAIL`をルート`.env`から注入、`caddy_data`ボリュームで証明書永続化
  - nginx: 既存イメージ・設定のまま、ホストへの`ports:`公開はしない
  - node: `docker/node/Dockerfile.prod`を指定、`./frontend`をbind-mount、`node_modules`は匿名ボリュームで隠す
  - php: 既存`docker/php/Dockerfile`のまま、`./backend`・docker.sock・`DOCKER_HOST_PATH`をdevと同様に設定
  - db: `postgres:16-alpine`、`db-data`ボリューム、ルート`.env`の本番用認証情報を使用
  - 全サービスに `restart: unless-stopped` を設定
  - 参照: design.md §2, §7.3

- [x] 1-2. `docker/node/Dockerfile.prod` を新規作成
  - `npm ci` → ビルドは起動時（`npm run build && npx next start -H 0.0.0.0`）
  - 参照: design.md §2.5

- [x] 1-3. `docker/caddy/Caddyfile` を新規作成
  - `{$SITE_ADDRESS} { reverse_proxy nginx:80 }`
  - 参照: design.md §2.2

- [x] 1-4. `scripts/backup-db.sh` を新規作成
  - `pg_dump`→gzip、直近14世代のみ保持
  - 実行権限（`chmod +x`）を付与してコミット
  - 参照: design.md §5.1

- [x] 1-5. `DEPLOY.md`（リポジトリ直下）を新規作成
  - design.md §3（各`.env`の中身テンプレート）・§7（初回/更新デプロイ手順）・§8（ヘルスチェック）を、実行可能なコマンド列として再構成したランブック
  - 秘密の実値は書かず、`<...>` のプレースホルダのみ
  - 参照: design.md 全体

---

## 2. ローカルでの検証 🤖

- [x] 2-1. `docker compose -f docker-compose.prod.yml config` で構文エラーがないことを確認
  - 参照: design.md §2

- [x] 2-2. `docker/node/Dockerfile.prod` のビルドをローカルで試す
  - `docker build -f docker/node/Dockerfile.prod -t devinit-node-prod-test .` が成功することを確認
  - ダミーの`NEXT_PUBLIC_API_URL`で`npm run build`相当が通ることを確認（コンテナ起動まではローカルでは行わない。API不在のため）
  - 参照: design.md §2.5

- [x] 2-3. `docker/caddy/Caddyfile` の構文を検証
  - `docker run --rm -v $(pwd)/docker/caddy/Caddyfile:/etc/caddy/Caddyfile caddy:2-alpine caddy validate --config /etc/caddy/Caddyfile` 等で構文チェック
  - 参照: design.md §2.2

- [x] 2-4. `scripts/backup-db.sh` をシェルスクリプトとしてレビュー（`sh -n` で構文チェック）
  - 参照: design.md §5.1

---

## 3. VM作成・下準備 🧑（ユーザー実施。完了後にVMのグローバルIPを教えてもらう）

- [ ] 3-1. OCIアカウント作成・Always Free Ampere A1インスタンス作成
  - シェイプ: VM.Standard.A1.Flex、4 OCPU/24GB RAM、Ubuntu 22.04 ARM64、ブートボリューム100GB
  - SSHキーペアを作成し、秘密鍵を保存
  - 参照: design.md §1.1

- [ ] 3-2. SSH接続確認
  - `ssh -i <秘密鍵> ubuntu@<VMのグローバルIP>`
  - 参照: design.md §1.2

- [ ] 3-3. Docker Engine + Compose pluginをインストール
  - Ubuntu公式手順（`get.docker.com`スクリプト、または`apt`でのdocker-ce導入）に従う
  - `sudo systemctl enable docker` で自動起動を有効化
  - 参照: design.md §7.3

- [ ] 3-4. ファイアウォールで80/443を開放（**二重に必要**）
  - OCIコンソール → VCN → セキュリティリスト（またはNSG）でIngress 80/443を追加
  - VM内 `sudo ufw allow 80,443/tcp`（または`iptables`で同等の設定）
  - 参照: design.md §1.2「OCI固有の注意」

---

## 4. 初回デプロイ 🧑（一部は私がSSH経由で代行可能。設計・コマンドはDEPLOY.mdに従う）

- [ ] 4-1. VMのグローバルIPから`SITE_ADDRESS`（sslip.ioホスト名）を確定
  - 例: IPが `140.238.10.20` なら `140-238-10-20.sslip.io`
  - 参照: design.md §4

- [ ] 4-2. リポジトリをVMに`git clone`
  - 参照: design.md §7.1 手順5

- [ ] 4-3. 各`.env`をVM上に作成
  - `backend/.env`（`APP_KEY`をこの時点で生成）・`frontend/.env.production`・ルート`.env`
  - DB認証情報はルート`.env`と`backend/.env`で一致させる
  - Resendでアカウント作成・APIキー発行・送信元アドレス検証を済ませ、`MAIL_*`に反映
  - 参照: design.md §3

- [ ] 4-4. `docker compose -f docker-compose.prod.yml up -d --build`
  - 参照: design.md §7.1 手順7

- [ ] 4-5. `composer install --no-dev --optimize-autoloader` と `php artisan migrate --force` を実行
  - 参照: design.md §2.4, §7.1 手順8

- [ ] 4-6. 初期管理者アカウントを作成
  - `php artisan tinker`で直接作成 → 本番`/admin/login`でログイン確認 → `/admin/settings`で初期パスワードを変更
  - 参照: design.md §6

---

## 5. 動作確認・バックアップ運用 🧑

- [ ] 5-1. HTTPSアクセス確認
  - `https://<SITE_ADDRESS>` にブラウザでアクセスし証明書エラーが出ないこと
  - `curl -I https://<SITE_ADDRESS>` で200/301等が返ること
  - 参照: design.md §8

- [ ] 5-2. 主要機能の動作確認
  - 受講生登録・ログイン・コード実行（PHP/Python/JavaScript/Ruby/Javaの最低限1件ずつ）
  - 管理者のパスワードリセット（Resend経由で実際にメールが届くこと）
  - 参照: requirements.md US-1, US-2

- [ ] 5-3. バックアップの手動実行とリストア検証
  - `scripts/backup-db.sh` を手動実行 → 生成された`.sql.gz`から別DBまたは同DBへリストアできることを確認
  - 参照: design.md §5.4

- [ ] 5-4. crontabにバックアップジョブを登録
  - 参照: design.md §5.2

---

## 6. ランブック整備・クローズ

- [ ] 6-1. `requirements.md` の受け入れ条件チェックボックスを埋める
- [ ] 6-2. `design.md` §「実装時に判明した設計との差分」（節を追記）を記録する
- [ ] 6-3. `DEPLOY.md` に実際にハマった点（もしあれば）を追記し、次回の更新デプロイ担当者（未来の自分）が迷わないようにする
