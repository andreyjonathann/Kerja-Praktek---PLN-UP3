<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;

// Auth Routes
Route::post('/auth/login', [DashboardController::class, 'login']);

// Protected Dashboard API Group
Route::middleware([])->group(function () {
    Route::get('/dashboard/overview', [DashboardController::class, 'overview']);
    Route::get('/dashboard/saidi', [DashboardController::class, 'saidi']);
    Route::get('/dashboard/saifi', [DashboardController::class, 'saifi']);
    Route::get('/dashboard/gangguan', [DashboardController::class, 'gangguan']);
    
    // Spreadsheet Upload
    Route::post('/spreadsheet/upload', [DashboardController::class, 'uploadSpreadsheet']);
});
