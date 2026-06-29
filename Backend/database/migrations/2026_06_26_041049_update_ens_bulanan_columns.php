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
        Schema::table('ens_bulanan', function (Blueprint $table) {
            $table->dropColumn(['terencana', 'tidak_terencana', 'bencana_alam']);
            $table->float('distribusi_padam_tidak_terencana')->default(0)->nullable();
            $table->float('distribusi_padam_terencana')->default(0)->nullable();
            $table->float('distribusi_bencana_alam')->default(0)->nullable();
            $table->float('transmisi')->default(0)->nullable();
            $table->float('pembangkit')->default(0)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ens_bulanan', function (Blueprint $table) {
            $table->dropColumn([
                'distribusi_padam_tidak_terencana',
                'distribusi_padam_terencana',
                'distribusi_bencana_alam',
                'transmisi',
                'pembangkit'
            ]);
            $table->float('terencana')->default(0)->nullable();
            $table->float('tidak_terencana')->default(0)->nullable();
            $table->float('bencana_alam')->default(0)->nullable();
        });
    }
};

