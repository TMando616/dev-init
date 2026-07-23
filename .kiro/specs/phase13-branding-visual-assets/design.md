# 技術設計: Phase 13 - ロゴ・言語トップ画像導入

## 設計方針の要点

- 画像は`frontend/public/images/`配下に集約し、`next/image`（`public`参照 + 明示的`width`/`height`）で表示する。静的importは使わない（`public`配下のファイルはURL文字列参照が標準のため）。
- 言語→画像・ラベルのマッピングを`frontend/src/lib/languages.ts`に1箇所集約する（Contract-First: 型を先に定義）。`LessonCard`・ダッシュボード・レッスン一覧のすべてがこの1ファイルを参照する。未知の`language`値は`null`を返し、呼び出し側でフォールバック表示する。
- ロゴ画像は白背景前提のため、配置先が`dark:`で暗色になる箇所（Sidebar/AdminSidebarヘッダー、ログインカード）では`dark:bg-white dark:rounded-md dark:p-1.5`のような「白バッジ」でラップし、ダーク時も違和感なく浮かせる。
- サイドバー折りたたみ時は、ロゴ画像を固定サイズの正方形コンテナに`object-cover object-left`で収め、アイコン部分だけをクロップ表示する（新規アイコン素材は作らない）。
- ダッシュボードの「言語別」セクションは、既存の`category_progress`と同じ形（`completed`/`total`）で`DashboardService`から返す。カテゴリと言語は独立軸なので、既存の`category_progress`ロジックとは別に並列で計算する。
- レッスン一覧の言語グルーピングは、既に取得済みの`/lessons`データをクライアント側で`language`によりグルーピングするだけで完結させる（バックエンド変更不要）。

---

## 1. アセット配置と最適化

### 1.1 配置パス

| 用途 | パス |
|------|------|
| ロゴ | `frontend/public/images/logo/dev-init-logo.png` |
| 言語画像 | `frontend/public/images/languages/{php,python,javascript,ruby,java}.png` |
| favicon | `frontend/src/app/favicon.ico`（既存の規約ファイルを上書き） |

### 1.2 事前最適化（実装タスクとして実施）

元ファイルは2020×773〜3352×1280、800KB〜4MBと大きい。`next/image`は表示時にオンデマンドでリサイズするが、元ファイル自体が大きいとリポジトリ肥大化とデコードコストにつながるため、コミット前に`sharp`（`frontend/node_modules/sharp`が利用可能）でリサイズ・再圧縮するNode一発スクリプトを実装タスクの中で使い捨てで実行する。

| ファイル | 目標最大幅 | 備考 |
|---------|-----------|------|
| `dev-init-logo.png` | 1200px | サイドバー/ログイン画面での表示高は最大でも48px程度なので十分 |
| 言語画像5枚 | 1600px | 最大表示箇所（ダッシュボード言語別カード）でも横幅400px程度 |

アスペクト比はそのまま維持（`ruby-logo.png`のみ他4枚と比率が異なるが、後述の`object-cover`前提のトリミング表示のためクロップ位置の調整のみで吸収し、原画像自体の比率統一は行わない）。

---

## 2. 言語アセットマッピング（新規: `frontend/src/lib/languages.ts`）

```ts
export type SupportedLanguage = 'php' | 'python' | 'javascript' | 'ruby' | 'java';

interface LanguageAsset {
  label: string;
  image: string;
}

const LANGUAGE_ASSETS: Record<SupportedLanguage, LanguageAsset> = {
  php:        { label: 'PHP',        image: '/images/languages/php.png' },
  python:     { label: 'Python',     image: '/images/languages/python.png' },
  javascript: { label: 'JavaScript', image: '/images/languages/javascript.png' },
  ruby:       { label: 'Ruby',       image: '/images/languages/ruby.png' },
  java:       { label: 'Java',       image: '/images/languages/java.png' },
};

export function getLanguageAsset(language?: string | null): LanguageAsset | null {
  if (!language) return null;
  return LANGUAGE_ASSETS[language as SupportedLanguage] ?? null;
}
```

- キーはバックエンドの`Lesson.language`実値（`CodeExecutionService`のキーと同一: `php`/`python`/`javascript`/`ruby`/`java`、seederで確認済み）とそのまま一致させる。
- `getLanguageAsset`が`null`を返すケース（未知の言語値）は、呼び出し側で必ず既存のフォールバックUI（`BookOpen`アイコン等）に切り替える。新しい言語が追加された時はこのファイルに1行足すだけで全画面に反映される。

---

## 3. ロゴコンポーネント（新規: `frontend/src/components/Logo.tsx`）

