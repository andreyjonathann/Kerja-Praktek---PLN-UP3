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
        Schema::create('gangguan_switching_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('gangguan_switching_id')->constrained('gangguan_switching')->onDelete('cascade');
            $table->string('merek')->nullable();
            $table->string('tahun_alat')->nullable();
            $table->string('nomor_seri')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gangguan_switching_details');
    }
};
