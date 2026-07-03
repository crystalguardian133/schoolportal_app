<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_subject', function (Blueprint $table) {
            if (! Schema::hasColumn('student_subject', 'year_level')) {
                $table->string('year_level')->nullable()->after('subject_uuid');
            }

            if (! Schema::hasColumn('student_subject', 'school_year')) {
                $table->string('school_year')->nullable()->after('year_level');
            }

            if (! Schema::hasColumn('student_subject', 'section')) {
                $table->string('section')->nullable()->after('school_year');
            }

            if (! Schema::hasColumn('student_subject', 'q1')) {
                $table->unsignedTinyInteger('q1')->nullable()->after('section');
            }

            if (! Schema::hasColumn('student_subject', 'q2')) {
                $table->unsignedTinyInteger('q2')->nullable()->after('q1');
            }

            if (! Schema::hasColumn('student_subject', 'q3')) {
                $table->unsignedTinyInteger('q3')->nullable()->after('q2');
            }

            if (! Schema::hasColumn('student_subject', 'total')) {
                $table->unsignedTinyInteger('total')->nullable()->after('q3');
            }

            $table->unique(['student_uuid', 'subject_uuid', 'year_level', 'school_year'], 'student_subject_unique_enrollment');
        });
    }

    public function down(): void
    {
        Schema::table('student_subject', function (Blueprint $table) {
            $table->dropUnique('student_subject_unique_enrollment');
            $table->dropColumn(['year_level', 'school_year', 'section', 'q1', 'q2', 'q3', 'total']);
        });
    }
};
