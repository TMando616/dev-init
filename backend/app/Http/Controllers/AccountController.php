<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteAccountRequest;
use App\Http\Requests\UpdatePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Services\AccountService;
use Laravel\Sanctum\PersonalAccessToken;

class AccountController extends Controller
{
    public function __construct(
        protected AccountService $service
    ) {}

    /**
     * Update the authenticated user's name and/or email.
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $this->service->updateProfile($request->user(), $request->validated());

        return response()->json($user);
    }

    /**
     * Change the authenticated user's password.
     */
    public function updatePassword(UpdatePasswordRequest $request)
    {
        $current = $request->user()->currentAccessToken();

        $this->service->changePassword(
            $request->user(),
            $request->validated('password'),
            $current instanceof PersonalAccessToken ? $current : null,
        );

        return response()->json([
            'message' => 'パスワードを変更しました。他の端末は再ログインが必要です。',
        ]);
    }

    /**
     * Withdraw (soft delete) the authenticated user's account.
     */
    public function destroy(DeleteAccountRequest $request)
    {
        $this->service->delete($request->user());

        return response()->json([
            'message' => '退会が完了しました。',
        ]);
    }
}
