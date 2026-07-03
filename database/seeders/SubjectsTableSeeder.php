<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Subject;
use Symfony\Component\Uid\Uuid;

class SubjectsTableSeeder extends Seeder
{
    public function run(): void
    {
        $subjects = [
            ['name' => 'Mathematics', 'code' => 'MATH-7', 'time_schedule' => 'Mon / Wed / Fri - 8:00 AM to 9:00 AM', 'subject_teacher' => 'Ms. Reyes'],
            ['name' => 'Science', 'code' => 'SCI-7', 'time_schedule' => 'Mon / Wed / Fri - 9:00 AM to 10:00 AM', 'subject_teacher' => 'Mr. Santos'],
            ['name' => 'English Communication', 'code' => 'ENG-7', 'time_schedule' => 'Tue / Thu - 8:00 AM to 9:30 AM', 'subject_teacher' => 'Mrs. Cruz'],
            ['name' => 'History', 'code' => 'HIST-7', 'time_schedule' => 'Tue / Thu - 10:00 AM to 11:00 AM', 'subject_teacher' => 'Mr. Garcia'],
            ['name' => 'Advanced Mathematics', 'code' => 'MATH-8', 'time_schedule' => 'Mon / Wed / Fri - 8:00 AM to 9:00 AM', 'subject_teacher' => 'Ms. Reyes'],
            ['name' => 'Earth Science', 'code' => 'SCI-8', 'time_schedule' => 'Mon / Wed / Fri - 9:00 AM to 10:00 AM', 'subject_teacher' => 'Mr. Santos'],
            ['name' => 'Literature and Composition', 'code' => 'ENG-8', 'time_schedule' => 'Tue / Thu - 8:00 AM to 9:30 AM', 'subject_teacher' => 'Mrs. Cruz'],
        ];

        foreach ($subjects as $data) {
            $subject = Subject::query()->where('code', $data['code'])->first();

            if (!$subject) {
                $subject = new Subject();
                // Ensure UUID present for the primary key
                if (empty($subject->uuid)) {
                    $subject->uuid = Uuid::v7()->toRfc4122();
                }
            }

            $subject->code = $data['code'];
            $subject->name = $data['name'];
            $subject->time_schedule = $data['time_schedule'];
            $subject->subject_teacher = $data['subject_teacher'];
            $subject->save();
        }
    }
}