```tsx
'use client';

import Image from 'next/image';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

interface LogoProps {
  variant?: 'full' | 'icon';
  className?: string;
}

export default function Logo({ variant = 'full', className }: LogoProps) {
  if (variant === 'icon') {
    return (
      <div className={cn(
        'relative h-8 w-8 shrink-0 overflow-hidden rounded-lg dark:bg-white dark:p-0.5',
        className
      )}>
        <Image
          src="/images/logo/dev-init-logo.png"
          alt="dev-init"
          fill
          className="object-cover object-left"
        />
      </div>
    );
  }

  return (
    <div className={cn('inline-flex items-center rounded-md dark:bg-white dark:px-2 dark:py-1', className)}>
      <Image
        src="/images/logo/dev-init-logo.png"
        alt="dev-init"
        width={1200}
        height={460}
        priority
        className="h-8 w-auto"
      />
    </div>
  );
}
```

- `variant="icon"`はサイドバー折りたたみ時専用。1枚のロゴ画像を正方形にクロップし、アイコン部分（画像左側）だけを見せる。
- ライト時（背景が白）はラッパーの`dark:`系クラスが効かないため、素の画像がそのまま馴染む。ダーク時のみ白背景パディングが自動で付く。
- `priority`はヘッダー/ログイン画面の初期表示要素なのでLCP最適化のため付与する（サイドバー内など複数箇所に置く場合は最初の1箇所のみ）。

---

## 4. 各画面の変更

### 4.1 `Sidebar.tsx` / `AdminSidebar.tsx`

現状の「アイコンボックス + テキスト」ブロックを`Logo`に置き換える。

```tsx
{!isCollapsed && <Logo />}
{isCollapsed && <Logo variant="icon" className="mx-auto" />}
```

`AdminSidebar.tsx`は元々`DevInit <span className="text-blue-600">Admin</span>`という表示だった。ロゴ画像には"Admin"の文字が含まれないため、`Logo`の右に区別用バッジを追加する。

```tsx
{!isCollapsed && (
  <div className="flex items-center gap-2">
    <Logo />
    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Admin</span>
  </div>
)}
{isCollapsed && <Logo variant="icon" className="mx-auto" />}
```

### 4.2 ログイン/登録画面

`(student)/login`, `(student)/register`: `<h1 className="text-3xl font-bold">DevInit</h1>` を `<Logo className="mx-auto h-10" />`（`h-10`はh1相当の視覚的高さに合わせる微調整）に置き換える。カード自体が`bg-white dark:bg-slate-900`なので`Logo`の白背景バッジ処理がそのまま活きる。

`(admin)/admin/login`: 既存の`ShieldCheck`アイコンボックスはそのまま残し（"管理者専用"を示す既存の視覚的合図として維持)、`<h1>DevInit <span>Admin</span></h1>`を`Logo` + "Admin"バッジ（4.1と同じパターン）に置き換える。

### 4.3 favicon

`frontend/src/app/favicon.ico`を`dev-init-favicon.ico`の内容で上書きする（Next.js App Routerの規約により追加の設定コードは不要）。

---

## 5. レッスンカードの言語サムネイル（`(student)/lessons/list/page.tsx`）

`Lesson`インターフェースに`language`を追加し、`LessonCard`内の`BookOpen`アイコンボックスを言語画像に置き換える。

```ts
interface Lesson {
  id: number;
  title: string;
  language: string;
  categories: { id: number; name: string }[];
}
```

```tsx
const asset = getLanguageAsset(lesson.language);

<div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-slate-900 dark:group-hover:bg-slate-100 group-hover:text-white dark:group-hover:text-slate-900 transition-colors">
  {asset ? (
    <Image src={asset.image} alt={asset.label} fill sizes="48px" className="object-cover object-left" />
  ) : (
    <BookOpen size={24} />
  )}
</div>
```

- `fill` + `object-cover object-left`で、言語画像の左側（アイコン部分）だけを48×48にクロップ表示する。
- 画像がある場合はホバー時の反転演出（`group-hover:bg-slate-900`等）が画像の上に効かなくなるが、画像自体に十分なコントラストがあるため許容する（枠線側の`hover:border-slate-300`等は引き続き機能する）。

---

## 6. ダッシュボードの「言語別」セクション

### 6.1 バックエンド: `DashboardService::getDashboardData`

`category_progress`と同じ形で`language_progress`を追加する。

```php
$languageProgress = Lesson::select('id', 'language')
    ->get()
    ->groupBy('language')
    ->map(function ($lessons, $language) use ($completedLessonIds) {
        $lessonIds = $lessons->pluck('id');
        $completedInLanguage = $completedLessonIds->intersect($lessonIds)->count();

        return [
            'language' => $language,
            'completed' => $completedInLanguage,
            'total' => $lessons->count(),
        ];
    })
    ->values();
```

返却配列に`'language_progress' => $languageProgress`を追加する。`Controller → Service → Repository`の依存方向は変えず、`DashboardService`内の既存パターンを踏襲するのみなのでレイヤー違反はない。

### 6.2 フロントエンド: `(student)/page.tsx`

`DashboardData`型に`language_progress: { language: string; completed: number; total: number }[]`を追加。「カテゴリ別進捗」セクションの直後に、同一のカードレイアウトを流用した「言語別」セクションを新設する。

