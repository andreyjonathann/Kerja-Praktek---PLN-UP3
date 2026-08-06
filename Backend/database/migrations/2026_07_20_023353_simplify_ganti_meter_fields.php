<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->integer('jumlah_unit')->after('bulan')->default(0);
        });

        // Migrate data
        DB::statement('UPDATE realisasi_ganti_meters SET jumlah_unit = COALESCE(jumlah_app, 0) + COALESCE(jumlah_yantek, 0)');

        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->dropColumn(['jumlah_app', 'jumlah_yantek', 'total']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->integer('jumlah_app')->nullable();
            $table->integer('jumlah_yantek')->nullable();
            $table->integer('total')->nullable();
        });

        // Try to recover data by putting everything into APP (lossy)
        DB::statement('UPDATE realisasi_ganti_meters SET jumlah_app = jumlah_unit, jumlah_yantek = 0, total = jumlah_unit');

        Schema::table('realisasi_ganti_meters', function (Blueprint $table) {
            $table->dropColumn('jumlah_unit');
        });
    }
};
