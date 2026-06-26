<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('gangguan_list');
        Schema::dropIfExists('gangguan_bulanan');
    }

    public function down(): void
    {
        // No down migration
    }
};
