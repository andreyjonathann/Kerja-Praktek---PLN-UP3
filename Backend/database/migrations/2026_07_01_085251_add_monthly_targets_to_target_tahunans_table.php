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
        Schema::table('target_tahunan', function (Blueprint $table) {
            $table->decimal('target_jan', 10, 4)->nullable()->after('target');
            $table->decimal('target_feb', 10, 4)->nullable()->after('target_jan');
            $table->decimal('target_mar', 10, 4)->nullable()->after('target_feb');
            $table->decimal('target_apr', 10, 4)->nullable()->after('target_mar');
            $table->decimal('target_mei', 10, 4)->nullable()->after('target_apr');
            $table->decimal('target_jun', 10, 4)->nullable()->after('target_mei');
            $table->decimal('target_jul', 10, 4)->nullable()->after('target_jun');
            $table->decimal('target_agu', 10, 4)->nullable()->after('target_jul');
            $table->decimal('target_sep', 10, 4)->nullable()->after('target_agu');
            $table->decimal('target_okt', 10, 4)->nullable()->after('target_sep');
            $table->decimal('target_nov', 10, 4)->nullable()->after('target_okt');
            $table->decimal('target_des', 10, 4)->nullable()->after('target_nov');
            
            // Add unique constraint for (bidang, indikator, tahun)
            $table->unique(['bidang', 'indikator', 'tahun'], 'target_tahunan_unique_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('target_tahunan', function (Blueprint $table) {
            $table->dropUnique('target_tahunan_unique_idx');
            
            $table->dropColumn([
                'target_jan', 'target_feb', 'target_mar', 'target_apr', 
                'target_mei', 'target_jun', 'target_jul', 'target_agu', 
                'target_sep', 'target_okt', 'target_nov', 'target_des'
            ]);
        });
    }
};
