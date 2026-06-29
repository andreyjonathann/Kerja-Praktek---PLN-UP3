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
            $table->decimal('saidi_distribusi_padam_tidak_terencana', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saidi_distribusi_padam_terencana', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saidi_distribusi_bencana_alam', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saidi_transmisi', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saidi_pembangkit', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saidi_total', 10, 4)->nullable()->default(null)->change();

            $table->decimal('saifi_distribusi_padam_tidak_terencana', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saifi_distribusi_padam_terencana', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saifi_distribusi_bencana_alam', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saifi_transmisi', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saifi_pembangkit', 10, 4)->nullable()->default(null)->change();
            $table->decimal('saifi_total', 10, 4)->nullable()->default(null)->change();
            
            $table->decimal('caidi', 10, 4)->nullable()->default(null)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            $table->decimal('saidi_distribusi_padam_tidak_terencana', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saidi_distribusi_padam_terencana', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saidi_distribusi_bencana_alam', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saidi_transmisi', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saidi_pembangkit', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saidi_total', 10, 4)->nullable(false)->default(0)->change();

            $table->decimal('saifi_distribusi_padam_tidak_terencana', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saifi_distribusi_padam_terencana', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saifi_distribusi_bencana_alam', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saifi_transmisi', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saifi_pembangkit', 10, 4)->nullable(false)->default(0)->change();
            $table->decimal('saifi_total', 10, 4)->nullable(false)->default(0)->change();
            
            $table->decimal('caidi', 10, 4)->nullable(false)->default(0)->change();
        });
    }
};
