<?php

namespace App\Repositories;

use App\Models\Lesson;
use Illuminate\Database\Eloquent\Collection;

class LessonRepository
{
    /**
     * Get all lessons with categories.
     */
    public function all(): Collection
    {
        return Lesson::with('categories')->get();
    }

    /**
     * Find a lesson by ID with categories.
     */
    public function find(int $id): ?Lesson
    {
        return Lesson::with('categories')->find($id);
    }

    /**
     * Create a new lesson and sync categories.
     */
    public function create(array $data): Lesson
    {
        $categoryIds = $data['category_ids'] ?? [];
        unset($data['category_ids']);
        
        $lesson = Lesson::create($data);
        $lesson->categories()->sync($categoryIds);
        
        return $lesson->load('categories');
    }

    /**
     * Update an existing lesson and sync categories.
     */
    public function update(Lesson $lesson, array $data): bool
    {
        if (isset($data['category_ids'])) {
            $lesson->categories()->sync($data['category_ids']);
            unset($data['category_ids']);
        }
        
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
