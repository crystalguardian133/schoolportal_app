<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subject_teacher', function (Blueprint $table) {
            $table->id();
            $table->uuid('subject_uuid');
            $table->string('teacher_uuid', 36);
            $table->boolean('is_substitute')->default(false);
            $table->timestamps();

            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->unique(['subject_uuid', 'teacher_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_teacher');
    }
};