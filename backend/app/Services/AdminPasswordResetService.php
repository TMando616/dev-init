<?php

namespace App\Services;

use App\Models\Admin;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AdminPasswordResetService
{
    /**
     * Always request the link through the broker without inspecting its
     * result, so the caller can return one generic message regardless of
     * whether the admin account exists.
     */
    public function sendResetLink(string $email): void
    {
        Password::broker('admins')->sendResetLink(['email' => $email]);
    }

    /**
     * @param  array{token: string, email: string, password: string}  $data
     */
    public function reset(array $data): void
    {
        $status = Password::broker('admins')->reset(
            $data,
            function (Admin $admin, string $password) {
                $admin->forceFill(['password' => $password])->save();

                // リセットは漏洩を疑って踏む導線なので、既存セッションは全て切る。
                $admin->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages([
                'email' => [__($status)],
            ]);
        }
    }
}
