<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\DetailGangguanTmLebih5Mnt;

class DetailGangguanTmLebih5MntFactory extends Factory
{
    protected $model = DetailGangguanTmLebih5Mnt::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'bulan' => $this->faker->numberBetween(1, 12),
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'jumlah_gangguan' => $this->faker->numberBetween(1, 10),
            'penyebab' => $this->faker->randomElement(['Pohon', 'Hewan', 'Petir', 'Layang-layang']),
            'nama_penyulang' => 'PYL-'.$this->faker->numberBetween(10, 99),
        ];
    }
}