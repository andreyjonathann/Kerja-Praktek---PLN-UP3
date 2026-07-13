<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$t = \App\Models\TargetTahunan::where('indikator', 'like', '%SAIFI%')->where('tahun', 2026)->first();
echo json_encode($t);
