<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminForgotPasswordRequest;
use App\Http\Requests\AdminResetPasswordRequest;
use App\Services\AdminPasswordResetService;

class AdminPasswordResetController extends Controller
{
    public function __construct(
        protected AdminPasswordResetService $service
    ) {}

    /**
     * Send a reset link. The response is identical whether or not the
     * email is registered, to avoid leaking account existence.
     */
    public function sendResetLink(AdminForgotPasswordRequest $request)
    {
        $this->service->sendResetLink($request->validated('email'));

        return response()->json([
            'message' => 'メールアドレスが登録されている場合、パスワード再設定用のリンクを送信しました。',
        ]);
    }

    public function reset(AdminResetPasswordRequest $request)
    {
        $this->service->reset($request->validated());

        return response()->json([
            'message' => 'パスワードを再設定しました。新しいパスワードでログインしてください。',
        ]);
    }
}
