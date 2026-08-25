<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Lesson;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    /**
     * The throttle middleware runs before the controller, so an invalid payload
     * still consumes the budget. This keeps the tests fast (no Docker runs).
     */
    public function test_login_is_throttled_after_six_attempts()
    {
        $credentials = ['email' => 'victim@example.com', 'password' => 'wrong-password'];

        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', $credentials)
                ->assertStatus(422);
        }

        $response = $this->postJson('/api/login', $credentials);

        $response->assertStatus(429)
            ->assertHeader('Retry-After');
    }

    public function test_login_attempts_below_the_threshold_are_not_throttled()
    {
        $credentials = ['email' => 'victim@example.com', 'password' => 'wrong-password'];

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', $credentials)
                ->assertStatus(422);
        }
    }

    public function test_login_throttling_is_scoped_per_email()
    {
        for ($i = 0; $i < 6; $i++) {
            $this->postJson('/api/login', [
                'email' => 'victim@example.com',
                'password' => 'wrong-password',
            ])->assertStatus(422);
        }

        // A different account from the same IP still gets through.
        $this->postJson('/api/login', [
            'email' => 'someone-else@example.com',
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_execute_is_throttled_after_twenty_requests()
    {
        for ($i = 0; $i < 20; $i++) {
            $this->actingAs($this->user, 'sanctum')
                ->postJson('/api/execute', [])
                ->assertStatus(422);
        }

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/execute', [])
            ->assertStatus(429);
    }

    public function test_submissions_are_throttled_after_forty_requests()
    {
        $lesson = Lesson::factory()->create();

        for ($i = 0; $i < 40; $i++) {
            $this->actingAs($this->user, 'sanctum')
                ->postJson('/api/submissions', [
                    'lesson_id' => $lesson->id,
                    'code' => "attempt {$i}",
                ])->assertStatus(200);
        }

        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/submissions', [
                'lesson_id' => $lesson->id,
                'code' => 'over the limit',
            ])->assertStatus(429);
    }

    /**
     * The editor autosaves on a 2s debounce, so 30 saves/min is the theoretical
     * worst case for a single learner. That must never hit the limit.
     */
    public function test_autosave_worst_case_is_not_throttled()
    {
        $lesson = Lesson::factory()->create();

        for ($i = 0; $i < 30; $i++) {
            $this->actingAs($this->user, 'sanctum')
                ->postJson('/api/submissions', [
                    'lesson_id' => $lesson->id,
                    'code' => "autosave {$i}",
                ])->assertStatus(200);
        }
    }

    public function test_account_operations_are_throttled_after_six_requests()
    {
        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($this->user, 'sanctum')
                ->putJson('/api/account/password', [])
                ->assertStatus(422);
        }

        $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/account/password', [])
            ->assertStatus(429);
    }

    /**
     * design.md §7.1: the 'account' limiter key used to be by(id) alone, so an
     * admin and a student sharing the same numeric id shared one 6/min bucket.
     * getMorphClass() must keep them separate.
     */
    public function test_account_throttle_is_scoped_per_guard_even_with_the_same_id()
    {
        $admin = Admin::factory()->create(['id' => $this->user->id]);

        for ($i = 0; $i < 6; $i++) {
            $this->actingAs($this->user, 'sanctum')
                ->putJson('/api/account/password', [])
                ->assertStatus(422);
        }

        $this->actingAs($this->user, 'sanctum')
            ->putJson('/api/account/password', [])
            ->assertStatus(429);

        // Same id, different guard: must not have been throttled by the loop above.
        $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/password', [])
            ->assertStatus(422);
    }

    public function test_submissions_budget_is_separate_from_the_general_api_budget()
    {
        $lesson = Lesson::factory()->create();

        // Exhaust the shared api limiter (60/min) via the dashboard.
        for ($i = 0; $i < 60; $i++) {
            $this->actingAs($this->user, 'sanctum')->getJson('/api/dashboard');
        }

        $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/dashboard')
            ->assertStatus(429);

        // Autosave still works.
        $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/submissions', [
                'lesson_id' => $lesson->id,
                'code' => 'still saving',
            ])->assertStatus(200);
    }
}
