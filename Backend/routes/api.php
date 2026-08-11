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

use App\Http\Controllers\NotificationController;

Route::middleware(['auth:sanctum', 'block_perencanaan'])->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Custom NKO Parameters CRUD
    Route::get('/nko-parameters', [\App\Http\Controllers\Api\NkoParameterController::class, 'index']);
    Route::post('/nko-parameters', [\App\Http\Controllers\Api\NkoParameterController::class, 'store']);
    Route::put('/nko-parameters/{id}', [\App\Http\Controllers\Api\NkoParameterController::class, 'update']);
    Route::delete('/nko-parameters/{id}', [\App\Http\Controllers\Api\NkoParameterController::class, 'destroy']);

    // Custom NKO Realizations CRUD
    Route::get('/nko-realizations', [\App\Http\Controllers\Api\NkoRealizationController::class, 'index']);
    Route::post('/nko-realizations', [\App\Http\Controllers\Api\NkoRealizationController::class, 'store']);
    Route::delete('/nko-realizations/{id}', [\App\Http\Controllers\Api\NkoRealizationController::class, 'destroy']);

    // Kinerja endpoints
    Route::get('/kinerja/{bidang}', [KinerjaController::class, 'index']);
    Route::post('/kinerja/{bidang}', [KinerjaController::class, 'store']);
    Route::delete('/kinerja/{bidang}', [KinerjaController::class, 'destroy']);
});


