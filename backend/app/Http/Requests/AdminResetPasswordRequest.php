<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AdminResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint: must be reachable while unauthenticated.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token' => 'required|string',
            'email' => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
