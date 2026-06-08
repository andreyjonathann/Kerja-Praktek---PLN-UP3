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
        Schema::create('kpi_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_indicator_id')->constrained('kpi_indicators')->onDelete('cascade');
            $table->integer('year');
            $table->integer('month')->nullable(); // 1-12, NULL for yearly target
            $table->decimal('target_value', 18, 4);
            $table->timestamps();
        });

        // Unique constraints to prevent duplicate targets
        DB::statement('CREATE UNIQUE INDEX kpi_targets_yearly_unique ON kpi_targets (kpi_indicator_id, year) WHERE month IS NULL');
        DB::statement('CREATE UNIQUE INDEX kpi_targets_monthly_unique ON kpi_targets (kpi_indicator_id, year, month) WHERE month IS NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kpi_targets');
    }
};
