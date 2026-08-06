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
        Schema::create('realisasi_ganti_meters', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->integer('tahun');
            $table->integer('bulan');
            $table->integer('jumlah_app')->default(0);
            $table->integer('jumlah_yantek')->default(0);
            $table->integer('total'); // Dihitung di backend: jumlah_app + jumlah_yantek
            $table->text('keterangan')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();

            // Mencegah duplikasi data per UP3 per bulan per tahun
            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('realisasi_ganti_meters');
    }
};
