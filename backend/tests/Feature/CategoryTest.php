<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create(['role' => 'user']);
        $this->admin = User::factory()->create(['role' => 'admin']);
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

    public function test_user_cannot_create_category()
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/categories', [
                'name' => 'New Category',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_category()
    {
        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/categories', [
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

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/categories/{$category->id}", [
                'name' => 'Updated Category',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('name', 'Updated Category');
    }

    public function test_admin_can_delete_category()
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/categories/{$category->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categories', ['id' => $category->id]);
    }
}
