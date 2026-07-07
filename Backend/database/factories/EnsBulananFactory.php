<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\EnsBulanan;
use App\Models\Periode;

class EnsBulananFactory extends Factory
{
    protected $model = EnsBulanan::class;
    public function definition(): array
    {
        return [
            'periode_id' => Periode::factory(),
            'distribusi_padam_tidak_terencana' => $this->faker->randomFloat(2, 10, 100),
            'distribusi_padam_terencana' => $this->faker->randomFloat(2, 5, 50),
            'distribusi_bencana_alam' => $this->faker->randomFloat(2, 0, 20),
            'transmisi' => $this->faker->randomFloat(2, 0, 10),
            'pembangkit' => $this->faker->randomFloat(2, 0, 10),
        ];
    }
}