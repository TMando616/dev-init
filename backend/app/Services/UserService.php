<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\ReactivationTokenRepository;
use App\Repositories\UserRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(
        protected UserRepository $repository,
        protected ReactivationTokenRepository $reactivationTokens,
    ) {}

    /**
     * List students. 'active' relies on the SoftDeletes global scope to hide
     * withdrawn accounts, so the default listing is unchanged.
     */
    public function list(string $status = 'active'): Collection
    {
        return $status === 'deleted'
            ? $this->repository->allTrashed()
            : $this->repository->all();
    }

    /**
     * Create a new student.
     */
    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);

        return $this->repository->create($data);
    }

    /**
     * Update a student. Hashes the password only when a new one is provided.
     */
    public function update(int $id, array $data): ?User
    {
        $user = $this->repository->find($id);
        if (!$user) {
            return null;
        }

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $this->repository->update($user, $data);

        return $user->fresh();
    }

    /**
     * Withdraw a student. Same handling as a self-service withdrawal: revoke
     * every token first so the account cannot keep using the API, then soft
     * delete so the record survives the retention window.
     */
    public function delete(int $id): bool
    {
        $user = $this->repository->find($id);
        if (!$user) {
            return false;
        }

        $user->tokens()->delete();

        return $this->repository->delete($user);
    }

    /**
     * Permanently delete a student, withdrawn or not, so an immediate
     * deletion request can be honoured without waiting out the retention
     * period. Submissions go with it via cascadeOnDelete.
     */
    public function forceDelete(int $id): bool
    {
        $user = $this->repository->findWithTrashed($id);
        if (!$user) {
            return false;
        }

        $user->tokens()->delete();

        // The email address is personal data too, and this table has no
        // foreign key to cascade from.
        $this->reactivationTokens->delete($user->email);

        return $this->repository->forceDelete($user);
    }
}
