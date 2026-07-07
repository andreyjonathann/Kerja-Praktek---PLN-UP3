<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $users = [
            [
                'name' => 'Administrator',
                'username' => 'admin',
                'email' => 'admin@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Aset',
                'username' => 'pic_aset',
                'email' => 'aset@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_aset',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Jaringan',
                'username' => 'pic_jaringan',
                'email' => 'jaringan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_jaringan',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Transaksi Energi',
                'username' => 'pic_transaksi_energi',
                'email' => 'te@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_transaksi_energi',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Niaga',
                'username' => 'pic_niaga',
                'email' => 'niaga@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_niaga',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Pemasaran',
                'username' => 'pic_pemasaran',
                'email' => 'pemasaran@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_pemasaran',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Keuangan',
                'username' => 'pic_keuangan',
                'email' => 'keuangan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_keuangan',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ]
        ];

        foreach ($users as $user) {
            User::updateOrCreate(
                ['email' => $user['email']],
                $user
            );
        }
        
        // Buat Periode Januari - Desember 2026 jika belum ada
        for ($i = 1; $i <= 12; $i++) {
            \App\Models\Periode::updateOrCreate(
                ['bulan' => $i, 'tahun' => 2026],
                ['is_active' => true]
            );
        }

        $this->call(TargetTahunanSeeder::class);
        $this->call(TargetTahunanRatingNegatifSeeder::class);
        $this->call(NkoParameterSeeder::class);
    }
}
