<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class K3ActivityController extends Controller
{
    /**
     * GET /api/k3/activities
     * List activities with optional filters: unit, jenis, status, tahun, bulan.
     */
    public function index(Request $request)
    {
        $query = DB::table('k3_activities as act')
            ->leftJoin('users as u', 'u.id', '=', 'act.created_by')
            ->select('act.*', 'u.name as created_by_name');

        if ($request->filled('unit')) {
            $query->where('act.unit', $request->unit);
        }
        if ($request->filled('jenis')) {
            $query->where('act.jenis', $request->jenis);
        }
        if ($request->filled('status')) {
            $query->where('act.status', $request->status);
        }
        if ($request->filled('tahun')) {
            $query->whereYear('act.tanggal', $request->tahun);
        }
        if ($request->filled('bulan')) {
            $query->whereMonth('act.tanggal', $request->bulan);
        }

        $data = $query->orderBy('act.tanggal', 'desc')->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * POST /api/k3/activities
     * Create a new activity.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'jenis'      => 'required|in:inspeksi,rapat_p2k3,pelatihan,audit_internal,audit_mitra',
            'judul'      => 'required|string|max:255',
            'tanggal'    => 'required|date',
            'lokasi'     => 'required|string|max:200',
            'peserta'    => 'required|integer|min:0',
            'unit'       => 'required|string|max:100',
            'keterangan' => 'nullable|string|max:2000',
            'status'     => 'nullable|in:planned,done,cancelled',
        ]);

        $id = DB::table('k3_activities')->insertGetId([
            'jenis'      => $request->jenis,
            'judul'      => $request->judul,
            'tanggal'    => $request->tanggal,
            'lokasi'     => $request->lokasi,
            'peserta'    => $request->peserta,
            'keterangan' => $request->keterangan,
            'status'     => $request->get('status', 'planned'),
            'unit'       => $request->unit,
            'created_by' => $user->id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $activity = DB::table('k3_activities')->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan K3 berhasil ditambahkan.',
            'data'    => $activity,
        ], 201);
    }

    /**
     * GET /api/k3/activities/{id}
     * Show a single activity.
     */
    public function show($id)
    {
        $activity = DB::table('k3_activities as act')
            ->leftJoin('users as u', 'u.id', '=', 'act.created_by')
            ->select('act.*', 'u.name as created_by_name')
            ->where('act.id', $id)
            ->first();

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Kegiatan tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $activity]);
    }

    /**
     * PUT /api/k3/activities/{id}
     * Update an activity. Only creator or admin_k3 may update.
     */
    public function update(Request $request, $id)
    {
        $user     = auth()->user();
        $activity = DB::table('k3_activities')->find($id);

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Kegiatan tidak ditemukan.'], 404);
        }

        if ($activity->created_by !== $user->id && $user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'jenis'      => 'sometimes|required|in:inspeksi,rapat_p2k3,pelatihan,audit_internal,audit_mitra',
            'judul'      => 'sometimes|required|string|max:255',
            'tanggal'    => 'sometimes|required|date',
            'lokasi'     => 'sometimes|required|string|max:200',
            'peserta'    => 'sometimes|required|integer|min:0',
            'unit'       => 'sometimes|required|string|max:100',
            'keterangan' => 'nullable|string|max:2000',
            'status'     => 'sometimes|required|in:planned,done,cancelled',
        ]);

        $fields = $request->only([
            'jenis', 'judul', 'tanggal', 'lokasi',
            'peserta', 'keterangan', 'status', 'unit',
        ]);
        $fields['updated_at'] = now();

        DB::table('k3_activities')->where('id', $id)->update($fields);

        $activity = DB::table('k3_activities')->find($id);

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan K3 berhasil diperbarui.',
            'data'    => $activity,
        ]);
    }

    /**
     * DELETE /api/k3/activities/{id}
     * Delete an activity. Only creator or admin_k3 may delete.
     */
    public function destroy($id)
    {
        $user     = auth()->user();
        $activity = DB::table('k3_activities')->find($id);

        if (!$activity) {
            return response()->json(['success' => false, 'message' => 'Kegiatan tidak ditemukan.'], 404);
        }

        if ($activity->created_by !== $user->id && $user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        DB::table('k3_activities')->where('id', $id)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kegiatan K3 berhasil dihapus.',
        ]);
    }
}
