<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\K3Activity;

class K3ActivityController extends Controller
{
    // ── Auth helpers ────────────────────────────────────────────────────────

    private function isAdminK3(Request $request): bool
    {
        return in_array($request->user()?->role, ['admin_k3', 'admin']);
    }

    private function forbiddenJson(string $message = 'Anda tidak berwenang.')
    {
        return response()->json(['message' => $message], 403);
    }

    // ── GET /k3/activities?tahun=2026&jenis=inspeksi ────────────────────────

    public function index(Request $request)
    {
        $query = K3Activity::query();
        if ($request->filled('tahun')) {
            $query->whereYear('tanggal', $request->tahun);
        }
        if ($request->filled('jenis') && $request->jenis !== 'all') {
            $query->where('jenis', $request->jenis);
        }
        return response()->json($query->orderBy('tanggal', 'desc')->get());
    }

    // ── POST /k3/activities ─────────────────────────────────────────────────

    public function store(Request $request)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya Admin K3 yang dapat menambah kegiatan.');
        }
        
        $validated = $request->validate([
            'jenis'      => 'required|in:inspeksi,rapat_p2k3,pelatihan,audit_internal,audit_mitra',
            'judul'      => 'required|string',
            'tanggal'    => 'required|date',
            'lokasi'     => 'required|string',
            'peserta'    => 'nullable|integer|min:0',
            'keterangan' => 'nullable|string',
            'status'     => 'nullable|in:planned,done,cancelled',
        ]);
        
        $validated['created_by'] = $request->user()->id;
        $activity = K3Activity::create($validated);
        
        return response()->json($activity, 201);
    }

    // ── PUT /k3/activities/{id} ─────────────────────────────────────────────

    public function update(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya Admin K3 yang dapat mengubah kegiatan.');
        }
        
        $activity = K3Activity::findOrFail($id);
        
        $validated = $request->validate([
            'jenis'      => 'sometimes|required|in:inspeksi,rapat_p2k3,pelatihan,audit_internal,audit_mitra',
            'judul'      => 'sometimes|required|string',
            'tanggal'    => 'sometimes|required|date',
            'lokasi'     => 'sometimes|required|string',
            'peserta'    => 'nullable|integer|min:0',
            'keterangan' => 'nullable|string',
            'status'     => 'nullable|in:planned,done,cancelled',
        ]);
        
        $activity->update($validated);
        
        return response()->json($activity);
    }

    // ── DELETE /k3/activities/{id} ──────────────────────────────────────────

    public function destroy(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya Admin K3 yang dapat menghapus kegiatan.');
        }
        
        K3Activity::findOrFail($id)->delete();
        
        return response()->json(['message' => 'Kegiatan berhasil dihapus.']);
    }
}
