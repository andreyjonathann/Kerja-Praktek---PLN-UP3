<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mttr_targets', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->decimal('target_persen', 8, 4)->default(100.00);
            $table->integer('jumlah_penyulang')->default(0);
            $table->timestamps();

            $table->unique(['up3', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mttr_targets');
    }
};