```tsx
<div>
  <div className="flex items-center gap-2 mb-6">
    <Code2 size={20} className="text-slate-500" />
    <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">言語別進捗</h3>
  </div>
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {data.language_progress
      .filter((lang) => lang.total > 0)
      .map((lang) => {
        const asset = getLanguageAsset(lang.language);
        const percentage = lang.total > 0 ? Math.round((lang.completed / lang.total) * 100) : 0;
        return (
          <Link
            key={lang.language}
            href={`/lessons/list?language=${lang.language}`}
            className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
          >
            <div className="relative h-24 bg-slate-50 dark:bg-slate-800">
              {asset && (
                <Image src={asset.image} alt={asset.label} fill className="object-cover object-center" />
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 dark:text-slate-100">{asset?.label ?? lang.language}</h4>
                <span className="text-sm font-bold text-slate-500">{percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-slate-900 dark:bg-slate-100 h-full transition-all duration-700" style={{ width: `${percentage}%` }} />
              </div>
              <p className="text-xs text-slate-500">{lang.completed} / {lang.total} レッスン</p>
            </div>
          </Link>
        );
      })}
  </div>
</div>
```

- `total > 0`でフィルタし、レッスンが1件もない言語は表示しない（受け入れ条件どおり）。
- カードのバナー部分（`h-24`）は言語画像の全体を`object-center`で見せる（アイコン+文字+キャッチコピーが視認できる高さ）。カード一覧側（5.）とは異なり、ここは横幅に余裕があるためクロップせずバナーらしく見せる。

---

## 7. レッスン一覧の言語グルーピング（`(student)/lessons/list/page.tsx`）

バックエンド変更なし。既に取得済みの`lessons`（`language`フィールド追加済み）をクライアント側で集計し、ページ上部に「言語から探す」という横スクロールのチップ行を追加する。クリックで`selectedLanguage`をセットし、以降のカテゴリ別/未分類の一覧表示を`selectedLanguage`でフィルタする。

```tsx
const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

const languageCounts = Object.entries(
  lessons.reduce<Record<string, number>>((acc, l) => {
    acc[l.language] = (acc[l.language] ?? 0) + 1;
    return acc;
  }, {})
);

const visibleLessons = selectedLanguage
  ? lessons.filter((l) => l.language === selectedLanguage)
  : lessons;
```

- 「言語から探す」チップ行: 各言語について`getLanguageAsset`で取得したラベル+小さい画像アイコン+件数を横並びで表示。選択中の言語は枠線強調。もう一度クリックで解除。
- `grouped` / `uncategorized`の計算元を`lessons`から`visibleLessons`に差し替えるだけで、既存のカテゴリ別グルーピング表示ロジックはそのまま使い回せる。
- URLクエリ（`?language=xxx`、6.2のダッシュボードカードからの遷移用）があれば初期状態として`selectedLanguage`に反映する（`useSearchParams`）。

---

## 8. ダークモード・フォールバックの一覧確認

| ケース | 挙動 |
|--------|------|
| ロゴ画像、ダーク背景上 | `dark:bg-white`バッジで白背景を確保 |
| `language`が5言語以外（未知の値 / null） | `LessonCard`は`BookOpen`アイコン、ダッシュボード言語別カードは画像なし+言語名テキストのみのプレースホルダー |
| `total: 0`の言語 | ダッシュボードの言語別セクションから除外 |
| サイドバー折りたたみ時 | `Logo variant="icon"`でロゴ左側をクロップ表示 |

---

## 9. 変更・新規ファイル一覧

**新規**
- `frontend/public/images/logo/dev-init-logo.png`
- `frontend/public/images/languages/{php,python,javascript,ruby,java}.png`
- `frontend/src/lib/languages.ts`
- `frontend/src/components/Logo.tsx`

**変更**
- `frontend/src/app/favicon.ico`（差し替え）
- `frontend/src/components/Sidebar.tsx`
- `frontend/src/components/AdminSidebar.tsx`
- `frontend/src/app/(student)/login/page.tsx`
- `frontend/src/app/(student)/register/page.tsx`
- `frontend/src/app/(admin)/admin/login/page.tsx`
- `frontend/src/app/(student)/lessons/list/page.tsx`（`Lesson.language`追加、`LessonCard`のサムネイル化、言語グルーピングUI追加）
- `frontend/src/app/(student)/page.tsx`（`DashboardData`型拡張、「言語別」セクション追加）
- `backend/app/Services/DashboardService.php`（`language_progress`追加）

**スコープ外（変更しない）**
- `LessonController` / `LessonResource`（`language`は既に無加工でJSONに含まれているため変更不要。`Lesson`モデルに`$hidden`指定なしを確認済み）

---

**承認待ち**: 内容をご確認ください。問題なければタスク分解（`tasks.md`）に進みます。
