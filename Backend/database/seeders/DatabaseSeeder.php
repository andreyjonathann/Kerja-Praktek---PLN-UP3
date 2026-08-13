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
            // Branch Andrey: Pengadaan
            [
                'name' => 'PIC Pengadaan',
                'username' => 'pic_pengadaan',
                'email' => 'pengadaan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_pengadaan',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // Branch Eunike: Jaringan
            [
                'name' => 'PIC Jaringan',
                'username' => 'pic_jaringan',
                'email' => 'jaringan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_jaringan',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // Branch Eunike: Transaksi Energi (TE)
            [
                'name' => 'PIC Transaksi Energi',
                'username' => 'pic_transaksi_energi',
                'email' => 'te@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_transaksi_energi',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // Branch Andrey: Niaga
            [
                'name' => 'PIC Niaga',
                'username' => 'pic_niaga',
                'email' => 'niaga@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_niaga',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // Branch Andrey: Pemasaran
            [
                'name' => 'PIC Pemasaran',
                'username' => 'pic_pemasaran',
                'email' => 'pemasaran@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_pemasaran',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // General: Keuangan
            [
                'name' => 'PIC Keuangan',
                'username' => 'pic_keuangan',
                'email' => 'keuangan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_keuangan',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            // Branch Early: K3
            [
                'name' => 'Admin K3',
                'username' => 'admin_k3',
                'email' => 'admin_k3@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'admin_k3',
                'up3' => 'UP3 Kebon Jeruk',
                'is_active' => true,
            ],
            [
                'name' => 'PIC K3',
                'username' => 'pic_k3',
                'email' => 'k3@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_k3',
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
        if (class_exists(PengadaanSeeder::class)) {
            $this->call(PengadaanSeeder::class);
        }
    }
}
