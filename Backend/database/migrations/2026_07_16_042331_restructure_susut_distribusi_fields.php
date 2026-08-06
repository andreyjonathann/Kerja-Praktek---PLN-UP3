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
        Schema::table('realisasi_susut_distribusis', function (Blueprint $table) {
            $table->dropColumn(['kwh_netto', 'pssd', 'kwh_jual_309']);
            $table->decimal('kwh_siap_jual', 15, 2)->after('bulan');
            $table->decimal('kwh_jual', 15, 2)->after('kwh_siap_jual');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('realisasi_susut_distribusis', function (Blueprint $table) {
            $table->dropColumn(['kwh_siap_jual', 'kwh_jual']);
            $table->decimal('kwh_netto', 15, 2)->after('bulan');
            $table->decimal('pssd', 15, 2)->after('kwh_netto');
            $table->decimal('kwh_jual_309', 15, 2)->after('pssd');
        });
    }
};
