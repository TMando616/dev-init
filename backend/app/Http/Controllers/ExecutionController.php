<?php

namespace App\Http\Controllers;

use App\Http\Requests\ExecuteRequest;
use App\Services\CodeExecutionService;
use Illuminate\Http\JsonResponse;

class ExecutionController extends Controller
{
    public function __construct(
        protected CodeExecutionService $executionService
    ) {}

    /**
     * Handle the code execution request.
     */
    public function __invoke(ExecuteRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->executionService->execute(
            $validated['language'],
            $validated['code']
        );

        return response()->json($result);
    }
}
