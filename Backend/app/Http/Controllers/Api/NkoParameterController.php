<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\NkoParameter;
use App\Models\NkoRealization;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class NkoParameterController extends Controller
{
    // Retrieve all parameters in a hierarchical tree (supports up to 3 levels)
    // Optionally filter by ?tahun=&bulan= to show parameters active in that period
    public function index(Request $request)
    {
        $tahun = $request->query('tahun');
        $bulan = $request->query('bulan');

        $query = NkoParameter::whereNull('parent_id')->orderBy('urutan');

        // If period filter provided, show parameters that were active during that month
        if ($tahun && $bulan) {
            $periodEnd = Carbon::create((int)$tahun, (int)$bulan, 1)->endOfMonth();
            $query->withTrashed()
                ->where('created_at', '<=', $periodEnd)
                ->where(function ($q) use ($periodEnd) {
                    $q->whereNull('deleted_at')
                      ->orWhere('deleted_at', '>', $periodEnd);
                });
        }

        $parameters = $query->with(['children' => function($query) use ($tahun, $bulan) {
            $query->orderBy('urutan');
            if ($tahun && $bulan) {
                $periodEnd = Carbon::create((int)$tahun, (int)$bulan, 1)->endOfMonth();
                $query->withTrashed()
                    ->where('created_at', '<=', $periodEnd)
                    ->where(function ($q) use ($periodEnd) {
                        $q->whereNull('deleted_at')
                          ->orWhere('deleted_at', '>', $periodEnd);
                    });
            }
            $query->with(['children' => function($q) use ($tahun, $bulan) {
                $q->orderBy('urutan');
                if ($tahun && $bulan) {
                    $periodEnd = Carbon::create((int)$tahun, (int)$bulan, 1)->endOfMonth();
                    $q->withTrashed()
                        ->where('created_at', '<=', $periodEnd)
                        ->where(function ($q2) use ($periodEnd) {
                            $q2->whereNull('deleted_at')
                               ->orWhere('deleted_at', '>', $periodEnd);
                        });
                }
            }]);
        }])->get();

        return response()->json([
            'success' => true,
            'data' => $parameters
        ]);
    }

    // Store a new parameter (allows batch storing children)
    public function store(Request $request)
    {
        $user = $request->user();
        if (!$user || (strtolower($user->role) !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Hanya Admin yang dapat menambahkan parameter.'], 403);
        }

        $request->validate([
            'nama' => 'required|string|max:255',
            'bobot' => 'nullable|numeric|min:0|max:100',
            'parent_id' => 'nullable|exists:nko_parameters,id',
            'polaritas' => 'nullable|in:MAXIMIZE,MINIMIZE,RANGE',
            'satuan' => 'nullable|string|max:50',
            'urutan' => 'nullable|integer',
            'children' => 'nullable|array',
            'children.*.nama' => 'required|string|max:255',
            'children.*.bobot' => 'nullable|numeric|min:0',
            'children.*.polaritas' => 'nullable|in:MAXIMIZE,MINIMIZE,RANGE',
            'children.*.satuan' => 'nullable|string|max:50'
        ]);

        return DB::transaction(function () use ($request) {
            $isSub = $request->filled('parent_id');

            // Determine final bobot
            // If bobot not provided and children are given, auto-sum from children
            $bobotFromChildren = null;
            if (!$isSub && $request->has('children') && is_array($request->children)) {
                $bobotFromChildren = collect($request->children)->sum(function($c) {
                    return floatval($c['bobot'] ?? 0);
                });
            }
            $rawBobot = $request->filled('bobot') ? floatval($request->bobot) : null;
            $bobot = $rawBobot ?? $bobotFromChildren ?? 0;

            if (!$isSub) {
                // Validate total parent weights
                $currentParentSum = NkoParameter::whereNull('parent_id')->sum('bobot');
                if ($currentParentSum + $bobot > 100.001) { // Floating point tolerance
                    $maxAvailable = 100.00 - $currentParentSum;
                    return response()->json([
                        'success' => false,
                        'message' => "Total bobot Parameter Utama melebihi 100%. Sisa bobot yang tersedia: {$maxAvailable}%."
                    ], 422);
                }
            } else {
                // For sub-parameter: if no bobot supplied, leave as 0 (will be auto-derived from grandchildren later)
                $rawSubBobot = $request->filled('bobot') ? floatval($request->bobot) : null;
                $bobot = $rawSubBobot ?? 0;

                // Only validate against parent if bobot was actually supplied
                if ($rawSubBobot !== null) {
                    $parent = NkoParameter::find($request->parent_id);
                    if ($parent && $parent->bobot > 0) {
                        $currentChildSum = NkoParameter::where('parent_id', $request->parent_id)->sum('bobot');
                        if ($currentChildSum + $rawSubBobot > $parent->bobot + 0.001) {
                            $maxAvailable = $parent->bobot - $currentChildSum;
                            return response()->json([
                                'success' => false,
                                'message' => "Total bobot sub-parameter melebihi bobot Parameter Utama ({$parent->bobot}%). Sisa bobot yang tersedia: {$maxAvailable}%."
                            ], 422);
                        }
                    }
                }
            }

            $createdAt = $request->input('created_at') ? Carbon::parse($request->input('created_at')) : now();

            // Create parameter
            $parameter = new NkoParameter([
                'parent_id' => $request->parent_id,
                'nama' => $request->nama,
                'polaritas' => $request->polaritas ?? null,
                'satuan' => $request->satuan,
                'bobot' => $bobot,
                'urutan' => $request->urutan ?? 0,
                'is_active' => true
            ]);
            $parameter->created_at = $createdAt;
            $parameter->save();

            // Save children if provided
            if ($request->has('children') && is_array($request->children) && !$isSub) {
                $childBobotSum = collect($request->children)->sum(function($c) { return floatval($c['bobot'] ?? 0); });
                // Only validate if parent bobot is explicitly set and children sum exceeds it
                if ($rawBobot !== null && $childBobotSum > $rawBobot + 0.001) {
                    return response()->json([
                        'success' => false,
                        'message' => "Total bobot sub-parameter ({$childBobotSum}%) melebihi bobot Parameter Utama yang baru dibuat ({$rawBobot}%)."
                    ], 422);
                }

                foreach ($request->children as $index => $childData) {
                    $child = new NkoParameter([
                        'parent_id' => $parameter->id,
                        'nama' => $childData['nama'],
                        'polaritas' => $childData['polaritas'] ?? null,
                        'satuan' => $childData['satuan'] ?? null,
                        'bobot' => floatval($childData['bobot'] ?? 0),
                        'urutan' => $index + 1,
                        'is_active' => true
                    ]);
                    $child->created_at = $createdAt;
                    $child->save();
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Parameter berhasil ditambahkan.',
                'data' => $parameter->load('children')
            ], 201);
        });
    }

    // Update parameter details or order
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (strtolower($user->role) !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Hanya Admin yang dapat memperbarui parameter.'], 403);
        }

        $parameter = NkoParameter::findOrFail($id);

        $request->validate([
            'nama' => 'sometimes|required|string|max:255',
            'bobot' => 'nullable|numeric|min:0|max:100',
            'polaritas' => 'nullable|in:MAXIMIZE,MINIMIZE,RANGE',
            'satuan' => 'nullable|string|max:50',
            'urutan' => 'sometimes|required|integer',
            'is_active' => 'sometimes|required|boolean'
        ]);

        return DB::transaction(function () use ($request, $parameter) {
            $bobot = $request->filled('bobot') ? floatval($request->input('bobot')) : $parameter->bobot;

            if ($parameter->parent_id === null) {
                // Parent parameter weight check (only if bobot explicitly changed)
                if ($request->filled('bobot')) {
                    $currentParentSum = NkoParameter::whereNull('parent_id')
                        ->where('id', '!=', $parameter->id)
                        ->sum('bobot');
                    if ($currentParentSum + $bobot > 100.001) {
                        $maxAvailable = 100.00 - $currentParentSum;
                        return response()->json([
                            'success' => false,
                            'message' => "Total bobot Parameter Utama melebihi 100%. Maksimal bobot untuk parameter ini: {$maxAvailable}%."
                        ], 422);
                    }

                    // Also verify that the new parent weight is not smaller than its existing children's weight sum
                    $childrenSum = NkoParameter::where('parent_id', $parameter->id)->sum('bobot');
                    if ($bobot < $childrenSum - 0.001) {
                        return response()->json([
                            'success' => false,
                            'message' => "Bobot Parameter Utama ({$bobot}%) tidak boleh kurang dari jumlah bobot sub-parameternya ({$childrenSum}%)."
                        ], 422);
                    }
                }
            } else {
                // Sub-parameter weight check (only if bobot explicitly changed and parent has a set bobot)
                if ($request->filled('bobot')) {
                    $parent = NkoParameter::find($parameter->parent_id);
                    if ($parent && $parent->bobot > 0) {
                        $currentChildSum = NkoParameter::where('parent_id', $parameter->parent_id)
                            ->where('id', '!=', $parameter->id)
                            ->sum('bobot');
                        if ($currentChildSum + $bobot > $parent->bobot + 0.001) {
                            $maxAvailable = $parent->bobot - $currentChildSum;
                            return response()->json([
                                'success' => false,
                                'message' => "Total bobot sub-parameter melebihi bobot induknya ({$parent->bobot}%). Maksimal bobot untuk sub-parameter ini: {$maxAvailable}%."
                            ], 422);
                        }
                    }
                }
            }

            $updateData = $request->only(['nama', 'polaritas', 'satuan', 'urutan', 'is_active']);
            if ($request->filled('bobot')) {
                $updateData['bobot'] = $bobot;
            }
            $parameter->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Parameter berhasil diperbarui.',
                'data' => $parameter
            ]);
        });
    }

    // Soft delete parameter (recursive - handles Level 1, 2, and 3)
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if (!$user || (strtolower($user->role) !== 'admin')) {
            return response()->json(['success' => false, 'message' => 'Hanya Admin yang dapat menghapus parameter.'], 403);
        }

        $parameter = NkoParameter::findOrFail($id);

        // Recursively collect all descendant IDs
        $ids = $this->collectDescendantIds($parameter->id);
        $ids[] = $parameter->id;

        // Check if there is history in realizations
        $hasHistory = NkoRealization::whereIn('parameter_id', $ids)->exists();
        $isForce = $request->input('force') === 'true' || $request->input('force') === true;

        if ($hasHistory && !$isForce) {
            return response()->json([
                'success' => false,
                'has_history' => true,
                'message' => 'Parameter ini memiliki histori realisasi. Data historis tetap tersimpan dan bisa dilihat di laporan bulan-bulan sebelumnya. Apakah Anda yakin ingin menghapus parameter ini?'
            ], 200);
        }

        return DB::transaction(function () use ($ids) {
            // Soft delete all descendants and self
            NkoParameter::whereIn('id', $ids)->delete();

            return response()->json([
                'success' => true,
                'message' => 'Parameter berhasil dihapus. Tidak akan muncul di bulan ini dan seterusnya.'
            ]);
        });
    }

    // Recursively collect all descendant IDs
    private function collectDescendantIds($parentId)
    {
        $ids = [];
        $children = NkoParameter::where('parent_id', $parentId)->pluck('id')->toArray();
        foreach ($children as $childId) {
            $ids[] = $childId;
            $ids = array_merge($ids, $this->collectDescendantIds($childId));
        }
        return $ids;
    }
}
