<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('srdag_realisasis', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->smallInteger('bulan');
            $table->integer('jumlah_dispatch_berhasil');
            $table->integer('jumlah_total_gangguan');
            $table->decimal('success_rate', 8, 6);
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('srdag_realisasis');
    }
};
