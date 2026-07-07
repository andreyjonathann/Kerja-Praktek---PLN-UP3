<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::where('role', 'pic_jaringan')->first();
if ($user) {
    auth()->login($user);
}

$response = $kernel->handle(
    $request = Illuminate\Http\Request::create('/api/v1/mttr/dashboard', 'GET', [
        'tahun' => 2026
    ])
);

echo $response->getContent();
