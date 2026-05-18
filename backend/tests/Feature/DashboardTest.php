<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_dashboard_returns_correct_aggregation()
    {
        // Setup: 2 categories, 3 lessons
        $cat1 = Category::factory()->create(['name' => 'Cat 1']);
        $cat2 = Category::factory()->create(['name' => 'Cat 2']);
        
        $lesson1 = Lesson::factory()->create(['title' => 'Lesson 1']);
        $lesson2 = Lesson::factory()->create(['title' => 'Lesson 2']);
        $lesson3 = Lesson::factory()->create(['title' => 'Lesson 3']);
        
        // Relationships:
        // Lesson 1 -> Cat 1
        // Lesson 2 -> Cat 1, Cat 2
        // Lesson 3 -> Cat 2
        $lesson1->categories()->attach($cat1);
        $lesson2->categories()->attach([$cat1->id, $cat2->id]);
        $lesson3->categories()->attach($cat2);
        
        // User completes Lesson 1 and Lesson 2
        Submission::create([
            'user_id' => $this->user->id,
            'lesson_id' => $lesson1->id,
            'code' => '// test',
            'status' => 'completed',
        ]);
        
        Submission::create([
            'user_id' => $this->user->id,
            'lesson_id' => $lesson2->id,
            'code' => '// test',
            'status' => 'completed',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('overall_progress.completed', 2)
            ->assertJsonPath('overall_progress.total', 3)
            ->assertJsonPath('overall_progress.percentage', 67); // 2/3 * 100

        // Category Progress
        // Cat 1: total 2 (L1, L2), completed 2
        // Cat 2: total 2 (L2, L3), completed 1 (L2)
        $response->assertJsonFragment([
            'name' => 'Cat 1',
            'completed' => 2,
            'total' => 2,
        ])->assertJsonFragment([
            'name' => 'Cat 2',
            'completed' => 1,
            'total' => 2,
        ]);
        
        // Recent Lesson should be Lesson 2
        $response->assertJsonPath('recent_lesson.title', 'Lesson 2');
    }

    public function test_dashboard_empty_state()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('overall_progress.total', 0)
            ->assertJsonPath('recent_lesson', null);
    }
}
