<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\IndexUserRequest;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Services\UserService;

class UserController extends Controller
{
    public function __construct(
        protected UserService $service
    ) {}

    /**
     * List students. Defaults to active ones; ?status=deleted shows the
     * withdrawn accounts still inside the retention period.
     */
    public function index(IndexUserRequest $request)
    {
        return response()->json(
            $this->service->list($request->validated()['status'] ?? 'active')
        );
    }

    /**
     * Create a new student.
     */
    public function store(StoreUserRequest $request)
    {
        $user = $this->service->create($request->validated());

        return response()->json($user, 201);
    }

    /**
     * Update a student.
     */
    public function update(UpdateUserRequest $request, string $id)
    {
        $user = $this->service->update((int) $id, $request->validated());

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json($user);
    }

    /**
     * Withdraw a student (soft delete, reversible during retention).
     */
    public function destroy(string $id)
    {
        $deleted = $this->service->delete((int) $id);

        if (!$deleted) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(null, 204);
    }

    /**
     * Permanently delete a student. Irreversible: submissions go with it.
     */
    public function forceDestroy(string $id)
    {
        $deleted = $this->service->forceDelete((int) $id);

        if (!$deleted) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(null, 204);
    }
}
