<?php

namespace App\Http\Requests;

use App\Enums\Language;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateLessonRequest extends FormRequest
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
            'title' => 'sometimes|required|string|max:255',
            'content' => 'sometimes|required|string',
            'language' => ['sometimes', 'required', 'string', Rule::in(Language::values())],
            'model_answer' => 'nullable|string',
            'expected_output' => 'nullable|string',
            'category_ids' => 'sometimes|array|min:1',
            'category_ids.*' => 'exists:categories,id',
        ];
    }
}
