<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Services\YtdCalculationService;
use App\Models\TargetTahunan;
use Illuminate\Support\Collection;

class YtdCalculationServiceTest extends TestCase
{
    /**
     * Data simulasi bulanan
     */
    private function getSimulatedRecords(): Collection
    {
        return collect([
            ['bulan' => 1, 'kwh_netto' => 129225741, 'pssd' => 1216784, 'kwh_jual_309' => 124632165],
            ['bulan' => 2, 'kwh_netto' => 122441127, 'pssd' => 1086511, 'kwh_jual_309' => 116500399],
            ['bulan' => 3, 'kwh_netto' => 135439856, 'pssd' => 1202923, 'kwh_jual_309' => 126537149],
            ['bulan' => 4, 'kwh_netto' => 148602887, 'pssd' => 1167505, 'kwh_jual_309' => 137802924],
        ]);
    }

    public function test_sum_raw_components_menjumlahkan_dengan_benar()
    {
        $records = $this->getSimulatedRecords();
        $columns = ['kwh_netto', 'pssd', 'kwh_jual_309'];

        $sums = YtdCalculationService::sumRawComponents($records, $columns);

        $this->assertEquals(535709611, $sums['kwh_netto']);
        $this->assertEquals(4673723, $sums['pssd']);
        $this->assertEquals(505472637, $sums['kwh_jual_309']);
    }

    public function test_get_latest_month_mengembalikan_bulan_terbesar()
    {
        $records = $this->getSimulatedRecords();
        $latest = YtdCalculationService::getLatestMonth($records);

        $this->assertEquals(4, $latest);
    }

    public function test_calculate_ytd_summary_susut_distribusi()
    {
        $records = $this->getSimulatedRecords();
        
        $targetRecord = new TargetTahunan();
        $targetRecord->target_apr = 5.38;

        $formula = function($sums) {
            return (($sums['kwh_netto'] - $sums['pssd'] - $sums['kwh_jual_309']) / $sums['kwh_netto']) * 100;
        };

        $result = YtdCalculationService::calculateYtdSummary(
            $records,
            ['kwh_netto', 'pssd', 'kwh_jual_309'],
            $formula,
            $targetRecord,
            'NEGATIF'
        );

        $this->assertEquals(4, $result['latest_month']);
        $this->assertEquals(5.38, $result['target_ytd']);
        $this->assertEqualsWithDelta(4.7718, $result['realisasi_ytd'], 0.01);
        $this->assertEquals(110, $result['nko_score']); // 111.31 capped to 110
        $this->assertEquals(535709611, $result['raw_sums']['kwh_netto']);
    }

    public function test_calculate_nko_score_return_null_jika_target_kosong()
    {
        $this->assertNull(YtdCalculationService::calculateNkoScore(10, null, 'NEGATIF'));
        $this->assertNull(YtdCalculationService::calculateNkoScore(10, 0, 'NEGATIF'));
    }

    public function test_calculate_nko_score_polaritas_positif()
    {
        $result = YtdCalculationService::calculateNkoScore(80, 100, 'POSITIF');
        $this->assertEquals(80, $result);

        $cappedResult = YtdCalculationService::calculateNkoScore(150, 100, 'POSITIF');
        $this->assertEquals(110, $cappedResult);
    }

    public function test_calculate_ytd_summary_return_null_semua_jika_records_kosong()
    {
        $records = collect([]);
        $targetRecord = new TargetTahunan();
        
        $formula = function($sums) { return 0; };

        $result = YtdCalculationService::calculateYtdSummary(
            $records,
            ['kwh_netto'],
            $formula,
            $targetRecord,
            'NEGATIF'
        );

        $this->assertNull($result['realisasi_ytd']);
        $this->assertNull($result['target_ytd']);
        $this->assertNull($result['latest_month']);
        $this->assertNull($result['nko_score']);
        $this->assertEmpty($result['raw_sums']);
    }

    public function test_calculate_nko_score_polaritas_negatif_extreme()
    {
        // Realisasi jauh lebih besar (buruk) dari target untuk polaritas NEGATIF
        // (2 - (33.33 / 3)) * 100 = (2 - 11.11) * 100 = -911
        // Seharusnya mengembalikan 0 (berkat max(0, ...))
        $result = YtdCalculationService::calculateNkoScore(33.33, 3, 'NEGATIF');
        $this->assertEquals(0, $result);
    }
}
