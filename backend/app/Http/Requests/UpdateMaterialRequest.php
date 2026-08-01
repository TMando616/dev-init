<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMaterialRequest extends FormRequest
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
            'title'     => 'sometimes|required|string|max:255',
            'content'   => 'sometimes|required|string',
            'lesson_id' => 'sometimes|exists:lessons,id',
            'order'     => 'nullable|integer|min:0',
        ];
    }
}
