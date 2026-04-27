<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LessonTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'user']);
        $this->admin = User::factory()->create(['role' => 'admin']);
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

    public function test_user_cannot_create_lesson()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/lessons', [
                'title' => 'New Lesson',
                'content' => 'Content',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_lesson()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/lessons', [
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

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/lessons/{$lesson->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('title', 'Updated Title');
    }

    public function test_admin_can_delete_lesson()
    {
        $lesson = Lesson::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/lessons/{$lesson->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('lessons', ['id' => $lesson->id]);
    }
}
