<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Pengadaan;

class PengadaanSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate table pengadaans to clear all dummy contracts
        \Illuminate\Support\Facades\Schema::disableForeignKeyConstraints();
        Pengadaan::truncate();
        \Illuminate\Support\Facades\Schema::enableForeignKeyConstraints();
    }
}
