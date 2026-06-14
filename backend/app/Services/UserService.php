<?php

namespace App\Services;

use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function __construct(
        protected UserRepository $repository
    ) {}

    /**
     * List all students.
     */
    public function list(): Collection
    {
        return $this->repository->all();
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
     * Delete a student.
     */
    public function delete(int $id): bool
    {
        $user = $this->repository->find($id);
        if (!$user) {
            return false;
        }

        return $this->repository->delete($user);
    }
}
