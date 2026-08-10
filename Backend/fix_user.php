<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
$u = App\Models\User::where('username', 'pic_jaringan')->first();
if ($u) {
    $u->up3 = 'UP3 Kebon Jeruk';
    $u->save();
    echo "OK - UP3 Kebon Jeruk set for pic_jaringan\n";
} else {
    echo "User not found\n";
}
