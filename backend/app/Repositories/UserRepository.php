<?php

namespace App\Repositories;

use App\Models\User;
use Illuminate\Database\Eloquent\Collection;

class UserRepository
{
    /**
     * Get all users (students).
     */
    public function all(): Collection
    {
        return User::all();
    }

    /**
     * Find a user by ID.
     */
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Create a new user.
     */
    public function create(array $data): User
    {
        return User::create($data);
    }

    /**
     * Update an existing user.
     */
    public function update(User $user, array $data): bool
    {
        return $user->update($data);
    }

    /**
     * Delete a user.
     */
    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }
}
