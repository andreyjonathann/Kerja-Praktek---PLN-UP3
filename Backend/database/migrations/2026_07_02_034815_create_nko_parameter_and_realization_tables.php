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
        Schema::create('nko_parameters', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parent_id')->nullable()->constrained('nko_parameters')->onDelete('set null');
            $table->string('nama');
            $table->enum('polaritas', ['MAXIMIZE', 'MINIMIZE', 'RANGE'])->default('MAXIMIZE');
            $table->string('satuan')->nullable();
            $table->decimal('bobot', 5, 2)->default(0.00);
            $table->integer('urutan')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('nko_realizations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parameter_id')->constrained('nko_parameters')->onDelete('cascade');
            $table->integer('tahun');
            $table->integer('bulan');
            $table->decimal('target_tahunan', 15, 4)->nullable();
            $table->decimal('target_bulanan', 15, 4)->nullable();
            $table->decimal('realisasi', 15, 4)->nullable();
            $table->decimal('pencapaian', 8, 2)->nullable();
            $table->decimal('nilai', 8, 2)->nullable();
            $table->string('keterangan')->nullable();
            $table->foreignId('pic_id')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
            $table->softDeletes();

            // Unique index for the active combination of parameter and period
            $table->unique(['parameter_id', 'tahun', 'bulan'], 'nko_realizations_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nko_realizations');
        Schema::dropIfExists('nko_parameters');
    }
};
