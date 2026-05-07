<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminUserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected $admin;
    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->admin = User::factory()->create(['role' => 'admin']);
        $this->user = User::factory()->create(['role' => 'user']);
    }

    public function test_admin_can_list_users()
    {
        $response = $this->actingAs($this->admin)
            ->getJson('/api/users');

        $response->assertStatus(200)
            ->assertJsonCount(2);
    }

    public function test_non_admin_cannot_list_users()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/users');

        $response->assertStatus(403);
    }

    public function test_admin_can_create_user()
    {
        $response = $this->actingAs($this->admin)
            ->postJson('/api/users', [
                'name' => 'New User',
                'email' => 'new@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
                'role' => 'admin',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'New User')
            ->assertJsonPath('role', 'admin');

        $this->assertDatabaseHas('users', ['email' => 'new@example.com', 'role' => 'admin']);
    }

    public function test_admin_can_update_user()
    {
        $response = $this->actingAs($this->admin)
            ->putJson("/api/users/{$this->user->id}", [
                'name' => 'Updated Name',
                'role' => 'admin',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated Name')
            ->assertJsonPath('role', 'admin');

        $this->assertDatabaseHas('users', [
            'id' => $this->user->id,
            'name' => 'Updated Name',
            'role' => 'admin',
        ]);
    }

    public function test_admin_can_delete_user()
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/users/{$this->user->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $this->user->id]);
    }

    public function test_admin_cannot_delete_self()
    {
        $response = $this->actingAs($this->admin)
            ->deleteJson("/api/users/{$this->admin->id}");

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Cannot delete yourself');

        $this->assertDatabaseHas('users', ['id' => $this->admin->id]);
    }
}
