<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_subject', function (Blueprint $table) {
            $table->id();
            $table->uuid('student_uuid');
            $table->uuid('subject_uuid');
            $table->string('grade')->nullable();
            $table->timestamps();

            $table->foreign('student_uuid')->references('uuid')->on('students')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');
            $table->unique(['student_uuid','subject_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_subject');
    }
};
