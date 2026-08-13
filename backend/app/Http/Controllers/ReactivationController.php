<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReactivateAccountRequest;
use App\Services\ReactivationService;
use Illuminate\Http\JsonResponse;

class ReactivationController extends Controller
{
    public function __construct(
        protected ReactivationService $service
    ) {}

    /**
     * Restore a withdrawn account from the emailed link.
     */
    public function __invoke(ReactivateAccountRequest $request): JsonResponse
    {
        $this->service->reactivate($request->validated());

        return response()->json([
            'message' => 'アカウントを復元しました。新しいパスワードでログインしてください。',
        ]);
    }
}
