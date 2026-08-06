<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->dropUnique(['up3', 'tahun', 'bulan']);
            $table->date('tanggal')->nullable()->after('up3');
            $table->unique(['up3', 'tanggal']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->dropUnique(['up3', 'tanggal']);
            $table->dropColumn('tanggal');
            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }
};
