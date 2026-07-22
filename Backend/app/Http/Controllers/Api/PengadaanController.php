<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pengadaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class PengadaanController extends Controller
{
    public function __construct()
    {
        $this->middleware(\App\Http\Middleware\RestrictPengadaanWrites::class)
             ->only(['store', 'update', 'destroy', 'updateStatus', 'deleteFile']);
    }

    public function index(Request $request)
    {
        $query = Pengadaan::query();

        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('direksi_pekerjaan')) {
            $query->where('direksi_pekerjaan', $request->direksi_pekerjaan);
        }
        if ($request->filled('no_nd_bidang')) {
            $query->where('no_nd_bidang', 'like', '%' . $request->no_nd_bidang . '%');
        }
        if ($request->filled('pt_pelaksana')) {
            $query->where('pt_pelaksana', 'like', '%' . $request->pt_pelaksana . '%');
        }
        if ($request->filled('no_kontrak')) {
            $query->where('no_kontrak', 'like', '%' . $request->no_kontrak . '%');
        }
        if ($request->filled('uraian_pekerjaan')) {
            $query->where('uraian_pekerjaan', 'like', '%' . $request->uraian_pekerjaan . '%');
        }
        if ($request->filled('skko_skki')) {
            $query->where('skko_skki', $request->skko_skki);
        }
        if ($request->filled('jenis_kontrak')) {
            $query->where('jenis_kontrak', $request->jenis_kontrak);
        }
        if ($request->filled('klasifikasi')) {
            $query->where('klasifikasi', $request->klasifikasi);
        }

        if ($request->filled('tahun')) {
            $year = $request->tahun;
            $query->where(function($q) use ($year) {
                $q->whereYear('tgl_awal', $year)
                  ->orWhereNull('tgl_awal');
            });
        }

        // Date Range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->whereBetween('tgl_awal', [$request->start_date, $request->end_date]);
        }

        // Tgl Akhir (Kontrak Berakhir) filter
        if ($request->filled('kontrak_berakhir')) {
            $query->where('tgl_akhir', '<=', $request->kontrak_berakhir);
        }

        $data = $query->orderBy('id', 'desc')->get();

        return response()->json([
            'success' => true,
            'data' => $data
        ]);
    }

    public function dashboard(Request $request)
    {
        $year = $request->input('tahun', 2026);

        // Fetch all data for the year to perform aggregations
        $query = Pengadaan::query();
        if ($year) {
            $query->where(function($q) use ($year) {
                $q->whereYear('tgl_awal', $year)
                  ->orWhereNull('tgl_awal'); // include 'Batal' or 'Proses' without start dates
            });
        }

        // Filter constraints matching current active filters on dashboard if any
        if ($request->filled('direksi_pekerjaan')) {
            $query->where('direksi_pekerjaan', $request->direksi_pekerjaan);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('no_nd_bidang')) {
            $query->where('no_nd_bidang', 'like', '%' . $request->no_nd_bidang . '%');
        }
        if ($request->filled('pt_pelaksana')) {
            $query->where('pt_pelaksana', 'like', '%' . $request->pt_pelaksana . '%');
        }
        if ($request->filled('no_kontrak')) {
            $query->where('no_kontrak', 'like', '%' . $request->no_kontrak . '%');
        }
        if ($request->filled('uraian_pekerjaan')) {
            $query->where('uraian_pekerjaan', 'like', '%' . $request->uraian_pekerjaan . '%');
        }

        $allRecords = $query->get();

        // 1. KPI Cards & Pagu Calculations
        $totalPengadaan = $allRecords->count();
        $totalRpKontrak = $allRecords->sum('rp_kontrak');
        $totalRab = $allRecords->sum('rab');
        
        $rpEfisiensi = $totalRab - $totalRpKontrak;
        $pctEfisiensi = $totalRab > 0 ? ($rpEfisiensi / $totalRab) * 100 : 0;

        // Calculate Pagu and Terpakai for B1, B2, B3, A0
        $paguB1 = \App\Models\PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B1')->sum('nominal');
        $paguB2 = \App\Models\PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B2')->sum('nominal');
        $paguB3 = \App\Models\PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKI')->where('klasifikasi', 'B3')->sum('nominal');
        $paguA0 = \App\Models\PaguAnggaran::where('tahun', $year)->where('skko_skki', 'SKKO')->where('klasifikasi', 'A0')->sum('nominal');

        $rabB1 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B1')->sum('rab');
        $rabB2 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B2')->sum('rab');
        $rabB3 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B3')->sum('rab');
        $rabA0 = $allRecords->where('skko_skki', 'SKKO')->where('klasifikasi', 'A0')->sum('rab');

        $terpakaiB1 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B1')->sum('rp_kontrak');
        $terpakaiB2 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B2')->sum('rp_kontrak');
        $terpakaiB3 = $allRecords->where('skko_skki', 'SKKI')->where('klasifikasi', 'B3')->sum('rp_kontrak');
        $terpakaiA0 = $allRecords->where('skko_skki', 'SKKO')->where('klasifikasi', 'A0')->sum('rp_kontrak');

        $efiB1 = $rabB1 - $terpakaiB1;
        $efiB2 = $rabB2 - $terpakaiB2;
        $efiB3 = $rabB3 - $terpakaiB3;
        $efiA0 = $rabA0 - $terpakaiA0;

        $paguSummary = [
            'B1' => [
                'pagu' => $paguB1, 
                'terpakai' => $terpakaiB1, 
                'sisa' => $paguB1 - $terpakaiB1,
                'rab' => $rabB1,
                'efisiensi_nominal' => $efiB1,
                'efisiensi_persen' => $rabB1 > 0 ? round(($efiB1 / $rabB1) * 100, 2) : 0
            ],
            'B2' => [
                'pagu' => $paguB2, 
                'terpakai' => $terpakaiB2, 
                'sisa' => $paguB2 - $terpakaiB2,
                'rab' => $rabB2,
                'efisiensi_nominal' => $efiB2,
                'efisiensi_persen' => $rabB2 > 0 ? round(($efiB2 / $rabB2) * 100, 2) : 0
            ],
            'B3' => [
                'pagu' => $paguB3, 
                'terpakai' => $terpakaiB3, 
                'sisa' => $paguB3 - $terpakaiB3,
                'rab' => $rabB3,
                'efisiensi_nominal' => $efiB3,
                'efisiensi_persen' => $rabB3 > 0 ? round(($efiB3 / $rabB3) * 100, 2) : 0
            ],
            'A0' => [
                'pagu' => $paguA0, 
                'terpakai' => $terpakaiA0, 
                'sisa' => $paguA0 - $terpakaiA0,
                'rab' => $rabA0,
                'efisiensi_nominal' => $efiA0,
                'efisiensi_persen' => $rabA0 > 0 ? round(($efiA0 / $rabA0) * 100, 2) : 0
            ],
        ];

        // 2. Pie Charts
        // A. KR, SPBL, PL (support legacy SPBJ/SPK)
        $jenisCounts = [
            'KR'   => $allRecords->filter(fn($r) => in_array($r->jenis_kontrak, ['KR', 'SPBJ']))->count(),
            'SPBL' => $allRecords->where('jenis_kontrak', 'SPBL')->count(),
            'PL'   => $allRecords->filter(fn($r) => in_array($r->jenis_kontrak, ['PL', 'SPK']))->count(),
        ];

        // B. SKKO, SKKI
        $skkoSkkiCounts = [
            'SKKO' => $allRecords->where('skko_skki', 'SKKO')->count(),
            'SKKI' => $allRecords->where('skko_skki', 'SKKI')->count(),
        ];

        // C. A0, B1, B2, B3
        $klasifikasiCounts = [
            'A0' => $allRecords->where('klasifikasi', 'A0')->count(),
            'B1' => $allRecords->where('klasifikasi', 'B1')->count(),
            'B2' => $allRecords->where('klasifikasi', 'B2')->count(),
            'B3' => $allRecords->where('klasifikasi', 'B3')->count(),
        ];

        // 3. Monthly Bar Chart
        $monthsName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        $monthlyTrend = [];
        
        for ($m = 1; $m <= 12; $m++) {
            $monthlyRecords = $allRecords->filter(function($r) use ($m) {
                if (!$r->tgl_awal) return false;
                return Carbon::parse($r->tgl_awal)->month === $m;
            });

            $monthlyTrend[] = [
                'month' => $monthsName[$m - 1] . ' ' . $year,
                'KR'   => $monthlyRecords->filter(fn($r) => in_array($r->jenis_kontrak, ['KR', 'SPBJ']))->count(),
                'SPBL' => $monthlyRecords->where('jenis_kontrak', 'SPBL')->count(),
                'PL'   => $monthlyRecords->filter(fn($r) => in_array($r->jenis_kontrak, ['PL', 'SPK']))->count(),
            ];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'summary' => [
                    'total_pengadaan' => $totalPengadaan,
                    'rp_kontrak' => $totalRpKontrak,
                    'rp_efisiensi' => $rpEfisiensi,
                    'pct_efisiensi' => round($pctEfisiensi, 2),
                ],
                'pagu_summary' => $paguSummary,
                'charts' => [
                    'jenis_kontrak' => $jenisCounts,
                    'skko_skki' => $skkoSkkiCounts,
                    'klasifikasi' => $klasifikasiCounts,
                ],
                'monthly_trend' => $monthlyTrend
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'nullable|string',
            'direksi_pekerjaan' => 'required|string',
            'uraian_pekerjaan' => 'required|string',
            'no_pr' => 'nullable|string',
            'pt_pelaksana' => 'nullable|string',
            'no_kontrak' => 'nullable|string',
            'tgl_awal' => 'nullable|date',
            'tgl_akhir' => 'nullable|date',
            'rp_kontrak' => 'nullable|numeric',
            'rab' => 'nullable|numeric',
            'no_nd_bidang' => 'nullable|string',
            'skko_skki' => 'nullable|string',
            'jenis_kontrak' => 'nullable|string',
            'klasifikasi' => 'nullable|string',
            'file_kontrak' => 'nullable|file|mimes:pdf|max:10240',
            'file_kontrak_2' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $data = $request->except(['file_kontrak', 'file_kontrak_2']);
        if (empty($data['status'])) {
            $data['status'] = 'Proses';
        }
        $data['created_by'] = auth()->id();

        if ($request->hasFile('file_kontrak')) {
            $file = $request->file('file_kontrak');
            $filename = time() . '_1_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $path = $file->storeAs('dokumen_kontrak', $filename, 'public');
            $data['file_kontrak'] = $path;
        }

        if ($request->hasFile('file_kontrak_2')) {
            $file = $request->file('file_kontrak_2');
            $filename = time() . '_2_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $path = $file->storeAs('dokumen_kontrak', $filename, 'public');
            $data['file_kontrak_2'] = $path;
        }

        $pengadaan = Pengadaan::create($data);

        return response()->json([
            'success' => true,
            'data' => $pengadaan,
            'message' => 'Data Pengadaan berhasil disimpan'
        ]);
    }

    public function show($id)
    {
        $pengadaan = Pengadaan::findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $pengadaan
        ]);
    }

    public function update(Request $request, $id)
    {
        $pengadaan = Pengadaan::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'nullable|string',
            'direksi_pekerjaan' => 'required|string',
            'uraian_pekerjaan' => 'required|string',
            'no_pr' => 'nullable|string',
            'pt_pelaksana' => 'nullable|string',
            'no_kontrak' => 'nullable|string',
            'tgl_awal' => 'nullable|date',
            'tgl_akhir' => 'nullable|date',
            'rp_kontrak' => 'nullable|numeric',
            'rab' => 'nullable|numeric',
            'no_nd_bidang' => 'nullable|string',
            'skko_skki' => 'nullable|string',
            'jenis_kontrak' => 'nullable|string',
            'klasifikasi' => 'nullable|string',
            'file_kontrak' => 'nullable|file|mimes:pdf|max:10240',
            'file_kontrak_2' => 'nullable|file|mimes:pdf|max:10240',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $data = $request->except(['file_kontrak', 'file_kontrak_2']);

        if ($request->hasFile('file_kontrak')) {
            if ($pengadaan->file_kontrak && \Illuminate\Support\Facades\Storage::disk('public')->exists($pengadaan->file_kontrak)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pengadaan->file_kontrak);
            }
            $file = $request->file('file_kontrak');
            $filename = time() . '_1_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $path = $file->storeAs('dokumen_kontrak', $filename, 'public');
            $data['file_kontrak'] = $path;
        }

        if ($request->hasFile('file_kontrak_2')) {
            if ($pengadaan->file_kontrak_2 && \Illuminate\Support\Facades\Storage::disk('public')->exists($pengadaan->file_kontrak_2)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pengadaan->file_kontrak_2);
            }
            $file = $request->file('file_kontrak_2');
            $filename = time() . '_2_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $file->getClientOriginalName());
            $path = $file->storeAs('dokumen_kontrak', $filename, 'public');
            $data['file_kontrak_2'] = $path;
        }

        $pengadaan->update($data);

        return response()->json([
            'success' => true,
            'data' => $pengadaan,
            'message' => 'Data Pengadaan berhasil diupdate'
        ]);
    }

    public function destroy($id)
    {
        $pengadaan = Pengadaan::findOrFail($id);

        if ($pengadaan->file_kontrak && \Illuminate\Support\Facades\Storage::disk('public')->exists($pengadaan->file_kontrak)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pengadaan->file_kontrak);
        }

        if ($pengadaan->file_kontrak_2 && \Illuminate\Support\Facades\Storage::disk('public')->exists($pengadaan->file_kontrak_2)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($pengadaan->file_kontrak_2);
        }

        $pengadaan->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data Pengadaan berhasil dihapus'
        ]);
    }

    public function deleteFile($id, $fileIndex)
    {
        $pengadaan = Pengadaan::findOrFail($id);
        $field = $fileIndex == 2 ? 'file_kontrak_2' : 'file_kontrak';

        if ($pengadaan->$field) {
            if (\Illuminate\Support\Facades\Storage::disk('public')->exists($pengadaan->$field)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($pengadaan->$field);
            }
            $pengadaan->update([$field => null]);
            return response()->json([
                'success' => true,
                'message' => 'File berhasil dihapus.'
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'File tidak ditemukan.'
        ], 404);
    }

    /**
     * Quick status-only update — accessible by pic_pengadaan
     */
    public function updateStatus(Request $request, $id)
    {
        $pengadaan = Pengadaan::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'status' => 'required|string|in:Proses,Terkontrak (Tanda Tangan),Batal',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'message' => $validator->errors()->first()], 422);
        }

        $pengadaan->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'data'    => $pengadaan,
            'message' => 'Status berhasil diperbarui'
        ]);
    }
}

