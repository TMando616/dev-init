<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Admin user
        User::factory()->admin()->create([
            'name' => 'Admin User',
            'email' => 'admin@example.com',
        ]);

        // Regular user
        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // Sample Lessons
        Lesson::factory()->create([
            'title' => 'Getting Started with JavaScript',
            'content' => "# Getting Started\n\nWelcome to your first lesson! In this lesson, we will learn how to print 'Hello, World!' to the console.",
            'model_answer' => "console.log('Hello, World!');",
        ]);

        Lesson::factory()->create([
            'title' => 'Variables and Types',
            'content' => "# Variables\n\nLearn about `const`, `let`, and basic data types in JavaScript.",
            'model_answer' => "const message = 'Hello';\nconsole.log(message);",
        ]);

        Lesson::factory(3)->create();
    }
}
