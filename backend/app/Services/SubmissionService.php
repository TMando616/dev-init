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

    public function completeLesson(int $userId, int $lessonId): Submission
    {
        $submission = $this->repository->findForUserAndLesson($userId, $lessonId);
        
        return $this->repository->updateOrCreate(
            ['user_id' => $userId, 'lesson_id' => $lessonId],
            [
                'status' => 'completed',
                'code' => $submission ? $submission->code : ''
            ]
        );
    }

    public function getSubmission(int $userId, int $lessonId): ?Submission
    {
        return $this->repository->findForUserAndLesson($userId, $lessonId);
    }

    public function getCompletedLessonIds(int $userId): array
    {
        return $this->repository->completedLessonIds($userId);
    }
}
