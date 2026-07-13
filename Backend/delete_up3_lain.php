<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$swDeleted = DB::table('gangguan_switching')->where('up3', 'UP3 Lain')->delete();
$srDeleted = DB::table('srdag_realisasis')->where('up3', 'UP3 Lain')->delete();

echo json_encode([
    'deleted_gangguan_switching' => $swDeleted,
    'deleted_srdag_realisasis' => $srDeleted
], JSON_PRETTY_PRINT);
