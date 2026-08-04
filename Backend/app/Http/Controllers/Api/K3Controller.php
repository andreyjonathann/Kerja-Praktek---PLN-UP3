<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\K3Category;
use App\Models\K3Criterion;
use App\Models\K3Target;
use App\Models\K3Assessment;

class K3Controller extends Controller
{
    // ── Auth helpers ────────────────────────────────────────────────────────

    private function isAdmin(Request $request): bool
    {
        return $request->user()?->role === 'admin';
    }

    private function isPicK3(Request $request): bool
    {
        return in_array($request->user()?->role, ['pic_k3', 'admin']);
    }

    private function forbiddenJson(string $message = 'Anda tidak berwenang.')
    {
        return response()->json(['message' => $message], 403);
    }

    // ── POST /k3/assessments/bulk ───────────────────────────────────────────

    public function storeBulkAssessment(Request $request)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson('Hanya pic_k3 atau admin yang dapat mengisi assessment K3.');
        }

        $validated = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-S[12]$/'],
            'assessments' => 'required|array',
            'assessments.*.criteria_id' => 'required|exists:k3_criteria,id',
            'assessments.*.actual_level' => 'nullable|integer|min:1|max:5',
            'assessments.*.notes' => 'nullable|string|max:2000',
            'assessments.*.pic_names' => 'nullable|string|max:1000',
        ]);

        $period = $validated['period'];
        $userId = $request->user()->id;

        \Illuminate\Support\Facades\DB::transaction(function () use ($validated, $period, $userId) {
            foreach ($validated['assessments'] as $item) {
                // Hanya proses jika actual_level dikirimkan dan tidak null
                if (!isset($item['actual_level']) || $item['actual_level'] === null) continue;

                $assessment = K3Assessment::firstOrNew([
                    'criteria_id' => $item['criteria_id'],
                    'period' => $period
                ]);

                if (!$assessment->exists) {
                    $assessment->status = 'draft';
                    $assessment->submitted_by = $userId;
                }

                $assessment->actual_level = $item['actual_level'];
                if (isset($item['notes'])) {
                    $assessment->notes = $item['notes'];
                }
                if (array_key_exists('pic_names', $item)) {
                    $assessment->pic_names = $item['pic_names'];
                }
                $assessment->save();
            }
        });

        return response()->json(['message' => 'Bulk assessment berhasil disimpan']);
    }

    // ── GET /k3/categories ──────────────────────────────────────────────────

    public function categories(Request $request)
    {
        $categories = K3Category::with(['criteria.levels'])
            ->orderBy('sort_order')
            ->get();

        return response()->json(['data' => $categories]);
    }

    // ── GET /k3/targets/{tahun}/{semester} ──────────────────────────────────

    public function getTargets(Request $request, string $tahun, string $semester)
    {
        // pic_k3 dan admin boleh baca; role lain tidak
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson('Hanya pic_k3 atau admin yang dapat membaca target K3.');
        }

        $period = "{$tahun}-{$semester}"; // e.g. "2026-S1"

        $targets = K3Target::with(['criterion.category'])
            ->whereHas('criterion', function ($q) use ($period) {
                // period sudah di tabel k3_targets
            })
            ->where('period', $period)
            ->get()
            ->map(fn($t) => [
                'id'           => $t->id,
                'criteria_id'  => $t->criteria_id,
                'criteria_code'=> $t->criterion->code,
                'criteria_name'=> $t->criterion->name,
                'category_code'=> $t->criterion->category->code,
                'period'       => $t->period,
                'target_level' => $t->target_level,
                'created_by'   => $t->created_by,
            ]);

        return response()->json(['data' => $targets]);
    }

    // ── POST /k3/targets ────────────────────────────────────────────────────

    public function storeTarget(Request $request)
    {
        // Hanya admin — sama dengan TargetTahunanController::store()
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang berwenang mengatur target K3.');
        }

        $validated = $request->validate([
            'criteria_id'  => 'required|exists:k3_criteria,id',
            'period'       => ['required', 'regex:/^\d{4}-S[12]$/'],  // e.g. 2026-S1
            'target_level' => 'required|integer|min:1|max:5',
        ]);

        $target = K3Target::updateOrCreate(
            ['criteria_id' => $validated['criteria_id'], 'period' => $validated['period']],
            ['target_level' => $validated['target_level'], 'created_by' => $request->user()->id]
        );

        return response()->json([
            'message' => 'Target K3 berhasil disimpan',
            'data'    => $target,
        ], $target->wasRecentlyCreated ? 201 : 200);
    }

    // ── PUT /k3/targets/{id} ────────────────────────────────────────────────

    public function updateTarget(Request $request, int $id)
    {
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang berwenang mengubah target K3.');
        }

        $target = K3Target::findOrFail($id);

        $validated = $request->validate([
            'target_level' => 'required|integer|min:1|max:5',
        ]);

        $target->update($validated);

        return response()->json(['message' => 'Target K3 berhasil diperbarui', 'data' => $target]);
    }

    // ── GET /k3/assessments/{tahun}/{semester} ──────────────────────────────

    public function getAssessments(Request $request, string $tahun, string $semester)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson('Hanya pic_k3 atau admin yang dapat membaca assessment K3.');
        }

        $period = "{$tahun}-{$semester}";

        $assessments = K3Assessment::with(['criterion.category', 'submitter:id,name', 'approver:id,name'])
            ->where('period', $period)
            ->get()
            ->map(fn($a) => [
                'id'            => $a->id,
                'criteria_id'   => $a->criteria_id,
                'criteria_code' => $a->criterion->code,
                'criteria_name' => $a->criterion->name,
                'category_code' => $a->criterion->category->code,
                'category_name' => $a->criterion->category->name,
                'period'        => $a->period,
                'actual_level'  => $a->actual_level,
                'notes'         => $a->notes,
                'status'        => $a->status,
                'catatan_revisor' => $a->catatan_revisor,
                'submitted_by'  => $a->submitter?->name,
                'approved_by'   => $a->approver?->name,
                'submitted_at'  => $a->submitted_at,
                'approved_at'   => $a->approved_at,
            ]);

        return response()->json(['data' => $assessments]);
    }

    // ── POST /k3/assessments ─────────────────────────────────────────────────

    public function storeAssessment(Request $request)
    {
        // Hanya pic_k3 atau admin — sama pola dengan KinerjaController::store()
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson('Hanya pic_k3 atau admin yang dapat mengisi assessment K3.');
        }

        $validated = $request->validate([
            'criteria_id'  => 'required|exists:k3_criteria,id',
            'period'       => ['required', 'regex:/^\d{4}-S[12]$/'],
            'actual_level' => 'required|integer|min:1|max:5',
            'notes'        => 'nullable|string|max:2000',
        ]);

        $assessment = K3Assessment::updateOrCreate(
            ['criteria_id' => $validated['criteria_id'], 'period' => $validated['period']],
            [
                'actual_level'  => $validated['actual_level'],
                'notes'         => $validated['notes'] ?? null,
                'status'        => 'draft',
                'submitted_by'  => $request->user()->id,
            ]
        );

        return response()->json([
            'message' => 'Assessment K3 berhasil disimpan',
            'data'    => $assessment,
        ], $assessment->wasRecentlyCreated ? 201 : 200);
    }

    // ── POST /k3/assessments/{id}/submit ────────────────────────────────────

    public function submitAssessment(Request $request, int $id)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $assessment = K3Assessment::findOrFail($id);

        if ($assessment->status !== 'draft' && $assessment->status !== 'revisi') {
            return response()->json(['message' => 'Hanya assessment berstatus draft atau revisi yang dapat disubmit.'], 422);
        }

        $assessment->update([
            'status'       => 'submitted',
            'submitted_by' => $request->user()->id,
            'submitted_at' => now(),
        ]);

        return response()->json(['message' => 'Assessment berhasil disubmit', 'data' => $assessment]);
    }

    public function submitBulkAssessment(Request $request)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $validated = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-S[12]$/'],
        ]);

        K3Assessment::where('period', $validated['period'])
            ->whereIn('status', ['draft', 'revisi'])
            ->update([
                'status'       => 'submitted',
                'submitted_by' => $request->user()->id,
                'submitted_at' => now(),
            ]);

        return response()->json(['message' => 'Assessment keseluruhan berhasil disubmit']);
    }

    public function unsubmitBulkAssessment(Request $request)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $validated = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-S[12]$/'],
        ]);

        K3Assessment::where('period', $validated['period'])
            ->where('status', 'submitted')
            ->update([
                'status'       => 'draft',
                'submitted_by' => null,
                'submitted_at' => null,
            ]);

        return response()->json(['message' => 'Assessment keseluruhan berhasil dibatalkan submit']);
    }

    // ── POST /k3/assessments/{id}/approve ───────────────────────────────────

    public function approveAssessment(Request $request, int $id)
    {
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang dapat menyetujui assessment K3.');
        }

        $assessment = K3Assessment::findOrFail($id);

        $assessment->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json(['message' => 'Assessment berhasil disetujui', 'data' => $assessment]);
    }

    public function approveBulkAssessment(Request $request)
    {
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang dapat menyetujui assessment K3.');
        }

        $validated = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-S[12]$/'],
        ]);

        K3Assessment::where('period', $validated['period'])
            ->where('status', 'submitted')
            ->update([
                'status'      => 'approved',
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

        return response()->json(['message' => 'Assessment keseluruhan berhasil disetujui']);
    }

    // ── POST /k3/assessments/{id}/revisi ────────────────────────────────────

    public function revisiAssessment(Request $request, int $id)
    {
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang dapat meminta revisi assessment K3.');
        }

        $validated = $request->validate([
            'catatan_revisor' => 'required|string|max:1000',
        ]);

        $assessment = K3Assessment::findOrFail($id);
        $assessment->update([
            'status'          => 'revisi',
            'catatan_revisor' => $validated['catatan_revisor'],
        ]);

        return response()->json(['message' => 'Assessment dikembalikan untuk revisi', 'data' => $assessment]);
    }

    public function revisiBulkAssessment(Request $request)
    {
        if (!$this->isAdmin($request)) {
            return $this->forbiddenJson('Hanya Admin yang dapat meminta revisi assessment K3.');
        }

        $validated = $request->validate([
            'period' => ['required', 'regex:/^\d{4}-S[12]$/'],
            'catatan_revisor' => 'required|string|max:1000',
        ]);

        K3Assessment::where('period', $validated['period'])
            ->where('status', 'submitted')
            ->update([
                'status'          => 'revisi',
                'catatan_revisor' => $validated['catatan_revisor'],
            ]);

        return response()->json(['message' => 'Assessment keseluruhan dikembalikan untuk revisi']);
    }

    // ── GET /k3/dashboard ───────────────────────────────────────────────────

    public function dashboard(Request $request)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $tahun    = $request->input('tahun', date('Y'));
        $semester = $request->input('semester', (date('n') <= 6 ? 'S1' : 'S2'));
        $period   = "{$tahun}-{$semester}";

        $categories = K3Category::with(['criteria'])->orderBy('sort_order')->get();

        $assessments = K3Assessment::where('period', $period)
            ->whereIn('status', ['submitted', 'approved'])
            ->get()
            ->keyBy('criteria_id');

        $targets = K3Target::where('period', $period)
            ->get()
            ->keyBy('criteria_id');

        $summary = $categories->map(function ($cat) use ($assessments, $targets) {
            $criteriaIds   = $cat->criteria->pluck('id');
            $scores        = [];
            $targetLevels  = [];

            foreach ($cat->criteria as $crit) {
                if (isset($assessments[$crit->id])) {
                    $scores[] = $assessments[$crit->id]->actual_level;
                }
                if (isset($targets[$crit->id])) {
                    $targetLevels[] = $targets[$crit->id]->target_level;
                }
            }

            $avgScore  = count($scores)  > 0 ? round(array_sum($scores)  / count($scores), 2)  : null;
            $avgTarget = count($targetLevels) > 0 ? round(array_sum($targetLevels) / count($targetLevels), 2) : null;

            return [
                'category_id'    => $cat->id,
                'code'           => $cat->code,
                'name'           => $cat->name,
                'short_name'     => $cat->short_name,
                'color'          => $cat->color,
                'icon'           => $cat->icon,
                'criteria_count' => $cat->criteria->count(),
                'assessed_count' => count($scores),
                'avg_score'      => $avgScore,
                'avg_target'     => $avgTarget,
            ];
        });

        $allScores = $summary->whereNotNull('avg_score')->pluck('avg_score');
        $overallScore = $allScores->count() > 0
            ? round($allScores->sum() / $allScores->count(), 2)
            : null;

        $activeAssessments = K3Assessment::where('period', $period)
            ->whereIn('status', ['draft', 'submitted', 'revisi'])
            ->count();

        return response()->json([
            'data' => [
                'period'             => $period,
                'tahun'              => $tahun,
                'semester'           => $semester,
                'overall_score'      => $overallScore,
                'active_assessments' => $activeAssessments,
                'categories'         => $summary,
            ]
        ]);
    }

    // ── GET /k3/dashboard/trend ─────────────────────────────────────────────

    public function dashboardTrend(Request $request)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        // Ambil data untuk 4 semester terakhir
        $currentYear = (int) date('Y');
        $periods = [
            ($currentYear - 1) . '-S1',
            ($currentYear - 1) . '-S2',
            $currentYear . '-S1',
            $currentYear . '-S2',
        ];

        $assessments = K3Assessment::whereIn('period', $periods)
            ->whereIn('status', ['submitted', 'approved'])
            ->get()
            ->groupBy('period');

        $criteriaList = \Illuminate\Support\Facades\DB::table('k3_criteria')
            ->join('k3_categories', 'k3_criteria.category_id', '=', 'k3_categories.id')
            ->select('k3_criteria.id', 'k3_categories.code')
            ->get()
            ->keyBy('id');

        $trend = [];
        foreach ($periods as $p) {
            $catScores = ['lmc' => null, 'aai' => null, 'ibp' => null, 'ste' => null, 'scc' => null, 'rep' => null];
            if (isset($assessments[$p])) {
                $scores = $assessments[$p]->pluck('actual_level');
                $avg = $scores->count() > 0 ? round($scores->sum() / $scores->count(), 2) : null;
                
                $periodGroup = $assessments[$p]->groupBy(function($a) use ($criteriaList) {
                    return strtolower($criteriaList[$a->criteria_id]->code ?? '');
                });
                
                foreach (array_keys($catScores) as $code) {
                    if (isset($periodGroup[$code])) {
                        $cScores = $periodGroup[$code]->pluck('actual_level');
                        $catScores[$code] = $cScores->count() > 0 ? round($cScores->sum() / $cScores->count(), 2) : null;
                    }
                }
            } else {
                $avg = null;
            }
            $trend[] = array_merge([
                'label' => $p,
                'avg_score' => $avg
            ], $catScores);
        }
        
        return response()->json($trend);
    }

    // ── GET /k3/nko-summary/{tahun}/{semester} ──────────────────────────────

    public function nkoSummary(Request $request, string $tahun, string $semester)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $period = "{$tahun}-{$semester}";

        $categories = K3Category::with(['criteria'])->orderBy('sort_order')->get();

        // ONLY get approved assessments for NKO realisasi
        $assessments = K3Assessment::where('period', $period)
            ->where('status', 'approved')
            ->get()
            ->keyBy('criteria_id');

        $targets = K3Target::where('period', $period)
            ->get()
            ->keyBy('criteria_id');

        $summary = $categories->map(function ($cat) use ($assessments, $targets) {
            $criteriaIds = $cat->criteria->pluck('id');
            $scores = [];
            $targetLevels = [];
            $criteriaDetails = [];

            foreach ($cat->criteria as $crit) {
                $actual = isset($assessments[$crit->id]) ? $assessments[$crit->id]->actual_level : null;
                $target = isset($targets[$crit->id]) ? $targets[$crit->id]->target_level : null;
                $targetId = isset($targets[$crit->id]) ? $targets[$crit->id]->id : null;

                if ($actual !== null) {
                    $scores[] = $actual;
                }
                if ($target !== null) {
                    $targetLevels[] = $target;
                }

                $criteriaDetails[] = [
                    'id' => $crit->id,
                    'code' => $crit->code,
                    'name' => $crit->name,
                    'target_id' => $targetId,
                    'target_level' => $target,
                    'actual_level' => $actual,
                ];
            }

            $avgScore = count($scores) > 0 ? round(array_sum($scores) / count($scores), 2) : null;
            $avgTarget = count($targetLevels) > 0 ? round(array_sum($targetLevels) / count($targetLevels), 2) : null;
            
            $gap = ($avgScore !== null && $avgTarget !== null) ? round($avgScore - $avgTarget, 2) : null;

            return [
                'category_id' => $cat->id,
                'category_code' => $cat->code,
                'category_name' => $cat->name,
                'avg_target' => $avgTarget,
                'avg_score' => $avgScore,
                'gap' => $gap,
                'criteria_details' => $criteriaDetails,
            ];
        });

        return response()->json([
            'data' => [
                'period' => $period,
                'tahun' => $tahun,
                'semester' => $semester,
                'categories' => $summary,
            ]
        ]);
    }

    // ── GET /k3/category-summary/{code}/{tahun}/{semester} ─────────────────

    public function categorySummary(Request $request, string $code, string $tahun, string $semester)
    {
        if (!$this->isPicK3($request)) {
            return $this->forbiddenJson();
        }

        $category = K3Category::where('code', strtoupper($code))
            ->with('criteria')
            ->firstOrFail();

        $period = "{$tahun}-{$semester}";
        $criteriaIds = $category->criteria->pluck('id');

        // ── Detail periode aktif ────────────────────────────────────────────
        $assessments = K3Assessment::where('period', $period)
            ->where('status', 'approved')
            ->whereIn('criteria_id', $criteriaIds)
            ->get()
            ->keyBy('criteria_id');

        $targets = K3Target::where('period', $period)
            ->whereIn('criteria_id', $criteriaIds)
            ->get()
            ->keyBy('criteria_id');

        $scores = [];
        $targetLevels = [];
        $criteriaDetails = [];

        foreach ($category->criteria as $crit) {
            $actual = isset($assessments[$crit->id]) ? $assessments[$crit->id]->actual_level : null;
            $target = isset($targets[$crit->id]) ? $targets[$crit->id]->target_level : null;
            $targetId = isset($targets[$crit->id]) ? $targets[$crit->id]->id : null;

            if ($actual !== null) $scores[] = $actual;
            if ($target !== null) $targetLevels[] = $target;

            $criteriaDetails[] = [
                'id' => $crit->id,
                'code' => $crit->code,
                'name' => $crit->name,
                'target_id' => $targetId,
                'target_level' => $target,
                'actual_level' => $actual,
            ];
        }

        $avgScore = count($scores) > 0 ? round(array_sum($scores) / count($scores), 2) : null;
        $avgTarget = count($targetLevels) > 0 ? round(array_sum($targetLevels) / count($targetLevels), 2) : null;
        $gap = ($avgScore !== null && $avgTarget !== null) ? round($avgScore - $avgTarget, 2) : null;

        // ── Tren 4 semester terakhir ─────────────────────────────────────────
        $currentYear = (int) date('Y');
        $periods = [
            ($currentYear - 1) . '-S1',
            ($currentYear - 1) . '-S2',
            $currentYear . '-S1',
            $currentYear . '-S2',
        ];

        $trendAssessments = K3Assessment::whereIn('period', $periods)
            ->where('status', 'approved')
            ->whereIn('criteria_id', $criteriaIds)
            ->get()
            ->groupBy('period');

        $trendTargets = K3Target::whereIn('period', $periods)
            ->whereIn('criteria_id', $criteriaIds)
            ->get()
            ->groupBy('period');

        $trend = collect($periods)->map(function ($p) use ($trendAssessments, $trendTargets) {
            $pScores = ($trendAssessments[$p] ?? collect())->pluck('actual_level');
            $pTargets = ($trendTargets[$p] ?? collect())->pluck('target_level');

            $pAvgScore = $pScores->count() > 0 ? round($pScores->avg(), 2) : null;
            $pAvgTarget = $pTargets->count() > 0 ? round($pTargets->avg(), 2) : null;
            $pGap = ($pAvgScore !== null && $pAvgTarget !== null) ? round($pAvgScore - $pAvgTarget, 2) : null;

            return [
                'period' => $p,
                'avg_target' => $pAvgTarget,
                'avg_score' => $pAvgScore,
                'gap' => $pGap,
            ];
        });

        return response()->json([
            'data' => [
                'category_code' => $category->code,
                'category_name' => $category->name,
                'period' => $period,
                'avg_target' => $avgTarget,
                'avg_score' => $avgScore,
                'gap' => $gap,
                'criteria_details' => $criteriaDetails,
                'trend' => $trend,
            ]
        ]);
    }
}
