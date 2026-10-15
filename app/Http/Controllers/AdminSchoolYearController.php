<?php

namespace App\Http\Controllers;

use App\Models\EnrollmentAudit;
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

    private const GRADE_LEVEL_MAP = [
        'Grade 7' => 'Grade 8',
        'Grade 8' => 'Grade 9',
        'Grade 9' => 'Grade 10',
        'Grade 10' => 'Grade 11',
        'Grade 11' => 'Grade 12',
    ];

    private const PASSING_AVERAGE = 75;

    /**
     * Classify every student of a school year WITHOUT writing anything.
     * Averages are computed from the live student_subjects rows, so callers
     * that delete those rows must call this FIRST.
     *
     * @return array{promoted: array, graduated: array, retained: array}
     */
    private function classifyRollover(SchoolYear $schoolYear): array
    {
        $averages = StudentSubject::where('school_year', $schoolYear->name)
            ->whereNotNull('total')
            ->get(['student_uuid', 'total'])
            ->groupBy('student_uuid')
            ->map(fn ($rows) => (int) round($rows->avg('total')));

        $students = Student::where('school_year', $schoolYear->name)->get();

        $promoted = [];
        $graduated = [];
        $retained = [];

        foreach ($students as $student) {
            $average = $averages->get($student->uuid);
            $entry = [
                'uuid' => $student->uuid,
                'name' => $student->name,
                'from' => $student->grade_level,
                'average' => $average,
            ];

            if (empty($student->grade_level) || $average === null) {
                $entry['to'] = null;
                $entry['reason'] = empty($student->grade_level) ? 'no grade level' : 'no graded subjects';
                $retained[] = $entry;
                continue;
            }

            $nextLevel = self::GRADE_LEVEL_MAP[$student->grade_level] ?? null;

            if ($nextLevel !== null && $average >= self::PASSING_AVERAGE) {
                $entry['to'] = $nextLevel;
                $promoted[] = $entry;
            } elseif ($nextLevel === null && $student->grade_level === 'Grade 12' && $average >= self::PASSING_AVERAGE) {
                $entry['to'] = null;
                $graduated[] = $entry;
            } else {
                $entry['to'] = null;
                $entry['reason'] = $average < self::PASSING_AVERAGE ? "average {$average} below ".self::PASSING_AVERAGE : 'no next level';
                $retained[] = $entry;
            }
        }

        return compact('promoted', 'graduated', 'retained');
    }

    public function rolloverPreview(Request $request, int $id)
    {
        $this->authorizeAdmin($request);

        $schoolYear = SchoolYear::findOrFail($id);

        $result = $this->classifyRollover($schoolYear);

        return response()->json([
            'school_year' => $schoolYear->name,
            'status' => $schoolYear->status,
            'counts' => [
                'promoted' => count($result['promoted']),
                'graduated' => count($result['graduated']),
                'retained' => count($result['retained']),
            ],
            'promoted' => $result['promoted'],
            'graduated' => $result['graduated'],
            'retained' => $result['retained'],
        ]);
    }

    public function endYear(Request $request, int $id)
    {
        $this->authorizeAdmin($request);

        $schoolYear = SchoolYear::findOrFail($id);

        if ($schoolYear->status !== 'active') {
            return back()->with('error', 'Only an active school year can be ended.');
        }

        $result = DB::transaction(function () use ($request, $schoolYear) {
            // Classify FIRST: the archive/delete below wipes the rows the
            // averages come from. Previously the grades were queried after
            // the delete, so every student was silently retained.
            $classification = $this->classifyRollover($schoolYear);
            $byUuid = [];
            foreach (['promoted', 'graduated', 'retained'] as $outcome) {
                foreach ($classification[$outcome] as $entry) {
                    $byUuid[$entry['uuid']] = $outcome;
                }
            }

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

            $counts = ['promoted' => 0, 'graduated' => 0, 'retained' => 0];

            foreach ($students as $student) {
                $outcome = $byUuid[$student->uuid] ?? 'retained';
                $counts[$outcome]++;

                $updates = [
                    'last_grade_level' => $student->grade_level,
                    'last_school_year' => $schoolYear->name,
                    'previous_section' => $student->section,
                    'section' => null,
                    'section_uuid' => null,
                    'school_year' => null,
                ];

                $metadata = [
                    'from' => $student->grade_level,
                    'school_year' => $schoolYear->name,
                ];

                if ($outcome === 'promoted') {
                    $updates['grade_level'] = self::GRADE_LEVEL_MAP[$student->grade_level];
                    $metadata['to'] = $updates['grade_level'];
                } elseif ($outcome === 'graduated') {
                    $updates['status'] = 'graduated';
                }

                DB::table('students')->where('uuid', $student->uuid)->update($updates);

                EnrollmentAudit::create([
                    'user_uuid' => $request->user()?->uuid,
                    'student_uuid' => $student->uuid,
                    'subject_uuid' => null,
                    'school_year' => $schoolYear->name,
                    'action' => $outcome,
                    'metadata' => $metadata,
                ]);
            }

            $schoolYear->update(['status' => 'ended']);

            return $counts;
        });

        return back()->with('success', "School year ended: {$result['promoted']} promoted, {$result['graduated']} graduated, {$result['retained']} retained.");
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
