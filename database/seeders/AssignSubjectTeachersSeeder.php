<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;
use App\Models\User;

class AssignSubjectTeachersSeeder extends Seeder
{
    public function run(): void
    {
        $teacher = User::query()->where('email', 'teacher@example.com')->first();

        if (!$teacher) {
            return;
        }

        // For demo purposes, assign this teacher to the first mathematics subject.
        $subject = Subject::query()->where('code', 'MATH-7')->first();

        if ($subject) {
            $subject->subject_teacher_uuid = $teacher->uuid;
            $subject->save();
        }
        // Mark demo teacher as adviser for section B (demo data)
        if ($teacher) {
            $teacher->is_adviser = true;
            $teacher->adviser_section = 'B';
            $teacher->save();
        }
    }
}
