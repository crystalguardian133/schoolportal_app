<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * class_section_subjects.subject_uuid is a string, but subjects.uuid is a
     * native uuid. On PostgreSQL Eloquent's join (varchar = uuid) has no
     * matching operator, so rendering sections 500s whenever a section with
     * subjects exists. Re-type the pivot column to uuid on pgsql only.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE class_section_subjects ALTER COLUMN subject_uuid TYPE uuid USING subject_uuid::uuid'
            );
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement(
                'ALTER TABLE class_section_subjects ALTER COLUMN subject_uuid TYPE varchar USING subject_uuid::text'
            );
        }
    }
};