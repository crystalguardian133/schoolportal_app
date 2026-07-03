<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'first_name')) {
                $table->string('first_name')->nullable()->after('student_id');
            }

            if (! Schema::hasColumn('students', 'middle_name')) {
                $table->string('middle_name')->nullable()->after('first_name');
            }

            if (! Schema::hasColumn('students', 'last_name')) {
                $table->string('last_name')->nullable()->after('middle_name');
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'last_name')) {
                $table->dropColumn('last_name');
            }

            if (Schema::hasColumn('students', 'middle_name')) {
                $table->dropColumn('middle_name');
            }

            if (Schema::hasColumn('students', 'first_name')) {
                $table->dropColumn('first_name');
            }
        });
    }
};
