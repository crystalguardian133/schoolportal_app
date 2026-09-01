<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $rows = DB::table('departments')
            ->whereNotNull('subject_uuid')
            ->get(['uuid', 'subject_uuid', 'name']);

        foreach ($rows as $dept) {
            $subject = DB::table('subjects')
                ->where('uuid', $dept->subject_uuid)
                ->first(['name']);

            if (! $subject) {
                continue;
            }

            // Infer grade level from a trailing grade token in the subject name
            // e.g. "MATHEMATICS 7" -> 7. JHS grades are 7-10; anything at/above 11
            // is senior high and uses track/strand scoping instead.
            $grade = null;
            if (preg_match('/(\d{1,2})\s*$/', trim($subject->name), $m)) {
                $candidate = (int) $m[1];
                if ($candidate >= 7 && $candidate <= 12) {
                    $grade = (string) $candidate;
                }
            }

            DB::table('department_subject')->updateOrInsert(
                [
                    'department_uuid' => $dept->uuid,
                    'subject_uuid' => $dept->subject_uuid,
                    'grade_level' => $grade,
                    'track' => null,
                    'strand' => null,
                ],
                ['created_at' => now(), 'updated_at' => now()]
            );
        }

        Schema::table('departments', function ($table) {
            $table->dropIndex(['subject_uuid']);
            $table->dropColumn('subject_uuid');
        });
    }

    public function down(): void
    {
        Schema::table('departments', function ($table) {
            $table->string('subject_uuid', 36)->nullable()->after('description');
            $table->index('subject_uuid');
        });
    }
};
