<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\TargetTahunan;

class TargetTahunanFactory extends Factory
{
    protected $model = TargetTahunan::class;
    public function definition(): array
    {
        return [
            'bidang' => 'Jaringan',
            'indikator' => $this->faker->randomElement(['SAIDI', 'SAIFI', 'ENS', 'MTTR']),
            'satuan' => $this->faker->randomElement(['menit/plg', 'kali/plg', '%']),
            'polaritas' => $this->faker->randomElement([1, -1]),
            'bobot' => $this->faker->randomFloat(2, 1, 10),
            'target' => $this->faker->randomFloat(2, 50, 100),
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'target_jan' => $this->faker->randomFloat(2, 1, 10),
            'target_feb' => $this->faker->randomFloat(2, 1, 10),
            'target_mar' => $this->faker->randomFloat(2, 1, 10),
            'target_apr' => $this->faker->randomFloat(2, 1, 10),
            'target_mei' => $this->faker->randomFloat(2, 1, 10),
            'target_jun' => $this->faker->randomFloat(2, 1, 10),
            'target_jul' => $this->faker->randomFloat(2, 1, 10),
            'target_agu' => $this->faker->randomFloat(2, 1, 10),
            'target_sep' => $this->faker->randomFloat(2, 1, 10),
            'target_okt' => $this->faker->randomFloat(2, 1, 10),
            'target_nov' => $this->faker->randomFloat(2, 1, 10),
            'target_des' => $this->faker->randomFloat(2, 1, 10),
        ];
    }
}