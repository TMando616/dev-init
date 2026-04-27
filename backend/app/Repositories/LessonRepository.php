<?php

namespace App\Repositories;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Collection;

class LessonRepository
{
    /**
     * Get all lessons.
     */
    public function all(): Collection
    {
        return Lesson::all();
    }

    /**
     * Find a lesson by ID.
     */
    public function find(int $id): ?Lesson
    {
        return Lesson::find($id);
    }

    /**
     * Create a new lesson.
     */
    public function create(array $data): Lesson
    {
        return Lesson::create($data);
    }

    /**
     * Update an existing lesson.
     */
    public function update(Lesson $lesson, array $data): bool
    {
        return $lesson->update($data);
    }

    /**
     * Delete a lesson.
     */
    public function delete(Lesson $lesson): bool
    {
        return $lesson->delete();
    }
}
