<?php

namespace App\Services;

use App\Models\Material;
use App\Repositories\MaterialRepository;
use Illuminate\Database\Eloquent\Collection;

class MaterialService
{
    public function __construct(
        protected MaterialRepository $repository
    ) {}

    public function getAllMaterials(): Collection
    {
        return $this->repository->all();
    }

    public function getMaterialById(int $id): ?array
    {
        $material = $this->repository->find($id);
        if (!$material) {
            return null;
        }

        ['prev' => $prev, 'next' => $next] = $this->repository->findPrevNext($material);

        return [
            'material' => $material,
            'prev' => $prev ? ['id' => $prev->id, 'title' => $prev->title] : null,
            'next' => $next ? ['id' => $next->id, 'title' => $next->title] : null,
        ];
    }

    public function getMaterialsByCategoryId(int $categoryId): Collection
    {
        return $this->repository->findByCategory($categoryId);
    }

    public function createMaterial(array $data): Material
    {
        return $this->repository->create($data);
    }

    public function updateMaterial(int $id, array $data): ?Material
    {
        $material = $this->repository->find($id);
        if ($material) {
            $this->repository->update($material, $data);
            return $material->fresh();
        }
        return null;
    }

    public function deleteMaterial(int $id): bool
    {
        $material = $this->repository->find($id);
        if ($material) {
            return $this->repository->delete($material);
        }
        return false;
    }
}
