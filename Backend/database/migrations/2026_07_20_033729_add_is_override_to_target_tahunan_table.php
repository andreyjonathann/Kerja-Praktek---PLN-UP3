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
        Schema::table('target_tahunan', function (Blueprint $table) {
            $table->json('is_override')->nullable()->after('target_des');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('target_tahunan', function (Blueprint $table) {
            $table->dropColumn('is_override');
        });
    }
};
