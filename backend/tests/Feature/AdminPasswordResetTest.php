<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Notifications\AdminResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

class AdminPasswordResetTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_returns_same_message_for_registered_email()
    {
        Notification::fake();
        $admin = Admin::factory()->create();

        $response = $this->postJson('/api/admin/forgot-password', ['email' => $admin->email]);

        $response->assertStatus(200)->assertJsonStructure(['message']);
        Notification::assertSentTo($admin, AdminResetPasswordNotification::class);
    }

    public function test_forgot_password_returns_same_message_for_unregistered_email()
    {
        Notification::fake();

        $response = $this->postJson('/api/admin/forgot-password', ['email' => 'nobody@example.com']);

        $response->assertStatus(200)->assertJsonStructure(['message']);
        Notification::assertNothingSent();
    }

    public function test_admin_can_reset_password_and_login_with_new_password()
    {
        $admin = Admin::factory()->create();
        $token = Password::broker('admins')->createToken($admin);

        $response = $this->postJson('/api/admin/reset-password', [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(200);

        $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'new-password',
        ])->assertStatus(200);
    }

    public function test_reset_password_token_cannot_be_reused()
    {
        $admin = Admin::factory()->create();
        $token = Password::broker('admins')->createToken($admin);

        $this->postJson('/api/admin/reset-password', [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'first-password',
            'password_confirmation' => 'first-password',
        ])->assertStatus(200);

        $response = $this->postJson('/api/admin/reset-password', [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'second-password',
            'password_confirmation' => 'second-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_reset_password_fails_with_tampered_token()
    {
        $admin = Admin::factory()->create();
        Password::broker('admins')->createToken($admin);

        $response = $this->postJson('/api/admin/reset-password', [
            'token' => 'not-a-real-token',
            'email' => $admin->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_reset_password_fails_with_an_expired_token()
    {
        $admin = Admin::factory()->create();
        $token = Password::broker('admins')->createToken($admin);

        // config/auth.php passwords.admins.expire は60分。
        $this->travel(61)->minutes();

        $response = $this->postJson('/api/admin/reset-password', [
            'token' => $token,
            'email' => $admin->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_reset_revokes_every_existing_token()
    {
        $admin = Admin::factory()->create(['password' => bcrypt('old-password')]);

        $token = $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'old-password',
        ])->json('access_token');

        $this->postJson('/api/admin/reset-password', [
            'token' => Password::broker('admins')->createToken($admin),
            'email' => $admin->email,
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ])->assertStatus(200);

        // 漏洩を疑って踏む導線なので、リセット前のセッションは残さない。
        $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/me')
            ->assertStatus(401);
    }
}
