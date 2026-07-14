<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('student_subject', function (Blueprint $table) {
            $table->unique(['student_uuid', 'subject_uuid', 'school_year']);
        });
    }

    public function down(): void
    {
        Schema::table('student_subject', function (Blueprint $table) {
            $table->dropUnique(['student_uuid', 'subject_uuid', 'school_year']);
        });
    }
};
