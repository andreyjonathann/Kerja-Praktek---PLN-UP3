<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\SrdagTarget;

class SrdagTargetFactory extends Factory
{
    protected $model = SrdagTarget::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'target_rate' => 100,
        ];
    }
}