<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$tables = ['users', 'periode', 'target_tahunan', 'kinerja_aset', 'kinerja_jaringan', 'kinerja_transaksi_energi', 'kinerja_niaga', 'kinerja_pemasaran', 'kinerja_keuangan', 'rekap_nko'];

foreach($tables as $table) {
    echo "TABLE: $table\n";
    $columns = Illuminate\Support\Facades\Schema::getColumns($table);
    foreach($columns as $col) {
        echo "- {$col['name']} ({$col['type_name']})\n";
    }
    echo "\n";
}
