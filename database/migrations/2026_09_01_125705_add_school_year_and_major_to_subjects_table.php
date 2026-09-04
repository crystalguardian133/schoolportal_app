<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->unsignedBigInteger('school_year_id')->nullable()->after('code');
            $table->uuid('major_subject_id')->nullable()->after('school_year_id');

            $table->foreign('school_year_id')->references('id')->on('school_years')->nullOnDelete();
            $table->foreign('major_subject_id')->references('uuid')->on('major_subjects')->nullOnDelete();

            $table->index('school_year_id');
            $table->index('major_subject_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropForeign(['school_year_id']);
            $table->dropForeign(['major_subject_id']);
            $table->dropColumn(['school_year_id', 'major_subject_id']);
        });
    }
};