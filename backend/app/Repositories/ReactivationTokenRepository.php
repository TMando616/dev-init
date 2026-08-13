<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

/**
 * Data access for account_reactivation_tokens. There is no Eloquent model
 * because the table has no id and is never exposed as a resource, matching
 * how the framework handles password_reset_tokens.
 *
 * Only hashed tokens are stored here: the plain token exists solely in the
 * email body, so a database leak alone cannot be used to reactivate accounts.
 */
class ReactivationTokenRepository
{
    protected string $table = 'account_reactivation_tokens';

    /**
     * Issue a token for the email, replacing any existing row so only the
     * newest link stays valid.
     */
    public function create(string $email, string $hashedToken): void
    {
        $this->delete($email);

        DB::table($this->table)->insert([
            'email' => $email,
            'token' => $hashedToken,
            'created_at' => now(),
        ]);
    }

    /**
     * Get the pending token row for the email, if any.
     */
    public function findByEmail(string $email): ?object
    {
        return DB::table($this->table)->where('email', $email)->first();
    }

    /**
     * Delete the token row for the email. Called after a successful
     * reactivation so the link cannot be reused.
     */
    public function delete(string $email): void
    {
        DB::table($this->table)->where('email', $email)->delete();
    }
}
