<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StudentManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;
    protected User $student;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = Admin::factory()->create();
        $this->student = User::factory()->create();
    }

    public function test_admin_can_list_students()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users');

        $response->assertStatus(200)
            ->assertJsonCount(1); // only the student; admins are not in users
    }

    public function test_student_list_does_not_include_admins()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users');

        $emails = array_column($response->json(), 'email');
        $this->assertNotContains($this->admin->email, $emails);
    }

    public function test_student_cannot_list_students()
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/admin/users');

        $response->assertStatus(401);
    }

    public function test_admin_can_create_student()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/users', [
                'name' => 'New Student',
                'email' => 'new@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'New Student');

        $this->assertDatabaseHas('users', ['email' => 'new@example.com']);
    }

    public function test_admin_can_update_student()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/users/{$this->student->id}", [
                'name' => 'Updated Name',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated Name');

        $this->assertDatabaseHas('users', [
            'id' => $this->student->id,
            'name' => 'Updated Name',
        ]);
    }

    public function test_admin_can_delete_student()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$this->student->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $this->student->id]);
    }
}
