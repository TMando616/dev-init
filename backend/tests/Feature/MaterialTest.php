<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Lesson;
use App\Models\Material;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaterialTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected Admin $admin;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user  = User::factory()->create();
        $this->admin = Admin::factory()->create();
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
        $lesson = Lesson::factory()->create();
        $m1 = Material::factory()->create(['lesson_id' => $lesson->id, 'order' => 1]);
        $m2 = Material::factory()->create(['lesson_id' => $lesson->id, 'order' => 2]);
        $m3 = Material::factory()->create(['lesson_id' => $lesson->id, 'order' => 3]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/materials/{$m2->id}");

        $response->assertStatus(200)
            ->assertJsonPath('material.id', $m2->id)
            ->assertJsonPath('prev.id', $m1->id)
            ->assertJsonPath('next.id', $m3->id);
    }

    public function test_prev_next_does_not_cross_lesson_boundary(): void
    {
        $lessonA = Lesson::factory()->create();
        $lessonB = Lesson::factory()->create();

        $a1 = Material::factory()->create(['lesson_id' => $lessonA->id, 'order' => 1]);
        $a2 = Material::factory()->create(['lesson_id' => $lessonA->id, 'order' => 2]);
        // 別レッスンの資料が prev/next に混入しないことを確認する
        Material::factory()->create(['lesson_id' => $lessonB->id, 'order' => 1]);

        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson("/api/materials/{$a1->id}");

        $response->assertStatus(200)
            ->assertJsonPath('prev', null)
            ->assertJsonPath('next.id', $a2->id);
    }

    public function test_show_returns_404_for_missing_material(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->getJson('/api/materials/9999');

        $response->assertStatus(404);
    }

    public function test_student_cannot_create_material(): void
    {
        $response = $this->actingAs($this->user, 'sanctum')
            ->postJson('/api/admin/materials', [
                'title'   => 'Test',
                'content' => 'Content',
            ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_create_material(): void
    {
        $lesson = Lesson::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->postJson('/api/admin/materials', [
                'title'     => 'New Material',
                'content'   => '# Hello',
                'lesson_id' => $lesson->id,
                'order'     => 1,
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('title', 'New Material');

        $this->assertDatabaseHas('materials', ['title' => 'New Material']);
    }

    public function test_admin_can_update_material(): void
    {
        $lesson   = Lesson::factory()->create();
        $material = Material::factory()->create(['lesson_id' => $lesson->id]);

        $response = $this->actingAs($this->admin, 'admin')
            ->putJson("/api/admin/materials/{$material->id}", [
                'title'     => 'Updated Title',
                'lesson_id' => $lesson->id,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('title', 'Updated Title');
    }

    public function test_admin_can_delete_material(): void
    {
        $material = Material::factory()->create();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/materials/{$material->id}");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('materials', ['id' => $material->id]);
    }
}
