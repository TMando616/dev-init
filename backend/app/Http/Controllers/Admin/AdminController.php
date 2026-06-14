<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\AdminService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(
        protected AdminService $service
    ) {}

    /**
     * List all admins.
     */
    public function index()
    {
        return response()->json($this->service->list());
    }

    /**
     * Create a new admin (invited by the authenticated admin).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:admins',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $admin = $this->service->create($validated);

        return response()->json($admin, 201);
    }

    /**
     * Delete an admin. Self-deletion is forbidden.
     */
    public function destroy(Request $request, string $id)
    {
        $result = $this->service->delete((int) $id, (int) $request->user()->id);

        return match ($result) {
            'self' => response()->json(['message' => 'Cannot delete yourself'], 400),
            'not_found' => response()->json(['message' => 'Admin not found'], 404),
            default => response()->json(null, 204),
        };
    }
}
