<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 36)->unique();
            $table->foreignId('attendance_session_id')->constrained('attendance_sessions')->onDelete('cascade');
            $table->string('student_uuid', 36);
            $table->enum('status', ['present', 'late', 'absent', 'excused'])->default('present');
            $table->enum('recorded_by', ['qr', 'manual'])->default('qr');
            $table->timestamp('scanned_at')->nullable();
            $table->timestamp('recorded_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('student_uuid')->references('uuid')->on('students')->onDelete('cascade');
            $table->unique(['attendance_session_id', 'student_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
