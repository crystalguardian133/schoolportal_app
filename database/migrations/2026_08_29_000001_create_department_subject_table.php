<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_subject', function (Blueprint $table) {
            $table->id();
            $table->uuid('department_uuid');
            $table->uuid('subject_uuid');
            $table->string('grade_level')->nullable();
            $table->string('track')->nullable();
            $table->string('strand')->nullable();
            $table->timestamps();

            $table->foreign('department_uuid')->references('uuid')->on('departments')->onDelete('cascade');
            $table->foreign('subject_uuid')->references('uuid')->on('subjects')->onDelete('cascade');

            $table->index(['department_uuid', 'grade_level']);
            $table->unique(
                ['department_uuid', 'subject_uuid', 'grade_level', 'track', 'strand'],
                'dept_subject_grade_strand_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_subject');
    }
};
