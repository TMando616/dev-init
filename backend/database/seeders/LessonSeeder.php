<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Lesson;
use Illuminate\Database\Seeder;

class LessonSeeder extends Seeder
{
    public function run(): void
    {
        $js     = Category::where('name', 'JavaScript基礎')->first();
        $php    = Category::where('name', 'PHP基礎')->first();
        $python = Category::where('name', 'Python基礎')->first();
        $java   = Category::where('name', 'Java基礎')->first();

        $jsLessons = [
            [
                'title'           => 'Hello, World! を表示しよう',
                'content'         => "# 演習1: Hello, World!\n\n`console.log()` を使って `Hello, World!` を表示してください。",
                'model_answer'    => "console.log('Hello, World!');",
                'expected_output' => "Hello, World!",
                'language'        => 'javascript',
            ],
            [
                'title'           => '変数に値を代入して表示しよう',
                'content'         => "# 演習2: 変数\n\n`const` を使って変数 `name` に自分の名前を代入し、表示してください。",
                'model_answer'    => "const name = 'Alice';\nconsole.log(name);",
                'expected_output' => "Alice",
                'language'        => 'javascript',
            ],
            [
                'title'           => '2つの数値を足し算しよう',
                'content'         => "# 演習3: 算術演算子\n\n変数 `a = 5`、`b = 3` を定義して、その合計を表示してください。",
                'model_answer'    => "const a = 5;\nconst b = 3;\nconsole.log(a + b);",
                'expected_output' => "8",
                'language'        => 'javascript',
            ],
            [
                'title'           => 'if文で条件分岐しよう',
                'content'         => "# 演習4: 条件分岐\n\n変数 `score = 75` を定義し、60以上なら `合格`、未満なら `不合格` を表示してください。",
                'model_answer'    => "const score = 75;\nif (score >= 60) {\n  console.log('合格');\n} else {\n  console.log('不合格');\n}",
                'expected_output' => "合格",
                'language'        => 'javascript',
            ],
            [
                'title'           => 'for文で1から5を表示しよう',
                'content'         => "# 演習5: ループ\n\n`for` 文を使って1から5までの数値を1行ずつ表示してください。",
                'model_answer'    => "for (let i = 1; i <= 5; i++) {\n  console.log(i);\n}",
                'expected_output' => "1\n2\n3\n4\n5",
                'language'        => 'javascript',
            ],
            [
                'title'           => '関数を定義して呼び出そう',
                'content'         => "# 演習6: 関数\n\n2つの数値を受け取り、その合計を返す関数 `add` を定義して、`add(3, 5)` の結果を表示してください。",
                'model_answer'    => "function add(a, b) {\n  return a + b;\n}\nconsole.log(add(3, 5));",
                'expected_output' => "8",
                'language'        => 'javascript',
            ],
            [
                'title'           => '配列の要素を表示しよう',
                'content'         => "# 演習7: 配列\n\n`fruits = ['apple', 'banana', 'cherry']` を定義し、`forEach` で1行ずつ表示してください。",
                'model_answer'    => "const fruits = ['apple', 'banana', 'cherry'];\nfruits.forEach(fruit => console.log(fruit));",
                'expected_output' => "apple\nbanana\ncherry",
                'language'        => 'javascript',
            ],
            [
                'title'           => '配列をmapで変換しよう',
                'content'         => "# 演習8: map\n\n`[1, 2, 3, 4, 5]` の各要素を2倍にした配列を作り、`console.log` で表示してください。",
                'model_answer'    => "const nums = [1, 2, 3, 4, 5];\nconst doubled = nums.map(n => n * 2);\nconsole.log(doubled.join('\\n'));",
                'expected_output' => "2\n4\n6\n8\n10",
                'language'        => 'javascript',
            ],
            [
                'title'           => 'オブジェクトのプロパティを表示しよう',
                'content'         => "# 演習9: オブジェクト\n\n`{ name: 'Alice', age: 25 }` のオブジェクトを定義し、`name` と `age` を表示してください。",
                'model_answer'    => "const user = { name: 'Alice', age: 25 };\nconsole.log(user.name);\nconsole.log(user.age);",
                'expected_output' => "Alice\n25",
                'language'        => 'javascript',
            ],
            [
                'title'           => 'アロー関数を使ってみよう',
                'content'         => "# 演習10: アロー関数\n\n2つの数値を受け取り積を返すアロー関数 `multiply` を定義し、`multiply(4, 7)` を表示してください。",
                'model_answer'    => "const multiply = (a, b) => a * b;\nconsole.log(multiply(4, 7));",
                'expected_output' => "28",
                'language'        => 'javascript',
            ],
        ];

        $phpLessons = [
            [
                'title'           => 'Hello, World! を表示しよう',
                'content'         => "# 演習1: Hello, World!\n\n`echo` を使って `Hello, World!` を表示してください。",
                'model_answer'    => "<?php\necho \"Hello, World!\";",
                'expected_output' => "Hello, World!",
                'language'        => 'php',
            ],
            [
                'title'           => '変数に値を代入して表示しよう',
                'content'         => "# 演習2: 変数\n\n変数 `\$name` に自分の名前を代入し、表示してください。",
                'model_answer'    => "<?php\n\$name = 'Alice';\necho \$name;",
                'expected_output' => "Alice",
                'language'        => 'php',
            ],
            [
                'title'           => '2つの数値を足し算しよう',
                'content'         => "# 演習3: 算術演算子\n\n変数 `\$a = 5`、`\$b = 3` を定義し、合計を表示してください。",
                'model_answer'    => "<?php\n\$a = 5;\n\$b = 3;\necho \$a + \$b;",
                'expected_output' => "8",
                'language'        => 'php',
            ],
            [
                'title'           => 'if文で条件分岐しよう',
                'content'         => "# 演習4: 条件分岐\n\n変数 `\$score = 75` を定義し、60以上なら `合格`、未満なら `不合格` を表示してください。",
                'model_answer'    => "<?php\n\$score = 75;\nif (\$score >= 60) {\n    echo '合格';\n} else {\n    echo '不合格';\n}",
                'expected_output' => "合格",
                'language'        => 'php',
            ],
            [
                'title'           => 'for文で1から5を表示しよう',
                'content'         => "# 演習5: ループ\n\n`for` 文を使って1から5までを1行ずつ表示してください。",
                'model_answer'    => "<?php\nfor (\$i = 1; \$i <= 5; \$i++) {\n    echo \$i . \"\\n\";\n}",
                'expected_output' => "1\n2\n3\n4\n5",
                'language'        => 'php',
            ],
            [
                'title'           => '関数を定義して呼び出そう',
                'content'         => "# 演習6: 関数\n\n2つの数値を受け取り合計を返す関数 `add` を定義して、`add(3, 5)` を表示してください。",
                'model_answer'    => "<?php\nfunction add(int \$a, int \$b): int {\n    return \$a + \$b;\n}\necho add(3, 5);",
                'expected_output' => "8",
                'language'        => 'php',
            ],
            [
                'title'           => '配列の要素を表示しよう',
                'content'         => "# 演習7: 配列\n\n`\$fruits = ['apple', 'banana', 'cherry']` を定義し、`foreach` で1行ずつ表示してください。",
                'model_answer'    => "<?php\n\$fruits = ['apple', 'banana', 'cherry'];\nforeach (\$fruits as \$fruit) {\n    echo \$fruit . \"\\n\";\n}",
                'expected_output' => "apple\nbanana\ncherry",
                'language'        => 'php',
            ],
            [
                'title'           => 'array_mapで配列を変換しよう',
                'content'         => "# 演習8: array_map\n\n`[1, 2, 3, 4, 5]` の各要素を2倍にした配列を作り、各要素を1行ずつ表示してください。",
                'model_answer'    => "<?php\n\$nums = [1, 2, 3, 4, 5];\n\$doubled = array_map(fn(\$n) => \$n * 2, \$nums);\necho implode(\"\\n\", \$doubled);",
                'expected_output' => "2\n4\n6\n8\n10",
                'language'        => 'php',
            ],
            [
                'title'           => '連想配列のプロパティを表示しよう',
                'content'         => "# 演習9: 連想配列\n\n`['name' => 'Alice', 'age' => 25]` を定義し、`name` と `age` を別々の行で表示してください。",
                'model_answer'    => "<?php\n\$user = ['name' => 'Alice', 'age' => 25];\necho \$user['name'] . \"\\n\";\necho \$user['age'];",
                'expected_output' => "Alice\n25",
                'language'        => 'php',
            ],
            [
                'title'           => 'クラスを定義してインスタンスを作ろう',
                'content'         => "# 演習10: クラス\n\n`name` プロパティを持つ `User` クラスを定義し、`greet()` メソッドで `こんにちは、Alice！` を返すようにしてください。",
                'model_answer'    => "<?php\nclass User {\n    public function __construct(public string \$name) {}\n    public function greet(): string {\n        return \"こんにちは、{\$this->name}！\";\n    }\n}\n\$user = new User('Alice');\necho \$user->greet();",
                'expected_output' => "こんにちは、Alice！",
                'language'        => 'php',
            ],
        ];

        $pythonLessons = [
            [
                'title'           => 'Hello, World! を表示しよう',
                'content'         => "# 演習1: Hello, World!\n\n`print()` を使って `Hello, World!` を表示してください。",
                'model_answer'    => "print('Hello, World!')",
                'expected_output' => "Hello, World!",
                'language'        => 'python',
            ],
            [
                'title'           => '変数に値を代入して表示しよう',
                'content'         => "# 演習2: 変数\n\n変数 `name` に自分の名前を代入し、表示してください。",
                'model_answer'    => "name = 'Alice'\nprint(name)",
                'expected_output' => "Alice",
                'language'        => 'python',
            ],
            [
                'title'           => '2つの数値を足し算しよう',
                'content'         => "# 演習3: 算術演算子\n\n変数 `a = 5`、`b = 3` を定義して、その合計を表示してください。",
                'model_answer'    => "a = 5\nb = 3\nprint(a + b)",
                'expected_output' => "8",
                'language'        => 'python',
            ],
            [
                'title'           => 'if文で条件分岐しよう',
                'content'         => "# 演習4: 条件分岐\n\n変数 `score = 75` を定義し、60以上なら `合格`、未満なら `不合格` を表示してください。",
                'model_answer'    => "score = 75\nif score >= 60:\n    print('合格')\nelse:\n    print('不合格')",
                'expected_output' => "合格",
                'language'        => 'python',
            ],
            [
                'title'           => 'for文で1から5を表示しよう',
                'content'         => "# 演習5: ループ\n\n`for` 文と `range` を使って1から5までの数値を1行ずつ表示してください。",
                'model_answer'    => "for i in range(1, 6):\n    print(i)",
                'expected_output' => "1\n2\n3\n4\n5",
                'language'        => 'python',
            ],
            [
                'title'           => '関数を定義して呼び出そう',
                'content'         => "# 演習6: 関数\n\n2つの数値を受け取り、その合計を返す関数 `add` を定義して、`add(3, 5)` の結果を表示してください。",
                'model_answer'    => "def add(a, b):\n    return a + b\n\nprint(add(3, 5))",
                'expected_output' => "8",
                'language'        => 'python',
            ],
            [
                'title'           => 'リストの要素を表示しよう',
                'content'         => "# 演習7: リスト\n\n`fruits = ['apple', 'banana', 'cherry']` を定義し、`for` 文で1行ずつ表示してください。",
                'model_answer'    => "fruits = ['apple', 'banana', 'cherry']\nfor fruit in fruits:\n    print(fruit)",
                'expected_output' => "apple\nbanana\ncherry",
                'language'        => 'python',
            ],
            [
                'title'           => 'リスト内包表記でリストを変換しよう',
                'content'         => "# 演習8: リスト内包表記\n\n`[1, 2, 3, 4, 5]` の各要素を2倍にしたリストを作り、1行ずつ表示してください。",
                'model_answer'    => "nums = [1, 2, 3, 4, 5]\ndoubled = [n * 2 for n in nums]\nprint('\\n'.join(map(str, doubled)))",
                'expected_output' => "2\n4\n6\n8\n10",
                'language'        => 'python',
            ],
            [
                'title'           => '辞書のプロパティを表示しよう',
                'content'         => "# 演習9: 辞書\n\n`{'name': 'Alice', 'age': 25}` の辞書を定義し、`name` と `age` を表示してください。",
                'model_answer'    => "user = {'name': 'Alice', 'age': 25}\nprint(user['name'])\nprint(user['age'])",
                'expected_output' => "Alice\n25",
                'language'        => 'python',
            ],
            [
                'title'           => 'クラスを定義してインスタンスを作ろう',
                'content'         => "# 演習10: クラス\n\n`name` 属性を持つ `User` クラスを定義し、`greet()` メソッドで `こんにちは、Alice！` を返すようにしてください。",
                'model_answer'    => "class User:\n    def __init__(self, name):\n        self.name = name\n\n    def greet(self):\n        return f'こんにちは、{self.name}！'\n\nuser = User('Alice')\nprint(user.greet())",
                'expected_output' => "こんにちは、Alice！",
                'language'        => 'python',
            ],
        ];

        $javaLessons = [
            [
                'title'           => 'Hello, World! を表示しよう',
                'content'         => "# 演習1: Hello, World!\n\n`System.out.println()` を使って `Hello, World!` を表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
                'expected_output' => "Hello, World!",
                'language'        => 'java',
            ],
            [
                'title'           => '変数に値を代入して表示しよう',
                'content'         => "# 演習2: 変数\n\n変数 `name` に自分の名前を代入し、表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        String name = \"Alice\";\n        System.out.println(name);\n    }\n}",
                'expected_output' => "Alice",
                'language'        => 'java',
            ],
            [
                'title'           => '2つの数値を足し算しよう',
                'content'         => "# 演習3: 算術演算子\n\n変数 `a = 5`、`b = 3` を定義して、その合計を表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        int a = 5;\n        int b = 3;\n        System.out.println(a + b);\n    }\n}",
                'expected_output' => "8",
                'language'        => 'java',
            ],
            [
                'title'           => 'if文で条件分岐しよう',
                'content'         => "# 演習4: 条件分岐\n\n変数 `score = 75` を定義し、60以上なら `合格`、未満なら `不合格` を表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        int score = 75;\n        if (score >= 60) {\n            System.out.println(\"合格\");\n        } else {\n            System.out.println(\"不合格\");\n        }\n    }\n}",
                'expected_output' => "合格",
                'language'        => 'java',
            ],
            [
                'title'           => 'for文で1から5を表示しよう',
                'content'         => "# 演習5: ループ\n\n`for` 文を使って1から5までの数値を1行ずつ表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        for (int i = 1; i <= 5; i++) {\n            System.out.println(i);\n        }\n    }\n}",
                'expected_output' => "1\n2\n3\n4\n5",
                'language'        => 'java',
            ],
            [
                'title'           => 'メソッドを定義して呼び出そう',
                'content'         => "# 演習6: メソッド\n\n2つの数値を受け取り、その合計を返す静的メソッド `add` を定義して、`add(3, 5)` の結果を表示してください。",
                'model_answer'    => "public class Main {\n    static int add(int a, int b) {\n        return a + b;\n    }\n\n    public static void main(String[] args) {\n        System.out.println(add(3, 5));\n    }\n}",
                'expected_output' => "8",
                'language'        => 'java',
            ],
            [
                'title'           => '配列の要素を表示しよう',
                'content'         => "# 演習7: 配列\n\n`String[] fruits = {\"apple\", \"banana\", \"cherry\"}` を定義し、拡張for文で1行ずつ表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        String[] fruits = {\"apple\", \"banana\", \"cherry\"};\n        for (String fruit : fruits) {\n            System.out.println(fruit);\n        }\n    }\n}",
                'expected_output' => "apple\nbanana\ncherry",
                'language'        => 'java',
            ],
            [
                'title'           => '配列の要素を変換しよう',
                'content'         => "# 演習8: 配列の変換\n\n`int[] nums = {1, 2, 3, 4, 5}` の各要素を2倍にして1行ずつ表示してください。",
                'model_answer'    => "public class Main {\n    public static void main(String[] args) {\n        int[] nums = {1, 2, 3, 4, 5};\n        for (int n : nums) {\n            System.out.println(n * 2);\n        }\n    }\n}",
                'expected_output' => "2\n4\n6\n8\n10",
                'language'        => 'java',
            ],
            [
                'title'           => 'Mapのプロパティを表示しよう',
                'content'         => "# 演習9: Map\n\n`HashMap<String, Object>` を使って `name` と `age` を格納し、それぞれ表示してください。",
                'model_answer'    => "import java.util.HashMap;\nimport java.util.Map;\n\npublic class Main {\n    public static void main(String[] args) {\n        Map<String, Object> user = new HashMap<>();\n        user.put(\"name\", \"Alice\");\n        user.put(\"age\", 25);\n        System.out.println(user.get(\"name\"));\n        System.out.println(user.get(\"age\"));\n    }\n}",
                'expected_output' => "Alice\n25",
                'language'        => 'java',
            ],
            [
                'title'           => 'クラスを定義してインスタンスを作ろう',
                'content'         => "# 演習10: クラス\n\n`name` フィールドを持つ `User` クラスを定義し、`greet()` メソッドで `こんにちは、Alice！` を返すようにしてください。",
                'model_answer'    => "public class Main {\n    static class User {\n        private String name;\n\n        public User(String name) {\n            this.name = name;\n        }\n\n        public String greet() {\n            return \"こんにちは、\" + name + \"！\";\n        }\n    }\n\n    public static void main(String[] args) {\n        User user = new User(\"Alice\");\n        System.out.println(user.greet());\n    }\n}",
                'expected_output' => "こんにちは、Alice！",
                'language'        => 'java',
            ],
        ];

        foreach ($jsLessons as $data) {
            $lesson = Lesson::create($data);
            if ($js) {
                $lesson->categories()->sync([$js->id]);
            }
        }

        foreach ($phpLessons as $data) {
            $lesson = Lesson::create($data);
            if ($php) {
                $lesson->categories()->sync([$php->id]);
            }
        }

        foreach ($pythonLessons as $data) {
            $lesson = Lesson::create($data);
            if ($python) {
                $lesson->categories()->sync([$python->id]);
            }
        }

        foreach ($javaLessons as $data) {
            $lesson = Lesson::create($data);
            if ($java) {
                $lesson->categories()->sync([$java->id]);
            }
        }
    }
}
