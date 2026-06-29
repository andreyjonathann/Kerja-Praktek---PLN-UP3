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
            // Drop old columns
            $table->dropColumn([
                'saidi_har', 'saidi_penyulang', 'saidi_gardu', 'saidi_jtr', 'saidi_sr_app', 'saidi_bencana_alam', 'saidi_sistem_transmisi',
                'saifi_har', 'saifi_penyulang', 'saifi_gardu', 'saifi_jtr', 'saifi_sr_app', 'saifi_bencana_alam', 'saifi_sistem_transmisi'
            ]);

            // Add new SAIDI columns
            $table->decimal('saidi_distribusi_padam_tidak_terencana', 10, 4)->default(0)->after('periode_id');
            $table->decimal('saidi_distribusi_padam_terencana', 10, 4)->default(0)->after('saidi_distribusi_padam_tidak_terencana');
            $table->decimal('saidi_distribusi_bencana_alam', 10, 4)->default(0)->after('saidi_distribusi_padam_terencana');
            $table->decimal('saidi_transmisi', 10, 4)->default(0)->after('saidi_distribusi_bencana_alam');
            $table->decimal('saidi_pembangkit', 10, 4)->default(0)->after('saidi_transmisi');

            // Add new SAIFI columns
            $table->decimal('saifi_distribusi_padam_tidak_terencana', 10, 4)->default(0)->after('saidi_total');
            $table->decimal('saifi_distribusi_padam_terencana', 10, 4)->default(0)->after('saifi_distribusi_padam_tidak_terencana');
            $table->decimal('saifi_distribusi_bencana_alam', 10, 4)->default(0)->after('saifi_distribusi_padam_terencana');
            $table->decimal('saifi_transmisi', 10, 4)->default(0)->after('saifi_distribusi_bencana_alam');
            $table->decimal('saifi_pembangkit', 10, 4)->default(0)->after('saifi_transmisi');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kinerja_jaringan', function (Blueprint $table) {
            // Re-add old columns
            $table->decimal('saidi_har', 10, 4)->default(0);
            $table->decimal('saidi_penyulang', 10, 4)->default(0);
            $table->decimal('saidi_gardu', 10, 4)->default(0);
            $table->decimal('saidi_jtr', 10, 4)->default(0);
            $table->decimal('saidi_sr_app', 10, 4)->default(0);
            $table->decimal('saidi_bencana_alam', 10, 4)->default(0);
            $table->decimal('saidi_sistem_transmisi', 10, 4)->default(0);

            $table->decimal('saifi_har', 10, 4)->default(0);
            $table->decimal('saifi_penyulang', 10, 4)->default(0);
            $table->decimal('saifi_gardu', 10, 4)->default(0);
            $table->decimal('saifi_jtr', 10, 4)->default(0);
            $table->decimal('saifi_sr_app', 10, 4)->default(0);
            $table->decimal('saifi_bencana_alam', 10, 4)->default(0);
            $table->decimal('saifi_sistem_transmisi', 10, 4)->default(0);

            // Drop new columns
            $table->dropColumn([
                'saidi_distribusi_padam_tidak_terencana', 'saidi_distribusi_padam_terencana', 'saidi_distribusi_bencana_alam', 'saidi_transmisi', 'saidi_pembangkit',
                'saifi_distribusi_padam_tidak_terencana', 'saifi_distribusi_padam_terencana', 'saifi_distribusi_bencana_alam', 'saifi_transmisi', 'saifi_pembangkit'
            ]);
        });
    }
};
