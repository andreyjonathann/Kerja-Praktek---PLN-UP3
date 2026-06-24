<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Periode;
use App\Models\KinerjaJaringan;
use App\Models\EnsBulanan;
use App\Models\GangguanBulanan;
use App\Models\GangguanList;
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
            'gangguan' => [
                'monthly_trend' => [],
                'by_cause' => [
                    ['name' => 'Penyulang', 'value' => 0],
                    ['name' => 'Gardu', 'value' => 0],
                    ['name' => 'JTR', 'value' => 0],
                ],
                'list' => []
            ],
            'ensPageData' => [],
            'overview' => []
        ];

        $periodes = Periode::where('tahun', $tahun)->orderBy('bulan')->get();
        $bulanMap = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

        $targetSaidi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saidi'])->first();
        $targetSaifi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saifi'])->first();
        $targetEns = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['ens'])->first();
        
        $tgtSaidiVal = $targetSaidi ? $targetSaidi->target : 0;
        $tgtSaifiVal = $targetSaifi ? $targetSaifi->target : 0;
        $tgtEnsVal = $targetEns ? $targetEns->target : 0;

        $totalSaidi = 0;
        $totalSaifi = 0;
        $totalEns = 0;
        $totalGangguan = 0;

        for ($i = 1; $i <= 12; $i++) {
            $p = $periodes->firstWhere('bulan', $i);
            
            $saidiData = null;
            $ensData = null;
            $gangguanData = null;

            if ($p) {
                $saidiData = KinerjaJaringan::where('periode_id', $p->id)->first();
                $ensData = EnsBulanan::where('periode_id', $p->id)->first();
                $gangguanData = GangguanBulanan::where('periode_id', $p->id)->first();
            }

            // SAIDI
            $sd_real = $saidiData ? $saidiData->saidi_total : null;
            $totalSaidi += $sd_real ?? 0;
            $result['saidi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $tgtSaidiVal / 12,
                'realisasi' => $sd_real,
                'cumulativeReal' => $totalSaidi,
                'cumulativeTgt' => ($tgtSaidiVal / 12) * $i,
                'pemeliharaan' => $saidiData ? $saidiData->saidi_har : 0,
                'penyulang' => $saidiData ? $saidiData->saidi_penyulang : 0,
                'gardu' => $saidiData ? $saidiData->saidi_gardu : 0,
                'jtr' => $saidiData ? $saidiData->saidi_jtr : 0,
                'srapp' => $saidiData ? $saidiData->saidi_sr_app : 0,
                'bencana_alam' => $saidiData ? $saidiData->saidi_bencana_alam : 0,
                'transmisi' => $saidiData ? $saidiData->saidi_sistem_transmisi : 0,
            ];

            // SAIFI
            $sf_real = $saidiData ? $saidiData->saifi_total : null;
            $totalSaifi += $sf_real ?? 0;
            $result['saifi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $tgtSaifiVal / 12,
                'realisasi' => $sf_real,
                'cumulativeReal' => $totalSaifi,
                'cumulativeTgt' => ($tgtSaifiVal / 12) * $i,
                'pemeliharaan' => $saidiData ? $saidiData->saifi_har : 0,
                'penyulang' => $saidiData ? $saidiData->saifi_penyulang : 0,
                'gardu' => $saidiData ? $saidiData->saifi_gardu : 0,
                'jtr' => $saidiData ? $saidiData->saifi_jtr : 0,
                'srapp' => $saidiData ? $saidiData->saifi_sr_app : 0,
                'bencana_alam' => $saidiData ? $saidiData->saifi_bencana_alam : 0,
                'transmisi' => $saidiData ? $saidiData->saifi_sistem_transmisi : 0,
            ];

            // ENS
            $ensBulananReal = $ensData ? ($ensData->terencana + $ensData->tidak_terencana + $ensData->bencana_alam) : 0;
            $totalEns += $ensBulananReal;
            $result['ensPageData'][] = [
                'bulan' => $i, 'label' => $bulanMap[$i-1],
                'bulanan' => [
                    'target' => $tgtEnsVal / 12,
                    'padam_terencana' => $ensData ? $ensData->terencana : 0,
                    'tidak_terencana' => $ensData ? $ensData->tidak_terencana : 0,
                    'bencana_alam' => $ensData ? $ensData->bencana_alam : 0,
                    $tahun => $ensData ? $ensBulananReal : null,
                ],
                'kumulatif' => [
                    'target' => ($tgtEnsVal / 12) * $i,
                    'padam_terencana' => $totalEns * 0.35, // dummy approx for cumulative
                    'tidak_terencana' => $totalEns * 0.50,
                    'bencana_alam' => $totalEns * 0.15,
                    $tahun => $ensData ? $totalEns : null,
                ]
            ];

            // Gangguan
            $gg = $gangguanData ? ($gangguanData->gt_5_menit + $gangguanData->le_5_menit) : 0;
            $totalGangguan += $gg;
            $result['gangguan']['monthly_trend'][] = [
                'name' => $bulanMap[$i-1],
                'gangguan' => $gg,
                'durasi' => $gg * 45 // dummy
            ];
        }

        $result['gangguan']['list'] = GangguanList::where('tahun', $tahun)->get();

        $result['overview'] = [
            'kpis' => [
                'saidi' => ['val' => $totalSaidi, 'target' => $tgtSaidiVal, 'isInverse' => true, 'unit' => 'mnt/plg'],
                'saifi' => ['val' => $totalSaifi, 'target' => $tgtSaifiVal, 'isInverse' => true, 'unit' => 'kali/plg'],
                'ens'   => ['val' => $totalEns, 'target' => $tgtEnsVal, 'isInverse' => true, 'unit' => 'MWh'],
                'gangguan' => ['val' => $totalGangguan, 'target' => 160, 'isInverse' => true, 'unit' => 'kali'],
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
        $request->validate(['periode_id' => 'required']);
        $ens = EnsBulanan::firstOrNew(['periode_id' => $request->periode_id]);
        $ens->fill($request->all());
        $ens->save();
        return response()->json(['message' => 'Data ENS tersimpan']);
    }

    public function saveGangguan(Request $request)
    {
        $request->validate(['periode_id' => 'required']);
        $gg = GangguanBulanan::firstOrNew(['periode_id' => $request->periode_id]);
        $gg->fill($request->all());
        $gg->save();
        return response()->json(['message' => 'Data Gangguan Bulanan tersimpan']);
    }

    public function saveGangguanList(Request $request)
    {
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
        GangguanList::destroy($id);
        return response()->json(['message' => 'Data terhapus']);
    }
}
