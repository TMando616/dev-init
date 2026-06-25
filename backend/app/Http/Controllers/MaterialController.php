<?php

namespace App\Http\Controllers;

use App\Services\MaterialService;
use Illuminate\Http\Request;

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

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'     => 'required|string|max:255',
            'content'   => 'required|string',
            'lesson_id' => 'required|exists:lessons,id',
            'order'     => 'nullable|integer|min:0',
        ]);

        $material = $this->service->createMaterial($validated);

        return response()->json($material->load('lesson:id,title'), 201);
    }

    public function update(Request $request, string $id)
    {
        $validated = $request->validate([
            'title'     => 'sometimes|required|string|max:255',
            'content'   => 'sometimes|required|string',
            'lesson_id' => 'required|exists:lessons,id',
            'order'     => 'nullable|integer|min:0',
        ]);

        $material = $this->service->updateMaterial((int)$id, $validated);
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
