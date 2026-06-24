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
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            $table->integer('ggn_tm_lebih_5_mnt')->nullable()->after('persen_rating_negatif');
            $table->integer('ggn_tm_kurang_5_mnt')->nullable()->after('ggn_tm_lebih_5_mnt');
            $table->integer('ggn_switching')->nullable()->after('ggn_tm_kurang_5_mnt');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            $table->dropColumn(['ggn_tm_lebih_5_mnt', 'ggn_tm_kurang_5_mnt', 'ggn_switching']);
        });
    }
};
