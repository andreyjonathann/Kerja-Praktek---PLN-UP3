<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates all K3 Maturity Level tables in a single migration.
     */
    public function up(): void
    {
        // 1. k3_categories -- top-level groupings (LMC, AAI, IBP, STE, SCC, REP)
        Schema::create('k3_categories', function (Blueprint $table) {
            $table->id();
            $table->string('code', 10)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();
        });

        // 2. k3_criteria -- individual assessment criteria per category
        Schema::create('k3_criteria', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained('k3_categories')->onDelete('cascade');
            $table->string('code', 10);
            $table->string('name');
            $table->string('pic_role', 50)->nullable();
            $table->unsignedSmallInteger('order')->default(0);
            $table->timestamps();

            $table->unique(['category_id', 'code'], 'k3_criteria_category_code_unique');
        });

        // 3. k3_criteria_levels -- level 1-5 descriptions per criteria
        Schema::create('k3_criteria_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('criteria_id')->constrained('k3_criteria')->onDelete('cascade');
            $table->unsignedTinyInteger('level'); // 1 - 5
            $table->text('description');
            $table->timestamps();

            $table->unique(['criteria_id', 'level'], 'k3_criteria_levels_unique');
        });

        // 4. k3_assessments -- one assessment per unit per period
        Schema::create('k3_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('unit', 100);
            $table->unsignedTinyInteger('periode_bulan'); // 1 - 12
            $table->year('periode_tahun');
            $table->enum('status', ['draft', 'submitted', 'approved', 'revisi'])->default('draft');
            $table->text('catatan_revisor')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();

            $table->unique(['unit', 'periode_bulan', 'periode_tahun'], 'k3_assessments_unit_period_unique');
        });

        // 5. k3_assessment_details -- per-criteria level choices inside an assessment
        Schema::create('k3_assessment_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->constrained('k3_assessments')->onDelete('cascade');
            $table->foreignId('criteria_id')->constrained('k3_criteria')->onDelete('cascade');
            $table->unsignedTinyInteger('level_chosen')->nullable(); // 1-5, null until filled
            $table->text('catatan')->nullable();
            $table->timestamps();

            $table->unique(['assessment_id', 'criteria_id'], 'k3_assessment_details_unique');
        });

        // 6. k3_findings -- temuan / finding tracking
        Schema::create('k3_findings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('assessment_id')->nullable()->constrained('k3_assessments')->onDelete('set null');
            $table->string('judul');
            $table->text('deskripsi');
            $table->enum('jenis', ['observasi', 'minor', 'mayor', 'kritikal']);
            $table->string('pic_name', 150);
            $table->date('due_date');
            $table->enum('status', ['open', 'in_progress', 'closed'])->default('open');
            $table->text('catatan_tindak_lanjut')->nullable();
            $table->string('unit', 100);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });

        // 7. k3_activities -- inspeksi, rapat P2K3, pelatihan, audit, dll.
        Schema::create('k3_activities', function (Blueprint $table) {
            $table->id();
            $table->enum('jenis', [
                'inspeksi',
                'rapat_p2k3',
                'pelatihan',
                'audit_internal',
                'audit_mitra',
            ]);
            $table->string('judul');
            $table->date('tanggal');
            $table->string('lokasi', 200);
            $table->unsignedInteger('peserta')->default(0);
            $table->text('keterangan')->nullable();
            $table->enum('status', ['planned', 'done', 'cancelled'])->default('planned');
            $table->string('unit', 100);
            $table->foreignId('created_by')->constrained('users')->onDelete('restrict');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations. Drop tables in reverse FK-dependency order.
     */
    public function down(): void
    {
        Schema::dropIfExists('k3_activities');
        Schema::dropIfExists('k3_findings');
        Schema::dropIfExists('k3_assessment_details');
        Schema::dropIfExists('k3_assessments');
        Schema::dropIfExists('k3_criteria_levels');
        Schema::dropIfExists('k3_criteria');
        Schema::dropIfExists('k3_categories');
    }
};
