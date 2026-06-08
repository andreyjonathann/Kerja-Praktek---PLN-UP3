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
        Schema::create('daily_kpi_inputs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kpi_indicator_id')->constrained('kpi_indicators')->onDelete('cascade');
            $table->date('date');
            $table->decimal('realization_value', 18, 4);
            $table->foreignId('pic_user_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            // Ensure unique input per indicator per day
            $table->unique(['kpi_indicator_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('daily_kpi_inputs');
    }
};
