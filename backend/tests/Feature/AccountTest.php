<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_profile()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/account/profile', [
                'name' => '山田 太郎',
                'email' => 'taro@example.com',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', '山田 太郎')
            ->assertJsonPath('email', 'taro@example.com');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => '山田 太郎',
            'email' => 'taro@example.com',
        ]);
    }

    public function test_user_can_keep_own_current_email()
    {
        $user = User::factory()->create(['email' => 'keep@example.com']);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/account/profile', [
                'name' => 'Updated Name',
                'email' => 'keep@example.com',
            ]);

        $response->assertStatus(200);
    }

    public function test_update_profile_fails_with_other_users_email()
    {
        User::factory()->create(['email' => 'taken@example.com']);
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/account/profile', [
                'email' => 'taken@example.com',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_update_profile_requires_authentication()
    {
        $response = $this->putJson('/api/account/profile', [
            'name' => 'Nobody',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_change_password_and_only_other_devices_are_logged_out()
    {
        $user = User::factory()->create([
            'password' => bcrypt('old-password'),
        ]);

        $tokenA = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'old-password',
        ])->json('access_token');

        $tokenB = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'old-password',
        ])->json('access_token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson('/api/account/password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertStatus(200);

        // The sanctum guard memoizes the resolved user on first use within a
        // test, so later requests in this method must forget it or they'll
        // keep returning the user from the very first authenticated call.
        Auth::forgetGuards();
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/user')
            ->assertStatus(200);

        Auth::forgetGuards();
        $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->getJson('/api/user')
            ->assertStatus(401);
    }

    public function test_change_password_fails_with_wrong_current_password()
    {
        $user = User::factory()->create([
            'password' => bcrypt('correct-password'),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->putJson('/api/account/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_user_can_withdraw_account()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);
        $token = $user->createToken('test_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->deleteJson('/api/account', [
                'password' => 'password123',
            ]);

        $response->assertStatus(200);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
        $this->assertCount(0, $user->fresh()->tokens);
    }

    public function test_withdrawal_fails_with_wrong_password()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);

        $response = $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/account', [
                'password' => 'wrong-password',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
        $this->assertNotSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_cannot_login_after_withdrawal()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);
        $user->delete();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(422);
    }

    public function test_pre_withdrawal_token_is_rejected_after_withdrawal()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);
        $token = $user->createToken('test_token')->plainTextToken;

        $user->delete();

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_submissions_remain_after_withdrawal()
    {
        $user = User::factory()->create([
            'password' => bcrypt('password123'),
        ]);
        $lesson = Lesson::factory()->create();
        $submission = Submission::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'code' => '// test',
            'status' => 'completed',
        ]);

        $user->delete();

        $this->assertDatabaseHas('submissions', ['id' => $submission->id]);
    }
}
