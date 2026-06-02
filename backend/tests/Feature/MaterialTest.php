<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user  = User::factory()->create(['role' => 'user']);
        $this->admin = User::factory()->create(['role' => 'admin']);
    }

    public function test_user_can_list_materials(): void
    {
        Material::factory(3)->create();

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/materials');

        $response->assertStatus(200)
            ->assertJsonCount(3);
    }

    public function test_user_can_show_material_with_prev_next(): void
    {
        $category = Category::factory()->create();
        $m1 = Material::factory()->create(['category_id' => $category->id, 'order' => 1]);
        $m2 = Material::factory()->create(['category_id' => $category->id, 'order' => 2]);
        $m3 = Material::factory()->create(['category_id' => $category->id, 'order' => 3]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/materials/{$m2->id}");

        $response->assertStatus(200)
            ->assertJsonPath('material.id', $m2->id)
            ->assertJsonPath('prev.id', $m1->id)
            ->assertJsonPath('next.id', $m3->id);
    }

    public function test_show_returns_404_for_missing_material(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/materials/9999');

        $response->assertStatus(404);
    }

    public function test_user_cannot_create_material(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/materials', [
                'title'   => 'Test',
                'content' => 'Content',
            ]);

        $response->assertStatus(403);
    }

    public function test_admin_can_create_material(): void
    {
        $category = Category::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->postJson('/api/materials', [
                'title'       => 'New Material',
                'content'     => '# Hello',
                'category_id' => $category->id,
                'order'       => 1,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'New Material');

        $this->assertDatabaseHas('materials', ['title' => 'New Material']);
    }

    public function test_admin_can_update_material(): void
    {
        $material = Material::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->putJson("/api/materials/{$material->id}", [
                'title' => 'Updated Title',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('title', 'Updated Title');
    }

    public function test_admin_can_delete_material(): void
    {
        $material = Material::factory()->create();

        $response = $this->actingAs($this->admin, 'sanctum')
            ->deleteJson("/api/materials/{$material->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('materials', ['id' => $material->id]);
    }
}
