<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_section_subject_teacher', function (Blueprint $table) {
            $table->id();
            $table->string('class_section_uuid', 36);
            $table->uuid('subject_uuid');
            $table->string('teacher_uuid', 36);
            $table->boolean('is_substitute')->default(false);
            $table->timestamps();

            $table->foreign('class_section_uuid')->references('uuid')->on('class_sections')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->unique(['class_section_uuid', 'subject_uuid', 'teacher_uuid'], 'csst_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_section_subject_teacher');
    }
};
