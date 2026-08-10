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
        Schema::create('k3_findings', function (Blueprint $table) {
            $table->id();
            $table->string('judul');
            $table->text('deskripsi')->nullable();
            $table->enum('jenis', ['observasi', 'minor', 'mayor', 'kritikal'])->default('observasi');
            $table->string('pic_name')->nullable();
            $table->date('due_date')->nullable();
            $table->enum('status', ['open', 'in_progress', 'closed'])->default('open');
            $table->string('unit')->default('UP3 Kebon Jeruk');
            $table->string('foto_path')->nullable();
            $table->string('foto_name')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('k3_findings');
    }
};
