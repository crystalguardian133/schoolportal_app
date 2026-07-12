<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('user_uuid', 36)->nullable()->unique()->after('uuid');
            $table->string('school_year')->nullable()->after('grade_level');
            $table->foreign('user_uuid')->references('uuid')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['user_uuid']);
            $table->dropUnique(['user_uuid']);
            $table->dropColumn(['user_uuid', 'school_year']);
        });
    }
};
