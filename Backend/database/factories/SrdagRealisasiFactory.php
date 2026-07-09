<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\SrdagRealisasi;
use App\Models\User;

class SrdagRealisasiFactory extends Factory
{
    protected $model = SrdagRealisasi::class;
    public function definition(): array
    {
        $total = $this->faker->numberBetween(50, 200);
        $berhasil = $this->faker->numberBetween(30, $total);
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'bulan' => $this->faker->numberBetween(1, 12),
            'jumlah_dispatch_berhasil' => $berhasil,
            'jumlah_total_gangguan' => $total,
            'success_rate' => ($berhasil / $total) * 100,
            'created_by' => User::factory(),
        ];
    }
}