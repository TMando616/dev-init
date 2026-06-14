<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminGuardIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_student_token_cannot_access_admin_api()
    {
        $student = User::factory()->create();
        $token = $student->createToken('auth_token')->plainTextToken;

        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/admin/users');

        $response->assertStatus(401);
    }

    public function test_admin_token_cannot_access_student_api()
    {
        $admin = Admin::factory()->create();
        $token = $admin->createToken('admin_auth_token')->plainTextToken;

        // /api/dashboard is a student-only (auth:sanctum) endpoint.
        $response = $this->withHeader('Authorization', 'Bearer ' . $token)
            ->getJson('/api/dashboard');

        $response->assertStatus(401);
    }

    public function test_shared_read_endpoint_is_reachable_by_both_guards()
    {
        $student = User::factory()->create();
        $admin = Admin::factory()->create();

        $studentToken = $student->createToken('auth_token')->plainTextToken;
        $adminToken = $admin->createToken('admin_auth_token')->plainTextToken;

        $this->withHeader('Authorization', 'Bearer ' . $studentToken)
            ->getJson('/api/lessons')
            ->assertStatus(200);

        $this->withHeader('Authorization', 'Bearer ' . $adminToken)
            ->getJson('/api/lessons')
            ->assertStatus(200);
    }
}
