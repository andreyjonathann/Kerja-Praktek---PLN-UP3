<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$sw = DB::table('gangguan_switching')->where('up3', 'UP3 Lain')->get();
$sr = DB::table('srdag_realisasis')->where('up3', 'UP3 Lain')->get();

echo json_encode([
    'gangguan_switching' => [
        'total' => $sw->count(),
        'rows'  => $sw,
    ],
    'srdag_realisasis' => [
        'total' => $sr->count(),
        'rows'  => $sr,
    ],
], JSON_PRETTY_PRINT);
