<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\KinerjaController;
use App\Http\Controllers\Api\NkoController;
use App\Http\Controllers\Api\TargetTahunanController;
use App\Http\Controllers\Api\DataJaringanController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Wrap in sanctum middleware later when auth is fully setup
use App\Http\Controllers\Api\AuthController;

Route::post('/auth/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
});

Route::middleware('api')->group(function () {
    Route::get('/nko/summary', [NkoController::class, 'summary']);
    
    // Data Jaringan (Dashboard)
    Route::get('/jaringan/dashboard', [DataJaringanController::class, 'getDashboardData']);

    // Jaringan CRUD
    Route::post('/jaringan/ens', [DataJaringanController::class, 'saveEns']);
    Route::post('/jaringan/gangguan', [DataJaringanController::class, 'saveGangguan']);
    Route::post('/jaringan/gangguan-list', [DataJaringanController::class, 'saveGangguanList']);
    Route::get('/jaringan/gangguan-list', [DataJaringanController::class, 'getGangguanList']);
    Route::delete('/jaringan/gangguan-list/{id}', [DataJaringanController::class, 'deleteGangguanList']);
    
    // Rating Negatif
    Route::get('/jaringan/rating-negatif', [\App\Http\Controllers\RatingNegatifController::class, 'index']);
    Route::post('/jaringan/rating-negatif', [\App\Http\Controllers\RatingNegatifController::class, 'store']);
    Route::get('/jaringan/rating-negatif/rekap', [\App\Http\Controllers\RatingNegatifController::class, 'rekap']);
    Route::get('/jaringan/rating-negatif/yoy', [\App\Http\Controllers\RatingNegatifController::class, 'yoy']);
    
    // Gangguan TM
    Route::get('/jaringan/gangguan-tm', [\App\Http\Controllers\GangguanTmController::class, 'index']);
    Route::post('/jaringan/gangguan-tm', [\App\Http\Controllers\GangguanTmController::class, 'store']);
    Route::get('/jaringan/gangguan-tm/rekap', [\App\Http\Controllers\GangguanTmController::class, 'rekap']);
    Route::get('/jaringan/gangguan-tm/semua-up3', [\App\Http\Controllers\GangguanTmController::class, 'semuaUp3']);
    
    // Target Tahunan
    Route::get('/targets', [TargetTahunanController::class, 'index']);
    Route::post('/targets', [TargetTahunanController::class, 'store']);
    
    // Kinerja endpoints
    Route::get('/kinerja/{bidang}', [KinerjaController::class, 'index']);
    Route::post('/kinerja/{bidang}', [KinerjaController::class, 'store']);
});
