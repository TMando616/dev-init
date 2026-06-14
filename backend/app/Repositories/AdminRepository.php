<?php

namespace App\Repositories;

use App\Models\Admin;
use Illuminate\Database\Eloquent\Collection;

class AdminRepository
{
    /**
     * Get all admins.
     */
    public function all(): Collection
    {
        return Admin::all();
    }

    /**
     * Find an admin by ID.
     */
    public function find(int $id): ?Admin
    {
        return Admin::find($id);
    }

    /**
     * Find an admin by email (used for login).
     */
    public function findByEmail(string $email): ?Admin
    {
        return Admin::where('email', $email)->first();
    }

    /**
     * Create a new admin.
     */
    public function create(array $data): Admin
    {
        return Admin::create($data);
    }

    /**
     * Delete an admin.
     */
    public function delete(Admin $admin): bool
    {
        return (bool) $admin->delete();
    }
}
