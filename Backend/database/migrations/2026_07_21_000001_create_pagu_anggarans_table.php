<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pagu_anggarans', function (Blueprint $table) {
            $table->id();
            $table->integer('tahun');
            $table->string('skko_skki'); // 'SKKO' or 'SKKI'
            $table->string('klasifikasi'); // 'A0', 'B1', 'B2', 'B3'
            $table->string('jenis_transaksi')->default('penambahan'); // 'awal' or 'penambahan'
            $table->decimal('nominal', 15, 2);
            $table->string('keterangan')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagu_anggarans');
    }
};
