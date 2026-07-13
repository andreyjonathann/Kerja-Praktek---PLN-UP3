<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';

// Bootstrap the console kernel instead of HTTP to load eloquent
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$user = \App\Models\User::where('role', 'pic_jaringan')->first();
if ($user) {
    auth()->login($user);
}

// Now handle the request with HTTP kernel
$httpKernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$response = $httpKernel->handle(
    Illuminate\Http\Request::create('/api/v1/mttr/dashboard', 'GET', ['tahun' => 2026])
);

$data = json_decode($response->getContent(), true);

if (!isset($data['data']['per_bulan'])) {
    echo json_encode($data, JSON_PRETTY_PRINT);
    exit;
}

$per_bulan = $data['data']['per_bulan'];
$sample = null;
foreach ($per_bulan as $b) {
    if ($b['realisasi_bulan_ini'] !== null) {
        $sample = $b;
        break;
    }
}
if (!$sample) {
    $sample = $per_bulan[0];
}

echo "RAW JSON Sample untuk 1 bulan:\n";
echo json_encode($sample, JSON_PRETTY_PRINT);
