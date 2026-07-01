<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    /**
     * Trigger 1 & 2: Notify PIC when Admin sets/updates a target
     */
    public function notifyTargetUpdated($bidang, $indikator, $targetLama, $targetBaru, $tahun)
    {
        $roleMap = [
            'JARINGAN' => 'pic_jaringan',
            'PEMASARAN' => 'pic_pemasaran',
            'TRANSAKSI ENERGI' => 'pic_transaksi_energi',
            'ASET' => 'pic_aset',
            'NIAGA' => 'pic_niaga',
            'KEUANGAN' => 'pic_keuangan',
        ];

        $role = $roleMap[strtoupper($bidang)] ?? null;
        if (!$role) return;

        $users = User::where('role', $role)->get();
        if ($users->isEmpty()) return;

        $targetLamaStr = $targetLama === null ? 'belum diisi' : $targetLama;
        $tipe = $targetLama === null ? 'TARGET_BARU' : 'TARGET_DIUBAH';
        
        $pesan = $targetLama === null 
            ? "Target {$indikator} tahun {$tahun} telah ditetapkan oleh Admin: {$targetBaru}. Silakan pantau realisasi Anda."
            : "Target {$indikator} tahun {$tahun} telah diperbarui dari {$targetLamaStr} menjadi {$targetBaru} oleh Admin.";

        $urlMap = [
            'JARINGAN' => '/saidi', 
            'PEMASARAN' => '/pemasaran/penjualan',
            'TRANSAKSI ENERGI' => '/input',
            'ASET' => '/input',
            'NIAGA' => '/niaga/pelunasan',
            'KEUANGAN' => '/input',
        ];

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'judul' => 'Perubahan Target KPI',
                'pesan' => $pesan,
                'tipe' => $tipe,
                'url_tujuan' => $urlMap[strtoupper($bidang)] ?? '/',
            ]);
        }
    }

    /**
     * Trigger 7: Notify Admin when PIC inputs new realisasi
     */
    public function notifyAdminRealisasiBaru($bidang, $indikator, $bulan, $tahun, $realisasi)
    {
        $admins = User::where('role', 'admin')->get();
        if ($admins->isEmpty()) return;

        $bulanNames = [
            1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April',
            5 => 'Mei', 6 => 'Juni', 7 => 'Juli', 8 => 'Agustus',
            9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember'
        ];
        $bulanName = $bulanNames[(int)$bulan] ?? $bulan;

        $pesan = "PIC {$bidang} telah menginput realisasi {$indikator} bulan {$bulanName} {$tahun}: {$realisasi}.";

        foreach ($admins as $admin) {
            Notification::create([
                'user_id' => $admin->id,
                'judul' => 'Realisasi Baru Diinput',
                'pesan' => $pesan,
                'tipe' => 'REALISASI_BARU',
                'url_tujuan' => '/kelola-target?bidang=' . strtolower(str_replace(' ', '-', $bidang)),
            ]);
        }
    }
}
