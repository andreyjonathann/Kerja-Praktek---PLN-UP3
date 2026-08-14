<?php

namespace App\Http\Controllers\Api\Keuangan;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\RealisasiPembayaran;
use App\Models\DokumenPendukung;
use App\Models\Pengadaan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class RealisasiPembayaranController extends Controller
{
    /**
     * Get all payments and documents for a specific contract (pengadaans.id).
     */
    public function index($pengadaanId)
    {
        $pengadaan = Pengadaan::with(['realisasiPembayarans.user', 'dokumenPendukungs.user'])
            ->findOrFail($pengadaanId);

        $totalTerbayar = $pengadaan->realisasiPembayarans->sum('nilai_realisasi');
        $sisaKontrak = max(0, $pengadaan->rp_kontrak - $totalTerbayar);

        return response()->json([
            'pengadaan' => $pengadaan,
            'realisasi_pembayarans' => $pengadaan->realisasiPembayarans,
            'dokumen_pendukungs' => $pengadaan->dokumenPendukungs,
            'summary' => [
                'nilai_kontrak' => $pengadaan->rp_kontrak,
                'total_terbayar' => $totalTerbayar,
                'sisa_kontrak' => $sisaKontrak
            ]
        ]);
    }

    /**
     * Store a new payment realization.
     */
    public function storePayment(Request $request)
    {
        $request->validate([
            'pengadaan_id' => 'required|exists:pengadaans,id',
            'jenis' => 'required|string',
            'termin_ke' => 'required|integer|min:1',
            'nilai_realisasi' => 'required|numeric|min:0',
            'tanggal_bayar' => 'nullable|date',
            'bulan_rencana_bayar' => 'nullable|string',
            'keterangan_kendala' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $payment = RealisasiPembayaran::create([
            'pengadaan_id' => $request->pengadaan_id,
            'jenis' => $request->jenis,
            'termin_ke' => $request->termin_ke,
            'nilai_realisasi' => $request->nilai_realisasi,
            'tanggal_bayar' => $request->tanggal_bayar,
            'bulan_rencana_bayar' => $request->bulan_rencana_bayar,
            'keterangan_kendala' => $request->keterangan_kendala,
            'status' => $request->status,
            'input_by' => Auth::id()
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil ditambahkan',
            'data' => $payment->load('user')
        ], 201);
    }

    /**
     * Update an existing payment realization.
     */
    public function updatePayment(Request $request, $id)
    {
        $payment = RealisasiPembayaran::findOrFail($id);

        $request->validate([
            'jenis' => 'required|string',
            'termin_ke' => 'required|integer|min:1',
            'nilai_realisasi' => 'required|numeric|min:0',
            'tanggal_bayar' => 'nullable|date',
            'bulan_rencana_bayar' => 'nullable|string',
            'keterangan_kendala' => 'nullable|string',
            'status' => 'required|string',
        ]);

        $payment->update([
            'jenis' => $request->jenis,
            'termin_ke' => $request->termin_ke,
            'nilai_realisasi' => $request->nilai_realisasi,
            'tanggal_bayar' => $request->tanggal_bayar,
            'bulan_rencana_bayar' => $request->bulan_rencana_bayar,
            'keterangan_kendala' => $request->keterangan_kendala,
            'status' => $request->status,
        ]);

        return response()->json([
            'message' => 'Pembayaran berhasil diperbarui',
            'data' => $payment->load('user')
        ]);
    }

    /**
     * Delete a payment realization.
     */
    public function destroyPayment($id)
    {
        $payment = RealisasiPembayaran::findOrFail($id);
        $payment->delete();

        return response()->json([
            'message' => 'Pembayaran berhasil dihapus'
        ]);
    }

    /**
     * Upload a supporting document (BASTP/AMD).
     */
    public function uploadDocument(Request $request)
    {
        $request->validate([
            'pengadaan_id' => 'required|exists:pengadaans,id',
            'jenis' => 'required|string|in:bastp,amd',
            'urutan_ke' => 'required|integer|min:1',
            'nomor_dokumen' => 'required|string',
            'tanggal_dokumen' => 'required|date',
            'file' => 'nullable|file|mimes:pdf,jpg,png,zip,docx|max:10240', // max 10MB
        ]);

        $filePath = null;
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $filePath = $file->storeAs('dokumen_pendukung', $fileName, 'public');
        }

        $document = DokumenPendukung::create([
            'pengadaan_id' => $request->pengadaan_id,
            'jenis' => $request->jenis,
            'urutan_ke' => $request->urutan_ke,
            'nomor_dokumen' => $request->nomor_dokumen,
            'tanggal_dokumen' => $request->tanggal_dokumen,
            'file_path' => $filePath,
            'uploaded_by' => Auth::id()
        ]);

        return response()->json([
            'message' => 'Dokumen berhasil diunggah',
            'data' => $document->load('user')
        ], 201);
    }

    /**
     * Delete a supporting document.
     */
    public function destroyDocument($id)
    {
        $document = DokumenPendukung::findOrFail($id);

        if ($document->file_path && Storage::disk('public')->exists($document->file_path)) {
            Storage::disk('public')->delete($document->file_path);
        }

        $document->delete();

        return response()->json([
            'message' => 'Dokumen berhasil dihapus'
        ]);
    }
}
