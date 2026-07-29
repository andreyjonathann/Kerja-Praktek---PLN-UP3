<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Periode;
use App\Models\KinerjaJaringan;
use App\Models\EnsBulanan;

use App\Models\TargetTahunan;

class DataJaringanController extends Controller
{
    public function getDashboardData(Request $request)
    {
        $tahun = $request->input('tahun', 2026);

        // Prepare dummy response matching what dashboardDataService.js used to build
        // But pull actual data from DB.

        $result = [
            'saidi' => [],
            'saifi' => [],

            'ensPageData' => [],
            'overview' => []
        ];

        $periodes = Periode::where('tahun', $tahun)->orderBy('bulan')->get();
        $bulanMap = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

        $targetSaidi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saidi'])->where('tahun', $tahun)->first();
        $targetSaifi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saifi'])->where('tahun', $tahun)->first();
        $targetEns = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['ens'])->where('tahun', $tahun)->first();
        
        $tgtSaidiVal = $targetSaidi ? $targetSaidi->target : null;
        $tgtSaifiVal = $targetSaifi ? $targetSaifi->target : null;
        $tgtEnsVal = $targetEns ? $targetEns->target : null;

        $saidiTargets = [
            1 => $targetSaidi ? $targetSaidi->target_jan : null,
            2 => $targetSaidi ? $targetSaidi->target_feb : null,
            3 => $targetSaidi ? $targetSaidi->target_mar : null,
            4 => $targetSaidi ? $targetSaidi->target_apr : null,
            5 => $targetSaidi ? $targetSaidi->target_mei : null,
            6 => $targetSaidi ? $targetSaidi->target_jun : null,
            7 => $targetSaidi ? $targetSaidi->target_jul : null,
            8 => $targetSaidi ? $targetSaidi->target_agu : null,
            9 => $targetSaidi ? $targetSaidi->target_sep : null,
            10 => $targetSaidi ? $targetSaidi->target_okt : null,
            11 => $targetSaidi ? $targetSaidi->target_nov : null,
            12 => $targetSaidi ? $targetSaidi->target_des : null,
        ];

        $saifiTargets = [
            1 => $targetSaifi ? $targetSaifi->target_jan : null,
            2 => $targetSaifi ? $targetSaifi->target_feb : null,
            3 => $targetSaifi ? $targetSaifi->target_mar : null,
            4 => $targetSaifi ? $targetSaifi->target_apr : null,
            5 => $targetSaifi ? $targetSaifi->target_mei : null,
            6 => $targetSaifi ? $targetSaifi->target_jun : null,
            7 => $targetSaifi ? $targetSaifi->target_jul : null,
            8 => $targetSaifi ? $targetSaifi->target_agu : null,
            9 => $targetSaifi ? $targetSaifi->target_sep : null,
            10 => $targetSaifi ? $targetSaifi->target_okt : null,
            11 => $targetSaifi ? $targetSaifi->target_nov : null,
            12 => $targetSaifi ? $targetSaifi->target_des : null,
        ];

        $ensTargets = [
            1 => $targetEns ? $targetEns->target_jan : null,
            2 => $targetEns ? $targetEns->target_feb : null,
            3 => $targetEns ? $targetEns->target_mar : null,
            4 => $targetEns ? $targetEns->target_apr : null,
            5 => $targetEns ? $targetEns->target_mei : null,
            6 => $targetEns ? $targetEns->target_jun : null,
            7 => $targetEns ? $targetEns->target_jul : null,
            8 => $targetEns ? $targetEns->target_agu : null,
            9 => $targetEns ? $targetEns->target_sep : null,
            10 => $targetEns ? $targetEns->target_okt : null,
            11 => $targetEns ? $targetEns->target_nov : null,
            12 => $targetEns ? $targetEns->target_des : null,
        ];

        $totalSaidi = 0;
        $totalSaifi = 0;
        $totalEns = 0;

