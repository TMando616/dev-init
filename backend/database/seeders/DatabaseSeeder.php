<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Seeder;
use Database\Seeders\LessonSeeder;
use Database\Seeders\MaterialSeeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Initial Categories
        Category::create([
            'name' => 'JavaScript基礎',
            'description' => 'JavaScriptの基本的な文法と概念を学びます。',
        ]);
        Category::create([
            'name' => 'PHP基礎',
            'description' => 'PHPの基本的な文法とWeb開発への応用を学びます。',
        ]);
        Category::create([
            'name' => 'React入門',
            'description' => 'Reactのコンポーネント、フック、状態管理について学びます。',
        ]);
        Category::create([
            'name' => 'Webデザイン',
            'description' => 'HTML, CSSを使用したモダンなWebデザインを学びます。',
        ]);

        // Admin (managed separately from students)
        Admin::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        // Student
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Structured Lessons & Materials
        $this->call([
            LessonSeeder::class,
            MaterialSeeder::class,
        ]);
    }
}
