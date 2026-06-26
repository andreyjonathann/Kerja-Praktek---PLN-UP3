<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('srdag_targets', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->smallInteger('tahun');
            $table->decimal('target_rate', 8, 6);
            $table->timestamps();

            $table->unique(['up3', 'tahun']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('srdag_targets');
    }
};
