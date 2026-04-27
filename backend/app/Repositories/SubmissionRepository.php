<?php

namespace App\Repositories;

use App\Models\Submission;

class SubmissionRepository
{
    /**
     * Find or create a submission for a user and lesson.
     */
    public function updateOrCreate(array $attributes, array $values): Submission
    {
        return Submission::updateOrCreate($attributes, $values);
    }

    /**
     * Get the latest submission for a user and lesson.
     */
    public function findForUserAndLesson(int $userId, int $lessonId): ?Submission
    {
        return Submission::where('user_id', $userId)
            ->where('lesson_id', $lessonId)
            ->first();
    }
}
