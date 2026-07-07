<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\MvodTarget;

class MvodTargetFactory extends Factory
{
    protected $model = MvodTarget::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'sla_gi_menit' => 60,
            'sla_jtm_menit' => 120,
            'sla_gd_menit' => 180,
        ];
    }
}