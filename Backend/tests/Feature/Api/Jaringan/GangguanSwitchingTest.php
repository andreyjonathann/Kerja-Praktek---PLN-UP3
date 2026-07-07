<?php

namespace Tests\Feature\Api\Jaringan;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\GangguanSwitching;
use App\Models\GangguanSwitchingTarget;
use App\Models\TargetTahunan;

class GangguanSwitchingTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $pic;
    protected $viewer;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Setup user PIC Jaringan
        $this->pic = User::factory()->create([
            'role' => 'pic_jaringan',
            'up3' => 'Kebon Jeruk'
        ]);
        
        // Setup user Viewer
        $this->viewer = User::factory()->create([
            'role' => 'Viewer',
            'up3' => 'Kebon Jeruk'
        ]);
    }

    public function test_pic_can_input_gangguan_switching()
    {
        $payload = [
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'details' => [
                ['merek' => 'Schneider', 'tahun_alat' => '2020', 'nomor_seri' => 'SN123'],
                ['merek' => 'Siemens', 'tahun_alat' => '2019', 'nomor_seri' => 'SM456'],
            ]
        ];

        $response = $this->actingAs($this->pic)->postJson('/api/v1/gangguan-switching', $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('gangguan_switching', [
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'jumlah_gangguan' => 2,
            'created_by' => $this->pic->id
        ]);

        $this->assertDatabaseHas('gangguan_switching_details', [
            'merek' => 'Schneider',
            'nomor_seri' => 'SN123'
        ]);
    }

    public function test_pic_can_edit_data_gangguan_switching()
    {
        $gangguan = GangguanSwitching::factory()->create([
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'jumlah_gangguan' => 0,
            'created_by' => $this->pic->id
        ]);

        $payload = [
            'details' => [
                ['merek' => 'ABB', 'tahun_alat' => '2021', 'nomor_seri' => 'ABB001']
            ]
        ];

        $response = $this->actingAs($this->pic)->putJson('/api/v1/gangguan-switching/' . $gangguan->id, $payload);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('gangguan_switching', [
            'id' => $gangguan->id,
            'jumlah_gangguan' => 1
        ]);

        $this->assertDatabaseHas('gangguan_switching_details', [
            'gangguan_switching_id' => $gangguan->id,
            'merek' => 'ABB'
        ]);
    }

    public function test_pic_can_delete_data_gangguan_switching()
    {
        $gangguan = GangguanSwitching::factory()->create([
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'created_by' => $this->pic->id
        ]);

        $response = $this->actingAs($this->pic)->deleteJson('/api/v1/gangguan-switching/' . $gangguan->id);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseMissing('gangguan_switching', [
            'id' => $gangguan->id
        ]);
    }

    public function test_viewer_cannot_input_edit_delete()
    {
        // Test Input
        $payload = [
            'up3' => 'Kebon Jeruk',
            'tahun' => 2024,
            'bulan' => 5,
            'details' => []
        ];
        $responseInput = $this->actingAs($this->viewer)->postJson('/api/v1/gangguan-switching', $payload);
        $responseInput->assertStatus(403);

        // Test Edit
        $gangguan = GangguanSwitching::factory()->create(['up3' => 'Kebon Jeruk']);
        $responseEdit = $this->actingAs($this->viewer)->putJson('/api/v1/gangguan-switching/' . $gangguan->id, ['details' => []]);
        $responseEdit->assertStatus(403);

        // Test Delete
        $responseDelete = $this->actingAs($this->viewer)->deleteJson('/api/v1/gangguan-switching/' . $gangguan->id);
        $responseDelete->assertStatus(403);
    }

    public function test_input_validation_error_on_invalid_data()
    {
        $payload = [
            'up3' => 'Kebon Jeruk',
            'tahun' => 'Bukan Tahun', // Invalid: string instead of integer
            'bulan' => 13,            // Invalid: month > 12
            'details' => 'Bukan array' // Invalid: string instead of array
        ];

        $response = $this->actingAs($this->pic)->postJson('/api/v1/gangguan-switching', $payload);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['tahun', 'bulan', 'details']);
    }

    public function test_dashboard_rekap_kalkulasi_ytd()
    {
        // Gunakan tahun lalu agar memastikan YTD dihitung penuh (12 bulan)
        $tahunLalu = date('Y') - 1;

        // Setup TargetTahunan (Master Target) untuk testing % pencapaian
        TargetTahunan::factory()->create([
            'bidang' => 'Jaringan',
            'indikator' => 'Gangguan Switching',
            'tahun' => $tahunLalu,
            'target_jan' => 10, 'target_feb' => 10, 'target_mar' => 10,
            'target_apr' => 10, 'target_mei' => 10, 'target_jun' => 10,
            'target_jul' => 10, 'target_agu' => 10, 'target_sep' => 10,
            'target_okt' => 10, 'target_nov' => 10, 'target_des' => 10, // Total = 120
        ]);

        // Setup GangguanSwitchingTarget (Target khusus dashboard)
        GangguanSwitchingTarget::factory()->create([
            'up3' => 'Kebon Jeruk',
            'tahun' => $tahunLalu,
            'target_switching_tahunan' => 120,
            'target_trafo_tahunan' => 0
        ]);

        // Seed Realisasi Gangguan Switching 12 bulan (Masing-masing 5 gangguan)
        for ($i = 1; $i <= 12; $i++) {
            GangguanSwitching::factory()->create([
                'up3' => 'Kebon Jeruk',
                'tahun' => $tahunLalu,
                'bulan' => $i,
                'jumlah_gangguan' => 5
            ]);
        }

        $response = $this->actingAs($this->pic)->getJson('/api/v1/gangguan-switching/dashboard?tahun=' . $tahunLalu . '&up3=Kebon Jeruk');

        $response->assertStatus(200);

        // Assert YTD = 5 * 12 = 60
        $response->assertJsonPath('data.summary.ytd_switching', 60);
        $response->assertJsonPath('data.summary.target_switching', 120);
        
        // Assert hitungan persentase vs target ( (60 / 120) * 100 = 50% )
        $response->assertJsonPath('data.summary.persen_vs_target', 50);
        
        // Assert trend_bulanan array length is 12
        $response->assertJsonCount(12, 'data.trend_bulanan');
        
        $trendData = collect($response->json('data.trend_bulanan'));
        
        // Assert kumulatif di bulan ke-12 sama dengan 60 (SUM manual)
        $trendDesember = $trendData->where('bulan', 12)->first();
        $this->assertEquals(60, $trendDesember['switching']);

        // --- ASERSI S1/S2 RATIO (Target Tahunan = 120) ---
        
        // Bulan 3 (Maret): (0.55 / 6) * 3 = 27.5% dari 120 = 33
        $trendMaret = $trendData->where('bulan', 3)->first();
        $this->assertEquals(33, $trendMaret['target_switching_kumulatif']);

        // Bulan 6 (Juni): 55% dari 120 = 66
        $trendJuni = $trendData->where('bulan', 6)->first();
        $this->assertEquals(66, $trendJuni['target_switching_kumulatif']);

        // Bulan 12 (Desember): 100% dari 120 = 120
        $this->assertEquals(120, $trendDesember['target_switching_kumulatif']);
    }
}
