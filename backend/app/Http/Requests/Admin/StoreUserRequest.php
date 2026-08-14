<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserRequest extends FormRequest
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
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            // unique:users also matches withdrawn accounts, which the default
            // listing hides. Point the admin at the 退会済み tab instead of
            // leaving them to wonder where the conflict is.
            'email.unique' => 'このメールアドレスは既に使用されています。退会済みユーザーが使用している可能性があります（一覧の「退会済み」から確認できます）。',
        ];
    }
}
