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
        Schema::create('k3_finding_progress', function (Blueprint $table) {
            $table->id();
            $table->foreignId('k3_finding_id')->constrained('k3_findings')->cascadeOnDelete();
            $table->text('text');
            $table->string('author')->nullable();
            $table->string('attachment_path')->nullable();
            $table->string('attachment_name')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('k3_finding_progress');
    }
};
