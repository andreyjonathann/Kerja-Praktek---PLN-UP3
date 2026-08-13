<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\UnitUp3;
use Illuminate\Http\Request;

class UnitUp3Controller extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        return response()->json(UnitUp3::orderBy('id', 'asc')->get());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'kode' => 'required|string|unique:unit_up3s,kode',
            'nama' => 'required|string',
            'wilayah' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif'
        ]);

        $unit = UnitUp3::create($validated);

        return response()->json([
            'message' => 'Unit UP3 berhasil ditambahkan',
            'data' => $unit
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $unit = UnitUp3::findOrFail($id);
        return response()->json($unit);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $unit = UnitUp3::findOrFail($id);

        $validated = $request->validate([
            'kode' => 'required|string|unique:unit_up3s,kode,' . $id,
            'nama' => 'required|string',
            'wilayah' => 'nullable|string',
            'status' => 'required|in:aktif,nonaktif'
        ]);

        $unit->update($validated);

        return response()->json([
            'message' => 'Unit UP3 berhasil diupdate',
            'data' => $unit
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $unit = UnitUp3::findOrFail($id);
        $unit->delete();

        return response()->json([
            'message' => 'Unit UP3 berhasil dihapus'
        ]);
    }
}
