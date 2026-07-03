<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('class_sections', function (Blueprint $table) {
            $table->string('uuid')->primary();
            $table->string('name')->unique();
            $table->string('grade_level')->nullable();
            $table->string('school_year')->nullable();
            $table->timestamps();
        });

        Schema::create('class_section_subjects', function (Blueprint $table) {
            $table->id();
            $table->string('class_section_uuid');
            $table->string('subject_uuid');
            $table->timestamps();

            $table->unique(['class_section_uuid', 'subject_uuid'], 'class_section_subject_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('class_section_subjects');
        Schema::dropIfExists('class_sections');
    }
};
