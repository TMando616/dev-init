<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Material;
use Illuminate\Database\Seeder;

class MaterialSeeder extends Seeder
{
    public function run(): void
    {
        $js  = Category::where('name', 'JavaScript基礎')->first();
        $php = Category::where('name', 'PHP基礎')->first();

        $jsMaterials = [
            [
                'title'   => 'JavaScriptとは？',
                'order'   => 1,
                'content' => <<<'MD'
# JavaScriptとは？

JavaScriptはブラウザ上で動作するプログラミング言語です。HTMLやCSSと組み合わせてWebページに動きをつけることができます。

## 特徴

- **インタープリタ型**: コードを1行ずつ解釈して実行します。
- **動的型付け**: 変数の型は実行時に決まります。
- **シングルスレッド**: 一度に1つの処理を実行しますが、非同期処理で効率化できます。

## はじめてのJavaScript

```javascript
console.log("Hello, World!");
```

ブラウザの開発者ツール（F12）を開いてコンソールタブで試してみましょう。
MD,
            ],
            [
                'title'   => '変数と定数',
                'order'   => 2,
                'content' => <<<'MD'
# 変数と定数

JavaScriptで値を保持するには変数・定数を使います。

## const（定数）

再代入できない値を宣言します。基本的にはこちらを使いましょう。

```javascript
const name = "Alice";
console.log(name); // Alice
```

## let（変数）

再代入が必要な場合に使います。

```javascript
let count = 0;
count = count + 1;
console.log(count); // 1
```

## var（非推奨）

古いコードで見かけますが、現代では使いません。スコープの扱いが直感的でないためです。
MD,
            ],
            [
                'title'   => 'データ型',
                'order'   => 3,
                'content' => <<<'MD'
# データ型

JavaScriptには主に以下のデータ型があります。

| 型 | 例 | 説明 |
|----|-----|------|
| `string` | `"hello"` | 文字列 |
| `number` | `42`, `3.14` | 数値 |
| `boolean` | `true`, `false` | 真偽値 |
| `null` | `null` | 値がないことを明示 |
| `undefined` | `undefined` | 未定義 |
| `object` | `{ key: "value" }` | オブジェクト |
| `array` | `[1, 2, 3]` | 配列（objectの一種） |

## typeof で型を確認

```javascript
console.log(typeof "hello"); // "string"
console.log(typeof 42);      // "number"
console.log(typeof true);    // "boolean"
```
MD,
            ],
            [
                'title'   => '演算子',
                'order'   => 4,
                'content' => <<<'MD'
# 演算子

## 算術演算子

```javascript
console.log(5 + 3);  // 8
console.log(10 - 4); // 6
console.log(3 * 4);  // 12
console.log(10 / 2); // 5
console.log(10 % 3); // 1（余り）
console.log(2 ** 8); // 256（べき乗）
```

## 比較演算子

```javascript
console.log(5 === 5);  // true（厳密等価）
console.log(5 !== 3);  // true（厳密不等価）
console.log(10 > 5);   // true
console.log(3 <= 3);   // true
```

> **注意**: `==` より `===` を使いましょう。`==` は型変換を行うため意図しない結果になることがあります。
MD,
            ],
            [
                'title'   => '条件分岐（if文）',
                'order'   => 5,
                'content' => <<<'MD'
# 条件分岐

## if / else if / else

```javascript
const score = 75;

if (score >= 90) {
    console.log("優秀");
} else if (score >= 60) {
    console.log("合格");
} else {
    console.log("不合格");
}
// → 合格
```

## 三項演算子

簡単な条件分岐を1行で書けます。

```javascript
const age = 20;
const status = age >= 18 ? "成人" : "未成年";
console.log(status); // 成人
```

## switch文

複数の値に対する分岐に便利です。

```javascript
const day = "月";
switch (day) {
    case "土":
    case "日":
        console.log("休日");
        break;
    default:
        console.log("平日");
}
```
MD,
            ],
            [
                'title'   => 'ループ',
                'order'   => 6,
                'content' => <<<'MD'
# ループ

## for文

```javascript
for (let i = 0; i < 5; i++) {
    console.log(i); // 0 1 2 3 4
}
```

## while文

```javascript
let n = 1;
while (n <= 3) {
    console.log(n);
    n++;
}
// 1 2 3
```

## for...of（配列の繰り返し）

```javascript
const fruits = ["apple", "banana", "cherry"];
for (const fruit of fruits) {
    console.log(fruit);
}
```

## forEach（配列メソッド）

```javascript
[1, 2, 3].forEach(num => console.log(num * 2));
// 2 4 6
```
MD,
            ],
            [
                'title'   => '関数',
                'order'   => 7,
                'content' => <<<'MD'
# 関数

## 関数宣言

```javascript
function greet(name) {
    return "こんにちは、" + name + "！";
}
console.log(greet("Alice")); // こんにちは、Alice！
```

## アロー関数

モダンなJavaScriptで多用される短い書き方です。

```javascript
const add = (a, b) => a + b;
console.log(add(3, 5)); // 8
```

## デフォルト引数

```javascript
const greet = (name = "ゲスト") => `こんにちは、${name}！`;
console.log(greet());        // こんにちは、ゲスト！
console.log(greet("Bob"));   // こんにちは、Bob！
```
MD,
            ],
            [
                'title'   => '配列',
                'order'   => 8,
                'content' => <<<'MD'
# 配列

## 基本操作

```javascript
const arr = [1, 2, 3];
arr.push(4);    // 末尾に追加 → [1, 2, 3, 4]
arr.pop();      // 末尾を削除 → [1, 2, 3]
arr.unshift(0); // 先頭に追加 → [0, 1, 2, 3]
arr.shift();    // 先頭を削除 → [1, 2, 3]
```

## 高階関数

```javascript
const numbers = [1, 2, 3, 4, 5];

// filter: 条件に合う要素を抽出
const evens = numbers.filter(n => n % 2 === 0); // [2, 4]

// map: 各要素を変換
const doubled = numbers.map(n => n * 2); // [2, 4, 6, 8, 10]

// reduce: 集計
const sum = numbers.reduce((acc, n) => acc + n, 0); // 15
```
MD,
            ],
            [
                'title'   => 'オブジェクト',
                'order'   => 9,
                'content' => <<<'MD'
# オブジェクト

## 基本

```javascript
const user = {
    name: "Alice",
    age: 25,
    isAdmin: false,
};

console.log(user.name);      // Alice
console.log(user["age"]);    // 25
```

## メソッド

```javascript
const counter = {
    count: 0,
    increment() {
        this.count++;
    },
};
counter.increment();
console.log(counter.count); // 1
```

## 分割代入

```javascript
const { name, age } = user;
console.log(name); // Alice
console.log(age);  // 25
```

## スプレッド演算子

```javascript
const updated = { ...user, age: 26 };
console.log(updated.age); // 26
```
MD,
            ],
            [
                'title'   => '非同期処理（Promise / async・await）',
                'order'   => 10,
                'content' => <<<'MD'
# 非同期処理

JavaScriptはシングルスレッドですが、非同期処理で待ち時間を有効活用できます。

## Promise

```javascript
const wait = (ms) =>
    new Promise(resolve => setTimeout(resolve, ms));

wait(1000).then(() => console.log("1秒後！"));
```

## async / await

Promiseをより読みやすく書ける構文です。

```javascript
async function fetchData() {
    try {
        const response = await fetch("https://api.example.com/data");
        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("エラー:", error);
    }
}
```

> **ポイント**: `await` は `async` 関数の中でのみ使えます。エラーは `try/catch` で捕捉しましょう。
MD,
            ],
        ];

        $phpMaterials = [
            [
                'title'   => 'PHPとは？',
                'order'   => 1,
                'content' => <<<'MD'
# PHPとは？

PHPはWebサーバー上で動作するサーバーサイドのプログラミング言語です。HTMLに埋め込んで動的なWebページを生成するために広く使われています。

## 特徴

- **オープンソース**: 無料で利用・配布できます。
- **Web特化**: HTMLとの親和性が高く、Web開発に特化した関数が豊富です。
- **広い普及率**: WordPressなど多くのCMSに使われています。

## はじめてのPHP

```php
<?php
echo "Hello, World!";
```

`<?php` タグでPHPコードの開始を宣言します。
MD,
            ],
            [
                'title'   => '変数とデータ型',
                'order'   => 2,
                'content' => <<<'MD'
# 変数とデータ型

## 変数

PHPの変数は `$` で始まります。

```php
<?php
$name = "Alice";
$age = 25;
$price = 3.14;
$isAdmin = true;

echo $name; // Alice
```

## 主なデータ型

| 型 | 例 |
|----|-----|
| `string` | `"hello"` |
| `int` | `42` |
| `float` | `3.14` |
| `bool` | `true`, `false` |
| `array` | `[1, 2, 3]` |
| `null` | `null` |

## 型の確認

```php
var_dump($age);     // int(25)
var_dump($name);    // string(5) "Alice"
gettype($price);    // "double"
```
MD,
            ],
            [
                'title'   => '文字列操作',
                'order'   => 3,
                'content' => <<<'MD'
# 文字列操作

## 連結

```php
<?php
$first = "Hello";
$second = "World";
echo $first . ", " . $second . "!"; // Hello, World!
```

## ヒアドキュメント

複数行の文字列を書くのに便利です。

```php
$message = <<<EOT
こんにちは！
PHPへようこそ。
EOT;
echo $message;
```

## よく使う文字列関数

```php
strlen("Hello");          // 5（文字数）
strtoupper("hello");      // "HELLO"
strtolower("HELLO");      // "hello"
str_replace("o", "0", "Hello World"); // "Hell0 W0rld"
trim("  hello  ");        // "hello"
explode(",", "a,b,c");    // ["a", "b", "c"]
```
MD,
            ],
            [
                'title'   => '条件分岐',
                'order'   => 4,
                'content' => <<<'MD'
# 条件分岐

## if / elseif / else

```php
<?php
$score = 75;

if ($score >= 90) {
    echo "優秀";
} elseif ($score >= 60) {
    echo "合格";
} else {
    echo "不合格";
}
// 合格
```

## match式（PHP 8.0以降）

```php
$status = 2;
$label = match($status) {
    1 => "pending",
    2 => "active",
    3 => "inactive",
    default => "unknown",
};
echo $label; // active
```

## 三項演算子

```php
$age = 20;
$type = $age >= 18 ? "成人" : "未成年";
echo $type; // 成人
```
MD,
            ],
            [
                'title'   => 'ループ',
                'order'   => 5,
                'content' => <<<'MD'
# ループ

## for文

```php
<?php
for ($i = 0; $i < 5; $i++) {
    echo $i . " "; // 0 1 2 3 4
}
```

## while文

```php
$n = 1;
while ($n <= 3) {
    echo $n . "\n";
    $n++;
}
```

## foreach（配列の繰り返し）

```php
$fruits = ["apple", "banana", "cherry"];
foreach ($fruits as $fruit) {
    echo $fruit . "\n";
}

// キーと値の両方を取得
$user = ["name" => "Alice", "age" => 25];
foreach ($user as $key => $value) {
    echo "$key: $value\n";
}
```
MD,
            ],
            [
                'title'   => '関数',
                'order'   => 6,
                'content' => <<<'MD'
# 関数

## 定義と呼び出し

```php
<?php
function greet(string $name): string {
    return "こんにちは、{$name}！";
}

echo greet("Alice"); // こんにちは、Alice！
```

## デフォルト引数

```php
function greet(string $name = "ゲスト"): string {
    return "こんにちは、{$name}！";
}
echo greet();        // こんにちは、ゲスト！
echo greet("Bob");   // こんにちは、Bob！
```

## 無名関数・アロー関数

```php
$add = fn(int $a, int $b): int => $a + $b;
echo $add(3, 5); // 8
```

## 可変長引数

```php
function sum(int ...$nums): int {
    return array_sum($nums);
}
echo sum(1, 2, 3, 4); // 10
```
MD,
            ],
            [
                'title'   => '配列',
                'order'   => 7,
                'content' => <<<'MD'
# 配列

## インデックス配列

```php
<?php
$arr = [1, 2, 3];
$arr[] = 4;          // 末尾に追加
array_push($arr, 5); // 同上
array_pop($arr);     // 末尾を削除
```

## 連想配列

```php
$user = [
    "name" => "Alice",
    "age"  => 25,
];
echo $user["name"]; // Alice
```

## よく使う配列関数

```php
$numbers = [3, 1, 4, 1, 5, 9];

sort($numbers);              // 昇順ソート
$filtered = array_filter($numbers, fn($n) => $n > 3); // [4, 5, 9]
$mapped = array_map(fn($n) => $n * 2, $numbers);
$sum = array_sum($numbers);  // 合計
count($numbers);             // 要素数
in_array(5, $numbers);       // true
```
MD,
            ],
            [
                'title'   => 'クラスとオブジェクト',
                'order'   => 8,
                'content' => <<<'MD'
# クラスとオブジェクト

## クラスの定義

```php
<?php
class User {
    public string $name;
    private int $age;

    public function __construct(string $name, int $age) {
        $this->name = $name;
        $this->age = $age;
    }

    public function getAge(): int {
        return $this->age;
    }

    public function greet(): string {
        return "こんにちは、{$this->name}！";
    }
}

$user = new User("Alice", 25);
echo $user->greet();     // こんにちは、Alice！
echo $user->getAge();    // 25
```

## 継承

```php
class AdminUser extends User {
    public function greet(): string {
        return parent::greet() . "（管理者）";
    }
}

$admin = new AdminUser("Bob", 30);
echo $admin->greet(); // こんにちは、Bob！（管理者）
```
MD,
            ],
            [
                'title'   => '例外処理',
                'order'   => 9,
                'content' => <<<'MD'
# 例外処理

エラーが発生した場合に備えて、`try/catch` で安全に処理します。

## 基本

```php
<?php
function divide(int $a, int $b): float {
    if ($b === 0) {
        throw new \InvalidArgumentException("ゼロ除算はできません");
    }
    return $a / $b;
}

try {
    echo divide(10, 2);  // 5
    echo divide(10, 0);  // 例外が発生
} catch (\InvalidArgumentException $e) {
    echo "エラー: " . $e->getMessage();
} finally {
    echo "処理終了";
}
```

## カスタム例外

```php
class ValidationException extends \RuntimeException {}

throw new ValidationException("バリデーションエラー");
```
MD,
            ],
            [
                'title'   => 'ファイル操作と入出力',
                'order'   => 10,
                'content' => <<<'MD'
# ファイル操作と入出力

## ファイルの読み書き

```php
<?php
// 書き込み
file_put_contents("hello.txt", "Hello, World!\n");

// 読み込み（文字列）
$content = file_get_contents("hello.txt");
echo $content;

// 読み込み（行ごとに配列）
$lines = file("hello.txt", FILE_IGNORE_NEW_LINES);
foreach ($lines as $line) {
    echo $line . "\n";
}
```

## 標準入出力

```php
// 出力
echo "Hello\n";
print("World\n");

// 標準入力（CLIで対話的に入力を受け取る）
$input = trim(fgets(STDIN));
echo "入力値: " . $input;
```

## JSON

```php
$data = ["name" => "Alice", "age" => 25];
$json = json_encode($data, JSON_UNESCAPED_UNICODE);
// {"name":"Alice","age":25}

$decoded = json_decode($json, true);
echo $decoded["name"]; // Alice
```
MD,
            ],
        ];

        foreach ($jsMaterials as $data) {
            Material::create([
                'title'       => $data['title'],
                'content'     => $data['content'],
                'category_id' => $js?->id,
                'order'       => $data['order'],
            ]);
        }

        foreach ($phpMaterials as $data) {
            Material::create([
                'title'       => $data['title'],
                'content'     => $data['content'],
                'category_id' => $php?->id,
                'order'       => $data['order'],
            ]);
        }
    }
}
