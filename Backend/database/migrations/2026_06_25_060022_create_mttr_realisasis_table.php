<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mttr_realisasis', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->integer('jumlah_siaga1_terpenuhi');
            $table->integer('jumlah_siaga1_total');
            $table->decimal('persen_realisasi', 8, 4);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mttr_realisasis');
    }
};
