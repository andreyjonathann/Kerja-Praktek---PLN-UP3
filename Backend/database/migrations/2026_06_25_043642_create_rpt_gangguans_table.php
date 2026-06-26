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
        Schema::create('rpt_gangguans', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->decimal('total_durasi_menit', 10, 2);
            $table->integer('jumlah_gangguan');
            $table->decimal('rata_rata_rpt', 10, 4);
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rpt_gangguans');
    }
};
