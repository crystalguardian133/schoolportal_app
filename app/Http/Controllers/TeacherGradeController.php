<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\SchoolYear;
use App\Models\Subject;
use App\Models\StudentSubject;

class TeacherGradeController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $selectedSubjectUuid = $request->query('subject_uuid');
        $selectedSectionUuid = $request->query('section_uuid');
        $search = $request->query('search', '');
        $activeYear = SchoolYear::current();
        $selectedSchoolYear = $request->query('school_year', $activeYear?->name ?? '');
        $page = max(1, (int) $request->query('page', 1));
        $perPage = 25;

        // Get subjects assigned to this teacher via subject_teacher (global) or class_section_subject_teacher (per-section)
        $globalSubjectUuids = DB::table('subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->pluck('subject_uuid')
            ->toArray();

        $sectionSubjectUuids = DB::table('class_section_subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->pluck('subject_uuid')
            ->toArray();

        $assignedSubjectUuids = array_values(array_unique(array_merge($globalSubjectUuids, $sectionSubjectUuids)));

        // Admin sees all subjects
        if ($user->hasRole('admin')) {
            $assignedSubjectUuids = Subject::pluck('uuid')->toArray();
        }

        // Build subject list: one entry per teacher assignment (subject × section)
        // Per-section assignments take priority over global assignments.
        // If a teacher has per-section assignments for a subject, only show those sections.
        $subjectModels = Subject::query()
            ->with('classSections')
            ->whereIn('uuid', $assignedSubjectUuids)
            ->get();

        // Collect per-section assignments first
        $sectionAssignments = DB::table('class_section_subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->get();

        // Track which subjects have per-section assignments
        $subjectsWithPerSection = $sectionAssignments->pluck('subject_uuid')->unique()->toArray();

        $subjects = [];

        // Global assignments: only expand to sections for subjects that have NO per-section assignments
        foreach ($globalSubjectUuids as $subjectUuid) {
            if (in_array($subjectUuid, $subjectsWithPerSection)) continue;

            $subject = $subjectModels->firstWhere('uuid', $subjectUuid);
            if (! $subject) continue;

            $sections = $subject->classSections
                ->when($selectedSchoolYear, fn ($q) => $q->where('school_year', $selectedSchoolYear));

            if ($sections->isEmpty()) {
                $subjects[] = [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'time_schedule' => $subject->time_schedule,
                    'section' => $subject->code ?? 'N/A',
                    'sectionUuid' => null,
                ];
            } else {
                foreach ($sections as $section) {
                    $subjects[] = [
                        'uuid' => $subject->uuid,
                        'name' => $subject->name,
                        'code' => $subject->code,
                        'time_schedule' => $subject->time_schedule,
                        'section' => $section->name,
                        'sectionUuid' => $section->uuid,
                    ];
                }
            }
        }

        // Per-section assignments: one entry per row
        foreach ($sectionAssignments as $assignment) {
            $subject = $subjectModels->firstWhere('uuid', $assignment->subject_uuid);
            if (! $subject) continue;

            $section = \App\Models\ClassSection::query()->where('uuid', $assignment->class_section_uuid)->first();
            if (! $section) continue;

            if ($selectedSchoolYear && $section->school_year !== $selectedSchoolYear) continue;

            $subjects[] = [
                'uuid' => $subject->uuid,
                'name' => $subject->name,
                'code' => $subject->code,
                'time_schedule' => $subject->time_schedule,
                'section' => $section->name,
                'sectionUuid' => $section->uuid,
            ];
        }

        usort($subjects, fn ($a, $b) => strcmp($a['name'] . $a['section'], $b['name'] . $b['section']));

        $students = [];
        $selectedSubject = null;
        $totalStudents = 0;

        // If a subject is selected, load its enrolled students with grades
        if ($selectedSubjectUuid && in_array($selectedSubjectUuid, $assignedSubjectUuids)) {
            $selectedSubject = collect($subjects)->firstWhere('uuid', $selectedSubjectUuid);

            // If a section UUID is also provided, narrow to that section
            $selectedSection = null;
            if ($selectedSectionUuid) {
                $selectedSection = \App\Models\ClassSection::query()->where('uuid', $selectedSectionUuid)->first();
                // Verify this section is in the subject list
                $matchFound = false;
                foreach ($subjects as $s) {
                    if ($s['uuid'] === $selectedSubjectUuid && ($s['sectionUuid'] === $selectedSectionUuid || $s['sectionUuid'] === null)) {
                        $matchFound = true;
                        break;
                    }
                }
                if (! $matchFound) {
                    $selectedSection = null;
                }
            }

            $query = StudentSubject::query()
                ->with('student')
                ->where('subject_uuid', $selectedSubjectUuid);

            if ($selectedSchoolYear !== '') {
                $query->where('school_year', $selectedSchoolYear);
            }

            if ($selectedSection) {
                $query->whereHas('student', fn ($q) => $q->where('section', $selectedSection->name));
            }

            if ($search !== '') {
                $terms = preg_split('/\s+/', trim($search), -1, PREG_SPLIT_NO_EMPTY);

                if (count($terms) > 0) {
                    $matchedUuids = DB::table('students')
                        ->where(function ($q) use ($terms) {
                            foreach ($terms as $term) {
                                $q->where(function ($w) use ($term) {
                                    $w->where('name', 'LIKE', "%{$term}%")
                                      ->orWhere('first_name', 'LIKE', "%{$term}%")
                                      ->orWhere('middle_name', 'LIKE', "%{$term}%")
                                      ->orWhere('last_name', 'LIKE', "%{$term}%")
                                      ->orWhere('lrn', 'LIKE', "%{$term}%")
                                      ->orWhere('student_id', 'LIKE', "%{$term}%");
                                });
                            }
                        })
                        ->pluck('uuid');

                    $query->whereIn('student_uuid', $matchedUuids);
                }
            }

            $totalStudents = (clone $query)->count();

            $enrollments = $query
                ->orderBy('id')
                ->offset(($page - 1) * $perPage)
                ->limit($perPage)
                ->get();

            $students = $enrollments->map(function ($enr) {
                return [
                    'enrollmentId' => $enr->id,
                    'studentUuid' => $enr->student?->uuid,
                    'name' => $enr->student?->name ?? 'Unknown',
                    'lrn' => $enr->student?->lrn ?? null,
                    'studentId' => $enr->student?->student_id ?? null,
                    'q1' => $enr->q1,
                    'q2' => $enr->q2,
                    'q3' => $enr->q3,
                    'total' => $enr->total,
                ];
            })->toArray();
        }

        // Get all school years for the filter dropdown, active first
        $schoolYears = SchoolYear::orderByDesc('status')
            ->orderByDesc('start_date')
            ->get()
            ->map(fn (SchoolYear $sy) => [
                'name' => $sy->name,
                'status' => $sy->status,
                'is_active' => $activeYear && $sy->id === $activeYear->id,
            ])
            ->values()
            ->toArray();

        return Inertia::render('teacher/grades', [
            'subjects' => $subjects,
            'selectedSubject' => $selectedSubject,
            'selectedSubjectUuid' => $selectedSubjectUuid,
            'selectedSectionUuid' => $selectedSectionUuid,
            'students' => $students,
            'totalStudents' => $totalStudents,
            'currentPage' => $page,
            'perPage' => $perPage,
            'search' => $search,
            'gradesLocked' => $this->areGradesLocked($selectedSchoolYear, $user),
            'schoolYears' => $schoolYears,
            'selectedSchoolYear' => $selectedSchoolYear,
        ]);
    }

    public function update(Request $request, string $classId)
    {
        $user = $request->user();

        $subject = Subject::query()->where('uuid', $classId)->first();
        if (! $subject) {
            return redirect()->back()->with('error', 'Subject not found');
        }

        // Authorization: only admin or assigned teacher can update
        if (! $user->hasRole('admin')) {
            $sectionUuid = $request->input('section_uuid');

            $isAssignedGlobal = DB::table('subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $user->uuid)
                ->exists();

            $isAssignedSection = false;
            if ($sectionUuid) {
                $isAssignedSection = DB::table('class_section_subject_teacher')
                    ->where('subject_uuid', $subject->uuid)
                    ->where('class_section_uuid', $sectionUuid)
                    ->where('teacher_uuid', $user->uuid)
                    ->exists();
            }

            // If no section specified, check if assigned to ANY section for this subject
            if (! $sectionUuid) {
                $isAssignedSection = DB::table('class_section_subject_teacher')
                    ->where('subject_uuid', $subject->uuid)
                    ->where('teacher_uuid', $user->uuid)
                    ->exists();
            }

            if (! $isAssignedGlobal && ! $isAssignedSection) {
                return redirect()->back()->with('error', 'Forbidden');
            }
        }

        // Check if grades are locked (ended school year)
        $activeYear = SchoolYear::current();
        $hasBypass = $user->hasRole('admin') || $user->hasPermission('school year bypass');

        if (! $hasBypass) {
            $requestYear = $request->input('school_year');
            if ($requestYear && $activeYear && $requestYear !== $activeYear->name) {
                return redirect()->back()->with('error', 'Grades for "' . $requestYear . '" are locked. The school year has ended.');
            }
            if ($requestYear && ! $activeYear) {
                return redirect()->back()->with('error', 'Grades are locked. No active school year.');
            }
        }

        $data = $request->validate([
            'grades' => 'required|array',
            'grades.*.studentId' => 'required|string',
            'grades.*.q1' => 'nullable|integer|min:0|max:100',
            'grades.*.q2' => 'nullable|integer|min:0|max:100',
            'grades.*.q3' => 'nullable|integer|min:0|max:100',
        ]);

        DB::beginTransaction();

        try {
            foreach ($data['grades'] as $row) {
                $studentId = $row['studentId'];

                $enr = StudentSubject::query()
                    ->where('subject_uuid', $subject->uuid)
                    ->whereHas('student', function ($q) use ($studentId) {
                        $q->where('student_id', $studentId);
                    })
                    ->first();

                if (! $enr) {
                    // skip missing enrollment
                    continue;
                }

                $enr->q1 = $row['q1'] ?? $enr->q1;
                $enr->q2 = $row['q2'] ?? $enr->q2;
                $enr->q3 = $row['q3'] ?? $enr->q3;
                $quarters = array_filter([$enr->q1, $enr->q2, $enr->q3], fn($v) => $v !== null);
                $enr->total = count($quarters) > 0 ? (int) round(array_sum($quarters) / count($quarters)) : null;
                $enr->save();
            }

            DB::commit();
            return redirect()->back()->with('success', 'Grades updated');
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('Grade update failed: '.$e->getMessage());
            return redirect()->back()->with('error', 'Failed to update grades');
        }
    }

    private function areGradesLocked(?string $selectedSchoolYear, $user): bool
    {
        if (! $selectedSchoolYear) {
            return false;
        }

        $hasBypass = $user->hasRole('admin') || $user->hasPermission('school year bypass');
        if ($hasBypass) {
            return false;
        }

        $activeYear = SchoolYear::current();

        // No active school year → everything is locked
        if (! $activeYear) {
            return true;
        }

        // Selected year doesn't match active year → locked
        return $selectedSchoolYear !== $activeYear->name;
    }
}
