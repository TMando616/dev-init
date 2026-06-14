<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AdminAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login()
    {
        $admin = Admin::factory()->create([
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => $admin->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['admin', 'access_token', 'token_type']);
    }

    public function test_student_credentials_are_rejected_on_admin_login()
    {
        // A student exists with the same password but is NOT an admin.
        User::factory()->create([
            'email' => 'student@example.com',
            'password' => Hash::make('password123'),
        ]);

        $response = $this->postJson('/api/admin/login', [
            'email' => 'student@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(422); // ValidationException: credentials incorrect
    }

    public function test_admin_can_fetch_self()
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('admin_auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/me');

        $response->assertStatus(200)
            ->assertJsonPath('email', $admin->email);
    }

    public function test_admin_can_logout()
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('admin_auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->postJson('/api/admin/logout');

        $response->assertStatus(200);
        $this->assertCount(0, $admin->fresh()->tokens);
    }
}
