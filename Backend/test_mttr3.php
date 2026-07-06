<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = \App\Models\TargetTahunan::where('tahun', '2026')->where('indikator', 'MTTR Siaga 1')->first();
$t->update([
    'satuan' => '%',
    'polaritas' => 'MAXIMIZE',
    'target_jan' => 100,
    'target_feb' => 100,
    'target_mar' => 100,
    'target_apr' => 100,
    'target_mei' => 100,
    'target_jun' => 100,
    'target_jul' => 100,
    'target_agu' => 100,
    'target_sep' => 100,
    'target_okt' => 100,
    'target_nov' => 100,
    'target_des' => 100,
]);
echo json_encode($t->fresh(), JSON_PRETTY_PRINT);
