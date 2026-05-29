# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Agentic SDLC — Spec-Driven Development (cc-sdd)

このリポジトリはKiro流のスペック駆動開発をClaude Codeで実践する構成です。  
大きな機能実装は必ずステアリング → 要件 → 設計 → タスク → 実装の順で進め、各フェーズで人間のレビューを挟みます。

### パス

| 種別 | パス |
|------|------|
| ステアリング（プロジェクト全体ルール） | `.kiro/steering/` |
| スペック（機能ごとの仕様） | `.kiro/specs/{feature}/` |

### ステアリングの読み込み

**会話開始時に必ず以下3ファイルを読み込み、内容をプロジェクト知識として保持してください。**

- `.kiro/steering/product.md` — プロダクトの目的・ユーザー・価値提案
- `.kiro/steering/tech.md` — 技術スタック・アーキテクチャ決定・開発標準
- `.kiro/steering/structure.md` — ディレクトリ構造・命名規則・依存方向

ステアリングに変更が必要になった場合は、実装前に対象ファイルを更新してください。

---

## ワークフロー

### Phase 0（任意）: ステアリング整備

プロジェクト全体の方針変更・技術決定があった場合に実施します。

```
ユーザー: ステアリングを更新したい
Claude: .kiro/steering/ の該当ファイルを編集し、変更内容を確認
```

### Phase 1: スペック作成（Requirements → Design → Tasks）

**重要: 各ステップで必ず人間のレビューと承認を得てから次に進むこと。`-y` フラグが指定された場合のみ承認をスキップして次フェーズへ進んでよい。**

#### 1-a. 要件定義

ユーザーから機能説明を受けたら `.kiro/specs/{feature}/requirements.md` を作成します。

```
.kiro/specs/{feature}/
  requirements.md   ← ユーザーストーリー・受け入れ条件
```

`requirements.md` の構成:
- **概要**: 機能の目的と対象ユーザー
- **ユーザーストーリー**: `As a ... / I want ... / So that ...` 形式
- **受け入れ条件**: 各ストーリーに対するチェッカブルな条件

作成後、ユーザーに確認を求めてください。

#### 1-b. ギャップ分析（既存コードベースがある場合）

既存実装との乖離を調査し、 `requirements.md` 末尾にギャップ分析セクションを追記します。

#### 1-c. 技術設計

承認後、 `.kiro/specs/{feature}/design.md` を作成します。

```
.kiro/specs/{feature}/
  design.md         ← コンポーネント設計・API設計・データモデル・シーケンス
```

ステアリングの `tech.md` および `structure.md` のアーキテクチャ制約（Controller→Service→Repository の依存方向など）を厳守してください。

作成後、ユーザーに確認を求めてください。

#### 1-d. タスク分解

承認後、 `.kiro/specs/{feature}/tasks.md` を作成します。

```
.kiro/specs/{feature}/
  tasks.md          ← 実装タスクのチェックリスト
```

`tasks.md` の構成（チェックボックス形式）:
```
- [ ] 1. タスク名
  - 詳細・参照ファイル
- [ ] 2. タスク名
  ...
```

作成後、ユーザーに確認を求めてください。

### Phase 2: 実装

承認された `tasks.md` に基づき実装を進めます。

- `TaskCreate` で各タスクを登録し、着手時に `in_progress`、完了時に `completed` へ更新する
- `tasks.md` のチェックボックスも同時に更新する（`- [x]`）
- 1サブタスク完了ごとにコミットし、ユーザーにプッシュを促す

### 進捗確認

いつでも `.kiro/specs/{feature}/tasks.md` を読んでチェック状況を報告できます。

### 実装検証

実装完了後は `/code-review` でコードレビューを実施し、`requirements.md` の受け入れ条件との整合を確認します。

---

## 開発ルール

### 言語

- **思考・推論は英語**で行う
- **ユーザーへの返答は日本語**で行う
- プロジェクトファイルへ書き込むMarkdown（requirements.md, design.md, tasks.md等）は**日本語**で記述する

### Gitルール

- コミット日時の改ざん（`--date` オプション等）を禁止する
- 既存コミットのamendや履歴書き換えは、ユーザーから明示的に指示された場合のみ行う
- システム時刻をそのまま使用する
- コミットはサブタスク完了ごとにこまめに行う（Completion over Perfection）
- 原則として `main` ブランチで直接開発する（トランクベース開発）

### 自律的な実行

ユーザーの指示のスコープ内では自律的に動く。必要なコンテキストを自ら収集し、今回の実行内で作業を完結させる。本質的な情報が欠けている場合、または指示が致命的に曖昧な場合のみ質問する。

---

## プロジェクト: DevInit

### 概要

プログラミング初学者向けのブラウザ完結型コード演習プラットフォーム。環境構築不要でブラウザ上でコードを記述・実行できる。

### よく使うコマンド

```bash
# 全サービス起動（nginx :80, frontend :3000, db :5432）
docker compose up

# バックエンドテスト（backend/ で実行）
php artisan test
php artisan test --filter=CodeExecutionTest   # クラス指定
php artisan test tests/Feature/AuthTest.php   # ファイル指定

# フロントエンド（frontend/ で実行）
npm run lint
npm run build
npm run dev
```

### アーキテクチャ

**バックエンド** (Laravel / PHP 8.4):  
`Controller → Service → Repository` の一方向依存。下位レイヤーが上位を参照することは禁止。

**コード実行の2経路**:
- **Dockerサンドボックス**（バックエンド）: PHP / Python / JavaScript / Ruby / Java をコンテナで隔離実行（`--network none`, 128MB, 5秒タイムアウト）。`DOCKER_HOST_PATH` 環境変数でホストパスとコンテナパスのズレを吸収する。
- **iframeサンドボックス**（フロントエンド）: JavaScriptをクライアント側 `<iframe>` で実行（3秒タイムアウト）。

**認証**: Laravel Sanctum（Bearer token）。フロントエンドは `localStorage` にトークンを保存し、Axiosインターセプターで自動付与する。管理者ルートは `admin` ミドルウェアで保護。

**フロントエンド** (Next.js 16.2.4 / React 19):  
Next.js 16はトレーニングデータ上の慣習と異なる破壊的変更が含まれる。コードを書く前に `frontend/node_modules/next/dist/docs/` を参照すること。

**テスト**: バックエンドはSQLiteインメモリDBを使用（`phpunit.xml` で設定済み）。

### 主要モデル関係

- `User` → many `Submission`; `role` フィールド (`admin`/`user`)
- `Lesson` ↔ many-to-many `Category` (pivot: `category_lesson`); `language` フィールドあり
- `Submission` → belongs to `User` + `Lesson`; 完了状態を管理
