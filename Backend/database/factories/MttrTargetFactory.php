<?php
namespace Database\Factories;
use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\MttrTarget;

class MttrTargetFactory extends Factory
{
    protected $model = MttrTarget::class;
    public function definition(): array
    {
        return [
            'up3' => 'Kebon Jeruk',
            'tahun' => $this->faker->numberBetween(2023, 2025),
            'target_persen' => 100,
            'jumlah_penyulang' => $this->faker->numberBetween(10, 50),
        ];
    }
}