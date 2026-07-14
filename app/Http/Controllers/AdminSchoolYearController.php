<?php

namespace App\Http\Controllers;

use App\Models\GradeArchive;
use App\Models\SchoolYear;
use App\Models\Student;
use App\Models\StudentSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSchoolYearController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        if (! $user || ! $user->hasPermission('access admin')) {
            abort(403, 'Unauthorized.');
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $schoolYears = SchoolYear::query()
            ->orderByDesc('start_date')
            ->get()
            ->map(fn (SchoolYear $sy) => [
                'id' => $sy->id,
                'name' => $sy->name,
                'start_date' => $sy->start_date,
                'end_date' => $sy->end_date,
                'enrollment_start' => $sy->enrollment_start,
                'enrollment_end' => $sy->enrollment_end,
                'status' => $sy->status,
                'student_count' => Student::where('school_year', $sy->name)->count(),
            ]);

        $currentYear = SchoolYear::current();

        return inertia('admin/school-years', [
            'schoolYears' => $schoolYears,
            'currentYear' => $currentYear ? [
                'id' => $currentYear->id,
                'name' => $currentYear->name,
                'start_date' => $currentYear->start_date,
                'end_date' => $currentYear->end_date,
                'enrollment_start' => $currentYear->enrollment_start,
                'enrollment_end' => $currentYear->enrollment_end,
                'status' => $currentYear->status,
            ] : null,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:school_years,name',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'enrollment_start' => 'nullable|date',
            'enrollment_end' => 'nullable|date|after_or_equal:enrollment_start',
        ]);

        $existingActive = SchoolYear::where('status', 'active')->first();
        if ($existingActive) {
            return back()->with('error', 'An active school year already exists. End it before creating a new one.');
        }

        SchoolYear::create([
            'name' => $data['name'],
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'enrollment_start' => $data['enrollment_start'] ?? null,
            'enrollment_end' => $data['enrollment_end'] ?? null,
            'status' => 'active',
        ]);

        return back()->with('success', 'School year created successfully.');
    }

    public function endYear(Request $request, int $id)
    {
        $this->authorizeAdmin($request);

        $schoolYear = SchoolYear::findOrFail($id);

        if ($schoolYear->status !== 'active') {
            return back()->with('error', 'Only an active school year can be ended.');
        }

        $gradeLevelMap = [
            'Grade 7' => 'Grade 8',
            'Grade 8' => 'Grade 9',
            'Grade 9' => 'Grade 10',
            'Grade 10' => 'Grade 11',
            'Grade 11' => 'Grade 12',
        ];

        DB::transaction(function () use ($schoolYear, $gradeLevelMap) {
            // Archive all grades for this school year before processing
            $enrollments = StudentSubject::where('school_year', $schoolYear->name)
                ->whereNotNull('total')
                ->get();

            $archives = $enrollments->map(fn ($enr) => [
                'student_uuid' => $enr->student_uuid,
                'subject_uuid' => $enr->subject_uuid,
                'school_year' => $enr->school_year,
                'section' => $enr->section,
                'year_level' => $enr->year_level,
                'q1' => $enr->q1,
                'q2' => $enr->q2,
                'q3' => $enr->q3,
                'total' => $enr->total,
                'grade' => $enr->grade,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();

            if (! empty($archives)) {
                GradeArchive::insertOrIgnore($archives);
            }

            // Delete student_subject records for this school year after archiving
            StudentSubject::where('school_year', $schoolYear->name)->delete();

            // Clear school_year on all class sections and their subject assignments
            DB::table('class_sections')->update(['school_year' => null]);
            DB::table('class_section_subjects')->update(['school_year' => null]);

            $students = Student::where('school_year', $schoolYear->name)->get();

            $promoted = 0;
            $retained = 0;

            foreach ($students as $student) {
                if (empty($student->grade_level)) {
                    $retained++;
                    continue;
                }

                $grades = StudentSubject::where('student_uuid', $student->uuid)
                    ->where('school_year', $schoolYear->name)
                    ->whereNotNull('total')
                    ->pluck('total');

                if ($grades->isEmpty()) {
                    $retained++;
                    continue;
                }

                $average = (int) round($grades->avg());
                $nextLevel = $gradeLevelMap[$student->grade_level] ?? null;

                if ($nextLevel && $average >= 75) {
                    DB::table('students')->where('uuid', $student->uuid)->update([
                        'last_grade_level' => $student->grade_level,
                        'last_school_year' => $schoolYear->name,
                        'previous_section' => $student->section,
                        'grade_level' => $nextLevel,
                        'section' => null,
                        'section_uuid' => null,
                        'school_year' => null,
                    ]);
                    $promoted++;
                } else {
                    DB::table('students')->where('uuid', $student->uuid)->update([
                        'last_grade_level' => $student->grade_level,
                        'last_school_year' => $schoolYear->name,
                        'previous_section' => $student->section,
                        'section' => null,
                        'section_uuid' => null,
                        'school_year' => null,
                    ]);
                    $retained++;
                }
            }

            $schoolYear->update(['status' => 'ended']);

            return [
                'promoted' => $promoted,
                'retained' => $retained,
            ];
        });

        return back()->with('success', 'School year ended. Students have been processed for promotion.');
    }

    public function destroy(Request $request, int $id)
    {
        $this->authorizeAdmin($request);

        $schoolYear = SchoolYear::findOrFail($id);

        if ($schoolYear->status === 'active') {
            return back()->with('error', 'Cannot delete an active school year. End it first.');
        }

        DB::transaction(function () use ($schoolYear) {
            StudentSubject::where('school_year', $schoolYear->name)->delete();
            $schoolYear->delete();
        });

        return back()->with('success', 'School year deleted.');
    }
}
