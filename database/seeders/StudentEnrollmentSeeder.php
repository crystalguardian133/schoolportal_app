<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Database\Seeder;
use Symfony\Component\Uid\Uuid;

class StudentEnrollmentSeeder extends Seeder
{
    public function run(): void
    {
        $studentUser = User::query()->where('email', 'test@example.com')->first();

        if (! $studentUser) {
            return;
        }

        // Ensure student record exists and has a UUID primary key
        $student = Student::query()->where('user_uuid', $studentUser->uuid)->first();

        if (! $student) {
            $student = new Student();
            $student->uuid = Uuid::v7()->toRfc4122();
            $student->user_uuid = $studentUser->uuid;
        }

        $student->lrn = '202600000001';
        $student->student_id = 'ID-2026-0001';
        $student->first_name = 'Test';
        $student->middle_name = 'M.';
        $student->last_name = 'Student';
        $student->name = 'Test M. Student';
        $student->section = 'B';
        $student->grade_level = 'Grade 8';
        $student->school_year = 'School Year 2026-2027';
        $student->save();

        $enrollments = [
            ['code' => 'MATH-7', 'year_level' => 'Grade 7', 'school_year' => 'School Year 2025-2026', 'section' => 'A', 'q1' => 95, 'q2' => 94, 'q3' => 96],
            ['code' => 'SCI-7', 'year_level' => 'Grade 7', 'school_year' => 'School Year 2025-2026', 'section' => 'A', 'q1' => 88, 'q2' => 90, 'q3' => 89],
            ['code' => 'ENG-7', 'year_level' => 'Grade 7', 'school_year' => 'School Year 2025-2026', 'section' => 'A', 'q1' => 81, 'q2' => 83, 'q3' => 84],
            ['code' => 'MATH-8', 'year_level' => 'Grade 8', 'school_year' => 'School Year 2026-2027', 'section' => 'B', 'q1' => 92, 'q2' => 93, 'q3' => 94],
            ['code' => 'SCI-8', 'year_level' => 'Grade 8', 'school_year' => 'School Year 2026-2027', 'section' => 'B', 'q1' => 86, 'q2' => 87, 'q3' => 88],
            ['code' => 'ENG-8', 'year_level' => 'Grade 8', 'school_year' => 'School Year 2026-2027', 'section' => 'B', 'q1' => 79, 'q2' => 80, 'q3' => 82],
        ];

        foreach ($enrollments as $enrollment) {
            $subject = Subject::query()->where('code', $enrollment['code'])->first();

            if (! $subject) {
                continue;
            }

            StudentSubject::query()->updateOrCreate(
                [
                    'student_uuid' => $student->uuid,
                    'subject_uuid' => $subject->uuid,
                    'year_level' => $enrollment['year_level'],
                    'school_year' => $enrollment['school_year'],
                ],
                [
                    'section' => $enrollment['section'],
                    'q1' => $enrollment['q1'],
                    'q2' => $enrollment['q2'],
                    'q3' => $enrollment['q3'],
                    'total' => round(($enrollment['q1'] + $enrollment['q2'] + $enrollment['q3']) / 3),
                ]
            );
        }
    }
}