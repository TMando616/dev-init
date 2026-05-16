<?php

namespace App\Services;

use App\Models\Category;
use App\Repositories\CategoryRepository;
use Illuminate\Database\Eloquent\Collection;

class CategoryService
{
    public function __construct(
        protected CategoryRepository $repository
    ) {}

    public function getAllCategories(): Collection
    {
        return $this->repository->all();
    }

    public function getCategoryById(int $id): ?Category
    {
        return $this->repository->find($id);
    }

    public function createCategory(array $data): Category
    {
        return $this->repository->create($data);
    }

    public function updateCategory(int $id, array $data): ?Category
    {
        $category = $this->repository->find($id);
        if ($category) {
            $this->repository->update($category, $data);
            return $category->fresh();
        }
        return null;
    }

    public function deleteCategory(int $id): bool
    {
        $category = $this->repository->find($id);
        if ($category) {
            return $this->repository->delete($category);
        }
        return false;
    }
}
