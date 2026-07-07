<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Periode;

class PeriodeFactory extends Factory
{
    protected $model = Periode::class;
    public function definition(): array
    {
        return [
            'bulan' => $this->faker->numberBetween(1, 12),
            'tahun' => $this->faker->numberBetween(2023, 2025),
        ];
    }
}