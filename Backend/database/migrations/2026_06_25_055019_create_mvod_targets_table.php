<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mvod_targets', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->decimal('sla_gi_menit', 8, 2)->default(30);
            $table->decimal('sla_jtm_menit', 8, 2)->default(60);
            $table->decimal('sla_gd_menit', 8, 2)->default(90);
            $table->timestamps();

            $table->unique(['up3', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mvod_targets');
    }
};
