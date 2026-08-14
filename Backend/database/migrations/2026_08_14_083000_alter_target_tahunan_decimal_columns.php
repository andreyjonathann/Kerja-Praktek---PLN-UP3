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
            $table->decimal('target', 24, 4)->nullable()->change();
            $table->decimal('target_jan', 24, 4)->nullable()->change();
            $table->decimal('target_feb', 24, 4)->nullable()->change();
            $table->decimal('target_mar', 24, 4)->nullable()->change();
            $table->decimal('target_apr', 24, 4)->nullable()->change();
            $table->decimal('target_mei', 24, 4)->nullable()->change();
            $table->decimal('target_jun', 24, 4)->nullable()->change();
            $table->decimal('target_jul', 24, 4)->nullable()->change();
            $table->decimal('target_agu', 24, 4)->nullable()->change();
            $table->decimal('target_sep', 24, 4)->nullable()->change();
            $table->decimal('target_okt', 24, 4)->nullable()->change();
            $table->decimal('target_nov', 24, 4)->nullable()->change();
            $table->decimal('target_des', 24, 4)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('target_tahunan', function (Blueprint $table) {
            $table->decimal('target', 15, 4)->nullable()->change();
            $table->decimal('target_jan', 10, 4)->nullable()->change();
            $table->decimal('target_feb', 10, 4)->nullable()->change();
            $table->decimal('target_mar', 10, 4)->nullable()->change();
            $table->decimal('target_apr', 10, 4)->nullable()->change();
            $table->decimal('target_mei', 10, 4)->nullable()->change();
            $table->decimal('target_jun', 10, 4)->nullable()->change();
            $table->decimal('target_jul', 10, 4)->nullable()->change();
            $table->decimal('target_agu', 10, 4)->nullable()->change();
            $table->decimal('target_sep', 10, 4)->nullable()->change();
            $table->decimal('target_okt', 10, 4)->nullable()->change();
            $table->decimal('target_nov', 10, 4)->nullable()->change();
            $table->decimal('target_des', 10, 4)->nullable()->change();
        });
    }
};
