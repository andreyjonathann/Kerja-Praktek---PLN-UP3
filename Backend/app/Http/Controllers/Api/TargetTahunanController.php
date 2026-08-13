<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\TargetTahunan;

class TargetTahunanController extends Controller
{
    private $roleMap = [
        'aset' => 'pic_pengadaan',
        'pengadaan' => 'pic_pengadaan',
        'jaringan' => 'pic_jaringan',
        'transaksi_energi' => 'pic_transaksi_energi',
        'niaga' => 'pic_niaga',
        'pemasaran' => 'pic_pemasaran',
        'keuangan' => 'pic_keuangan',
    ];

    // Reverse map: role -> bidang name as stored in DB (capitalized)
    private $roleToBidang = [
        'pic_aset' => 'Aset',
        'pic_pengadaan' => 'Aset',
        'pic_jaringan' => 'Jaringan',
        'pic_transaksi_energi' => 'Transaksi Energi',
        'pic_niaga' => 'Niaga',
        'pic_pemasaran' => 'Pemasaran',
        'pic_keuangan' => 'Keuangan',
    ];

    public function index(Request $request)
    {
        $user = $request->user();

        $query = TargetTahunan::query();
        if ($request->tahun) $query->where('tahun', $request->tahun);

        if ($user && $user->role !== 'admin' && $user->role !== 'viewer') {
            // PIC role: force filter to own bidang only
            $ownBidang = $this->roleToBidang[$user->role] ?? null;
            if (!$ownBidang) {
                return response()->json([], 200);
            }

            if ($request->bidang) {
                // PIC requested a specific bidang — check it matches their own
                if (strtolower($request->bidang) !== strtolower($ownBidang)) {
                    return response()->json([
                        'message' => 'Anda tidak berwenang membaca data bidang ini.'
                    ], 403);
                }
            }
            // Force filter to own bidang regardless
            $query->whereRaw('LOWER(bidang) = ?', [strtolower($ownBidang)]);
        } else {
            // Admin/viewer: apply bidang filter only if explicitly requested
            if ($request->bidang) $query->where('bidang', $request->bidang);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Hanya Admin yang berwenang mengatur target.'
            ], 403);
        }

        $validated = $request->validate([
            'bidang' => 'required|string',
            'indikator' => 'required|string',
            'satuan' => 'required|string',
            'polaritas' => 'required|in:MAXIMIZE,MINIMIZE',
            'bobot' => 'required|numeric',
            'target' => 'required|numeric',
            'tahun' => 'required|integer'
        ]);

        $existing = TargetTahunan::where('bidang', $request->bidang)
            ->where('indikator', $request->indikator)
            ->where('tahun', $request->tahun)
            ->first();

        $targetLama = $existing ? $existing->target : null;

        $target = TargetTahunan::updateOrCreate(
            ['bidang' => $request->bidang, 'indikator' => $request->indikator, 'tahun' => $request->tahun],
            $validated
        );

        if ($target->wasRecentlyCreated || $target->wasChanged('target')) {
            app(\App\Services\NotificationService::class)->notifyTargetUpdated(
                $request->bidang,
                $request->indikator,
                $targetLama,
                $request->target,
                $request->tahun
            );
        }

        return response()->json(['message' => 'Target berhasil disimpan', 'data' => $target]);
    }
    public function getMonthlyTarget(Request $request, $bidang, $indikator)
    {
        $user = $request->user();
        if ($user->role !== 'admin' && $user->role !== 'viewer') {
            $allowedRole = $this->roleMap[strtolower(urldecode($bidang))] ?? null;
            if ($user->role !== $allowedRole) {
                return response()->json([
                    'message' => 'Anda tidak berwenang membaca data bidang ini.'
                ], 403);
            }
        }

        $tahun = $request->input('tahun', date('Y'));
        
        // Match string case-insensitively just in case
        $target = TargetTahunan::whereRaw('LOWER(bidang) = ?', [strtolower(urldecode($bidang))])
            ->whereRaw('LOWER(indikator) = ?', [strtolower(urldecode($indikator))])
            ->where('tahun', $tahun)
            ->first();

        // if not found, we can just return nulls for UI
        if (!$target) {
            return response()->json([
                'target_jan' => null, 'target_feb' => null, 'target_mar' => null,
                'target_apr' => null, 'target_mei' => null, 'target_jun' => null,
                'target_jul' => null, 'target_agu' => null, 'target_sep' => null,
                'target_okt' => null, 'target_nov' => null, 'target_des' => null,
            ]);
        }

        return response()->json([
            'target_jan' => $target->target_jan, 'target_feb' => $target->target_feb, 'target_mar' => $target->target_mar,
            'target_apr' => $target->target_apr, 'target_mei' => $target->target_mei, 'target_jun' => $target->target_jun,
            'target_jul' => $target->target_jul, 'target_agu' => $target->target_agu, 'target_sep' => $target->target_sep,
            'target_okt' => $target->target_okt, 'target_nov' => $target->target_nov, 'target_des' => $target->target_des,
            'is_override' => $target->is_override ?? [],
            'satuan' => $target->satuan,
            'indikator' => $target->indikator,
            'bidang' => $target->bidang,
        ]);
    }

    public function resetToAuto(Request $request, $bidang, $indikator, $tahun)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json(['message' => 'Hanya Admin yang berwenang mengatur target.'], 403);
        }

        $bulan = $request->input('bulan'); // e.g. 'jan', 'feb', or 'tahunan'
        
        $bidangStr = urldecode($bidang);
        $indikatorStr = urldecode($indikator);

        $existing = TargetTahunan::whereRaw('LOWER(bidang) = ?', [strtolower($bidangStr)])
            ->whereRaw('LOWER(indikator) = ?', [strtolower($indikatorStr)])
            ->where('tahun', $tahun)
            ->first();

        if ($existing) {
            $overrides = $existing->is_override ?? [];
            if ($bulan) {
                $overrides[$bulan] = false;
            }
            $existing->is_override = $overrides;
            $existing->save();

            // Trigger recalculation if it's Ganti Meter
            if (strtolower($indikatorStr) === 'ganti meter') {
                app(\App\Services\TargetGantiMeterService::class)->recalculateTarget($tahun);
            }
        }

        return response()->json(['message' => 'Target berhasil di-reset ke otomatis.']);
    }

    public function updateMonthlyTarget(Request $request, $bidang, $indikator, $tahun)
    {
        $user = $request->user();
        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Hanya Admin yang berwenang mengatur target.'
            ], 403);
        }

        $validated = $request->validate([
            'target_jan' => 'nullable|numeric',
            'target_feb' => 'nullable|numeric',
            'target_mar' => 'nullable|numeric',
            'target_apr' => 'nullable|numeric',
            'target_mei' => 'nullable|numeric',
            'target_jun' => 'nullable|numeric',
            'target_jul' => 'nullable|numeric',
            'target_agu' => 'nullable|numeric',
            'target_sep' => 'nullable|numeric',
            'target_okt' => 'nullable|numeric',
            'target_nov' => 'nullable|numeric',
            'target_des' => 'nullable|numeric',
        ]);

        $bidangStr = urldecode($bidang);
        $indikatorStr = urldecode($indikator);

        // Find existing to preserve other attributes if updating, or defaults if creating
        // Actually, updateOrCreate relies on exact casing for creation. 
        // We will try to find it case insensitively first.
        $existing = TargetTahunan::whereRaw('LOWER(bidang) = ?', [strtolower($bidangStr)])
            ->whereRaw('LOWER(indikator) = ?', [strtolower($indikatorStr)])
            ->where('tahun', $tahun)
            ->first();

        $months = [
            'jan', 'feb', 'mar', 'apr', 'mei', 'jun', 
            'jul', 'agu', 'sep', 'okt', 'nov', 'des'
        ];

        if ($existing) {
            $overrides = $existing->is_override ?? [];
            foreach ($months as $m) {
                if (array_key_exists("target_$m", $validated) && $validated["target_$m"] !== null) {
                    $overrides[$m] = true;
                }
            }
            $existing->is_override = $overrides;

            $existing->update([
                'target_jan' => $validated['target_jan'] ?? $existing->target_jan,
                'target_feb' => $validated['target_feb'] ?? $existing->target_feb,
                'target_mar' => $validated['target_mar'] ?? $existing->target_mar,
                'target_apr' => $validated['target_apr'] ?? $existing->target_apr,
                'target_mei' => $validated['target_mei'] ?? $existing->target_mei,
                'target_jun' => $validated['target_jun'] ?? $existing->target_jun,
                'target_jul' => $validated['target_jul'] ?? $existing->target_jul,
                'target_agu' => $validated['target_agu'] ?? $existing->target_agu,
                'target_sep' => $validated['target_sep'] ?? $existing->target_sep,
                'target_okt' => $validated['target_okt'] ?? $existing->target_okt,
                'target_nov' => $validated['target_nov'] ?? $existing->target_nov,
                'target_des' => $validated['target_des'] ?? $existing->target_des,
            ]);
            $target = $existing;
        } else {
            // It doesn't exist, we must create it. But wait, if they create from the monthly screen,
            // they don't have polaritas, satuan, bobot, etc.
            // Ideally, TargetTahunan is seeded, so it SHOULD exist. 
            // If not, we just create it with empty defaults.
            $overrides = [];
            foreach ($months as $m) {
                if (array_key_exists("target_$m", $validated) && $validated["target_$m"] !== null) {
                    $overrides[$m] = true;
                }
            }

            $target = TargetTahunan::create([
                'bidang' => ucwords($bidangStr), // basic formatting
                'indikator' => $indikatorStr,
                'tahun' => $tahun,
                'is_override' => $overrides,
                'target_jan' => $validated['target_jan'] ?? null,
                'target_feb' => $validated['target_feb'] ?? null,
                'target_mar' => $validated['target_mar'] ?? null,
                'target_apr' => $validated['target_apr'] ?? null,
                'target_mei' => $validated['target_mei'] ?? null,
                'target_jun' => $validated['target_jun'] ?? null,
                'target_jul' => $validated['target_jul'] ?? null,
                'target_agu' => $validated['target_agu'] ?? null,
                'target_sep' => $validated['target_sep'] ?? null,
                'target_okt' => $validated['target_okt'] ?? null,
                'target_nov' => $validated['target_nov'] ?? null,
                'target_des' => $validated['target_des'] ?? null,
            ]);
        }

        // Trigger recalculation if it's Ganti Meter
        if (strtolower($indikatorStr) === 'ganti meter') {
            app(\App\Services\TargetGantiMeterService::class)->recalculateTarget($tahun);
        }

        return response()->json(['message' => 'Target Bulanan berhasil disimpan', 'data' => $target]);
    }
}
