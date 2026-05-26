<?php

namespace App\Http\Controllers;

use App\Services\CodeExecutionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExecutionController extends Controller
{
    public function __construct(
        protected CodeExecutionService $executionService
    ) {}

    /**
     * Handle the code execution request.
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'language' => 'required|string',
            'code' => 'required|string',
        ]);

        $result = $this->executionService->execute(
            $validated['language'],
            $validated['code']
        );

        return response()->json($result);
    }
}
