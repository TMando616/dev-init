# Research and Gap Analysis: dev-init

## Current State Investigation
- **Directory Layout**: プロジェクトルートには `.kiro` ディレクトリと基本設定ファイル（`.gitignore`, `GEMINI.md`）のみが存在し、アプリケーションのソースコードは一切存在しない。
- **Architecture Patterns**: 要件定義で「モジュラーモノリス」「レイヤードアーキテクチャ」が指定されているが、実装は未着手である。
- **Reusable Assets**: 現時点で利用可能なコンポーネントやサービスは存在しない。

## Requirements Feasibility Analysis
要件定義（Requirement 1-4）に基づき、必要な技術要素と現状のギャップを整理します。

| Requirement | Technical Needs | Status | Gap / Constraint |
| :--- | :--- | :--- | :--- |
| **1. 演習画面** | Next.js, TypeScript, Code Editor (Monaco等), Markdown Renderer | **Missing** | フロントエンド基盤が未構築。 |
| **2. 教材管理** | Laravel (PHP), Database (MySQL/PostgreSQL), CRUD logic | **Missing** | バックエンド基盤およびDBスキーマが未定義。 |
| **3. 実行環境** | Docker API, Container Orchestration (PHP-SDK), Resource Limits | **Missing** | Docker連携ロジックおよびコンテナイメージが未定義。 |
| **4. 品質と拡張性** | Strategy/Factory Patterns, PHPUnit, ESLint/Prettier | **Missing** | デザインパターンの適用およびテスト・静的解析設定が未着手。 |

### Research Needed
- Dockerコンテナ内でのコード実行をPHP（Laravel）から安全に制御するための最適なライブラリ（docker-php-sdk等）の選定。
- ブラウザ上でのエディタ操作感と実行結果の同期方法（WebSocket vs HTTP Polling）。

## Implementation Approach Options

### Option B: Create New Components (推奨)
**Rationale**: 現在ソースコードが皆無であるため、要件に基づき新規にコンポーネントおよびディレクトリ構造を構築する必要がある。

- **Integration points**: フロントエンド（Next.js）とバックエンド（Laravel API）の新規構築。
- **Responsibility boundaries**: 
    - Frontend: UI、エディタ管理、Markdownレンダリング。
    - Backend: 認証、教材管理、Docker実行エンジン。

**Trade-offs**:
- ✅ クリーンな初期状態からアーキテクチャを適用できる。
- ✅ 責務の分離が容易。
- ❌ 全てのボイラープレートをゼロから作成する必要がある。

## Implementation Complexity & Risk
- **Effort**: **XL (2+ weeks)**
    - 理由: フロントエンド、バックエンド、およびDocker連携を含むインフラ構成をゼロから構築するため、広範な作業が必要。
- **Risk**: **High**
    - 理由: ユーザーが送信した任意のコードをコンテナ内で安全に実行するためのセキュリティ設計（リソース制限、ネットワーク遮断）に高い技術的難易度が伴う。

## Recommendations for Design Phase
- **Preferred approach**: 最小構成（MVP）を優先し、まずは「1言語（例: Python/Node.js）の実行」に絞ったディレクトリ構造とAPI定義を行う。
- **Key decisions**: バックエンドのレイヤードアーキテクチャ（Controller/Service/Repository）の具体的なディレクトリ配置を決定する。
- **Research items**: セキュアなDockerコンテナ実行のためのベースイメージの選定と実行時間制限（Timeout）の実装方法。
