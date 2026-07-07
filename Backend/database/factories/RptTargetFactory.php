<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\RptTarget;

class RptTargetFactory extends Factory
{
    protected $model = RptTarget::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'target_menit' => 45,
        ];
    }
}