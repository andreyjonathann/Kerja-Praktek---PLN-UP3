<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class K3AssessmentController extends Controller
{
    // -------------------------------------------------------------------------
    // MASTER DATA
    // -------------------------------------------------------------------------

    /**
     * GET /api/k3/categories
     * Return all categories with their criteria and level descriptions.
     */
    public function categories(Request $request)
    {
        $categories = DB::table('k3_categories')
            ->orderBy('order')
            ->get();

        foreach ($categories as $cat) {
            $cat->criteria = DB::table('k3_criteria')
                ->where('category_id', $cat->id)
                ->orderBy('order')
                ->get();

            foreach ($cat->criteria as $crit) {
                $crit->levels = DB::table('k3_criteria_levels')
                    ->where('criteria_id', $crit->id)
                    ->orderBy('level')
                    ->get();
            }
        }

        return response()->json(['success' => true, 'data' => $categories]);
    }

    // -------------------------------------------------------------------------
    // ASSESSMENTS — LIST
    // -------------------------------------------------------------------------

    /**
     * GET /api/k3/assessments
     * List assessments; optionally filtered by unit, bulan, tahun.
     */
    public function index(Request $request)
    {
        $query = DB::table('k3_assessments as a')
            ->leftJoin('users as u', 'u.id', '=', 'a.created_by')
            ->select(
                'a.*',
                'u.name as created_by_name',
                'u.up3 as created_by_up3'
            );

        if ($request->filled('unit')) {
            $query->where('a.unit', $request->unit);
        }
        if ($request->filled('bulan')) {
            $query->where('a.periode_bulan', (int) $request->bulan);
        }
        if ($request->filled('tahun')) {
            $query->where('a.periode_tahun', (int) $request->tahun);
        }
        if ($request->filled('status')) {
            $query->where('a.status', $request->status);
        }

        $data = $query->orderBy('a.periode_tahun', 'desc')
            ->orderBy('a.periode_bulan', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $data]);
    }

    // -------------------------------------------------------------------------
    // ASSESSMENTS — STORE
    // -------------------------------------------------------------------------

    /**
     * POST /api/k3/assessments
     * Create a new assessment (draft) with empty detail rows for all criteria.
     */
    public function store(Request $request)
    {
        $user = auth()->user();

        $request->validate([
            'unit'          => 'required|string|max:100',
            'periode_bulan' => 'required|integer|min:1|max:12',
            'periode_tahun' => 'required|integer|min:2020|max:2100',
        ]);

        // Prevent duplicate per unit+period
        $exists = DB::table('k3_assessments')
            ->where('unit', $request->unit)
            ->where('periode_bulan', $request->periode_bulan)
            ->where('periode_tahun', $request->periode_tahun)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => 'Assessment untuk unit dan periode tersebut sudah ada.',
            ], 422);
        }

        $assessmentId = DB::table('k3_assessments')->insertGetId([
            'unit'          => $request->unit,
            'periode_bulan' => $request->periode_bulan,
            'periode_tahun' => $request->periode_tahun,
            'status'        => 'draft',
            'created_by'    => $user->id,
            'created_at'    => now(),
            'updated_at'    => now(),
        ]);

        // Pre-populate detail rows for every criteria
        $allCriteria = DB::table('k3_criteria')->pluck('id');
        $details = $allCriteria->map(fn ($cId) => [
            'assessment_id' => $assessmentId,
            'criteria_id'   => $cId,
            'level_chosen'  => null,
            'catatan'       => null,
            'created_at'    => now(),
            'updated_at'    => now(),
        ])->toArray();

        DB::table('k3_assessment_details')->insert($details);

        $assessment = DB::table('k3_assessments')->find($assessmentId);

        return response()->json([
            'success' => true,
            'message' => 'Assessment berhasil dibuat.',
            'data'    => $assessment,
        ], 201);
    }

    // -------------------------------------------------------------------------
    // ASSESSMENTS — SHOW
    // -------------------------------------------------------------------------

    /**
     * GET /api/k3/assessments/{id}
     * Return assessment with full detail rows, criteria info, and level options.
     */
    public function show($id)
    {
        $assessment = DB::table('k3_assessments as a')
            ->leftJoin('users as u', 'u.id', '=', 'a.created_by')
            ->select('a.*', 'u.name as created_by_name')
            ->where('a.id', $id)
            ->first();

        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        // Load details with criteria and available levels
        $details = DB::table('k3_assessment_details as d')
            ->join('k3_criteria as c', 'c.id', '=', 'd.criteria_id')
            ->join('k3_categories as cat', 'cat.id', '=', 'c.category_id')
            ->select(
                'd.*',
                'c.code as criteria_code',
                'c.name as criteria_name',
                'c.pic_role',
                'c.order as criteria_order',
                'cat.id as category_id',
                'cat.code as category_code',
                'cat.name as category_name',
                'cat.order as category_order'
            )
            ->where('d.assessment_id', $id)
            ->orderBy('cat.order')
            ->orderBy('c.order')
            ->get();

        foreach ($details as $detail) {
            $detail->available_levels = DB::table('k3_criteria_levels')
                ->where('criteria_id', $detail->criteria_id)
                ->orderBy('level')
                ->get();
        }

        $assessment->details = $details;

        return response()->json(['success' => true, 'data' => $assessment]);
    }

    // -------------------------------------------------------------------------
    // ASSESSMENTS — UPDATE
    // -------------------------------------------------------------------------

    /**
     * PUT /api/k3/assessments/{id}
     * Update level_chosen and catatan on assessment detail rows.
     * Only allowed when status is draft or revisi.
     */
    public function update(Request $request, $id)
    {
        $assessment = DB::table('k3_assessments')->find($id);
        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        // if (!in_array($assessment->status, ['draft', 'revisi'])) {
        //     return response()->json([
        //         'success' => false,
        //         'message' => 'Assessment hanya dapat diubah ketika berstatus draft atau revisi.',
        //     ], 422);
        // }

        $request->validate([
            'details'                  => 'required|array|min:1',
            'details.*.criteria_id'    => 'required|integer|exists:k3_criteria,id',
            'details.*.level_chosen'   => 'nullable|integer|min:1|max:5',
            'details.*.catatan'        => 'nullable|string|max:2000',
        ]);

        foreach ($request->details as $row) {
            DB::table('k3_assessment_details')
                ->where('assessment_id', $id)
                ->where('criteria_id', $row['criteria_id'])
                ->update([
                    'level_chosen' => $row['level_chosen'] ?? null,
                    'catatan'      => $row['catatan']       ?? null,
                    'updated_at'   => now(),
                ]);
        }

        DB::table('k3_assessments')->where('id', $id)->update(['updated_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment berhasil diperbarui.',
        ]);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW — SUBMIT
    // -------------------------------------------------------------------------

    /**
     * POST /api/k3/assessments/{id}/submit
     * Advance status from draft/revisi -> submitted.
     */
    public function submit($id)
    {
        $user       = auth()->user();
        $assessment = DB::table('k3_assessments')->find($id);

        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        if (!in_array($assessment->status, ['draft', 'revisi'])) {
            return response()->json([
                'success' => false,
                'message' => 'Hanya assessment dengan status draft atau revisi yang dapat disubmit.',
            ], 422);
        }

        DB::table('k3_assessments')->where('id', $id)->update([
            'status'       => 'submitted',
            'submitted_at' => now(),
            'updated_at'   => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment berhasil disubmit dan menunggu persetujuan.',
        ]);
    }

    /**
     * POST /api/k3/assessments/{id}/unsubmit
     * Revert status from submitted -> draft.
     */
    public function unsubmit($id)
    {
        $assessment = DB::table('k3_assessments')->find($id);

        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        if ($assessment->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya assessment dengan status submitted yang dapat dibatalkan (unsubmit).',
            ], 422);
        }

        DB::table('k3_assessments')->where('id', $id)->update([
            'status'       => 'draft',
            'updated_at'   => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment berhasil dikembalikan ke Draft.',
        ]);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW — APPROVE
    // -------------------------------------------------------------------------

    /**
     * POST /api/k3/assessments/{id}/approve
     * Advance status submitted -> approved. Role: admin_k3 only.
     */
    public function approve(Request $request, $id)
    {
        $user = auth()->user();

        if ($user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Hanya admin K3 yang dapat menyetujui assessment.'], 403);
        }

        $assessment = DB::table('k3_assessments')->find($id);

        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        if ($assessment->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya assessment dengan status submitted yang dapat disetujui.',
            ], 422);
        }

        DB::table('k3_assessments')->where('id', $id)->update([
            'status'      => 'approved',
            'approved_at' => now(),
            'updated_at'  => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment berhasil disetujui.',
        ]);
    }

    // -------------------------------------------------------------------------
    // WORKFLOW — REVISI
    // -------------------------------------------------------------------------

    /**
     * POST /api/k3/assessments/{id}/revisi
     * Return assessment to drafter with revision notes. Role: admin_k3 only.
     */
    public function revisi(Request $request, $id)
    {
        $user = auth()->user();

        if ($user->role !== 'admin_k3') {
            return response()->json(['success' => false, 'message' => 'Unauthorized. Hanya admin K3 yang dapat meminta revisi.'], 403);
        }

        $request->validate([
            'catatan_revisor' => 'required|string|max:2000',
        ]);

        $assessment = DB::table('k3_assessments')->find($id);

        if (!$assessment) {
            return response()->json(['success' => false, 'message' => 'Assessment tidak ditemukan.'], 404);
        }

        if ($assessment->status !== 'submitted') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya assessment dengan status submitted yang dapat dikembalikan untuk revisi.',
            ], 422);
        }

        DB::table('k3_assessments')->where('id', $id)->update([
            'status'          => 'revisi',
            'catatan_revisor' => $request->catatan_revisor,
            'updated_at'      => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Assessment dikembalikan untuk revisi.',
        ]);
    }

    // -------------------------------------------------------------------------
    // DASHBOARD
    // -------------------------------------------------------------------------

    /**
     * GET /api/k3/dashboard
     * Returns:
     *   - radar_data     : avg score per category (for radar/spider chart)
     *   - tren_bulanan   : avg maturity score per month for current year
     *   - perbandingan_unit : avg maturity per unit for given year
     */
    public function dashboard(Request $request)
    {
        $tahun = (int) $request->get('tahun', date('Y'));
        $unit  = $request->get('unit');

        // ------------------------------------------------------------------
        // Helper: base query for approved assessment details
        // ------------------------------------------------------------------
        $baseQuery = fn () => DB::table('k3_assessment_details as d')
            ->join('k3_assessments as a', 'a.id', '=', 'd.assessment_id')
            ->join('k3_criteria as c', 'c.id', '=', 'd.criteria_id')
            ->join('k3_categories as cat', 'cat.id', '=', 'c.category_id')
            ->whereIn('a.status', ['draft', 'submitted', 'approved', 'revisi'])
            ->whereNotNull('d.level_chosen');

        // ------------------------------------------------------------------
        // 1. Radar data — avg level_chosen per category
        // ------------------------------------------------------------------
        $radarQuery = $baseQuery()->where('a.periode_tahun', $tahun);
        if ($unit) {
            $radarQuery->where('a.unit', $unit);
        }

        $radarRows = $radarQuery
            ->select(
                'cat.code as category_code',
                'cat.name as category_name',
                DB::raw('ROUND(AVG(d.level_chosen), 2) as avg_score'),
                DB::raw('COUNT(d.id) as total_criteria')
            )
            ->groupBy('cat.id', 'cat.code', 'cat.name', 'cat.order')
            ->orderBy('cat.order')
            ->get();

        // ------------------------------------------------------------------
        // 2. Tren bulanan — avg maturity score per month in given year
        // ------------------------------------------------------------------
        $trenQuery = $baseQuery()->where('a.periode_tahun', $tahun);
        if ($unit) {
            $trenQuery->where('a.unit', $unit);
        }

        $trenRows = $trenQuery
            ->select(
                'a.periode_bulan as bulan',
                DB::raw('ROUND(AVG(d.level_chosen), 2) as avg_score'),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'LMC' THEN d.level_chosen END), 2) as lmc"),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'AAI' THEN d.level_chosen END), 2) as aai"),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'IBP' THEN d.level_chosen END), 2) as ibp"),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'STE' THEN d.level_chosen END), 2) as ste"),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'SCC' THEN d.level_chosen END), 2) as scc"),
                DB::raw("ROUND(AVG(CASE WHEN cat.code = 'REP' THEN d.level_chosen END), 2) as rep")
            )
            ->groupBy('a.periode_bulan')
            ->orderBy('a.periode_bulan')
            ->get();

        $months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
        $trenData = collect(range(1, 12))->map(function ($m) use ($trenRows, $months) {
            $row = $trenRows->firstWhere('bulan', $m);
            return [
                'bulan'     => $m,
                'label'     => $months[$m - 1],
                'avg_score' => $row && $row->avg_score !== null ? (float) $row->avg_score : null,
                'lmc'       => $row && $row->lmc !== null ? (float) $row->lmc : null,
                'aai'       => $row && $row->aai !== null ? (float) $row->aai : null,
                'ibp'       => $row && $row->ibp !== null ? (float) $row->ibp : null,
                'ste'       => $row && $row->ste !== null ? (float) $row->ste : null,
                'scc'       => $row && $row->scc !== null ? (float) $row->scc : null,
                'rep'       => $row && $row->rep !== null ? (float) $row->rep : null,
            ];
        });

        // ------------------------------------------------------------------
        // 3. Perbandingan unit — avg maturity per unit for given year
        // ------------------------------------------------------------------
        $unitRows = $baseQuery()
            ->where('a.periode_tahun', $tahun)
            ->select(
                'a.unit',
                DB::raw('ROUND(AVG(d.level_chosen), 2) as avg_score')
            )
            ->groupBy('a.unit')
            ->orderBy('a.unit')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => [
                'tahun'            => $tahun,
                'unit_filter'      => $unit,
                'radar_data'       => $radarRows,
                'tren_bulanan'     => $trenData,
                'perbandingan_unit' => $unitRows,
            ],
        ]);
    }
}
