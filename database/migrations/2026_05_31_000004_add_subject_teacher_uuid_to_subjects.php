<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (!Schema::hasColumn('subjects', 'subject_teacher_uuid')) {
                $table->string('subject_teacher_uuid',36)->nullable()->after('code');
                $table->foreign('subject_teacher_uuid')->references('uuid')->on('users')->onDelete('set null');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            if (Schema::hasColumn('subjects', 'subject_teacher_uuid')) {
                $table->dropForeign(['subject_teacher_uuid']);
                $table->dropColumn('subject_teacher_uuid');
            }
        });
    }
};
