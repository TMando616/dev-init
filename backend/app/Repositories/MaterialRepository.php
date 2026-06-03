<?php

namespace App\Repositories;

use App\Models\Material;
use Illuminate\Database\Eloquent\Collection;

class MaterialRepository
{
    /**
     * Columns sufficient for list views; excludes the heavy `content` TEXT body.
     */
    private const LIST_COLUMNS = ['id', 'title', 'category_id', 'order', 'created_at', 'updated_at'];

    public function all(): Collection
    {
        return Material::with('category')->ordered()->get(self::LIST_COLUMNS);
    }

    public function find(int $id): ?Material
    {
        return Material::with('category')->find($id);
    }

    public function findByCategory(int $categoryId): Collection
    {
        return Material::with('category')
            ->where('category_id', $categoryId)
            ->ordered()
            ->get(self::LIST_COLUMNS);
    }

    public function create(array $data): Material
    {
        return Material::create($data);
    }

    public function update(Material $material, array $data): bool
    {
        return $material->update($data);
    }

    public function delete(Material $material): bool
    {
        return $material->delete();
    }

    public function findPrevNext(Material $material): array
    {
        $base = Material::query();

        if ($material->category_id) {
            $base->where('category_id', $material->category_id);
        } else {
            $base->whereNull('category_id');
        }

        $prev = (clone $base)
            ->where(function ($q) use ($material) {
                $q->where('order', '<', $material->order)
                  ->orWhere(function ($q2) use ($material) {
                      $q2->where('order', $material->order)->where('id', '<', $material->id);
                  });
            })
            ->orderByDesc('order')->orderByDesc('id')
            ->first();

        $next = (clone $base)
            ->where(function ($q) use ($material) {
                $q->where('order', '>', $material->order)
                  ->orWhere(function ($q2) use ($material) {
                      $q2->where('order', $material->order)->where('id', '>', $material->id);
                  });
            })
            ->orderBy('order')->orderBy('id')
            ->first();

        return ['prev' => $prev, 'next' => $next];
    }
}
