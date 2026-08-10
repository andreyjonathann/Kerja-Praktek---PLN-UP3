<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── k3_activities ───────────────────────────────────────────────────
        Schema::create('k3_activities', function (Blueprint $table) {
            $table->id();
            $table->string('jenis', 30);
            $table->text('judul');
            $table->date('tanggal');
            $table->string('lokasi');
            $table->unsignedInteger('peserta')->default(0);
            $table->text('keterangan')->nullable();
            $table->enum('status', ['planned', 'done', 'cancelled'])->default('planned');
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('k3_activities');
    }
};
