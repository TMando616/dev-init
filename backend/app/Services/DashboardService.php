<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Lesson;
use App\Models\Submission;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    /**
     * Get dashboard data for a user.
     */
    public function getDashboardData(User $user): array
    {
        $totalLessons = Lesson::count();
        $completedLessonIds = Submission::where('user_id', $user->id)
            ->where('status', 'completed')
            ->pluck('lesson_id')
            ->unique();
        
        $completedCount = $completedLessonIds->count();
        
        $overallProgress = [
            'completed' => $completedCount,
            'total' => $totalLessons,
            'percentage' => $totalLessons > 0 ? round(($completedCount / $totalLessons) * 100) : 0,
        ];

        // Eager load lessons for each category to avoid N+1 and calculate progress
        $categories = Category::with('lessons:id')->get();
        $categoryProgress = $categories->map(function ($category) use ($completedLessonIds) {
            $categoryLessonIds = $category->lessons->pluck('id');
            $completedInCategory = $completedLessonIds->intersect($categoryLessonIds)->count();
            
            return [
                'category_id' => $category->id,
                'name' => $category->name,
                'completed' => $completedInCategory,
                'total' => $category->lessons->count(),
            ];
        });

        $recentSubmission = Submission::where('user_id', $user->id)
            ->with('lesson')
            ->latest('id') // Use ID to ensure deterministic order in tests
            ->first();

        return [
            'overall_progress' => $overallProgress,
            'category_progress' => $categoryProgress,
            'recent_lesson' => $recentSubmission ? [
                'id' => $recentSubmission->lesson->id,
                'title' => $recentSubmission->lesson->title,
                'last_accessed' => $recentSubmission->updated_at,
            ] : null,
        ];
    }
}
