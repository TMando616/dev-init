<?php

namespace App\Http\Controllers;

use App\Services\SubmissionService;
use Illuminate\Http\Request;

class SubmissionController extends Controller
{
    public function __construct(
        protected SubmissionService $service
    ) {}

    /**
     * Store or update a submission (Save code).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'lesson_id' => 'required|exists:lessons,id',
            'code' => 'required|string',
        ]);

        $submission = $this->service->saveCode(
            $request->user()->id,
            $validated['lesson_id'],
            $validated['code']
        );

        return response()->json($submission);
    }

    /**
     * Display the specified submission for the authenticated user.
     */
    public function show(Request $request, string $lessonId)
    {
        $submission = $this->service->getSubmission(
            $request->user()->id,
            (int)$lessonId
        );

        if (!$submission) {
            return response()->json(['message' => 'No submission found'], 404);
        }

        return response()->json($submission);
    }
}
