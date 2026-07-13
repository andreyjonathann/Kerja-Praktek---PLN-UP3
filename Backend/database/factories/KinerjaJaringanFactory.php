<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\KinerjaJaringan;
use App\Models\Periode;

class KinerjaJaringanFactory extends Factory
{
    protected $model = KinerjaJaringan::class;
    public function definition(): array
    {
        return [
            'periode_id' => Periode::factory(),
            'saidi_distribusi_padam_tidak_terencana' => $this->faker->randomFloat(2, 0, 50),
            'saidi_distribusi_padam_terencana' => $this->faker->randomFloat(2, 0, 20),
            'saidi_distribusi_bencana_alam' => $this->faker->randomFloat(2, 0, 10),
            'saidi_transmisi' => $this->faker->randomFloat(2, 0, 5),
            'saidi_pembangkit' => $this->faker->randomFloat(2, 0, 5),
            'saidi_total' => $this->faker->randomFloat(2, 5, 90),
            'saifi_distribusi_padam_tidak_terencana' => $this->faker->randomFloat(2, 0, 5),
            'saifi_distribusi_padam_terencana' => $this->faker->randomFloat(2, 0, 2),
            'saifi_distribusi_bencana_alam' => $this->faker->randomFloat(2, 0, 1),
            'saifi_transmisi' => $this->faker->randomFloat(2, 0, 0.5),
            'saifi_pembangkit' => $this->faker->randomFloat(2, 0, 0.5),
            'saifi_total' => $this->faker->randomFloat(2, 0.5, 9),
            'caidi' => $this->faker->randomFloat(2, 10, 50),
            'nko_score' => $this->faker->randomFloat(2, 80, 100),
            'jml_rating_negatif' => $this->faker->numberBetween(0, 50),
            'jml_wo_pln_mobile' => $this->faker->numberBetween(100, 1000),
            'persen_rating_negatif' => $this->faker->randomFloat(2, 0, 5),
            'ggn_tm_lebih_5_mnt' => $this->faker->numberBetween(0, 10),
            'ggn_tm_kurang_5_mnt' => $this->faker->numberBetween(0, 5),
            'ggn_switching' => $this->faker->numberBetween(0, 20),
        ];
    }
}