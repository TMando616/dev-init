<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Services\UserService;

class UserController extends Controller
{
    public function __construct(
        protected UserService $service
    ) {}

    /**
     * List all students.
     */
    public function index()
    {
        return response()->json($this->service->list());
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
     * Delete a student.
     */
    public function destroy(string $id)
    {
        $deleted = $this->service->delete((int) $id);

        if (!$deleted) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json(null, 204);
    }
}
