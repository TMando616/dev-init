# Tasks: Phase 4 - Multi-Language Code Execution

## 1. Infrastructure & Database
- [x] 1.1 `docker-compose.yml` の修正: Laravelコンテナへの `/var/run/docker.sock` のマウント設定追加
- [x] 1.2 `lessons` テーブルへの `language` カラム追加（マイグレーション）
- [x] 1.3 `Lesson` モデルおよびファクトリの更新

## 2. Backend Implementation (Code Execution)
- [x] 2.1 `CodeExecutionService` の作成: Dockerコマンドの生成、プロセス実行、タイムアウト処理の実装
- [x] 2.2 `ExecutionController` の作成: `POST /api/execute` エンドポイントの実装
- [x] 2.3 各言語（PHP, Python, JS, Ruby, Java）의 実行確認テスト（フィーチャーテスト）の実装
- [x] 2.4 セキュリティ制限（ネットワーク遮断、メモリ制限）の動作検証

## 3. Admin UI Extension (Frontend)
- [x] 3.1 レッスン作成・編集画面への「言語選択」プルダウンの追加
- [x] 3.2 カテゴリ管理と並行して言語情報も保存・取得できるように API 連携を修正
- [x] 3.3 各言語に応じた Monaco Editor のデフォルトテンプレート（初期コード）の設定

## 4. User Exercise UI (Frontend)
- [x] 4.1 演習画面へのコンソール領域（黒背景）の追加
- [x] 4.2 「実行」ボタンの追加と `POST /api/execute` への通信処理実装
- [x] 4.3 実行中状態（Loading）、成功、エラー表示の UI 実装
- [x] 4.4 選択言語に応じたシンタックスハイライトの動的切り替え

## 5. Verification & Cleanup
- [x] 5.1 全 5 言語が実際にブラウザから実行できることの最終確認
- [x] 5.2 CI での Lint/Test パスの確認
- [x] 5.3 ドキュメントの更新

## 6. UI/UX Improvements (Dashboard & Sidebar)
- [x] 6.1 ダッシュボードヘッダーの管理ボタン（カテゴリ・ユーザー等）を削除
- [x] 6.2 サイドバーに「カテゴリ管理」「ユーザー管理」「新規レッスン作成」のリンク・ボタンを集約
- [x] 6.3 管理者用ナビゲーション全体のレイアウト調整
