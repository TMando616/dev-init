<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreMaterialRequest extends FormRequest
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
            'title'     => 'required|string|max:255',
            'content'   => 'required|string',
            'lesson_id' => 'required|exists:lessons,id',
            'order'     => 'nullable|integer|min:0',
        ];
    }
}
