<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdatePasswordRequest;
use App\Http\Requests\Admin\UpdateProfileRequest;
use App\Services\AdminAccountService;
use Laravel\Sanctum\PersonalAccessToken;

class AccountController extends Controller
{
    public function __construct(
        protected AdminAccountService $service
    ) {}

    /**
     * Update the authenticated admin's name and/or email.
     */
    public function updateProfile(UpdateProfileRequest $request)
    {
        // current_password is a proof of identity, not a profile field.
        $admin = $this->service->updateProfile(
            $request->user(),
            $request->safe()->only(['name', 'email']),
        );

        return response()->json($admin);
    }

    /**
     * Change the authenticated admin's password.
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
}
