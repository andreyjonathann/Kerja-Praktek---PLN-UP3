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
        Schema::create('detail_gangguan_tm_lebih5_mnts', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->integer('bulan');
            $table->integer('tahun');
            $table->integer('jumlah_gangguan');
            $table->text('penyebab')->nullable();
            $table->string('nama_penyulang')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_gangguan_tm_lebih5_mnts');
    }
};
