# Requirements Document

## Introduction
「DevInit」は、プログラミング初学者がブラウザ上で直接コードを記述・実行し、即座にフィードバックを得られる学習プラットフォームです。Dockerを利用した安全なコード実行環境を提供し、管理者が教材を柔軟に管理できる仕組みを構築します。本要件定義では、MVP（Minimum Viable Product）として、1言語の実行環境をブラウザ上で完結させる最小構成の実現を目指します。

## Boundary Context
- **In scope**:
  - Markdown形式の問題文表示機能
  - ブラウザ上でのコード編集および実行結果の表示
  - 模範解答とのコード比較（テキストベース）
  - 教材（問題、解答）のCRUD操作
  - ユーザー管理の基本機能
  - Dockerコンテナ内での安全なコード実行（1言語）
- **Out of scope**:
  - 複数言語の同時サポート（MVP以降に検討）
  - 高度なコード差分解析（行単位の単純比較にとどめる）
  - リアルタイムでの共同編集機能
  - 外部サービス（GitHub等）との連携
- **Adjacent expectations**:
  - 実行環境はホストシステムから分離され、悪意のあるコードから保護されていること
  - フロントエンドとバックエンドはAPIを介して通信すること

## Requirements

### Requirement 1: 演習画面（ユーザー機能）
**Objective:** As a 初学者ユーザー, I want ブラウザ上で問題を確認しコードを実行できる演習画面, so that 開発環境を構築することなく学習を開始できる。

#### Acceptance Criteria
1. When ユーザーが演習ページを開いたとき, the System shall Markdown形式の問題文をレンダリングして表示する
2. When ユーザーがコードを実行したとき, the Execution Service shall Dockerコンテナ内でコードを評価し、標準出力およびエラーを出力する
3. When コードの実行が完了したとき, the System shall 実行結果をユーザー画面に表示する
4. When ユーザーが模範解答の表示を選択したとき, the System shall 現在の入力コードと模範解答を並べて表示する
5. The Editor shall シンタックスハイライト機能を備えたコード編集環境を提供する

### Requirement 2: 教材管理（管理者機能）
**Objective:** As a 管理者, I want 教材の追加・編集やユーザー管理ができる管理画面, so that 学習コンテンツを適切に運用できる。

#### Acceptance Criteria
1. When 管理者が新しい問題を作成するとき, the Admin Service shall タイトル、Markdown形式の本文、模範解答を保存する
2. When 管理者が既存の問題を編集するとき, the Admin Service shall 変更内容をデータベースに反映する
3. When 管理者がユーザー一覧を表示したとき, the Admin Service shall 登録済みユーザーの情報をリスト形式で表示する
4. If 教材の保存時に必須項目が未入力の場合, then the System shall エラーメッセージを表示し、保存を中断する

### Requirement 3: セキュアなコード実行環境
**Objective:** As a システム運用者, I want ユーザーが送信したコードを隔離された環境で実行する仕組み, so that ホストシステムの安全性を維持できる。

#### Acceptance Criteria
1. When コード実行リクエストを受け取ったとき, the Execution Factory shall 実行専用の一時的なDockerコンテナを生成する
2. While コードの実行中, the Execution Service shall CPUやメモリの使用量および実行時間に制限（タイムアウト）を設ける
3. When コードの実行が終了またはタイムアウトしたとき, the Execution Factory shall 生成したコンテナを即座に破棄する
4. The Execution Environment shall ネットワークアクセスを遮断した状態でコードを実行する

### Requirement 4: システム品質と拡張性
**Objective:** As a 開発者, I want モジュラーモノリス構成とレイヤードアーキテクチャの採用, so that 将来的な機能拡張や保守を容易にする。

#### Acceptance Criteria
1. The Backend System shall Controller, Service, Repositoryの各層に責務を分離して実装する
2. The Frontend System shall 静的解析ツール（ESLint/Prettier）を通過したコードで構成される
3. Where 将来的に複数言語をサポートする場合, the Execution Strategy shall 実行エンジンを容易に切り替え可能とする
4. The Backend System shall 主要なロジックに対してPHPUnitによる自動テストを備える
