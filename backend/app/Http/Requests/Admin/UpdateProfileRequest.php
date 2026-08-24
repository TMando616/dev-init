<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateProfileRequest extends FormRequest
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
            'name' => 'sometimes|required|string|max:255',
            'email' => [
                'sometimes',
                'required',
                'string',
                'email',
                'max:255',
                // users との重複は許容する。受講生アカウントと管理者アカウントを
                // 同じメールアドレスで両方持つ運用を妨げないため(US-1)。
                Rule::unique('admins')->ignore($this->user()->id),
            ],
            // Changing the email is the one profile edit that can lock the
            // owner out: a stolen token could point the address at the
            // attacker and then take over through /admin/forgot-password.
            // Renaming carries no such risk, so the check only applies to a
            // real address change.
            'current_password' => [
                Rule::requiredIf(fn () => $this->isChangingEmail()),
                'string',
                'current_password:admin',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'メールアドレスを変更するには現在のパスワードの入力が必要です。',
            'current_password.current_password' => '現在のパスワードが正しくありません。',
        ];
    }

    protected function isChangingEmail(): bool
    {
        return $this->filled('email') && $this->input('email') !== $this->user()->email;
    }
}
