<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\RptGangguan;
use App\Models\User;

class RptGangguanFactory extends Factory
{
    protected $model = RptGangguan::class;
    public function definition(): array
    {
        $gangguan = $this->faker->numberBetween(1, 20);
        $durasi = $this->faker->numberBetween($gangguan * 30, $gangguan * 120);
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'bulan' => $this->faker->numberBetween(1, 12),
            'total_durasi_menit' => $durasi,
            'jumlah_gangguan' => $gangguan,
            'rata_rata_rpt' => $durasi / $gangguan,
            'created_by' => User::factory(),
        ];
    }
}