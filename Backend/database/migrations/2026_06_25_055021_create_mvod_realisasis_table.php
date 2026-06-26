<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mvod_realisasis', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->string('tipe_rct'); // 'GI', 'JTM', 'GD'
            $table->decimal('total_lama_padam_jam', 10, 4);
            $table->integer('kali_padam');
            $table->decimal('total_lama_padam_menit', 10, 4);
            $table->decimal('rata_rct_menit', 10, 4);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan', 'tipe_rct']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mvod_realisasis');
    }
};
