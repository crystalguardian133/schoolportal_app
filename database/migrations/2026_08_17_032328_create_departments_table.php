<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('departments', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('head_uuid', 36)->nullable();
            $table->timestamps();

            $table->index('head_uuid');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('departments');
    }
};
