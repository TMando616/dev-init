# Requirements Document

## Introduction
「DevInit」は、プログラミング初学者がブラウザ上で直接コードを記述・学習できるプラットフォームです。MVP（Minimum Viable Product）では、開発環境構築の壁を取り払う第一歩として、教材の閲覧、コードの編集、および基本的なユーザー管理機能を提供し、バックエンドとの連携基盤を確立することを目標とします。コードの実際の実行環境（Docker等）は将来の拡張フェーズで導入します。

## Boundary Context
- **In scope**:
  - Markdown形式の問題文表示機能
  - ブラウザ上でのコード編集エディタ（編集内容の保持）
  - 模範解答とのコード比較（テキストベースの表示）
  - 教材（問題、解答）のCRUD操作
  - ユーザー管理（登録、ログイン、一覧表示）の基本機能
  - フロントエンドとバックエンドのAPI連携基盤
- **Out of scope (Future Extensions)**:
  - **Dockerコンテナ内でのコード実行機能**
  - 実行結果のリアルタイムフィードバック
  - ネットワークアクセス制限やリソース制限の実装
  - 複数言語の実行エンジン切り替え
- **Adjacent expectations**:
  - フロントエンドとバックエンドは分離され、RESTful APIを介して通信すること
  - 将来のコード実行機能導入を見据えた拡張性のある設計であること

## Requirements

### Requirement 1: 演習・学習画面（ユーザー機能）
**Objective:** As a 初学者ユーザー, I want ブラウザ上で問題を確認しエディタでコードを入力できる画面, so that 学習コンテンツに集中できる。

#### Acceptance Criteria
1. When ユーザーが演習ページを開いたとき, the System shall Markdown形式の問題文をレンダリングして表示する
2. The Editor shall シンタックスハイライト機能を備えたコード編集環境を提供する
3. When ユーザーが模範解答の表示を選択したとき, the System shall 現在の入力コードと模範解答を並べて表示する
4. (MVP) When ユーザーが「保存」をクリックしたとき, the System shall 入力中のコードをサーバー側に保存し、次回アクセス時に復元する

### Requirement 2: 教材管理（管理者機能）
**Objective:** As a 管理者, I want 教材の追加・編集やユーザー管理ができる管理画面, so that 学習コンテンツを適切に運用できる。

#### Acceptance Criteria
1. When 管理者が新しい問題を作成するとき, the Admin Service shall タイトル、Markdown形式の本文、模範解答を保存する
2. When 管理者が既存の問題を編集するとき, the Admin Service shall 変更内容をデータベースに反映する
3. When 管理者がユーザー一覧を表示したとき, the Admin Service shall 登録済みユーザーの情報をリスト形式で表示する
4. If 教材の保存時に必須項目が未入力の場合, then the System shall エラーメッセージを表示し、保存を中断する

### Requirement 3: ユーザー認証・認可
**Objective:** As a ユーザー, I want アカウントを作成しログインできる機能, so that 自分の学習進捗やコードを管理できる。

#### Acceptance Criteria
1. When 未登録ユーザーがサインアップしたとき, the System shall ユーザー情報をデータベースに登録し、自動的にログイン状態にする
2. When 既存ユーザーがログインしたとき, the System shall 認証情報を確認し、個人用ページへのアクセスを許可する
3. The System shall 管理者権限を持つユーザーのみが管理画面へアクセスできるように制御する

### Requirement 4: システム品質と拡張性
**Objective:** As a 開発者, I want レイヤードアーキテクチャの採用, so that 将来の実行エンジン導入を容易にする。

#### Acceptance Criteria
1. The Backend System shall Controller, Service, Repositoryの各層に責務を分離して実装する
2. The Frontend System shall Next.jsの標準的なディレクトリ構造に従い、再利用可能なコンポーネントを構成する
3. The System Architecture shall コード実行機能（将来実装）をモジュールとして追加可能な疎結合な構成とする
4. The Backend System shall APIの各エンドポイントに対してテストを備える