Route::middleware('api')->group(function () {
    // Gangguan Switching & Trafo
    Route::prefix('v1')->middleware(['auth:sanctum', 'block_perencanaan'])->group(function () {
        Route::get('/gangguan-switching', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexSwitching']);
        Route::post('/gangguan-switching', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeSwitching']);
        Route::put('/gangguan-switching/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateSwitching']);
        
        Route::get('/gangguan-trafo', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexTrafo']);
        Route::post('/gangguan-trafo', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeTrafo']);
        Route::put('/gangguan-trafo/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateTrafo']);

        Route::delete('/gangguan-switching/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'destroySwitching']);
        Route::delete('/gangguan-trafo/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'destroyTrafo']);

        Route::get('/gangguan-switching-trafo', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexGabungan']);
        Route::post('/gangguan-switching/detail', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeKejadianSwitching']);
        Route::put('/gangguan-switching/detail/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateKejadianSwitching']);
        Route::delete('/gangguan-switching/detail/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'destroyKejadianSwitching']);
        Route::post('/gangguan-trafo/detail', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeKejadianTrafo']);
        Route::put('/gangguan-trafo/detail/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'updateKejadianTrafo']);
        Route::delete('/gangguan-trafo/detail/{id}', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'destroyKejadianTrafo']);


        Route::get('/gangguan-switching/targets', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'indexTargets']);
        Route::post('/gangguan-switching/targets', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'storeTargets']);

        Route::get('/gangguan-switching/dashboard', [\App\Http\Controllers\Api\GangguanSwitchingController::class, 'dashboard']);

        Route::get('/rpt-gangguan', [\App\Http\Controllers\Api\RptGangguanController::class, 'index']);
        Route::post('/rpt-gangguan', [\App\Http\Controllers\Api\RptGangguanController::class, 'store']);
        Route::put('/rpt-gangguan/{id}', [\App\Http\Controllers\Api\RptGangguanController::class, 'update']);
        Route::delete('/rpt-gangguan/{id}', [\App\Http\Controllers\Api\RptGangguanController::class, 'destroy']);
        Route::get('/rpt-gangguan/dashboard', [\App\Http\Controllers\Api\RptGangguanController::class, 'dashboard']);
        
        Route::get('/rpt-gangguan/targets', [\App\Http\Controllers\Api\RptGangguanController::class, 'indexTargets']);
        Route::post('/rpt-gangguan/targets', [\App\Http\Controllers\Api\RptGangguanController::class, 'storeTargets']);

        // SRDAG
        Route::get('/srdag', [\App\Http\Controllers\Api\SrdagController::class, 'index']);
        Route::post('/srdag', [\App\Http\Controllers\Api\SrdagController::class, 'store']);
        Route::put('/srdag/{id}', [\App\Http\Controllers\Api\SrdagController::class, 'update']);
        Route::delete('/srdag/{id}', [\App\Http\Controllers\Api\SrdagController::class, 'destroy']);
        Route::get('/srdag/dashboard', [\App\Http\Controllers\Api\SrdagController::class, 'dashboard']);
        
        Route::get('/srdag/targets', [\App\Http\Controllers\Api\SrdagController::class, 'indexTargets']);
        Route::post('/srdag/targets', [\App\Http\Controllers\Api\SrdagController::class, 'storeTargets']);

        // MVOD
        Route::get('/mvod', [\App\Http\Controllers\Api\MvodController::class, 'index']);
        Route::post('/mvod', [\App\Http\Controllers\Api\MvodController::class, 'store']);
        Route::put('/mvod/{id}', [\App\Http\Controllers\Api\MvodController::class, 'update']);
        Route::delete('/mvod/{id}', [\App\Http\Controllers\Api\MvodController::class, 'destroy']);
        Route::get('/mvod/dashboard', [\App\Http\Controllers\Api\MvodController::class, 'dashboard']);
        
        Route::get('/mvod/targets', [\App\Http\Controllers\Api\MvodController::class, 'targets']);
        Route::post('/mvod/targets', [\App\Http\Controllers\Api\MvodController::class, 'storeTargets']);

        // MTTR Siaga 1
        Route::get('/mttr', [\App\Http\Controllers\Api\MttrController::class, 'index']);
        Route::post('/mttr', [\App\Http\Controllers\Api\MttrController::class, 'store']);
        Route::put('/mttr/{id}', [\App\Http\Controllers\Api\MttrController::class, 'update']);
        Route::delete('/mttr/{id}', [\App\Http\Controllers\Api\MttrController::class, 'destroy']);
        Route::get('/mttr/dashboard', [\App\Http\Controllers\Api\MttrController::class, 'dashboard']);
        
        Route::get('/mttr/targets', [\App\Http\Controllers\Api\MttrController::class, 'targets']);
        Route::post('/mttr/targets', [\App\Http\Controllers\Api\MttrController::class, 'storeTargets']);

        // Transaksi Energi - P2TL
        Route::get('/p2tl', [\App\Http\Controllers\Api\RealisasiP2tlController::class, 'index']);
        Route::get('/p2tl/dashboard', [\App\Http\Controllers\Api\RealisasiP2tlController::class, 'dashboard']);
        Route::post('/p2tl', [\App\Http\Controllers\Api\RealisasiP2tlController::class, 'store']);
        Route::put('/p2tl/{id}', [\App\Http\Controllers\Api\RealisasiP2tlController::class, 'update']);
        Route::delete('/p2tl/{id}', [\App\Http\Controllers\Api\RealisasiP2tlController::class, 'destroy']);

        // Transaksi Energi - Ganti Meter
        Route::get('/ganti-meter', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'index']);
        Route::get('/ganti-meter/dashboard', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'dashboard']);
        Route::post('/ganti-meter', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'store']);
        Route::get('/ganti-meter/dashboard-harian', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'dashboardHarian']);
        Route::put('/ganti-meter/{id}', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'update']);
        Route::delete('/ganti-meter/{id}', [\App\Http\Controllers\Api\RealisasiGantiMeterController::class, 'destroy']);

        // Transaksi Energi - Susut Distribusi
        Route::get('/susut-distribusi', [\App\Http\Controllers\Api\RealisasiSusutDistribusiController::class, 'index']);
        Route::get('/susut-distribusi/dashboard', [\App\Http\Controllers\Api\RealisasiSusutDistribusiController::class, 'dashboard']);
        Route::post('/susut-distribusi', [\App\Http\Controllers\Api\RealisasiSusutDistribusiController::class, 'store']);
        Route::put('/susut-distribusi/{id}', [\App\Http\Controllers\Api\RealisasiSusutDistribusiController::class, 'update']);
        Route::delete('/susut-distribusi/{id}', [\App\Http\Controllers\Api\RealisasiSusutDistribusiController::class, 'destroy']);

        // Pengadaan / Kontrak
        Route::get('/pengadaan/dashboard', [\App\Http\Controllers\Api\PengadaanController::class, 'dashboard']);
        Route::get('/pengadaan', [\App\Http\Controllers\Api\PengadaanController::class, 'index']);
        Route::get('/pengadaan/{id}', [\App\Http\Controllers\Api\PengadaanController::class, 'show']);
        
        // Write operations restricted to pic_pengadaan
        Route::middleware(\App\Http\Middleware\RestrictPengadaanWrites::class)->group(function () {
            Route::post('/pengadaan', [\App\Http\Controllers\Api\PengadaanController::class, 'store']);
            Route::put('/pengadaan/{id}', [\App\Http\Controllers\Api\PengadaanController::class, 'update']);
            Route::patch('/pengadaan/{id}/status', [\App\Http\Controllers\Api\PengadaanController::class, 'updateStatus']);
            Route::delete('/pengadaan/{id}', [\App\Http\Controllers\Api\PengadaanController::class, 'destroy']);
            Route::delete('/pengadaan/{id}/file/{fileIndex}', [\App\Http\Controllers\Api\PengadaanController::class, 'deleteFile']);
            
            Route::post('/pagu-anggaran', [\App\Http\Controllers\Api\PaguAnggaranController::class, 'store']);
            Route::delete('/pagu-anggaran/{id}', [\App\Http\Controllers\Api\PaguAnggaranController::class, 'destroy']);
        });

        // Pagu Anggaran SKKO / SKKI (Read-only for others)
        Route::get('/pagu-anggaran', [\App\Http\Controllers\Api\PaguAnggaranController::class, 'index']);
    });

    // Read-only endpoints (protected by auth:sanctum)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/nko/summary', [NkoController::class, 'summary']);
        
        // K3 Module
        Route::get('/k3/categories', [\App\Http\Controllers\Api\K3Controller::class, 'categories']);
        Route::get('/k3/dashboard', [\App\Http\Controllers\Api\K3Controller::class, 'dashboard']);
        Route::get('/k3/dashboard/trend', [\App\Http\Controllers\Api\K3Controller::class, 'dashboardTrend']);
        
        Route::get('/k3/targets/{tahun}/{semester}', [\App\Http\Controllers\Api\K3Controller::class, 'getTargets']);
        Route::post('/k3/targets', [\App\Http\Controllers\Api\K3Controller::class, 'storeTarget']);
        Route::put('/k3/targets/{id}', [\App\Http\Controllers\Api\K3Controller::class, 'updateTarget']);
        Route::get('/k3/nko-summary/{tahun}/{semester}', [\App\Http\Controllers\Api\K3Controller::class, 'nkoSummary']);
        Route::get('/k3/category-summary/{code}/{tahun}/{semester}', [\App\Http\Controllers\Api\K3Controller::class, 'categorySummary']);
        
        Route::get('/k3/assessments/{tahun}/{semester}', [\App\Http\Controllers\Api\K3Controller::class, 'getAssessments']);
        Route::post('/k3/assessments', [\App\Http\Controllers\Api\K3Controller::class, 'storeAssessment']);
        Route::post('/k3/assessments/bulk', [\App\Http\Controllers\Api\K3Controller::class, 'storeBulkAssessment']);
        
        Route::post('/k3/assessments/bulk/submit', [\App\Http\Controllers\Api\K3Controller::class, 'submitBulkAssessment']);
        Route::post('/k3/assessments/bulk/unsubmit', [\App\Http\Controllers\Api\K3Controller::class, 'unsubmitBulkAssessment']);
        Route::post('/k3/assessments/bulk/approve', [\App\Http\Controllers\Api\K3Controller::class, 'approveBulkAssessment']);
        Route::post('/k3/assessments/bulk/revisi', [\App\Http\Controllers\Api\K3Controller::class, 'revisiBulkAssessment']);
        
        Route::post('/k3/assessments/{id}/submit', [\App\Http\Controllers\Api\K3Controller::class, 'submitAssessment']);
        Route::post('/k3/assessments/{id}/approve', [\App\Http\Controllers\Api\K3Controller::class, 'approveAssessment']);
        Route::post('/k3/assessments/{id}/revisi', [\App\Http\Controllers\Api\K3Controller::class, 'revisiAssessment']);

        // K3 Kegiatan
        Route::get('/k3/activities', [\App\Http\Controllers\Api\K3ActivityController::class, 'index']);
        Route::post('/k3/activities', [\App\Http\Controllers\Api\K3ActivityController::class, 'store']);
        Route::put('/k3/activities/{id}', [\App\Http\Controllers\Api\K3ActivityController::class, 'update']);
        Route::delete('/k3/activities/{id}', [\App\Http\Controllers\Api\K3ActivityController::class, 'destroy']);
        
        // K3 Findings
        Route::get('/k3/findings', [\App\Http\Controllers\Api\K3FindingController::class, 'index']);
        Route::post('/k3/findings', [\App\Http\Controllers\Api\K3FindingController::class, 'store']);
        Route::put('/k3/findings/{id}', [\App\Http\Controllers\Api\K3FindingController::class, 'update']);
        Route::delete('/k3/findings/{id}', [\App\Http\Controllers\Api\K3FindingController::class, 'destroy']);
        Route::patch('/k3/findings/{id}/status', [\App\Http\Controllers\Api\K3FindingController::class, 'changeStatus']);
        Route::post('/k3/findings/{id}/progress', [\App\Http\Controllers\Api\K3FindingController::class, 'addProgress']);
        Route::delete('/k3/findings/{id}/progress/{progressId}/attachment', [\App\Http\Controllers\Api\K3FindingController::class, 'deleteProgressAttachment']);
        Route::post('/k3/findings/{id}/progress/{progressId}/attachment', [\App\Http\Controllers\Api\K3FindingController::class, 'addProgressAttachment']);
        
        // Data Jaringan (Dashboard)
        Route::get('/jaringan/dashboard', [DataJaringanController::class, 'getDashboardData']);
        Route::get('/jaringan/gangguan-list', [DataJaringanController::class, 'getGangguanList']);
        
        // Rating Negatif
        Route::get('/jaringan/rating-negatif', [\App\Http\Controllers\RatingNegatifController::class, 'index']);
        Route::get('/jaringan/rating-negatif/rekap', [\App\Http\Controllers\RatingNegatifController::class, 'rekap']);
        Route::get('/jaringan/rating-negatif/yoy', [\App\Http\Controllers\RatingNegatifController::class, 'yoy']);
        
        // Gangguan TM
        Route::get('/jaringan/gangguan-tm', [\App\Http\Controllers\GangguanTmController::class, 'index']);
        Route::get('/jaringan/gangguan-tm/lebih-5/detail', [\App\Http\Controllers\GangguanTmController::class, 'detailLebih5Mnt']);
        Route::get('/jaringan/gangguan-tm/rekap', [\App\Http\Controllers\GangguanTmController::class, 'rekap']);
        Route::get('/jaringan/gangguan-tm/semua-up3', [\App\Http\Controllers\GangguanTmController::class, 'semuaUp3']);
        
        // Target Tahunan
        Route::get('/targets', [TargetTahunanController::class, 'index']);
        Route::get('/target/{bidang}/{indikator}', [TargetTahunanController::class, 'getMonthlyTarget']);
        Route::get('/kinerja/{bidang}', [KinerjaController::class, 'index']);
    });

    // Write endpoints (protected by auth:sanctum and block_perencanaan)
    Route::middleware(['auth:sanctum', 'block_perencanaan'])->group(function () {
        // Jaringan CRUD
        Route::post('/jaringan/ens', [DataJaringanController::class, 'saveEns']);
        Route::delete('/jaringan/ens', [DataJaringanController::class, 'deleteEns']);
        Route::put('/jaringan/ens/{id}', [DataJaringanController::class, 'updateEns']);
        Route::delete('/jaringan/ens/{id}', [DataJaringanController::class, 'destroyEns']);
        Route::post('/jaringan/gangguan', [DataJaringanController::class, 'saveGangguan']);
        Route::post('/jaringan/gangguan-list', [DataJaringanController::class, 'saveGangguanList']);
        Route::delete('/jaringan/gangguan-list/{id}', [DataJaringanController::class, 'deleteGangguanList']);
        
        // Rating Negatif
        Route::post('/jaringan/rating-negatif', [\App\Http\Controllers\RatingNegatifController::class, 'store']);
        Route::delete('/jaringan/rating-negatif/{id}', [\App\Http\Controllers\RatingNegatifController::class, 'destroy']);
        
        // Gangguan TM
        Route::post('/jaringan/gangguan-tm', [\App\Http\Controllers\GangguanTmController::class, 'store']); // Legacy
        Route::post('/jaringan/gangguan-tm/kurang-5', [\App\Http\Controllers\GangguanTmController::class, 'storeKurang5Mnt']);
        Route::put('/jaringan/gangguan-tm/kurang-5/{id}', [\App\Http\Controllers\GangguanTmController::class, 'updateKurang5Mnt']);
        Route::delete('/jaringan/gangguan-tm/kurang-5/{id}', [\App\Http\Controllers\GangguanTmController::class, 'deleteKurang5Mnt']);
        Route::post('/jaringan/gangguan-tm/lebih-5', [\App\Http\Controllers\GangguanTmController::class, 'storeLebih5Mnt']);
        Route::put('/jaringan/gangguan-tm/lebih-5/{tahun}/{bulan}', [\App\Http\Controllers\GangguanTmController::class, 'updateLebih5Mnt']);
        Route::post('/jaringan/gangguan-tm/detail-lebih5', [\App\Http\Controllers\GangguanTmController::class, 'insertDetailLebih5Mnt']);
        Route::put('/jaringan/gangguan-tm/detail-lebih5/{id}', [\App\Http\Controllers\GangguanTmController::class, 'updateDetailLebih5Mnt']);
        Route::delete('/jaringan/gangguan-tm/detail-lebih5/{id}', [\App\Http\Controllers\GangguanTmController::class, 'deleteDetailLebih5Mnt']);
        
        // Target Tahunan
        Route::post('/targets', [TargetTahunanController::class, 'store']);
        Route::put('/target/{bidang}/{indikator}/{tahun}', [TargetTahunanController::class, 'updateMonthlyTarget']);
        Route::put('/target/reset-auto/{bidang}/{indikator}/{tahun}', [TargetTahunanController::class, 'resetToAuto']);

        Route::get('/target-ganti-meter-harian', [\App\Http\Controllers\Api\TargetGantiMeterHarianController::class, 'index']);
        Route::post('/target-ganti-meter-harian/bulk', [\App\Http\Controllers\Api\TargetGantiMeterHarianController::class, 'storeBulk']);
    });
});

