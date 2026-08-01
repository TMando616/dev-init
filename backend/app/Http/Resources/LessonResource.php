<?php

namespace App\Http\Resources;

use App\Models\Admin;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // The model answer is only serialized for the admin guard. Students
        // fetch it on demand from GET /lessons/{id}/model-answer.
        $isAdmin = $request->user() instanceof Admin;

        return [
            'id' => $this->id,
            'title' => $this->title,
            'language' => $this->language,
            'content' => $this->content,
            'expected_output' => $this->expected_output,
            $this->mergeWhen($isAdmin, fn () => [
                'model_answer' => $this->model_answer,
            ]),
            'categories' => $this->whenLoaded('categories'),
            'materials' => $this->whenLoaded('materials'),
            'next_lesson_id' => $this->whenAppended('next_lesson_id'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
