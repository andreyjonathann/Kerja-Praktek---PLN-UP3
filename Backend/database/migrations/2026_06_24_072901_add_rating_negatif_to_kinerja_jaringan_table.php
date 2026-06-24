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
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            $table->integer('jml_rating_negatif')->nullable()->default(0);
            $table->integer('jml_wo_pln_mobile')->nullable()->default(0);
            $table->decimal('persen_rating_negatif', 10, 6)->nullable()->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            $table->dropColumn(['jml_rating_negatif', 'jml_wo_pln_mobile', 'persen_rating_negatif']);
        });
    }
};
