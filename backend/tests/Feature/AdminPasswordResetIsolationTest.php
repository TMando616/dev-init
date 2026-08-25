<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use App\Notifications\AdminResetPasswordNotification;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Tests\TestCase;

/**
 * 同一メールアドレスを持つ受講生と管理者が併存する状態での分離を検証する。
 * broker('admins') は admin_password_reset_tokens しか読み書きしないため、
 * 片方のリセットがもう片方に影響しないはず(design.md §4.1)。
 */
class AdminPasswordResetIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function createSharedEmailPair(string $email): array
    {
        return [
            'user' => User::factory()->create(['email' => $email, 'password' => bcrypt('user-password')]),
            'admin' => Admin::factory()->create(['email' => $email, 'password' => bcrypt('admin-password')]),
        ];
    }

    public function test_admin_reset_does_not_change_the_students_password()
    {
        ['user' => $user, 'admin' => $admin] = $this->createSharedEmailPair('shared@example.com');

        $this->postJson('/api/admin/reset-password', [
            'token' => Password::broker('admins')->createToken($admin),
            'email' => $admin->email,
            'password' => 'new-admin-password',
            'password_confirmation' => 'new-admin-password',
        ])->assertStatus(200);

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'user-password',
        ])->assertStatus(200);
    }

    public function test_student_reset_does_not_change_the_admins_password()
    {
        ['user' => $user, 'admin' => $admin] = $this->createSharedEmailPair('shared@example.com');

        $this->postJson('/api/reset-password', [
            'token' => Password::createToken($user),
            'email' => $user->email,
            'password' => 'new-user-password',
            'password_confirmation' => 'new-user-password',
        ])->assertStatus(200);

        $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'admin-password',
        ])->assertStatus(200);
    }

    public function test_admin_forgot_password_endpoint_does_not_notify_the_student()
    {
        Notification::fake();
        ['user' => $user, 'admin' => $admin] = $this->createSharedEmailPair('shared@example.com');

        $this->postJson('/api/admin/forgot-password', ['email' => $admin->email])
            ->assertStatus(200);

        Notification::assertSentTo($admin, AdminResetPasswordNotification::class);
        Notification::assertNotSentTo($user, ResetPasswordNotification::class);
    }

    public function test_student_forgot_password_endpoint_does_not_notify_the_admin()
    {
        Notification::fake();
        ['user' => $user, 'admin' => $admin] = $this->createSharedEmailPair('shared@example.com');

        $this->postJson('/api/forgot-password', ['email' => $user->email])
            ->assertStatus(200);

        Notification::assertSentTo($user, ResetPasswordNotification::class);
        Notification::assertNotSentTo($admin, AdminResetPasswordNotification::class);
    }
}
