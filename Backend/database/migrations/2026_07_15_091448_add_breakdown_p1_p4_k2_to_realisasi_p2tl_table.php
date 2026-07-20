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
        Schema::table('realisasi_p2tl', function (Blueprint $table) {
            $table->integer('jml_plg_p1')->default(0)->after('bulan');
            $table->integer('jml_plg_p2')->default(0)->after('jml_plg_p1');
            $table->decimal('kwh_p2', 15, 2)->default(0)->after('jml_plg_p2');
            $table->integer('jml_plg_p3')->default(0)->after('kwh_p2');
            $table->decimal('kwh_p3', 15, 2)->default(0)->after('jml_plg_p3');
            $table->integer('jml_plg_p4')->default(0)->after('kwh_p3');
            $table->decimal('kwh_p4', 15, 2)->default(0)->after('jml_plg_p4');
            $table->integer('jml_plg_k2')->default(0)->after('kwh_p4');
            $table->decimal('kwh_k2', 15, 2)->default(0)->after('jml_plg_k2');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('realisasi_p2tl', function (Blueprint $table) {
            $table->dropColumn(['jml_plg_p1', 'jml_plg_p2', 'kwh_p2', 'jml_plg_p3', 'kwh_p3', 'jml_plg_p4', 'kwh_p4', 'jml_plg_k2', 'kwh_k2']);
        });
    }
};
