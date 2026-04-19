# Project Structure

## Organization Philosophy

フロントエンドとバックエンドをトップレベルで分離したモノリポ構成。バックエンドはモジュラーモノリスおよびレイヤードアーキテクチャを基本とする。

## Directory Patterns

### Frontend (`/frontend/`)
**Location**: `/frontend/src/`  
**Purpose**: Next.js (App Router) ベースのUI。コンポーネント、サービス（APIクライアント）、型定義を配置。

### Backend (`/backend/`)
**Location**: `/backend/app/`  
**Purpose**: LaravelベースのAPI。`Http/Controllers`, `Services`, `Repositories` のレイヤーに分割。
**Modules**: `app/Modules/` 配下に「Execution（実行エンジン）」や「Education（教材管理）」などのドメイン領域を定義。

### Infrastructure (`/docker/`)
**Location**: `/docker/`  
**Purpose**: 実行環境（Python, Node.js等）のDockerfileおよびベースイメージ定義。

## Naming Conventions

- **Files**: kebab-case (Frontend), PascalCase (Backend Classes)
- **Components**: PascalCase (React components)
- **Database**: snake_case (Table/Column names)

## Code Organization Principles

- **Dependency Direction**: Controller -> Service -> Repository。下位レイヤーが上位レイヤーを知ることは禁止。
- **Contract-First**: インターフェース（PHP interface, TS interface）を先に定義し、実装との結合度を下げる。
