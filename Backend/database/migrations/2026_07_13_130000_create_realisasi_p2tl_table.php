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
        Schema::create('realisasi_p2tl', function (Blueprint $table) {
            $table->id();
            $table->string('up3');
            $table->integer('tahun');
            $table->integer('bulan'); // 1-12
            $table->decimal('realisasi_kwh', 15, 2);
            $table->text('keterangan')->nullable();
            $table->foreignId('created_by')->constrained('users');
            $table->timestamps();
            $table->unique(['up3', 'tahun', 'bulan']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('realisasi_p2tl');
    }
};
