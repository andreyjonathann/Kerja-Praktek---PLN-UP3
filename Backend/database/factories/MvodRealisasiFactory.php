<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\MvodRealisasi;
use App\Models\User;

class MvodRealisasiFactory extends Factory
{
    protected $model = MvodRealisasi::class;
    public function definition(): array
    {
        $jam = $this->faker->randomFloat(2, 1, 10);
        $kali = $this->faker->numberBetween(1, 5);
        $menit = $jam * 60;
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'bulan' => $this->faker->numberBetween(1, 12),
            'tipe_rct' => $this->faker->randomElement(['GI', 'JTM', 'GD']),
            'total_lama_padam_jam' => $jam,
            'kali_padam' => $kali,
            'total_lama_padam_menit' => $menit,
            'rata_rct_menit' => $menit / $kali,
            'created_by' => User::factory(),
        ];
    }
}