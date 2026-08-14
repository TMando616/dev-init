<?php

namespace Tests\Feature;

use App\Models\Admin;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
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

        // Withdrawal is reversible during the retention period, so the row
        // stays behind with deleted_at set.
        $this->assertSoftDeleted('users', ['id' => $this->student->id]);
    }

    public function test_deleting_a_student_revokes_their_tokens()
    {
        $this->student->createToken('auth_token');

        $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$this->student->id}")
            ->assertStatus(204);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'tokenable_type' => User::class,
            'tokenable_id' => $this->student->id,
        ]);
    }

    public function test_admin_can_force_delete_a_withdrawn_student()
    {
        $lesson = Lesson::factory()->create();
        $submission = Submission::create([
            'user_id' => $this->student->id,
            'lesson_id' => $lesson->id,
            'code' => '// work',
            'status' => 'completed',
        ]);
        $this->student->delete();

        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$this->student->id}/force");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $this->student->id]);
        $this->assertDatabaseMissing('submissions', ['id' => $submission->id]);
    }

    public function test_admin_can_force_delete_an_active_student()
    {
        $response = $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$this->student->id}/force");

        $response->assertStatus(204);
        $this->assertDatabaseMissing('users', ['id' => $this->student->id]);
    }

    public function test_force_delete_removes_leftover_reactivation_tokens()
    {
        DB::table('account_reactivation_tokens')->insert([
            'email' => $this->student->email,
            'token' => bcrypt('whatever'),
            'created_at' => now(),
        ]);
        $this->student->delete();

        $this->actingAs($this->admin, 'admin')
            ->deleteJson("/api/admin/users/{$this->student->id}/force")
            ->assertStatus(204);

        $this->assertDatabaseMissing('account_reactivation_tokens', [
            'email' => $this->student->email,
        ]);
    }

    public function test_force_delete_returns_404_for_unknown_student()
    {
        $this->actingAs($this->admin, 'admin')
            ->deleteJson('/api/admin/users/9999/force')
            ->assertStatus(404);
    }

    public function test_student_cannot_force_delete()
    {
        $this->actingAs($this->student, 'sanctum')
            ->deleteJson("/api/admin/users/{$this->student->id}/force")
            ->assertStatus(401);

        $this->assertDatabaseHas('users', ['id' => $this->student->id]);
    }

    public function test_withdrawn_students_are_hidden_from_the_default_listing()
    {
        $this->student->delete();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users');

        $response->assertStatus(200)->assertJsonCount(0);
    }

    public function test_withdrawn_students_are_listed_with_status_deleted()
    {
        $active = User::factory()->create();
        $this->student->delete();

        $response = $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?status=deleted');

        $response->assertStatus(200)->assertJsonCount(1);

        $emails = array_column($response->json(), 'email');
        $this->assertContains($this->student->email, $emails);
        $this->assertNotContains($active->email, $emails);
    }

    public function test_listing_rejects_an_unknown_status()
    {
        $this->actingAs($this->admin, 'admin')
            ->getJson('/api/admin/users?status=whatever')
            ->assertStatus(422)
            ->assertJsonValidationErrors('status');
    }
}
