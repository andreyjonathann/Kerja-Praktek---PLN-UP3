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
        Schema::create('gangguan_switching', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->integer('jumlah_gangguan')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan']);
        });

        Schema::create('gangguan_trafo', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->integer('jumlah_gangguan')->default(0);
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan']);
        });

        Schema::create('gangguan_switching_targets', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->integer('target_switching_tahunan')->default(0);
            $table->integer('target_trafo_tahunan')->default(0);
            $table->timestamps();

            $table->unique(['up3', 'tahun']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gangguan_switching_targets');
        Schema::dropIfExists('gangguan_trafo');
        Schema::dropIfExists('gangguan_switching');
    }
};
