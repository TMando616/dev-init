<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ReactivateAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Public endpoint: the withdrawn user cannot authenticate yet.
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
