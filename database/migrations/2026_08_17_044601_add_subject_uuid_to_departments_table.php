<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->string('subject_uuid', 36)->nullable()->after('description');
            $table->index('subject_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function (Blueprint $table) {
            $table->dropIndex(['subject_uuid']);
            $table->dropColumn('subject_uuid');
        });
    }
};
