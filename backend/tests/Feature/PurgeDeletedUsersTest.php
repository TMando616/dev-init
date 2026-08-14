<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class PurgeDeletedUsersTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Withdraw a user and backdate the withdrawal, so the retention boundary
     * can be tested without travelling in time.
     */
    private function withdrawnDaysAgo(int $days, array $attributes = []): User
    {
        $user = User::factory()->create($attributes);
        $user->delete();
        $user->forceFill(['deleted_at' => now()->subDays($days)])->saveQuietly();

        return $user;
    }

    public function test_purges_users_past_the_retention_period_with_their_submissions()
    {
        $user = $this->withdrawnDaysAgo(31);
        $lesson = Lesson::factory()->create();
        $submission = Submission::create([
            'user_id' => $user->id,
            'lesson_id' => $lesson->id,
            'code' => '// old',
            'status' => 'completed',
        ]);

        $this->artisan('users:purge-deleted')->assertExitCode(0);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('submissions', ['id' => $submission->id]);
    }

    public function test_keeps_users_still_inside_the_retention_period()
    {
        $user = $this->withdrawnDaysAgo(29);

        $this->artisan('users:purge-deleted')->assertExitCode(0);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_keeps_active_users()
    {
        $user = User::factory()->create();

        $this->artisan('users:purge-deleted')->assertExitCode(0);

        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_removes_leftover_reactivation_tokens()
    {
        $user = $this->withdrawnDaysAgo(31, ['email' => 'gone@example.com']);
        DB::table('account_reactivation_tokens')->insert([
            'email' => 'gone@example.com',
            'token' => bcrypt('whatever'),
            'created_at' => now()->subDays(31),
        ]);

        $this->artisan('users:purge-deleted')->assertExitCode(0);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
        $this->assertDatabaseMissing('account_reactivation_tokens', ['email' => 'gone@example.com']);
    }

    public function test_dry_run_reports_targets_without_deleting()
    {
        $user = $this->withdrawnDaysAgo(31, ['email' => 'gone@example.com']);

        $this->artisan('users:purge-deleted', ['--dry-run' => true])
            ->expectsOutputToContain('gone@example.com')
            ->assertExitCode(0);

        $this->assertSoftDeleted('users', ['id' => $user->id]);
    }

    public function test_days_option_overrides_the_configured_retention_period()
    {
        $user = $this->withdrawnDaysAgo(10);

        $this->artisan('users:purge-deleted', ['--days' => 7])->assertExitCode(0);

        $this->assertDatabaseMissing('users', ['id' => $user->id]);
    }

    public function test_logs_the_purged_count()
    {
        Log::spy();
        $this->withdrawnDaysAgo(31);
        $this->withdrawnDaysAgo(40);

        $this->artisan('users:purge-deleted')->assertExitCode(0);

        Log::shouldHaveReceived('info')
            ->once()
            ->with('Purged deleted users', ['count' => 2, 'days' => 30]);
    }
}
