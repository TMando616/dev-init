<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\Admin\AccountController as AdminAccountController;
use App\Http\Controllers\Admin\AdminController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ExecutionController;
use App\Http\Controllers\LessonController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ReactivationController;
use App\Http\Controllers\SubmissionController;
use Illuminate\Support\Facades\Route;

// Public auth endpoints
Route::middleware('throttle:auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/reset-password', [PasswordResetController::class, 'reset']);
    Route::post('/reactivate', ReactivationController::class);

    // Admin login (no public registration: admins are created by other admins)
    Route::post('/admin/login', [AdminAuthController::class, 'login']);
});

// Content read endpoints shared by students and admins (both guards allowed)
Route::middleware(['auth:sanctum,admin', 'throttle:api'])->group(function () {
    Route::get('/lessons', [LessonController::class, 'index']);
    Route::get('/lessons/{id}', [LessonController::class, 'show']);
    Route::get('/lessons/{id}/model-answer', [LessonController::class, 'modelAnswer']);
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/categories/{id}', [CategoryController::class, 'show']);
    Route::get('/materials', [MaterialController::class, 'index']);
    Route::get('/materials/{id}', [MaterialController::class, 'show']);
});

// Student-only protected endpoints
Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('throttle:api')->group(function () {
        Route::get('/user', [AuthController::class, 'user']);
        Route::post('/logout', [AuthController::class, 'logout']);

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index']);

        Route::get('/submissions/lesson/{lessonId}', [SubmissionController::class, 'show']);
        Route::get('/submissions/completed-lesson-ids', [SubmissionController::class, 'completedLessonIds']);

        // Account (self-service)
        Route::put('/account/profile', [AccountController::class, 'updateProfile']);
    });

    // Sensitive self-account operations get their own tighter budget.
    Route::middleware('throttle:account')->group(function () {
        Route::put('/account/password', [AccountController::class, 'updatePassword']);
        Route::delete('/account', [AccountController::class, 'destroy']);
    });

    // Code Execution (one Docker container per request: tighter budget)
    Route::post('/execute', ExecutionController::class)->middleware('throttle:execute');

    // Autosave-driven writes get their own budget so they never compete with
    // the endpoints above.
    Route::middleware('throttle:submissions')->group(function () {
        Route::post('/submissions', [SubmissionController::class, 'store']);
        Route::post('/submissions/complete', [SubmissionController::class, 'complete']);
    });
});

// Admin-only protected endpoints
Route::middleware(['auth:admin', 'throttle:api'])->prefix('admin')->group(function () {
    Route::get('/me', [AdminAuthController::class, 'me']);
    Route::post('/logout', [AdminAuthController::class, 'logout']);

    // Account (self-service)
    Route::put('/account/profile', [AdminAccountController::class, 'updateProfile']);

    // Sensitive self-account operation gets its own tighter budget.
    Route::put('/account/password', [AdminAccountController::class, 'updatePassword'])
        ->withoutMiddleware('throttle:api')
        ->middleware('throttle:account');

    // Admin account management (invite-create only)
    Route::get('/admins', [AdminController::class, 'index']);
    Route::post('/admins', [AdminController::class, 'store']);
    Route::delete('/admins/{id}', [AdminController::class, 'destroy']);

    // Student account management
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);
    Route::delete('/users/{id}/force', [UserController::class, 'forceDestroy']);

    // Content management (write operations)
    Route::post('/lessons', [LessonController::class, 'store']);
    Route::put('/lessons/{id}', [LessonController::class, 'update']);
    Route::delete('/lessons/{id}', [LessonController::class, 'destroy']);
    Route::post('/categories', [CategoryController::class, 'store']);
    Route::put('/categories/{id}', [CategoryController::class, 'update']);
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);
    Route::post('/materials', [MaterialController::class, 'store']);
    Route::put('/materials/{id}', [MaterialController::class, 'update']);
    Route::delete('/materials/{id}', [MaterialController::class, 'destroy']);
});
