<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('pengadaans', function (Blueprint $table) {
            $table->id();
            $table->string('status'); // e.g. Proses, Terkontrak (Tanda Tangan), Batal
            $table->string('direksi_pekerjaan'); // e.g. JARINGAN, KONSTRUKSI, TE LISTRIK, PEMASARAN
            $table->text('uraian_pekerjaan');
            $table->string('no_pr')->nullable();
            $table->string('pt_pelaksana')->nullable();
            $table->string('no_kontrak')->nullable();
            $table->date('tgl_awal')->nullable();
            $table->date('tgl_akhir')->nullable();
            $table->decimal('rp_kontrak', 17, 2)->nullable();
            $table->decimal('rab', 17, 2)->nullable();
            $table->string('no_nd_bidang')->nullable();
            $table->string('skko_skki')->nullable(); // e.g. SKKO, SKKI
            $table->string('jenis_kontrak')->nullable(); // e.g. SPBJ, SPBL, SPK
            $table->string('klasifikasi')->nullable(); // e.g. A0, B1, B2, B3
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('pengadaans');
    }
};
