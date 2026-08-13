<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use App\Notifications\ReactivateAccountNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ReactivationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Register with a withdrawn email and return the plain token from the
     * link that was mailed, mirroring what the recipient would click.
     */
    private function requestReactivationToken(User $user): string
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => '別の名前',
            'email' => $user->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $token = null;
        Notification::assertSentTo($user, ReactivateAccountNotification::class, function ($notification) use (&$token) {
            $token = $notification->token;

            return true;
        });

        return $token;
    }

    public function test_registering_with_withdrawn_email_sends_link_without_creating_user()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();

        $response = $this->postJson('/api/register', [
            'name' => '新しい名前',
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(202)->assertJsonStructure(['message']);
        $response->assertJsonMissingPath('access_token');

        $this->assertSame(1, User::withTrashed()->where('email', 'gone@example.com')->count());
        Notification::assertSentTo($user, ReactivateAccountNotification::class);
    }

    public function test_user_can_reactivate_and_login_with_new_password()
    {
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();

        $token = $this->requestReactivationToken($user);

        $response = $this->postJson('/api/reactivate', [
            'token' => $token,
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['message']);
        $this->assertNotSoftDeleted('users', ['id' => $user->id]);

        $this->postJson('/api/login', [
            'email' => 'gone@example.com',
            'password' => 'new-password',
        ])->assertStatus(200)->assertJsonStructure(['access_token']);
    }

    public function test_reactivation_keeps_previous_name_and_submissions()
    {
        $user = User::factory()->create([
            'name' => '退会前の名前',
            'email' => 'gone@example.com',
        ]);
        $lesson = Lesson::factory()->create();
        $submission = Submission::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'code' => '// before withdrawal',
            'status' => 'completed',
        ]);
        $user->delete();

        $token = $this->requestReactivationToken($user);

        $this->postJson('/api/reactivate', [
            'token' => $token,
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        // 登録フォームに入れた「別の名前」は採用しない。
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => '退会前の名前',
        ]);
        $this->assertDatabaseHas('submissions', [
            'id' => $submission->id,
            'user_id' => $user->id,
            'status' => 'completed',
        ]);
    }

    public function test_reactivation_token_cannot_be_reused()
    {
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();

        $token = $this->requestReactivationToken($user);
        $payload = [
            'token' => $token,
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ];

        $this->postJson('/api/reactivate', $payload)->assertStatus(200);

        $this->postJson('/api/reactivate', $payload)
            ->assertStatus(422)
            ->assertJsonValidationErrors('email');
    }

    public function test_reactivation_rejects_tampered_token()
    {
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();

        $this->requestReactivationToken($user);

        $this->postJson('/api/reactivate', [
            'token' => str_repeat('a', 64),
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_account_past_retention_period_cannot_be_reactivated()
    {
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();

        $token = $this->requestReactivationToken($user);

        // 保持期間を過ぎたところでリンクを開く。
        $user->forceFill([
            'deleted_at' => now()->subDays(config('account.retention_days') + 1),
        ])->saveQuietly();

        $this->postJson('/api/reactivate', [
            'token' => $token,
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_registering_over_a_record_past_retention_creates_a_new_account()
    {
        Notification::fake();
        $user = User::factory()->create(['email' => 'gone@example.com']);
        $user->delete();
        $user->forceFill([
            'deleted_at' => now()->subDays(config('account.retention_days') + 1),
        ])->saveQuietly();

        $response = $this->postJson('/api/register', [
            'name' => '新しい人',
            'email' => 'gone@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['user', 'access_token']);
        Notification::assertNothingSent();

        // 古いレコードは解放され、新しいアカウントだけが残る。
        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertSame(1, User::where('email', 'gone@example.com')->count());
    }

    public function test_registering_with_active_email_still_fails_validation()
    {
        Notification::fake();
        User::factory()->create(['email' => 'active@example.com']);

        $this->postJson('/api/register', [
            'name' => '重複',
            'email' => 'active@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(422)->assertJsonValidationErrors('email');

        Notification::assertNothingSent();
    }

    public function test_registering_with_unused_email_still_returns_a_token()
    {
        Notification::fake();

        $response = $this->postJson('/api/register', [
            'name' => '新規',
            'email' => 'fresh@example.com',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200)->assertJsonStructure(['user', 'access_token', 'token_type']);
        $this->assertDatabaseHas('users', ['email' => 'fresh@example.com']);
        Notification::assertNothingSent();
    }
}
