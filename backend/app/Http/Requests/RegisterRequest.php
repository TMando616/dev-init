<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint: registration is intentionally open to anyone.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            // Only active accounts block registration. An email held by a
            // withdrawn account passes validation so the controller can send
            // a reactivation link instead of a duplicate-email error.
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users')->whereNull('deleted_at'),
            ],
            'password' => 'required|string|min:8|confirmed',
        ];
    }
}
