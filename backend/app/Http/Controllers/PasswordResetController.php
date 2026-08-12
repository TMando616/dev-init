<?php

namespace App\Http\Controllers;

use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Services\PasswordResetService;

class PasswordResetController extends Controller
{
    public function __construct(
        protected PasswordResetService $service
    ) {}

    /**
     * Send a reset link. The response is identical whether or not the
     * email is registered, to avoid leaking account existence.
     */
    public function sendResetLink(ForgotPasswordRequest $request)
    {
        $this->service->sendResetLink($request->validated('email'));

        return response()->json([
            'message' => 'メールアドレスが登録されている場合、パスワード再設定用のリンクを送信しました。',
        ]);
    }

    public function reset(ResetPasswordRequest $request)
    {
        $this->service->reset($request->validated());

        return response()->json([
            'message' => 'パスワードを再設定しました。新しいパスワードでログインしてください。',
        ]);
    }
}
