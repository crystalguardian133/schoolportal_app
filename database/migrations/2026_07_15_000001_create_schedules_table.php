<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->string('class_section_uuid', 36);
            $table->string('subject_uuid', 36);
            $table->string('teacher_uuid', 36);
            $table->string('day');
            $table->string('start_time');
            $table->string('end_time');
            $table->string('room')->nullable();
            $table->string('school_year')->nullable();
            $table->timestamps();

            $table->foreign('class_section_uuid')->references('uuid')->on('class_sections')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');
            $table->foreign('teacher_uuid')->references('uuid')->on('users')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
