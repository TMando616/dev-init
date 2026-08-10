<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Laravel\Sanctum\PersonalAccessToken;

class AccountService
{
    public function __construct(
        protected UserRepository $repository
    ) {}

    /**
     * Update the authenticated user's own profile.
     */
    public function updateProfile(User $user, array $data): User
    {
        $this->repository->update($user, $data);

        return $user->fresh();
    }

    /**
     * Change the authenticated user's password and revoke every other
     * device's token. $current is null when called via Sanctum::actingAs()
     * in tests, whose TransientToken has no persisted id to exclude.
     */
    public function changePassword(User $user, string $password, ?PersonalAccessToken $current): void
    {
        $user->forceFill(['password' => $password])->save();

        $user->tokens()
            ->when($current, fn ($q) => $q->where('id', '!=', $current->id))
            ->delete();
    }

    /**
     * Withdraw the account: revoke all tokens, then soft delete so the
     * record (and its submissions) survive for the retention window.
     */
    public function delete(User $user): void
    {
        $user->tokens()->delete();
        $user->delete();
    }
}
