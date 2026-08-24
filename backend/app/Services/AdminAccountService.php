<?php

namespace App\Services;

use App\Models\Admin;
use App\Repositories\AdminRepository;
use Laravel\Sanctum\PersonalAccessToken;

class AdminAccountService
{
    public function __construct(
        protected AdminRepository $repository,
    ) {}

    /**
     * Update the authenticated admin's own profile.
     */
    public function updateProfile(Admin $admin, array $data): Admin
    {
        $this->repository->update($admin, $data);

        return $admin->fresh();
    }

    /**
     * Change the authenticated admin's password and revoke every other
     * device's token. $current is null when called via Sanctum::actingAs()
     * in tests, whose TransientToken has no persisted id to exclude.
     */
    public function changePassword(Admin $admin, string $password, ?PersonalAccessToken $current): void
    {
        $admin->forceFill(['password' => $password])->save();

        $admin->tokens()
            ->when($current, fn ($q) => $q->where('id', '!=', $current->id))
            ->delete();
    }
}
