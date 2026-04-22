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

## Development Flow & Commit Strategy
- **トランクベース開発**: 原則として `main` ブランチで直接開発を進めます。これにより、GitHub上での活動（コントリビューション）がリアルタイムに反映されるようにします。
- **こまめなコミットとプッシュ**: 1つの小さなサブタスクが完了するごとにコミットを行い、Completion over Perfection（完璧さより完了）の精神でこまめに進捗を保存・プッシュします。
- **AIの役割**: AIは実装を開始する際、常に `main` ブランチにいることを確認してください。また、タスク完了時にはユーザーにコミットとプッシュを促すか、代行を提案してください。