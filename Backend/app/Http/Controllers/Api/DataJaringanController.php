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

        $targetSaidi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saidi'])->first();
        $targetSaifi = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['saifi'])->first();
        $targetEns = TargetTahunan::whereRaw('LOWER(bidang) = ?', ['jaringan'])->whereRaw('LOWER(indikator) = ?', ['ens'])->first();
        
        $tgtSaidiVal = $targetSaidi ? $targetSaidi->target : null;
        $tgtSaifiVal = $targetSaifi ? $targetSaifi->target : null;
        $tgtEnsVal = $targetEns ? $targetEns->target : null;

        $totalSaidi = 0;
        $totalSaifi = 0;
        $totalEns = 0;
        
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
            $result['saidi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $tgtSaidiVal !== null ? $tgtSaidiVal / 12 : null,
                'realisasi' => $sd_real,
                'cumulativeReal' => $totalSaidi,
                'cumulativeTgt' => $tgtSaidiVal !== null ? ($tgtSaidiVal / 12) * $i : null,
                'distribusi_padam_tidak_terencana' => $saidiData ? $saidiData->saidi_distribusi_padam_tidak_terencana : 0,
                'distribusi_padam_terencana' => $saidiData ? $saidiData->saidi_distribusi_padam_terencana : 0,
                'distribusi_bencana_alam' => $saidiData ? $saidiData->saidi_distribusi_bencana_alam : 0,
                'transmisi' => $saidiData ? $saidiData->saidi_transmisi : 0,
                'pembangkit' => $saidiData ? $saidiData->saidi_pembangkit : 0,
            ];

            // SAIFI
            $sf_real = $saidiData ? $saidiData->saifi_total : null;
            $totalSaifi += $sf_real ?? 0;
            $result['saifi'][] = [
                'id' => $i, 'bulan' => $i, 'label' => $bulanMap[$i-1],
                'target' => $tgtSaifiVal !== null ? $tgtSaifiVal / 12 : null,
                'realisasi' => $sf_real,
                'cumulativeReal' => $totalSaifi,
                'cumulativeTgt' => $tgtSaifiVal !== null ? ($tgtSaifiVal / 12) * $i : null,
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
            
            $result['ensPageData'][] = [
                'bulan' => $i, 'label' => $bulanMap[$i-1],
                'bulanan' => [
                    'target' => $tgtEnsVal / 12,
                    'padam_terencana' => $ensData ? $ensData->distribusi_padam_terencana : 0,
                    'tidak_terencana' => $ensData ? $ensData->distribusi_padam_tidak_terencana : 0,
                    'bencana_alam' => $ensData ? $ensData->distribusi_bencana_alam : 0,
                    'transmisi' => $ensData ? $ensData->transmisi : 0,
                    'pembangkit' => $ensData ? $ensData->pembangkit : 0,
                    $tahun => $ensData ? $ensBulananReal : null,
                ],
                'kumulatif' => [
                    'target' => ($tgtEnsVal / 12) * $i,
                    'padam_terencana' => $cumEnsTerencana,
                    'tidak_terencana' => $cumEnsTidakTerencana,
                    'bencana_alam' => $cumEnsBencana,
                    'transmisi' => $cumEnsTransmisi,
                    'pembangkit' => $cumEnsPembangkit,
                    $tahun => $ensData ? $totalEns : null,
                ]
            ];

        }

        $result['overview'] = [
            'kpis' => [
                'saidi' => ['val' => $totalSaidi, 'target' => $tgtSaidiVal, 'isInverse' => true, 'unit' => 'mnt/plg'],
                'saifi' => ['val' => $totalSaifi, 'target' => $tgtSaifiVal, 'isInverse' => true, 'unit' => 'kali/plg'],
                'ens'   => ['val' => $totalEns, 'target' => $tgtEnsVal, 'isInverse' => true, 'unit' => 'MWh'],

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
