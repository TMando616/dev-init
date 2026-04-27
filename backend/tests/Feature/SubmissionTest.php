<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\User;
use App\Models\Submission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubmissionTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Lesson $lesson;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->lesson = Lesson::factory()->create();
    }

    public function test_user_can_save_code()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/submissions', [
                'lesson_id' => $this->lesson->id,
                'code' => 'console.log("test")',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('code', 'console.log("test")');

        $this->assertDatabaseHas('submissions', [
            'user_id' => $this->user->id,
            'lesson_id' => $this->lesson->id,
            'code' => 'console.log("test")',
        ]);
    }

    public function test_user_can_retrieve_saved_code()
    {
        Submission::create([
            'user_id' => $this->user->id,
            'lesson_id' => $this->lesson->id,
            'code' => 'saved code',
            'status' => 'saved',
        ]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/submissions/lesson/{$this->lesson->id}");

        $response->assertStatus(200)
            ->assertJsonPath('code', 'saved code');
    }

    public function test_user_gets_404_if_no_submission()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/submissions/lesson/{$this->lesson->id}");

        $response->assertStatus(404);
    }
}
