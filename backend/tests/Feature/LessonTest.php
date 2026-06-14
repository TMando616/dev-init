<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LessonTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->admin = Admin::factory()->create();
    }

    public function test_user_can_list_lessons()
    {
        Lesson::factory(3)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/lessons');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_show_lesson()
    {
        $lesson = Lesson::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/lessons/{$lesson->id}");

        $response->assertStatus(200)
            ->assertJsonPath('title', $lesson->title);
    }

    public function test_student_cannot_create_lesson()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/admin/lessons', [
                'title' => 'New Lesson',
                'content' => 'Content',
            ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_create_lesson()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/lessons', [
                'title' => 'Admin Lesson',
                'content' => 'Admin Content',
                'model_answer' => 'console.log(1)',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'Admin Lesson');

        $this->assertDatabaseHas('lessons', ['title' => 'Admin Lesson']);
    }

    public function test_admin_can_update_lesson()
    {
        $lesson = Lesson::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/lessons/{$lesson->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('title', 'Updated Title');
    }

    public function test_admin_can_delete_lesson()
    {
        $lesson = Lesson::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/lessons/{$lesson->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
    }

    public function test_lesson_can_belong_to_multiple_categories()
    {
        $categories = \App\Models\Category::factory(2)->create();
        $lesson = Lesson::factory()->create();
        
        $lesson->categories()->attach($categories->pluck('id'));

        $this->assertCount(2, $lesson->categories);
        $this->assertTrue($categories[0]->lessons->contains($lesson));
        $this->assertTrue($categories[1]->lessons->contains($lesson));
    }
}
