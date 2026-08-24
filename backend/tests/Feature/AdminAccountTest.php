<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAccountTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_profile()
    {
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'name' => '運営 太郎',
                'email' => 'taro@example.com',
                'current_password' => 'password',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', '運営 太郎')
            ->assertJsonPath('email', 'taro@example.com');

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'name' => '運営 太郎',
            'email' => 'taro@example.com',
        ]);
    }

    public function test_admin_can_keep_own_current_email()
    {
        $admin = Admin::factory()->create(['email' => 'keep@example.com']);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'name' => 'Updated Name',
                'email' => 'keep@example.com',
            ]);

        $response->assertStatus(200);
    }

    public function test_update_profile_fails_with_another_admins_email()
    {
        Admin::factory()->create(['email' => 'taken@example.com']);
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'email' => 'taken@example.com',
                'current_password' => 'password',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    public function test_admin_can_change_email_to_a_students_email()
    {
        User::factory()->create(['email' => 'shared@example.com']);
        $admin = Admin::factory()->create();

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'email' => 'shared@example.com',
                'current_password' => 'password',
            ]);

        $response->assertStatus(200);
    }

    public function test_changing_the_email_requires_the_current_password()
    {
        $admin = Admin::factory()->create(['email' => 'before@example.com']);

        $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', ['email' => 'after@example.com'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'email' => 'before@example.com',
        ]);
    }

    public function test_changing_the_email_fails_with_a_wrong_current_password()
    {
        $admin = Admin::factory()->create(['email' => 'before@example.com']);

        $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'email' => 'after@example.com',
                'current_password' => 'not-my-password',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('current_password');

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'email' => 'before@example.com',
        ]);
    }

    public function test_renaming_does_not_require_the_current_password()
    {
        $admin = Admin::factory()->create(['email' => 'stay@example.com']);

        $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/profile', [
                'name' => '改名 太郎',
                'email' => 'stay@example.com',
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('admins', [
            'id' => $admin->id,
            'name' => '改名 太郎',
        ]);
    }

    public function test_update_profile_requires_authentication()
    {
        $response = $this->putJson('/api/admin/account/profile', [
            'name' => 'Nobody',
        ]);

        $response->assertStatus(401);
    }

    public function test_a_student_token_cannot_update_the_admin_profile()
    {
        $user = User::factory()->create();
        $token = $user->createToken('student_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->putJson('/api/admin/account/profile', [
                'name' => 'Intruder',
            ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_change_password_and_only_other_devices_are_logged_out()
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('old-password'),
        ]);

        $tokenA = $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'old-password',
        ])->json('access_token');

        $tokenB = $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'old-password',
        ])->json('access_token');

        $response = $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->putJson('/api/admin/account/password', [
                'current_password' => 'old-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertStatus(200);

        // The admin guard memoizes the resolved user on first use within a
        // test, so later requests in this method must forget it or they'll
        // keep returning the admin from the very first authenticated call.
        Auth::forgetGuards();
        $this->withHeader('Authorization', 'Bearer ' . $tokenA)
            ->getJson('/api/admin/me')
            ->assertStatus(200);

        Auth::forgetGuards();
        $this->withHeader('Authorization', 'Bearer ' . $tokenB)
            ->getJson('/api/admin/me')
            ->assertStatus(401);
    }

    public function test_change_password_fails_with_wrong_current_password()
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('correct-password'),
        ]);

        $response = $this->actingAs($admin, 'admin')
            ->putJson('/api/admin/account/password', [
                'current_password' => 'wrong-password',
                'password' => 'new-password',
                'password_confirmation' => 'new-password',
            ]);

        $response->assertStatus(422)->assertJsonValidationErrors('current_password');
    }
}
