<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periode', function (Blueprint $table) {
            $table->id();
            $table->integer('bulan')->nullable();
            $table->integer('tahun')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('target_tahunan', function (Blueprint $table) {
            $table->id();
            $table->string('bidang')->nullable();
            $table->string('indikator')->nullable();
            $table->string('satuan')->nullable();
            $table->string('polaritas')->default('MAXIMIZE'); // MAXIMIZE / MINIMIZE
            $table->decimal('bobot', 5, 2)->nullable();
            $table->decimal('target', 15, 4)->nullable();
            $table->integer('tahun')->nullable();
            $table->timestamps();
        });

        Schema::create('kinerja_jaringan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->nullable()->constrained('periode')->onDelete('cascade');
            
            // SAIDI
            $table->decimal('saidi_har', 10, 4)->default(0);
            $table->decimal('saidi_penyulang', 10, 4)->default(0);
            $table->decimal('saidi_gardu', 10, 4)->default(0);
            $table->decimal('saidi_jtr', 10, 4)->default(0);
            $table->decimal('saidi_sr_app', 10, 4)->default(0);
            $table->decimal('saidi_bencana_alam', 10, 4)->default(0);
            $table->decimal('saidi_sistem_transmisi', 10, 4)->default(0);
            $table->decimal('saidi_total', 10, 4)->default(0);
            
            // SAIFI
            $table->decimal('saifi_har', 10, 4)->default(0);
            $table->decimal('saifi_penyulang', 10, 4)->default(0);
            $table->decimal('saifi_gardu', 10, 4)->default(0);
            $table->decimal('saifi_jtr', 10, 4)->default(0);
            $table->decimal('saifi_sr_app', 10, 4)->default(0);
            $table->decimal('saifi_bencana_alam', 10, 4)->default(0);
            $table->decimal('saifi_sistem_transmisi', 10, 4)->default(0);
            $table->decimal('saifi_total', 10, 4)->default(0);

            // CAIDI
            $table->decimal('caidi', 10, 4)->default(0);

            // Score KPI Jaringan
            $table->decimal('nko_score', 8, 2)->default(0);
            $table->timestamps();
        });

        // Other divisions using JSON for flexibility if indicators change, plus nko_score
        $other_divisions = ['kinerja_aset', 'kinerja_transaksi_energi', 'kinerja_niaga', 'kinerja_pemasaran', 'kinerja_keuangan'];
        foreach ($other_divisions as $table_name) {
            Schema::create($table_name, function (Blueprint $table) {
                $table->id();
                $table->foreignId('periode_id')->nullable()->constrained('periode')->onDelete('cascade');
                $table->json('data_realisasi')->nullable();
                $table->decimal('nko_score', 8, 2)->default(0);
                $table->timestamps();
            });
        }

        Schema::create('rekap_nko', function (Blueprint $table) {
            $table->id();
            $table->foreignId('periode_id')->nullable()->constrained('periode')->onDelete('cascade');
            $table->decimal('score_aset', 8, 2)->default(0);
            $table->decimal('score_jaringan', 8, 2)->default(0);
            $table->decimal('score_transaksi_energi', 8, 2)->default(0);
            $table->decimal('score_niaga', 8, 2)->default(0);
            $table->decimal('score_pemasaran', 8, 2)->default(0);
            $table->decimal('score_keuangan', 8, 2)->default(0);
            $table->decimal('total_nko', 8, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // 
    }
};
