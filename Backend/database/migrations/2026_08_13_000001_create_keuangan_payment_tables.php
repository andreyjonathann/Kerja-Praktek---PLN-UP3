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
        Schema::create('realisasi_pembayarans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengadaan_id')->constrained('pengadaans')->onDelete('cascade');
            $table->string('jenis'); // e.g. termin, bastp_bertahap
            $table->integer('termin_ke')->default(1);
            $table->decimal('nilai_realisasi', 17, 2);
            $table->date('tanggal_bayar')->nullable();
            $table->string('bulan_rencana_bayar')->nullable();
            $table->text('keterangan_kendala')->nullable();
            $table->string('status')->default('rencana'); // e.g. rencana, lunas, sebagian, tertunda
            $table->foreignId('input_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });

        Schema::create('dokumen_pendukungs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('pengadaan_id')->constrained('pengadaans')->onDelete('cascade');
            $table->string('jenis'); // e.g. bastp, amd
            $table->integer('urutan_ke')->default(1);
            $table->string('nomor_dokumen');
            $table->date('tanggal_dokumen');
            $table->string('file_path')->nullable();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->onDelete('set null');
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
        Schema::dropIfExists('dokumen_pendukungs');
        Schema::dropIfExists('realisasi_pembayarans');
    }
};
