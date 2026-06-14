<?php

namespace App\Services;

use App\Models\Admin;
use App\Repositories\AdminRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class AdminService
{
    public function __construct(
        protected AdminRepository $repository
    ) {}

    /**
     * List all admins.
     */
    public function list(): Collection
    {
        return $this->repository->all();
    }

    /**
     * Create a new admin (invited by an existing admin).
     */
    public function create(array $data): Admin
    {
        $data['password'] = Hash::make($data['password']);

        return $this->repository->create($data);
    }

    /**
     * Delete an admin. Self-deletion is forbidden.
     *
     * @return string 'self' | 'not_found' | 'deleted'
     */
    public function delete(int $id, int $currentId): string
    {
        if ($id === $currentId) {
            return 'self';
        }

        $admin = $this->repository->find($id);
        if (!$admin) {
            return 'not_found';
        }

        $this->repository->delete($admin);

        return 'deleted';
    }
}
