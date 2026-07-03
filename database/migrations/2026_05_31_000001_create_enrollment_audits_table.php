<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('enrollment_audits', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('user_uuid')->nullable();
            $table->string('student_uuid');
            $table->string('subject_uuid')->nullable();
            $table->string('school_year')->nullable();
            $table->string('action')->default('enrolled');
            $table->json('metadata')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollment_audits');
    }
};
