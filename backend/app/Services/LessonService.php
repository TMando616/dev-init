<?php

namespace App\Services;

use App\Models\Lesson;
use App\Repositories\LessonRepository;
use Illuminate\Database\Eloquent\Collection;

class LessonService
{
    public function __construct(
        protected LessonRepository $repository
    ) {}

    public function getAllLessons(): Collection
    {
        return $this->repository->all();
    }

    public function getLessonById(int $id): ?Lesson
    {
        return $this->repository->find($id);
    }

    public function createLesson(array $data): Lesson
    {
        return $this->repository->create($data);
    }

    public function updateLesson(int $id, array $data): ?Lesson
    {
        $lesson = $this->repository->find($id);
        if ($lesson) {
            $this->repository->update($lesson, $data);
            return $lesson->fresh();
        }
        return null;
    }

    public function deleteLesson(int $id): bool
    {
        $lesson = $this->repository->find($id);
        if ($lesson) {
            return $this->repository->delete($lesson);
        }
        return false;
    }
}
