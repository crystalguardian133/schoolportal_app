<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'lrn')) {
                $table->string('lrn')->nullable()->unique()->after('user_uuid');
            }

            if (! Schema::hasColumn('students', 'student_id')) {
                $table->string('student_id')->nullable()->unique()->after('lrn');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'student_id')) {
                $table->dropUnique(['student_id']);
                $table->dropColumn('student_id');
            }

            if (Schema::hasColumn('students', 'lrn')) {
                $table->dropUnique(['lrn']);
                $table->dropColumn('lrn');
            }
        });
    }
};
