<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->admin = Admin::factory()->create();
    }

    public function test_user_can_list_categories()
    {
        Category::factory(3)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/categories');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_show_category()
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/categories/{$category->id}");

        $response->assertStatus(200)
            ->assertJsonPath('name', $category->name);
    }

    public function test_student_cannot_create_category()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/admin/categories', [
                'name' => 'New Category',
            ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_create_category()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/categories', [
                'name' => 'Admin Category',
                'description' => 'Description',
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Admin Category');

        $this->assertDatabaseHas('categories', ['name' => 'Admin Category']);
    }

    public function test_admin_can_update_category()
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/categories/{$category->id}", [
                'name' => 'Updated Category',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated Category');
    }

    public function test_admin_can_delete_category()
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/categories/{$category->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
