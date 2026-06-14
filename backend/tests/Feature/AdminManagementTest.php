<?php

namespace Tests\Feature;

use App\Models\Admin;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminManagementTest extends TestCase
{
    use RefreshDatabase;

    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->admin = Admin::factory()->create();
    }

    public function test_admin_can_list_admins()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/admins');

        $response->assertStatus(200)
            ->assertJsonCount(1);
    }

    public function test_admin_can_create_admin()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/admins', [
                'name' => 'Invited Admin',
                'email' => 'invited@example.com',
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('email', 'invited@example.com');

        $this->assertDatabaseHas('admins', ['email' => 'invited@example.com']);
    }

    public function test_no_public_admin_register_route_exists()
    {
        $response = $this->postJson('/api/admin/register', [
            'name' => 'Hacker',
            'email' => 'hacker@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(404);
        $this->assertDatabaseMissing('admins', ['email' => 'hacker@example.com']);
    }

    public function test_admin_cannot_delete_self()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/admins/{$this->admin->id}");

        $response->assertStatus(400)
            ->assertJsonPath('message', 'Cannot delete yourself');

        $this->assertDatabaseHas('admins', ['id' => $this->admin->id]);
    }

    public function test_admin_can_delete_another_admin()
    {
        $other = Admin::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/admins/{$other->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('admins', ['id' => $other->id]);
    }
}
