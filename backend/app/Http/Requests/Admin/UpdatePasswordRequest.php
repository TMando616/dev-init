<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is enforced by the auth:admin route middleware.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // 'admin' guard: the default 'web' guard is session-based and
            // cannot resolve the authenticated admin under Bearer token auth.
            'current_password' => 'required|string|current_password:admin',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
