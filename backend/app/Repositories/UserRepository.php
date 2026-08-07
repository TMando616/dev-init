<?php

namespace App\Repositories;

use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Collection;

class UserRepository
{
    /**
     * Get all users (students). Soft-deleted users are excluded by the
     * SoftDeletes global scope, so withdrawn accounts never leak into
     * listings or counts.
     */
    public function all(): Collection
    {
        return User::all();
    }

    /**
     * Get all withdrawn (soft-deleted) users.
     */
    public function allTrashed(): Collection
    {
        return User::onlyTrashed()->get();
    }

    /**
     * Find a user by ID.
     */
    public function find(int $id): ?User
    {
        return User::find($id);
    }

    /**
     * Find a user by ID, including withdrawn ones. Used by the admin-side
     * force delete, which must reach accounts the normal listing hides.
     */
    public function findWithTrashed(int $id): ?User
    {
        return User::withTrashed()->find($id);
    }

    /**
     * Find an active user by email address.
     */
    public function findByEmail(string $email): ?User
    {
        return User::where('email', $email)->first();
    }

    /**
     * Find a withdrawn user by email address.
     */
    public function findTrashedByEmail(string $email): ?User
    {
        return User::onlyTrashed()->where('email', $email)->first();
    }

    /**
     * Get withdrawn users deleted before the given threshold.
     */
    public function trashedOlderThan(CarbonInterface $threshold): Collection
    {
        return User::onlyTrashed()
            ->where('deleted_at', '<', $threshold)
            ->get();
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
     * Soft delete a user (withdrawal). The record is kept for the retention
     * period so the account can be reactivated with its submissions intact.
     */
    public function delete(User $user): bool
    {
        return (bool) $user->delete();
    }

    /**
     * Restore a withdrawn user.
     */
    public function restore(User $user): bool
    {
        return (bool) $user->restore();
    }

    /**
     * Permanently delete a user. Submissions are removed by the foreign key's
     * cascadeOnDelete.
     */
    public function forceDelete(User $user): bool
    {
        return (bool) $user->forceDelete();
    }
}
