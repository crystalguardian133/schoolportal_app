<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('school_years', function (Blueprint $table) {
            $table->date('enrollment_start')->nullable()->after('end_date');
            $table->date('enrollment_end')->nullable()->after('enrollment_start');
        });

        Schema::create('grade_archives', function (Blueprint $table) {
            $table->id();
            $table->uuid('student_uuid');
            $table->uuid('subject_uuid');
            $table->string('school_year');
            $table->string('section')->nullable();
            $table->string('year_level')->nullable();
            $table->integer('q1')->nullable();
            $table->integer('q2')->nullable();
            $table->integer('q3')->nullable();
            $table->integer('total')->nullable();
            $table->integer('grade')->nullable();
            $table->timestamps();

            $table->index('school_year');
            $table->unique(['student_uuid', 'subject_uuid', 'school_year'], 'grade_archive_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_archives');

        Schema::table('school_years', function (Blueprint $table) {
            $table->dropColumn(['enrollment_start', 'enrollment_end']);
        });
    }
};
