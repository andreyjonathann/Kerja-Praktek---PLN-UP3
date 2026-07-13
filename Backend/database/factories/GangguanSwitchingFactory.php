<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\GangguanSwitching;
use App\Models\User;

class GangguanSwitchingFactory extends Factory
{
    protected $model = GangguanSwitching::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'bulan' => $this->faker->numberBetween(1, 12),
            'jumlah_gangguan' => $this->faker->numberBetween(1, 20),
            'created_by' => User::factory(),
        ];
    }
}