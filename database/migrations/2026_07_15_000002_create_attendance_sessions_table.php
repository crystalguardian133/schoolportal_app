<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->foreignId('schedule_id')->constrained('schedules')->onDelete('cascade');
            $table->string('teacher_uuid', 36);
            $table->uuid('subject_uuid');
            $table->string('class_section_uuid', 36);
            $table->date('date');
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('duration_minutes')->default(15);
            $table->string('qr_token', 64)->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('teacher_uuid')->references('uuid')->on('users')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');
            $table->foreign('class_section_uuid')->references('uuid')->on('class_sections')->onDelete('cascade');
            $table->index(['schedule_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_sessions');
    }
};
