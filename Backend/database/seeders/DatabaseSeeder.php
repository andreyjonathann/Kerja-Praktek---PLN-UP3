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
                'is_active' => true,
            ],
            [
                'name' => 'PIC Jaringan',
                'username' => 'pic_jaringan',
                'email' => 'jaringan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_jaringan',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Transaksi Energi',
                'username' => 'pic_transaksi_energi',
                'email' => 'te@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_transaksi_energi',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Niaga',
                'username' => 'pic_niaga',
                'email' => 'niaga@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_niaga',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Pemasaran',
                'username' => 'pic_pemasaran',
                'email' => 'pemasaran@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_pemasaran',
                'is_active' => true,
            ],
            [
                'name' => 'PIC Keuangan',
                'username' => 'pic_keuangan',
                'email' => 'keuangan@pln.co.id',
                'password' => Hash::make('password'),
                'role' => 'pic_keuangan',
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
    }
}
