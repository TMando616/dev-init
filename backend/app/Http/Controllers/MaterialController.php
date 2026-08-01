<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMaterialRequest;
use App\Http\Requests\UpdateMaterialRequest;
use App\Services\MaterialService;

class MaterialController extends Controller
{
    public function __construct(
        protected MaterialService $service
    ) {}

    public function index()
    {
        return response()->json($this->service->getAllMaterials());
    }

    public function show(string $id)
    {
        $result = $this->service->getMaterialById((int)$id);

        if (!$result) {
            return response()->json(['message' => 'Material not found'], 404);
        }

        return response()->json($result);
    }

    public function store(StoreMaterialRequest $request)
    {
        $material = $this->service->createMaterial($request->validated());

        return response()->json($material->load('lesson:id,title'), 201);
    }

    public function update(UpdateMaterialRequest $request, string $id)
    {
        $material = $this->service->updateMaterial((int)$id, $request->validated());
        if (!$material) {
            return response()->json(['message' => 'Material not found'], 404);
        }

        return response()->json($material->load('lesson:id,title'));
    }

    public function destroy(string $id)
    {
        $deleted = $this->service->deleteMaterial((int)$id);

        if (!$deleted) {
            return response()->json(['message' => 'Material not found'], 404);
        }

        return response()->json(null, 204);
    }
}
