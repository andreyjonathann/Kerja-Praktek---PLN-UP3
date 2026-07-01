<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class NotifyMissingTargets extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'notify:missing-targets';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for missing targets in the current year and notify Admin/PIC';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $tahun = date('Y');
        // List of all expected target indicator mappings
        $expectedTargets = [
            'Jaringan' => ['SAIDI', 'SAIFI', 'ENS', 'Gangguan TM', 'Susut'],
            'Pemasaran' => ['Penjualan', 'Pendapatan', 'Piutang'],
            'Transaksi Energi' => ['P2TL', 'AMR'],
            // Add more as needed based on constants.js
        ];

        foreach ($expectedTargets as $bidang => $indikators) {
            foreach ($indikators as $indikator) {
                $target = \App\Models\TargetTahunan::where('bidang', $bidang)
                    ->where('indikator', $indikator)
                    ->where('tahun', $tahun)
                    ->first();

                if (!$target || $target->target === null) {
                    // Send Notification to PIC
                    $roleMap = [
                        'Jaringan' => 'pic_jaringan',
                        'Pemasaran' => 'pic_pemasaran',
                        'Transaksi Energi' => 'pic_transaksi_energi',
                    ];

                    $role = $roleMap[$bidang] ?? null;
                    if ($role) {
                        $users = \App\Models\User::where('role', $role)->get();
                        foreach ($users as $user) {
                            \App\Models\Notification::create([
                                'user_id' => $user->id,
                                'judul' => 'Target Belum Ditetapkan',
                                'pesan' => "Perhatian: Target {$indikator} tahun {$tahun} belum ditetapkan. Anda tidak dapat memantau pencapaian tanpa target yang jelas.",
                                'tipe' => 'TARGET_KOSONG',
                                'url_tujuan' => '/kelola-target?bidang=' . strtolower(str_replace(' ', '-', $bidang)),
                            ]);
                        }
                    }
                }
            }
        }

        $this->info('Missing targets check completed.');
    }
}
