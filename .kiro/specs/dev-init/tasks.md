# Implementation Plan: dev-init

## 1. Foundation: プロジェクト基盤の構築
このフェーズでは、フロントエンドとバックエンドのベースプロジェクトを作成し、共通の構成を設定します。

- [ ] 1.1 バックエンド（Laravel）の初期化とレイヤード構造の準備
  - `laravel new backend` によるプロジェクト作成
  - `app/Modules/Execution` 等のカスタムディレクトリ構造の作成
  - Docker PHP SDK のインストールと基本設定
  - `php artisan test` が正常に動作することを確認
  - _Requirements: 4.1, 4.4_

- [ ] 1.2 フロントエンド（Next.js）の初期化
  - `npx create-next-app@latest frontend` による TypeScript プロジェクト作成
  - ESLint, Prettier の初期設定
  - 基本的なレイアウト（ヘッダー、メイン領域）の構築
  - `npm run dev` で初期画面が表示されることを確認
  - _Requirements: 4.2_

- [ ] 1.3 データベーススキーマの定義とマイグレーション
  - `problems` テーブル（教材）および `submissions` テーブル（提出記録）の作成
  - シーダーによる初期サンプルデータの投入
  - データベース接続テストの成功を確認
  - _Requirements: 2.1, 2.2_

## 2. Core: 実行エンジンとバックエンドAPI
バックエンドの核となるコード実行ロジックを実装します。

- [ ] 2.1 コード実行の抽象化基盤（Strategy/Factory）の実装
  - `ExecutionStrategy` インターフェースの定義
  - `ExecutionFactory` の実装
  - ダミーの Strategy による疎通確認テストの成功
  - _Requirements: 3.1, 4.3_
  - _Boundary: ExecutionModule_

- [ ] 2.2 (P) Docker実行ロジックの実装（Python 暫定）
  - Dockerコンテナの起動、コード転送、実行、結果取得のロジック実装
  - タイムアウト制限（Timeout）およびリソース制限の実装
  - ネットワークアクセス遮断設定の適用
  - テストコードによる「hello world」の実行成功を確認
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4_
  - _Boundary: ExecutionModule_

- [ ] 2.3 (P) 教材管理（CRUD）APIの実装
  - `ProblemController`, `Service`, `Repository` の実装
  - 一覧取得、詳細取得、作成、更新、削除のAPIエンドポイント作成
  - APIテスト（JUnit風）による各エンドポイントの正常動作確認
  - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - _Boundary: EducationModule_

## 3. Core: フロントエンド演習画面
ユーザーが実際にコードを入力し、結果を確認する画面を構築します。

- [ ] 3.1 演習用コードエディタコンポーネントの構築
  - Monaco Editor 等のライブラリの導入
  - シンタックスハイライトおよび基本操作の実装
  - エディタへの入力値が状態管理（State）に反映されることを確認
  - _Requirements: 1.1, 1.5_
  - _Boundary: FrontendEditor_

- [ ] 3.2 (P) 問題文表示と実行結果出力コンポーネント
  - Markdown レンダラーの導入と問題文の表示
  - 実行結果（標準出力、エラー）の表示領域の実装
  - 初期データの表示および結果の動的更新を確認
  - _Requirements: 1.1, 1.3_
  - _Boundary: FrontendViewer_

- [ ] 3.3 (P) 模範解答比較機能の実装
  - 現在のコードと模範解答を並べて表示するビューの実装
  - ボタンクリックによる比較表示の切り替え
  - 正しく模範解答が表示されることを確認
  - _Requirements: 1.4_
  - _Boundary: FrontendCompare_

## 4. Integration: システムの結合と最終検証
フロントとバックを接続し、全体の流れを確認します。

- [ ] 4.1 コード実行リクエストの結合
  - フロントエンドから `/api/execute` へのリクエスト送信処理の実装
  - 実行中のローディング状態および完了後の結果反映の実装
  - 実際にブラウザで入力したコードが Docker で実行されることを確認
  - _Depends: 2.2, 3.1_
  - _Requirements: 1.2, 1.3_

- [ ] 4.2 管理画面の構築と統合
  - 管理者用プロブレム管理UIの実装
  - ユーザー一覧表示機能の統合
  - 管理画面からの教材追加がユーザー画面に反映されることを確認
  - _Depends: 2.3_
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 4.3 MVP最終検証とテスト
  - 全ての受入基準（Acceptance Criteria）のセルフチェック
  - Dockerコンテナが実行後に正しく破棄されているかの確認
  - 異常系（無限ループ等）に対するタイムアウトの動作確認
  - _Requirements: 3.3, 4.4_
