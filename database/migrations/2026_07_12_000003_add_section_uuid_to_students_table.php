<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (! Schema::hasColumn('students', 'section_uuid')) {
                $table->string('section_uuid', 36)->nullable()->after('section');
                $table->foreign('section_uuid')->references('uuid')->on('class_sections')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (Schema::hasColumn('students', 'section_uuid')) {
                $table->dropForeign(['section_uuid']);
                $table->dropColumn('section_uuid');
            }
        });
    }
};
