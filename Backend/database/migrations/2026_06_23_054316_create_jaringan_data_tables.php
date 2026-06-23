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
        Schema::create('ens_bulanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->onDelete('cascade');
            $table->decimal('terencana', 15, 2)->default(0);
            $table->decimal('tidak_terencana', 15, 2)->default(0);
            $table->decimal('bencana_alam', 15, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('gangguan_bulanan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->constrained('periode')->onDelete('cascade');
            $table->integer('gt_5_menit')->default(0);
            $table->integer('le_5_menit')->default(0);
            $table->integer('berulang')->default(0);
            $table->timestamps();
        });

        Schema::create('gangguan_list', function (Blueprint $table) {
            $table->id();
            $table->integer('tahun');
            $table->integer('bulan');
            $table->string('penyulang')->nullable();
            $table->string('gardu_induk')->nullable();
            $table->date('tanggal')->nullable();
            $table->time('waktu_padam')->nullable();
            $table->time('waktu_nyala')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('kode_gardu')->nullable();
            $table->integer('durasi')->default(0); // menit
            $table->string('penyebab')->nullable();
            $table->text('keterangan')->nullable();
            $table->integer('pelanggan_padam')->default(0);
            $table->decimal('beban_padam', 10, 2)->default(0);
            $table->string('status')->default('Selesai');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gangguan_list');
        Schema::dropIfExists('gangguan_bulanan');
        Schema::dropIfExists('ens_bulanan');
    }
};
