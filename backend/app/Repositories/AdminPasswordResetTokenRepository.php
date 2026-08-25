<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;

/**
 * Laravel's password broker owns the writes to this table, so this repository
 * only covers the cleanup the framework never does: the rows are keyed by
 * email with no foreign key to admins, so they survive a deleted account and
 * keep an email address on file.
 */
class AdminPasswordResetTokenRepository
{
    protected string $table = 'admin_password_reset_tokens';

    /**
     * Drop the pending reset row for the email, if any.
     */
    public function delete(string $email): void
    {
        DB::table($this->table)->where('email', $email)->delete();
    }
}
