<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $subjects = DB::table('subjects')
            ->whereNotNull('subject_teacher_uuid')
            ->select(['uuid as subject_uuid', 'subject_teacher_uuid as teacher_uuid'])
            ->get();

        foreach ($subjects as $subject) {
            DB::table('subject_teacher')->insert([
                'subject_uuid' => $subject->subject_uuid,
                'teacher_uuid' => $subject->teacher_uuid,
                'is_substitute' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        //
    }
};