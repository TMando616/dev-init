<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Authorization is enforced by the auth:sanctum route middleware.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // 'sanctum' guard: the default 'web' guard is session-based and
            // cannot resolve the authenticated user under Bearer token auth.
            'current_password' => 'required|string|current_password:sanctum',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
