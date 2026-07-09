<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\GangguanSwitchingTarget;

class GangguanSwitchingTargetFactory extends Factory
{
    protected $model = GangguanSwitchingTarget::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'target_switching_tahunan' => $this->faker->numberBetween(50, 150),
            'target_trafo_tahunan' => $this->faker->numberBetween(10, 50),
        ];
    }
}