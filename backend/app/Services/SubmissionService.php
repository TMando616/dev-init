<?php

namespace App\Services;

use App\Models\Submission;
use App\Repositories\SubmissionRepository;

class SubmissionService
{
    public function __construct(
        protected SubmissionRepository $repository
    ) {}

    public function saveCode(int $userId, int $lessonId, string $code): Submission
    {
        return $this->repository->updateOrCreate(
            ['user_id' => $userId, 'lesson_id' => $lessonId],
            ['code' => $code, 'status' => 'saved']
        );
    }

    public function getSubmission(int $userId, int $lessonId): ?Submission
    {
        return $this->repository->findForUserAndLesson($userId, $lessonId);
    }
}
