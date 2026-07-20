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
        Schema::table('srdag_realisasis', function (Blueprint $table) {
            $table->integer('wo_marking_padam_meluas')->default(0)->after('jumlah_total_gangguan');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('srdag_realisasis', function (Blueprint $table) {
            $table->dropColumn('wo_marking_padam_meluas');
        });
    }
};
