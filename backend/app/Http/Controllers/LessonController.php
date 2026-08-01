<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLessonRequest;
use App\Http\Requests\UpdateLessonRequest;
use App\Services\LessonService;

class LessonController extends Controller
{
    public function __construct(
        protected LessonService $service
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->service->getAllLessons());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreLessonRequest $request)
    {
        $lesson = $this->service->createLesson($request->validated());

        return response()->json($lesson, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $lesson = $this->service->getLessonById((int)$id);

        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        return response()->json($lesson);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateLessonRequest $request, string $id)
    {
        $lesson = $this->service->updateLesson((int)$id, $request->validated());
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        return response()->json($lesson);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->service->deleteLesson((int)$id);

        if (!$deleted) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        return response()->json(null, 204);
    }
}
