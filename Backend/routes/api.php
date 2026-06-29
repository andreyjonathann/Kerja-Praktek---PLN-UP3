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
    // Gangguan Switching & Trafo
    Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
        Route::get('/gangguan-switching', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexSwitching']);
        Route::post('/gangguan-switching', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeSwitching']);
        Route::put('/gangguan-switching/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateSwitching']);
        
        Route::get('/gangguan-trafo', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexTrafo']);
        Route::post('/gangguan-trafo', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeTrafo']);
        Route::put('/gangguan-trafo/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateTrafo']);

        Route::get('/gangguan-switching/targets', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexTargets']);
        Route::post('/gangguan-switching/targets', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeTargets']);

        Route::get('/gangguan-switching/dashboard', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'dashboard']);

        Route::get('/rpt-gangguan', [\App\Http\Controllers\Api\RptGangguanController::class, 'index']);
        Route::post('/rpt-gangguan', [\App\Http\Controllers\Api\RptGangguanController::class, 'store']);
        Route::put('/rpt-gangguan/{id}', [\App\Http\Controllers\Api\RptGangguanController::class, 'update']);
        Route::get('/rpt-gangguan/dashboard', [\App\Http\Controllers\Api\RptGangguanController::class, 'dashboard']);
        
        Route::get('/rpt-gangguan/targets', [\App\Http\Controllers\Api\RptGangguanController::class, 'indexTargets']);
        Route::post('/rpt-gangguan/targets', [\App\Http\Controllers\Api\RptGangguanController::class, 'storeTargets']);

        // SRDAG
        Route::get('/srdag', [\App\Http\Controllers\Api\SrdagController::class, 'index']);
        Route::post('/srdag', [\App\Http\Controllers\Api\SrdagController::class, 'store']);
        Route::put('/srdag/{id}', [\App\Http\Controllers\Api\SrdagController::class, 'update']);
        Route::get('/srdag/dashboard', [\App\Http\Controllers\Api\SrdagController::class, 'dashboard']);
        
        Route::get('/srdag/targets', [\App\Http\Controllers\Api\SrdagController::class, 'indexTargets']);
        Route::post('/srdag/targets', [\App\Http\Controllers\Api\SrdagController::class, 'storeTargets']);

        // MVOD
        Route::get('/mvod', [\App\Http\Controllers\Api\MvodController::class, 'index']);
        Route::post('/mvod', [\App\Http\Controllers\Api\MvodController::class, 'store']);
        Route::put('/mvod/{id}', [\App\Http\Controllers\Api\MvodController::class, 'update']);
        Route::get('/mvod/dashboard', [\App\Http\Controllers\Api\MvodController::class, 'dashboard']);
        
        Route::get('/mvod/targets', [\App\Http\Controllers\Api\MvodController::class, 'targets']);
        Route::post('/mvod/targets', [\App\Http\Controllers\Api\MvodController::class, 'storeTargets']);

        // MTTR Siaga 1
        Route::get('/mttr', [\App\Http\Controllers\Api\MttrController::class, 'index']);
        Route::post('/mttr', [\App\Http\Controllers\Api\MttrController::class, 'store']);
        Route::put('/mttr/{id}', [\App\Http\Controllers\Api\MttrController::class, 'update']);
        Route::get('/mttr/dashboard', [\App\Http\Controllers\Api\MttrController::class, 'dashboard']);
        
        Route::get('/mttr/targets', [\App\Http\Controllers\Api\MttrController::class, 'targets']);
        Route::post('/mttr/targets', [\App\Http\Controllers\Api\MttrController::class, 'storeTargets']);
    });
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
    Route::delete('/kinerja/{bidang}', [KinerjaController::class, 'destroy']);
});
