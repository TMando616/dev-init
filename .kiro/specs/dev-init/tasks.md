# Implementation Plan: dev-init (MVP Phase)

## 1. Foundation: プロジェクト基盤の構築
このフェーズでは、フロントエンドとバックエンドのベースプロジェクトを作成し、共通の構成を設定します。

- [x] 1.1 バックエンド（Laravel）の初期化
  - `laravel new backend` によるプロジェクト作成
  - データベース接続（SQLite/PostgreSQL）の設定
  - `php artisan test` が正常に動作することを確認
  - _Requirements: 4.1, 4.4_

- [x] 1.2 フロントエンド（Next.js）の初期化
  - `npx create-next-app@latest frontend` による TypeScript/App Router プロジェクト作成
  - Tailwind CSS, ESLint, Prettier の初期設定
  - `npm run dev` で初期画面が表示されることを確認
  - _Requirements: 4.2_

- [x] 1.3 Docker開発環境の構築
  - `docker-compose.yml` の作成（frontend, backend, db, nginx）
  - 各サービス用 `Dockerfile` の作成
  - 共通 `.env` ファイルの設定
  - `docker-compose up` で全サービスが正常に起動することを確認
  - _Requirements: 4.1_

- [x] 1.4 データベーススキーマの定義とマイグレーション
  - `users`, `lessons`, `submissions` テーブルの作成
  - 権限（Role）管理用カラムの追加
  - シーダーによる初期サンプルデータの投入
  - _Requirements: 2.1, 3.1_

- [x] 1.5 CI環境（GitHub Actions）の構築
  - `.github/workflows/ci.yml` の作成
  - フロントエンドの Lint/Build ジョブ設定
  - バックエンドの Lint/Test ジョブ設定
  - プルリクエスト時の自動実行確認
  - _Requirements: 4.1_


## 2. Core: バックエンドAPIの構築
認証およびレッスン管理、コード保存のAPIを実装します。

- [x] 2.1 ユーザー認証（Auth）の実装
  - Laravel Sanctum のセットアップ
  - ユーザー登録、ログイン、ログアウトのエンドポイント作成
  - 認証ミドルウェアの適用とテスト
  - _Requirements: 3.1, 3.2_

- [x] 2.2 レッスン管理（Lesson CRUD）APIの実装
  - `LessonController`, `Service`, `Repository` の実装
  - 一覧取得、詳細取得、作成、更新、削除のAPIエンドポイント作成
  - 管理者権限によるアクセス制限の実装
  - _Requirements: 2.1, 2.2, 2.3, 3.3_

- [x] 2.3 コード保存・復元（Submission）APIの実装
  - ユーザーが記述中のコードを保存するエンドポイント作成
  - 特定のレッスンに対する保存済みコードを取得する機能
  - 提出履歴（簡易）の記録機能
  - _Requirements: 1.4_

## 3. Core: フロントエンドUIの構築
ユーザーがレッスンを閲覧し、コードを記述する画面を構築します。

- [x] 3.1 認証画面（サインアップ・ログイン）の構築
  - ログイン、ユーザー登録フォームの実装
  - API連携と認証トークンの状態管理
  - 認証状態に応じたリダイレクト処理
  - _Requirements: 3.1, 3.2_

- [x] 3.2 レッスン一覧および演習用エディタ画面の構築
  - `lessons` 一覧の表示
  - Monaco Editor 等のライブラリ導入とシンタックスハイライト
  - Markdown レンダラーによるレッスン本文表示
  - _Requirements: 1.1, 1.2, 1.5_

- [x] 3.3 (P) 模範解答表示とコード保存機能の統合
  - 模範解答の表示・非表示切り替えUI
  - エディタ内容の自動保存または手動保存のAPI連携
  - ページ再訪時のコード復元機能
  - _Requirements: 1.3, 1.4_

## 4. Integration: システムの結合と最終検証
フロントとバックを完全に接続し、エンドツーエンドの動作を確認します。

- [x] 4.1 (P) 管理者用レッスン管理機能の実装
  - 管理画面からのレッスン作成・編集UI
  - レッスン削除機能の実装
  - 管理者権限によるアクセス制限（フロントエンド）
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4.2 MVP最終検証とテスト
  - 全ての受入基準（Acceptance Criteria）のセルフチェック
  - 手動によるスモークテスト（登録→閲覧→編集→保存→ログアウト）
  - _Requirements: 4.4_
