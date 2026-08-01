<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Services\CategoryService;

class CategoryController extends Controller
{
    public function __construct(
        protected CategoryService $service
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json($this->service->getAllCategories());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreCategoryRequest $request)
    {
        $category = $this->service->createCategory($request->validated());

        return response()->json($category, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $category = $this->service->getCategoryById((int)$id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateCategoryRequest $request, string $id)
    {
        $category = $this->service->updateCategory((int)$id, $request->validated());

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $deleted = $this->service->deleteCategory((int)$id);

        if (!$deleted) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json(null, 204);
    }
}
