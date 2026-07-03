<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_sections', function (Blueprint $table) {
            if (! Schema::hasColumn('class_sections', 'school_year')) {
                $table->string('school_year')->nullable()->after('grade_level');
            }
        });
    }

    public function down(): void
    {
        Schema::table('class_sections', function (Blueprint $table) {
            if (Schema::hasColumn('class_sections', 'school_year')) {
                $table->dropColumn('school_year');
            }
        });
    }
};