        $runningCumulativeTgtSaidi = 0;
        $anySaidiTargetFilled = false;
        $ytdTgtSaidiForOverview = 0;
        $hasRealisasiSaidiOverall = false;

        $runningCumulativeTgtSaifi = 0;
        $anySaifiTargetFilled = false;
        $ytdTgtSaifiForOverview = 0;
        $hasRealisasiSaifiOverall = false;

        $runningCumulativeTgtEns = 0;
        $anyEnsTargetFilled = false;
        
        $cumEnsTerencana = 0;
        $cumEnsTidakTerencana = 0;
        $cumEnsBencana = 0;
        $cumEnsTransmisi = 0;
        $cumEnsPembangkit = 0;
        for ($i = 1; $i <= 12; $i++) {
            $p = $periodes->firstWhere('bulan', $i);
            
            $saidiData = null;
            $ensData = null;


            if ($p) {
                $saidiData = KinerjaJaringan::where('periode_id', $p->id)->first();
                $ensData = EnsBulanan::where('periode_id', $p->id)->first();

            }

            // SAIDI
            $sd_real = $saidiData ? $saidiData->saidi_total : null;
            $totalSaidi += $sd_real ?? 0;
            
            $targetBulananSaidi = $saidiTargets[$i];
            if ($targetBulananSaidi !== null) {
                $runningCumulativeTgtSaidi += $targetBulananSaidi;
                $anySaidiTargetFilled = true;
            }
            
            if ($sd_real !== null) {
                $hasRealisasiSaidiOverall = true;
                $ytdTgtSaidiForOverview = $anySaidiTargetFilled ? $runningCumulativeTgtSaidi : null;
            }

            $result['saidi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $targetBulananSaidi,
                'realisasi' => $sd_real,
                'cumulativeReal' => $totalSaidi,
                'cumulativeTgt' => $anySaidiTargetFilled ? $runningCumulativeTgtSaidi : null,
                'distribusi_padam_tidak_terencana' => $saidiData ? $saidiData->saidi_distribusi_padam_tidak_terencana : 0,
                'distribusi_padam_terencana' => $saidiData ? $saidiData->saidi_distribusi_padam_terencana : 0,
                'distribusi_bencana_alam' => $saidiData ? $saidiData->saidi_distribusi_bencana_alam : 0,
                'transmisi' => $saidiData ? $saidiData->saidi_transmisi : 0,
                'pembangkit' => $saidiData ? $saidiData->saidi_pembangkit : 0,
            ];

            // SAIFI
            $sf_real = $saidiData ? $saidiData->saifi_total : null;
            $totalSaifi += $sf_real ?? 0;
            
            $targetBulananSaifi = $saifiTargets[$i];
            if ($targetBulananSaifi !== null) {
                $runningCumulativeTgtSaifi += $targetBulananSaifi;
                $anySaifiTargetFilled = true;
            }
            
            if ($sf_real !== null) {
                $hasRealisasiSaifiOverall = true;
                $ytdTgtSaifiForOverview = $anySaifiTargetFilled ? $runningCumulativeTgtSaifi : null;
            }

            $result['saifi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $targetBulananSaifi,
                'realisasi' => $sf_real,
                'cumulativeReal' => $totalSaifi,
                'cumulativeTgt' => $anySaifiTargetFilled ? $runningCumulativeTgtSaifi : null,
                'distribusi_padam_tidak_terencana' => $saidiData ? $saidiData->saifi_distribusi_padam_tidak_terencana : 0,
                'distribusi_padam_terencana' => $saidiData ? $saidiData->saifi_distribusi_padam_terencana : 0,
                'distribusi_bencana_alam' => $saidiData ? $saidiData->saifi_distribusi_bencana_alam : 0,
                'transmisi' => $saidiData ? $saidiData->saifi_transmisi : 0,
                'pembangkit' => $saidiData ? $saidiData->saifi_pembangkit : 0,
            ];

            // ENS
            $ensBulananReal = 0;
            if ($ensData) {
                $ensBulananReal = $ensData->distribusi_padam_terencana +
                                  $ensData->distribusi_padam_tidak_terencana +
                                  $ensData->distribusi_bencana_alam +
                                  $ensData->transmisi +
                                  $ensData->pembangkit;
                
                $cumEnsTerencana += $ensData->distribusi_padam_terencana;
                $cumEnsTidakTerencana += $ensData->distribusi_padam_tidak_terencana;
                $cumEnsBencana += $ensData->distribusi_bencana_alam;
                $cumEnsTransmisi += $ensData->transmisi;
                $cumEnsPembangkit += $ensData->pembangkit;
            }
            $totalEns += $ensBulananReal;
            
            $targetBulananEns = $ensTargets[$i];
            if ($targetBulananEns !== null) {
                $runningCumulativeTgtEns += $targetBulananEns;
                $anyEnsTargetFilled = true;
            }

            $result['ensPageData'][] = [
                'bulan' => $i, 'label' => $bulanMap[$i-1],
                'bulanan' => [
                    'id' => $ensData ? $ensData->id : null,
                    'target' => $targetBulananEns,
                    'padam_terencana' => $ensData ? $ensData->distribusi_padam_terencana : 0,
                    'tidak_terencana' => $ensData ? $ensData->distribusi_padam_tidak_terencana : 0,
                    'bencana_alam' => $ensData ? $ensData->distribusi_bencana_alam : 0,
                    'transmisi' => $ensData ? $ensData->transmisi : 0,
                    'pembangkit' => $ensData ? $ensData->pembangkit : 0,
                    $tahun => $ensData ? $ensBulananReal : null,
                ],
                'kumulatif' => [
                    'target' => $anyEnsTargetFilled ? $runningCumulativeTgtEns : null,
                    'padam_terencana' => $cumEnsTerencana,
                    'tidak_terencana' => $cumEnsTidakTerencana,
                    'bencana_alam' => $cumEnsBencana,
                    'transmisi' => $cumEnsTransmisi,
                    'pembangkit' => $cumEnsPembangkit,
                    $tahun => $ensData ? $totalEns : null,
                ]
            ];

        }

