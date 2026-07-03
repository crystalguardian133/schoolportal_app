<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('class_sections', function (Blueprint $table) {
            $table->dropUnique('class_sections_name_unique');
            $table->unique(['name', 'school_year'], 'class_sections_name_school_year_unique');
        });
    }

    public function down(): void
    {
        Schema::table('class_sections', function (Blueprint $table) {
            $table->dropUnique('class_sections_name_school_year_unique');
            $table->unique('name', 'class_sections_name_unique');
        });
    }
};
