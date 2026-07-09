<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class K3FindingController extends Controller
{
    /**
     * GET /api/k3/findings
     * List findings with optional filters: unit, jenis, status, assessment_id, bulan, tahun.
     */
    public function index(Request $request)
    {
        $query = DB::table('k3_findings as f')
            ->leftJoin('users as u', 'u.id', '=', 'f.created_by')
            ->select('f.*', 'u.name as created_by_name');

        if ($request->filled('unit')) {
            $query->where('f.unit', $request->unit);
        }
        if ($request->filled('jenis')) {
            $query->where('f.jenis', $request->jenis);
        }
        if ($request->filled('status')) {
            $query->where('f.status', $request->status);
        }
        if ($request->filled('assessment_id')) {
            $query->where('f.assessment_id', $request->assessment_id);
        }
        if ($request->filled('tahun')) {
            $query->whereYear('f.created_at', $request->tahun);
        }

        $data = $query->orderBy('f.created_at', 'desc')->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/k3/findings
     * Create a new finding record.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'judul'         => 'required|string|max:255',
            'deskripsi'     => 'required|string',
            'jenis'         => 'required|in:observasi,minor,mayor,kritikal',
            'pic_name'      => 'required|string|max:150',
            'due_date'      => 'required|date',
            'unit'          => 'required|string|max:100',
            'assessment_id' => 'nullable|integer|exists:k3_assessments,id',
            'status'        => 'nullable|in:open,in_progress,closed',
            'catatan_tindak_lanjut' => 'nullable|string|max:2000',
        ]);

        $id = DB::table('k3_findings')->insertGetId([
            'assessment_id'         => $request->assessment_id,
            'judul'                 => $request->judul,
            'deskripsi'             => $request->deskripsi,
            'jenis'                 => $request->jenis,
            'pic_name'              => $request->pic_name,
            'due_date'              => $request->due_date,
            'status'                => $request->get('status', 'open'),
            'catatan_tindak_lanjut' => $request->catatan_tindak_lanjut,
            'unit'                  => $request->unit,
            'created_by'            => $user->id,
            'created_at'            => now(),
            'updated_at'            => now(),
        ]);

        $finding = DB::table('k3_findings')->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Finding berhasil ditambahkan.',
            'data'    => $finding,
        ], 201);
    }

    /**
     * GET /api/k3/findings/{id}
     * Show a single finding.
     */
    public function show($id)
    {
        $finding = DB::table('k3_findings as f')
            ->leftJoin('users as u', 'u.id', '=', 'f.created_by')
            ->select('f.*', 'u.name as created_by_name')
            ->where('f.id', $id)
            ->first();

        if (!$finding) {
            return response()->json(['success' => false, 'message' => 'Finding tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $finding]);
    }

    /**
     * PUT /api/k3/findings/{id}
     * Update a finding (all fields editable by creator or admin_k3).
     */
    public function update(Request $request, $id)
    {
        $user    = auth()->user();
        $finding = DB::table('k3_findings')->find($id);

        if (!$finding) {
            return response()->json(['success' => false, 'message' => 'Finding tidak ditemukan.'], 404);
        }

        // Only creator or admin_k3 may update
        if ($finding->created_by !== $user->id && $user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'judul'         => 'sometimes|required|string|max:255',
            'deskripsi'     => 'sometimes|required|string',
            'jenis'         => 'sometimes|required|in:observasi,minor,mayor,kritikal',
            'pic_name'      => 'sometimes|required|string|max:150',
            'due_date'      => 'sometimes|required|date',
            'unit'          => 'sometimes|required|string|max:100',
            'status'        => 'sometimes|required|in:open,in_progress,closed',
            'catatan_tindak_lanjut' => 'nullable|string|max:2000',
            'assessment_id' => 'nullable|integer|exists:k3_assessments,id',
        ]);

        $updated = array_filter($request->only([
            'assessment_id',
            'judul',
            'deskripsi',
            'jenis',
            'pic_name',
            'due_date',
            'status',
            'catatan_tindak_lanjut',
            'unit',
        ]), fn ($v) => $v !== null);

        $updated['updated_at'] = now();

        DB::table('k3_findings')->where('id', $id)->update($updated);

        $finding = DB::table('k3_findings')->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Finding berhasil diperbarui.',
            'data'    => $finding,
        ]);
    }

    /**
     * DELETE /api/k3/findings/{id}
     * Delete a finding. Only creator or admin_k3 may delete.
     */
    public function destroy($id)
    {
        $user    = auth()->user();
        $finding = DB::table('k3_findings')->find($id);

        if (!$finding) {
            return response()->json(['success' => false, 'message' => 'Finding tidak ditemukan.'], 404);
        }

        if ($finding->created_by !== $user->id && $user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        DB::table('k3_findings')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Finding berhasil dihapus.',
        ]);
    }
}
