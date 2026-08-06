<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\KinerjaJaringan;
use App\Models\KinerjaAset;
use App\Models\KinerjaNiaga;
use App\Models\KinerjaPemasaran;
use App\Models\KinerjaKeuangan;
use App\Models\KinerjaTransaksiEnergi;
use App\Services\NkoCalculationService;

class RecalculateNkoScores extends Command
{
    protected $signature = 'nko:recalculate {--tahun= : Filter recalculate hanya untuk tahun tertentu, misal --tahun=2026}';

    protected $description = 'Hitung ulang seluruh nko_score dan rekap_nko menggunakan formula NkoCalculationService terbaru (setelah perbaikan formula MINIMIZE)';

    public function handle()
    {
        $tahun = $this->option('tahun');

        // 1. Recalculate Jaringan
        $jaringanQuery = KinerjaJaringan::query();
        if ($tahun) {
            $jaringanQuery->whereHas('periode', fn($q) => $q->where('tahun', $tahun));
        }
        $jaringanRecords = $jaringanQuery->get();
        $this->info("Recalculating {$jaringanRecords->count()} baris Kinerja Jaringan...");
        foreach ($jaringanRecords as $record) {
            NkoCalculationService::calculateJaringan($record);
        }

        // 2. Recalculate bidang generik
        $genericMap = [
            KinerjaAset::class => 'Aset',
            KinerjaNiaga::class => 'Niaga',
            KinerjaPemasaran::class => 'Pemasaran',
            KinerjaKeuangan::class => 'Keuangan',
            KinerjaTransaksiEnergi::class => 'Transaksi Energi',
        ];

        foreach ($genericMap as $modelClass => $bidang) {
            $query = $modelClass::query();
            if ($tahun) {
                $query->whereHas('periode', fn($q) => $q->where('tahun', $tahun));
            }
            $records = $query->get();
            $this->info("Recalculating {$records->count()} baris {$bidang}...");
            foreach ($records as $record) {
                NkoCalculationService::calculateGeneric($record, $bidang);
            }
        }

        $this->info('Selesai! Seluruh nko_score dan rekap_nko sudah dihitung ulang dengan formula terbaru.');
    }
}
