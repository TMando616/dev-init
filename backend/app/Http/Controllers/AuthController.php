<?php

namespace App\Http\Controllers;

use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\User;
use App\Services\ReactivationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected ReactivationService $reactivationService
    ) {}

    /**
     * Register a new student.
     */
    public function register(RegisterRequest $request)
    {
        $user = $this->reactivationService->resolveRegistration($request->validated());

        // Withdrawn email inside the retention window: the reactivation link
        // has been mailed, so there is no account to hand a token to yet.
        if (! $user) {
            return response()->json([
                'message' => 'ご入力のメールアドレス宛に確認メールを送信しました。メールをご確認ください。',
            ], 202);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Login a student and create a token.
     */
    public function login(LoginRequest $request)
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Logout the student (revoke token).
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Successfully logged out',
        ]);
    }

    /**
     * Get the authenticated student.
     */
    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