        // If there's no realisasi overall but targets exist, use the full running sum
        if (!$hasRealisasiSaidiOverall && $anySaidiTargetFilled) {
            $ytdTgtSaidiForOverview = $runningCumulativeTgtSaidi;
        }

        $hitungSkorNegatif = function($realisasi, $target) {
            if ($target === null || $target <= 0 || $realisasi === null) {
                return null;
            }
            return max(0, min((2 - ($realisasi / $target)) * 100, 110));
        };

        $result['overview'] = [
            'kpis' => [
                'saidi' => ['val' => $totalSaidi, 'target' => $anySaidiTargetFilled ? $ytdTgtSaidiForOverview : null, 'isInverse' => true, 'unit' => 'mnt/plg', 'persen_pencapaian' => $hitungSkorNegatif($totalSaidi, $anySaidiTargetFilled ? $ytdTgtSaidiForOverview : null)],
                'saifi' => ['val' => $totalSaifi, 'target' => $anySaifiTargetFilled ? $ytdTgtSaifiForOverview : null, 'isInverse' => true, 'unit' => 'kali/plg', 'persen_pencapaian' => $hitungSkorNegatif($totalSaifi, $anySaifiTargetFilled ? $ytdTgtSaifiForOverview : null)],
                'ens'   => ['val' => $totalEns, 'target' => $anyEnsTargetFilled ? $runningCumulativeTgtEns : null, 'isInverse' => true, 'unit' => 'MWh', 'persen_pencapaian' => $hitungSkorNegatif($totalEns, $anyEnsTargetFilled ? $runningCumulativeTgtEns : null)],
                'losses' => ['val' => 5.5, 'target' => 6.0, 'isInverse' => true, 'unit' => '%'],
            ],
            'monthlyPerf' => array_map(function($sd, $sf) {
                return [
                    'name' => $sd['label'],
                    'saidi' => $sd['realisasi'], 'saifi' => $sf['realisasi'],
                    'targetSaidi' => $sd['target'], 'targetSaifi' => $sf['target']
                ];
            }, $result['saidi'], $result['saifi'])
        ];

