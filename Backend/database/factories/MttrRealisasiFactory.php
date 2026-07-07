<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\MttrRealisasi;
use App\Models\User;

class MttrRealisasiFactory extends Factory
{
    protected $model = MttrRealisasi::class;
    public function definition(): array
    {
        $siaga1_total = $this->faker->numberBetween(10, 50);
        $siaga1_terpenuhi = $this->faker->numberBetween(5, $siaga1_total);
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'bulan' => $this->faker->numberBetween(1, 12),
            'jenis_aset' => $this->faker->randomElement(['SUTM', 'SKTM', 'PHBTM', 'TRAFO']),
            'jumlah_siaga1_terpenuhi' => $siaga1_terpenuhi,
            'jumlah_siaga1_total' => $siaga1_total,
            'persen_realisasi' => ($siaga1_terpenuhi / $siaga1_total) * 100,
            'created_by' => User::factory(),
        ];
    }
}