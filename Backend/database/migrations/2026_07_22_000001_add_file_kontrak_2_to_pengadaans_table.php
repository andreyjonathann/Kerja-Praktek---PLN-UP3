<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengadaans', function (Blueprint $table) {
            $table->string('file_kontrak_2')->nullable()->after('file_kontrak');
        });
    }

    public function down(): void
    {
        Schema::table('pengadaans', function (Blueprint $table) {
            $table->dropColumn('file_kontrak_2');
        });
    }
};
