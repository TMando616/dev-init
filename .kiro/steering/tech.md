# Technology Stack

## Architecture

フロントエンドとバックエンドを分離したAPIベースの「モジュラーモノリス」構成。バックエンドはController / Service / Repositoryに責務を分割したレイヤードアーキテクチャを採用。

## Core Technologies

- **Frontend**: Next.js 14+ (React) / TypeScript
- **Backend**: Laravel 10+ (PHP 8.2+)
- **Database**: PostgreSQL
- **Infrastructure**: Docker (コード実行環境)

## Key Libraries

- **Frontend**: Monaco Editor (コード編集), Tailwind CSS (スタイリング)
- **Backend**: Docker PHP SDK (コンテナ制御), PHPUnit (テスト)

## Development Standards

### Type Safety
TypeScriptによる厳格な型定義。`any`の使用を禁止し、インターフェースを明示する。

### Code Quality
- **Frontend**: ESLint, Prettierによる静的解析。
- **Backend**: Laravelの標準規約、PSR-12準拠。

### Testing
- **Backend**: ServiceレイヤーのロジックおよびAPIエンドポイントに対するPHPUnitテスト。
- **E2E**: 主要なユーザー動線（演習の実行）の検証。

## Key Technical Decisions

- **Strategy/Factory パターンの導入**: 将来的な多言語対応を見据え、実行エンジンを動的に切り替え可能にする。
- **Dockerによる分離**: セキュリティと再現性を担保するため、ユーザーコードを一時的なコンテナで実行し、即座に破棄する。

## Development Flow & Branch Strategy
- タスクベースのフィーチャーブランチ戦略を採用します。開発は `develop` ブランチから派生した `feature/` ブランチで行います。
- AIは新しいタスクの実装（`/kiro:spec-impl`等）を開始する際、事前にユーザーに対して「新しいブランチ（例: `feature/task-name`）を作成しましたか？」と確認・リマインドしてください。
- 1つのタスク（チケット）が完了するごとにコミットを行い、Completion over Perfection（完璧さより完了）の精神でこまめに進捗を保存します。