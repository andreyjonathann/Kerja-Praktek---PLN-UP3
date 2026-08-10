<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\K3Finding;
use App\Models\K3FindingProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class K3FindingController extends Controller
{
    private function isAdminK3(Request $request): bool
    {
        return in_array($request->user()?->role, ['pic_k3', 'admin_k3', 'admin']);
    }

    private function forbiddenJson(string $message = 'Anda tidak berwenang.')
    {
        return response()->json(['message' => $message], 403);
    }

    public function index(Request $request)
    {
        $query = K3Finding::with('progress')->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        if ($request->filled('jenis') && $request->jenis !== 'all') {
            $query->where('jenis', $request->jenis);
        }
        if ($request->filled('tahun')) {
            $query->whereYear('created_at', $request->tahun);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat menambah temuan.');
        }

        $validated = $request->validate([
            'judul'      => 'required|string',
            'deskripsi'  => 'nullable|string',
            'jenis'      => 'required|in:observasi,minor,mayor,kritikal',
            'pic_name'   => 'nullable|string',
            'due_date'   => 'nullable|date',
            'status'     => 'nullable|in:open,in_progress,closed',
            'unit'       => 'nullable|string',
            'foto'       => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'catatan_tindak_lanjut' => 'nullable|string',
        ]);

        if ($request->hasFile('foto')) {
            $file = $request->file('foto');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $validated['foto_path'] = $file->storeAs('k3_temuan', $filename, 'public');
            $validated['foto_name'] = $file->getClientOriginalName();
        }

        $validated['created_by'] = $request->user()->id;
        $catatanAwal = $validated['catatan_tindak_lanjut'] ?? null;
        unset($validated['catatan_tindak_lanjut'], $validated['foto']);

        $finding = K3Finding::create($validated);

        if ($catatanAwal) {
            $finding->progress()->create([
                'text'   => $catatanAwal,
                'author' => $request->user()->name,
            ]);
        }

        return response()->json($finding->load('progress'), 201);
    }

    public function update(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat mengubah temuan.');
        }

        $finding = K3Finding::findOrFail($id);

        $validated = $request->validate([
            'judul'      => 'sometimes|required|string',
            'deskripsi'  => 'nullable|string',
            'jenis'      => 'sometimes|required|in:observasi,minor,mayor,kritikal',
            'pic_name'   => 'nullable|string',
            'due_date'   => 'nullable|date',
            'status'     => 'nullable|in:open,in_progress,closed',
            'unit'       => 'nullable|string',
            'foto'       => 'nullable|image|mimes:jpg,jpeg,png|max:5120',
            'remove_foto'=> 'nullable|boolean',
        ]);

        if ($request->hasFile('foto')) {
            if ($finding->foto_path) {
                Storage::disk('public')->delete($finding->foto_path);
            }
            $file = $request->file('foto');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $validated['foto_path'] = $file->storeAs('k3_temuan', $filename, 'public');
            $validated['foto_name'] = $file->getClientOriginalName();
        } elseif ($request->boolean('remove_foto') && $finding->foto_path) {
            Storage::disk('public')->delete($finding->foto_path);
            $validated['foto_path'] = null;
            $validated['foto_name'] = null;
        }
        unset($validated['foto'], $validated['remove_foto']);

        $finding->update($validated);

        return response()->json($finding->load('progress'));
    }

    public function changeStatus(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat mengubah status.');
        }
        $finding = K3Finding::findOrFail($id);
        $validated = $request->validate([
            'status' => 'required|in:open,in_progress,closed',
        ]);
        $finding->update($validated);
        return response()->json($finding);
    }

    public function destroy(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat menghapus temuan.');
        }

        $finding = K3Finding::findOrFail($id);

        if ($finding->foto_path) {
            Storage::disk('public')->delete($finding->foto_path);
        }
        foreach ($finding->progress as $p) {
            if ($p->attachment_path) {
                Storage::disk('public')->delete($p->attachment_path);
            }
        }

        $finding->delete();

        return response()->json(['message' => 'Temuan berhasil dihapus.']);
    }

    public function addProgress(Request $request, $id)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat menambah progress.');
        }

        $finding = K3Finding::findOrFail($id);

        $validated = $request->validate([
            'text'       => 'required|string',
            'attachment' => 'nullable|file|image|max:5120',
        ]);

        $data = [
            'text'   => $validated['text'],
            'author' => $request->user()->name,
        ];

        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $data['attachment_path'] = $file->storeAs('k3_temuan_progress', $filename, 'public');
            $data['attachment_name'] = $file->getClientOriginalName();
        }

        $progress = $finding->progress()->create($data);

        return response()->json($progress, 201);
    }

    public function deleteProgressAttachment(Request $request, $findingId, $progressId)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat menghapus lampiran.');
        }

        $progress = K3FindingProgress::where('k3_finding_id', $findingId)->findOrFail($progressId);

        if ($progress->attachment_path) {
            Storage::disk('public')->delete($progress->attachment_path);
        }
        $progress->update(['attachment_path' => null, 'attachment_name' => null]);

        return response()->json($progress);
    }

    public function addProgressAttachment(Request $request, $findingId, $progressId)
    {
        if (!$this->isAdminK3($request)) {
            return $this->forbiddenJson('Hanya PIC K3 yang dapat menambah lampiran.');
        }

        $progress = K3FindingProgress::where('k3_finding_id', $findingId)->findOrFail($progressId);

        $validated = $request->validate([
            'attachment' => 'required|image|mimes:jpg,jpeg,png|max:5120',
        ]);

        if ($progress->attachment_path) {
            Storage::disk('public')->delete($progress->attachment_path);
        }

        $file = $request->file('attachment');
        $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
        $progress->update([
            'attachment_path' => $file->storeAs('k3_temuan_progress', $filename, 'public'),
            'attachment_name' => $file->getClientOriginalName(),
        ]);

        return response()->json($progress);
    }
}
