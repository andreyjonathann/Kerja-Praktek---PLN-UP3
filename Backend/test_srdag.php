<?php
DB::beginTransaction();
try {
    \App\Models\SrdagTarget::create(['up3' => 'Kebon Jeruk', 'tahun' => 2026, 'target_rate' => 0.95]);
    \App\Models\SrdagRealisasi::create(['up3' => 'Kebon Jeruk', 'tahun' => 2026, 'bulan' => 1, 'jumlah_dispatch_berhasil' => 10, 'jumlah_total_gangguan' => 12, 'success_rate' => 0.8333]);
    \App\Models\SrdagRealisasi::create(['up3' => 'Kebon Jeruk', 'tahun' => 2026, 'bulan' => 2, 'jumlah_dispatch_berhasil' => 15, 'jumlah_total_gangguan' => 15, 'success_rate' => 1.0]);

    $request = new \Illuminate\Http\Request(['tahun' => 2026, 'up3' => 'Kebon Jeruk']);
    $controller = new \App\Http\Controllers\Api\SrdagController();
    $response = $controller->dashboard($request);
    
    echo json_encode($response->getData(true)['data']['trend_bulanan'], JSON_PRETTY_PRINT);
} finally {
    DB::rollBack();
}
