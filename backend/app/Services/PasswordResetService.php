<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class PasswordResetService
{
    /**
     * Always request the link through the broker without inspecting its
     * result. Withdrawn users are already invisible to it (SoftDeletes
     * global scope), so the caller can return one generic message
     * regardless of whether the account exists or is active.
     */
    public function sendResetLink(string $email): void
    {
        Password::sendResetLink(['email' => $email]);
    }

    /**
     * @param  array{token: string, email: string, password: string}  $data
     */
    public function reset(array $data): void
    {
        $status = Password::reset(
            $data,
            function (User $user, string $password) {
                $user->forceFill(['password' => $password])->save();

                // Same reasoning as AccountService::changePassword: a reset is
                // what someone reaches for when they suspect their account is
                // compromised, so every existing session has to die with it.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }
}
