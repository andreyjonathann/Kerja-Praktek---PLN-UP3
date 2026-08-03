<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── 1. k3_categories ────────────────────────────────────────────────
        Schema::create('k3_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();          // LMC, AAI, IBP, STE, SCC, REP
            $table->string('name');                         // Nama lengkap kategori
            $table->string('short_name')->nullable();       // Nama pendek untuk label
            $table->string('color', 10)->nullable();        // Hex color untuk UI
            $table->string('icon', 50)->nullable();         // Lucide icon name
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // ── 2. k3_criteria ──────────────────────────────────────────────────
        Schema::create('k3_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('k3_categories')->onDelete('cascade');
            $table->string('code', 10);                     // e.g. '1.1', '2.3'
            $table->text('name');                           // Nama kriteria
            $table->text('target_description')->nullable(); // Kolom target dari Excel
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });

        // ── 3. k3_criteria_levels ───────────────────────────────────────────
        Schema::create('k3_criteria_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('k3_criteria')->onDelete('cascade');
            $table->unsignedTinyInteger('level');           // 1 – 5
            $table->text('description');                    // Deskripsi level dari Excel
            $table->timestamps();

            $table->unique(['criteria_id', 'level']);
        });

        // ── 4. k3_targets ───────────────────────────────────────────────────
        // Per criteria per semester — hanya admin yg bisa POST/PUT
        Schema::create('k3_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('k3_criteria')->onDelete('cascade');
            $table->string('period', 10);                   // e.g. '2026-S1', '2026-S2'
            $table->unsignedTinyInteger('target_level');    // 1 – 5
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['criteria_id', 'period']);      // 1 target per criteria per semester
        });

        // ── 5. k3_assessments ───────────────────────────────────────────────
        // Realisasi self-assessment per criteria per semester — pic_k3 | admin
        Schema::create('k3_assessments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('k3_criteria')->onDelete('cascade');
            $table->string('period', 10);                   // e.g. '2026-S1'
            $table->unsignedTinyInteger('actual_level')->nullable(); // 1 – 5
            $table->text('notes')->nullable();              // Catatan/bukti pendukung
            $table->enum('status', ['draft', 'submitted', 'approved', 'revisi'])->default('draft');
            $table->text('catatan_revisor')->nullable();    // Catatan saat revisi/reject
            $table->foreignId('submitted_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamps();

            $table->unique(['criteria_id', 'period']);      // 1 assessment per criteria per semester
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('k3_assessments');
        Schema::dropIfExists('k3_targets');
        Schema::dropIfExists('k3_criteria_levels');
        Schema::dropIfExists('k3_criteria');
        Schema::dropIfExists('k3_categories');
    }
};
