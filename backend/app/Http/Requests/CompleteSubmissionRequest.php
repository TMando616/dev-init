<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompleteSubmissionRequest extends FormRequest
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
            'lesson_id' => 'required|exists:lessons,id',
        ];
    }
}
