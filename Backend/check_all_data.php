<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = [
    'kinerja_jaringan',
    'kinerja_aset',
    'kinerja_keuangan',
    'kinerja_transaksi_energi',
    'kinerja_pemasaran',
    'kinerja_niaga'
];

$result = [];
foreach ($tables as $table) {
    $result[$table] = DB::table($table)
        ->join('periode', "$table.periode_id", '=', 'periode.id')
        ->select('periode.bulan', 'periode.tahun', "$table.*")
        ->get();
}

echo json_encode($result, JSON_PRETTY_PRINT);
