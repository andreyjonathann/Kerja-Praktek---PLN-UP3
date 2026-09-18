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
        $bidangKey = strtoupper(trim(str_replace(['_', '-'], ' ', $bidang)));

        $roleMap = [
            'JARINGAN' => 'pic_jaringan',
            'PEMASARAN' => 'pic_pemasaran',
            'TRANSAKSI ENERGI' => 'pic_transaksi_energi',
            'ASET' => 'pic_pengadaan',
            'PENGADAAN' => 'pic_pengadaan',
            'NIAGA' => 'pic_niaga',
            'KEUANGAN' => 'pic_keuangan',
            'K3' => 'pic_k3',
        ];

        $picRole = $roleMap[$bidangKey] ?? null;
        
        // Notify the relevant PIC, Manager, and Perencanaan
        $rolesToNotify = array_values(array_filter(array_unique([$picRole, 'manager', 'perencanaan'])));
        
        $users = User::whereIn('role', $rolesToNotify)->get();
        if ($users->isEmpty()) return;

        $targetLamaStr = $targetLama === null ? 'belum diisi' : $targetLama;
        $tipe = $targetLama === null ? 'TARGET_BARU' : 'TARGET_DIUBAH';
        
        $pesan = $targetLama === null 
            ? "Target {$indikator} ({$bidangKey}) tahun {$tahun} telah ditetapkan oleh Admin: {$targetBaru}. Silakan pantau realisasi Anda."
            : "Target {$indikator} ({$bidangKey}) tahun {$tahun} telah diperbarui dari {$targetLamaStr} menjadi {$targetBaru} oleh Admin.";

        $urlMap = [
            'JARINGAN' => '/saidi', 
            'PEMASARAN' => '/pemasaran/penjualan',
            'TRANSAKSI ENERGI' => '/susut',
            'ASET' => '/pengadaan/kontrak',
            'PENGADAAN' => '/pengadaan/kontrak',
            'NIAGA' => '/niaga/pelunasan',
            'KEUANGAN' => '/keuangan',
            'K3' => '/k3/dashboard',
        ];

        foreach ($users as $user) {
            Notification::create([
                'user_id' => $user->id,
                'judul' => 'Perubahan Target KPI',
                'pesan' => $pesan,
                'tipe' => $tipe,
                'url_tujuan' => $urlMap[$bidangKey] ?? '/',
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
