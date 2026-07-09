<?php
require 'vendor/autoload.php';
require 'bootstrap/app.php';
$app = app();
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$data = App\Models\TargetTahunan::where('indikator', 'like', '%Switching%')->get();
echo json_encode($data, JSON_PRETTY_PRINT);
