<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Add jenis_aset column to mttr_realisasis
        Schema::table('mttr_realisasis', function (Blueprint $table) {
            $table->string('jenis_aset', 10)->default('ALL')->after('bulan');
        });

        // 2. Drop old unique constraint and create new one including jenis_aset
        Schema::table('mttr_realisasis', function (Blueprint $table) {
            $table->dropUnique(['up3', 'tahun', 'bulan']);
            $table->unique(['up3', 'tahun', 'bulan', 'jenis_aset']);
        });
    }

    public function down(): void
    {
        Schema::table('mttr_realisasis', function (Blueprint $table) {
            $table->dropUnique(['up3', 'tahun', 'bulan', 'jenis_aset']);
            $table->unique(['up3', 'tahun', 'bulan']);
            $table->dropColumn('jenis_aset');
        });
    }
};
