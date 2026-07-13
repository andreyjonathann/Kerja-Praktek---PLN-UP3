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
        Schema::create('realisasi_susut_distribusis', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->integer('tahun');
            $table->integer('bulan'); // 1-12
            $table->decimal('kwh_netto', 15, 2);
            $table->decimal('pssd', 15, 2);
            $table->decimal('kwh_jual_309', 15, 2);
            $table->decimal('realisasi_persen', 8, 4); // WAJIB dihitung di controller, bukan dari input user
            $table->text('keterangan')->nullable();
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
        Schema::dropIfExists('realisasi_susut_distribusis');
    }
};