        return response()->json($result);
    }

    public function saveEns(Request $request)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'periode_id' => 'required', // This is actually bulan from the frontend
            'tahun' => 'required'
        ]);

        $periode = Periode::firstOrCreate([
            'bulan' => $request->periode_id,
            'tahun' => $request->tahun
        ]);

        $data = $request->except(['periode_id', 'tahun']);
        foreach ($data as $key => $val) {
            if ($val === null || $val === '') {
                $data[$key] = 0;
            }
        }

        $ens = EnsBulanan::firstOrNew(['periode_id' => $periode->id]);
        $ens->fill($data);
        $ens->save();
        return response()->json(['message' => 'Data ENS tersimpan']);
    }

    public function deleteEns(Request $request)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'bulan' => 'required',
            'tahun' => 'required'
        ]);

        $periode = Periode::where('bulan', $request->bulan)->where('tahun', $request->tahun)->first();
        if ($periode) {
            $ens = EnsBulanan::where('periode_id', $periode->id)->first();
            if ($ens) {
                $ens->delete();
                return response()->json(['message' => 'Data ENS dihapus']);
            }
        }
        return response()->json(['message' => 'Data tidak ditemukan'], 404);
    }

    public function updateEns(Request $request, $id)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'distribusi_padam_tidak_terencana' => 'nullable|numeric|min:0',
            'distribusi_padam_terencana' => 'nullable|numeric|min:0',
            'distribusi_bencana_alam' => 'nullable|numeric|min:0',
            'transmisi' => 'nullable|numeric|min:0',
            'pembangkit' => 'nullable|numeric|min:0',
        ]);

        $ens = EnsBulanan::findOrFail($id);

        $data = $request->only([
            'distribusi_padam_tidak_terencana',
            'distribusi_padam_terencana',
            'distribusi_bencana_alam',
            'transmisi',
            'pembangkit'
        ]);

        foreach ($data as $key => $val) {
            if ($val === null || $val === '') {
                $data[$key] = 0;
            }
        }

        $ens->update($data);

        return response()->json(['success' => true, 'data' => $ens, 'message' => 'Data ENS berhasil diupdate']);
    }

    public function destroyEns($id)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $ens = EnsBulanan::findOrFail($id);
        $ens->delete();

        return response()->json(['success' => true, 'message' => 'Data ENS berhasil dihapus']);
    }

    public function saveGangguan(Request $request)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        $request->validate(['periode_id' => 'required']);
        $gg = GangguanBulanan::firstOrNew(['periode_id' => $request->periode_id]);
        $gg->fill($request->all());
        $gg->save();
        return response()->json(['message' => 'Data Gangguan Bulanan tersimpan']);
    }

    public function saveGangguanList(Request $request)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        $request->validate([
            'tahun' => 'required',
            'bulan' => 'required',
            'penyulang' => 'required'
        ]);
        $gg = new GangguanList();
        $gg->fill($request->all());
        $gg->save();
        return response()->json(['message' => 'Data Log Gangguan tersimpan']);
    }

    public function getGangguanList(Request $request)
    {
        $tahun = $request->input('tahun', 2026);
        return response()->json(GangguanList::where('tahun', $tahun)->get());
    }

    public function deleteGangguanList($id)
    {
        $user = auth()->user();
        if (!$user || !in_array($user->role, ['pic_jaringan', 'admin'])) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 403);
        }
        GangguanList::destroy($id);
        return response()->json(['message' => 'Data terhapus']);
    }
}
