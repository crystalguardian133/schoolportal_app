<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Subject;
use App\Models\StudentSubject;
use Illuminate\Support\Facades\DB;

class TeacherClassController extends Controller
{
    private function classLoad($user = null, $schoolYear = null): array
    {
        // eager load enrollments and students so we can derive section(s)
        $subjects = Subject::with(['enrollments.student'])->get()->sortBy('name');

        $rows = $subjects->map(function ($s) use ($schoolYear) {
            // derive section label: prefer code, otherwise list distinct student sections
            $sectionLabel = null;
            if (!empty($s->code)) {
                $sectionLabel = strtoupper(str_replace('-', ' ', $s->code));
            } else {
                $sections = $s->enrollments
                    ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                    ->pluck('student')->filter()->pluck('section')->unique()->filter()->values()->all();
                if (!empty($sections)) {
                    $sectionLabel = implode(', ', $sections);
                }
            }

            $enrollmentCount = $s->enrollments()
                ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                ->count();

            return [
                'id' => $s->uuid,
                'section' => $sectionLabel ?? 'Section',
                'subject' => $s->name,
                'students' => $enrollmentCount,
                'timeSchedule' => $s->time_schedule ?? '',
                'subject_teacher_uuid' => $s->subject_teacher ?? null,
            ];
        })->toArray();

        // If no user provided, return all
        if (!$user) {
            return $rows;
        }

        // Admin sees all
        if ($user->hasRole('admin')) {
            return $rows;
        }

        $filtered = [];

        // Staff: include only subjects assigned to this teacher (via pivot or substitute)
        if ($user->hasRole('staff') || !empty($user->is_adviser)) {
            $assignedSubjects = DB::table('subject_teacher')
                ->where('teacher_uuid', $user->uuid)
                ->pluck('subject_uuid')
                ->toArray();

            foreach ($rows as $r) {
                if (in_array($r['id'], $assignedSubjects)) {
                    $filtered[] = $r;
                }
            }
        }

        // If user is an adviser, add an advisory pseudo-class entry
        if (!empty($user->is_adviser) && !empty($user->adviser_section)) {
            $filtered[] = [
                'id' => 'advisory-'.str_replace(' ', '-', $user->grade_level ?? 'advisory').'-'.$user->adviser_section,
                'section' => ($user->grade_level ?? 'Grade').' - '.$user->adviser_section,
                'subject' => 'Advisory',
                'students' => 0,
                'timeSchedule' => '',
                'subject_teacher_uuid' => null,
            ];
        }

        return $filtered;
    }

    private function classStudents(string $subjectUuid): array
    {
        $rows = StudentSubject::query()->with('student')
            ->where('subject_uuid', $subjectUuid)
            ->get();

        return $rows->map(function ($r) {
            return [
                'name' => $r->student?->name ?? 'Unknown',
                'lrn' => $r->student?->lrn ?? null,
                'studentId' => $r->student?->student_id ?? null,
                'q1' => $r->q1 ?? 0,
                'q2' => $r->q2 ?? 0,
                'q3' => $r->q3 ?? 0,
            ];
        })->toArray();
    }

    public function index(Request $request): Response
    {
        $user = $request->user();

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        return Inertia::render('teacher/classes', [
            'classes' => $this->classLoad($user, $schoolYear),
        ]);
    }

    public function show(Request $request, string $classId): Response
    {
        $user = $request->user();

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        $classes = $this->classLoad($user, $schoolYear);

        // Advisory class handling
        if (str_starts_with($classId, 'advisory-')) {
            // only advisers (or admins) can view advisory class
            if (! $user || (! $user->hasRole('admin') && empty($user->is_adviser))) {
                abort(403);
            }

            // parse adviser section from user
            $adviserSection = $user->adviser_section ?? null;
            if (! $adviserSection) {
                abort(404);
            }

            // fetch students in that section
            $students = [];
            $studentRows = \App\Models\Student::query()
                ->where('section', $adviserSection)
                ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                ->get();

            // fetch subjects that have enrollments for this section
            $subjects = Subject::query()
                ->whereHas('enrollments', function ($q) use ($adviserSection) {
                    $q->whereHas('student', function ($q2) use ($adviserSection) {
                        $q2->where('section', $adviserSection);
                    });
                })->get();

            // build a matrix student_uuid => subject_uuid => enrollment grades
            $matrix = [];

            foreach ($studentRows as $st) {
                $row = [
                    'name' => $st->name,
                    'lrn' => $st->lrn ?? null,
                    'studentId' => $st->student_id ?? null,
                ];

                // collect per-subject grades
                $matrix[$st->uuid] = [];
                foreach ($subjects as $sub) {
                    $enr = StudentSubject::query()
                        ->where('subject_uuid', $sub->uuid)
                        ->where('student_uuid', $st->uuid)
                        ->first();

                    if ($enr) {
                        $matrix[$st->uuid][$sub->uuid] = [
                            'q1' => $enr->q1 ?? null,
                            'q2' => $enr->q2 ?? null,
                            'q3' => $enr->q3 ?? null,
                            'total' => $enr->total ?? (int) round((($enr->q1 ?? 0) + ($enr->q2 ?? 0) + ($enr->q3 ?? 0)) / 3),
                        ];
                    } else {
                        $matrix[$st->uuid][$sub->uuid] = [
                            'q1' => null,
                            'q2' => null,
                            'q3' => null,
                            'total' => null,
                        ];
                    }
                }

                $row['uuid'] = $st->uuid;
                $students[] = $row;
            }

            // compute per-student averages across all subjects
            $studentAverages = [];
            foreach ($studentRows as $st) {
                $enrs = StudentSubject::query()
                    ->where('student_uuid', $st->uuid)
                    ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                    ->get();
                $avgQ1 = $enrs->avg('q1') ?? null;
                $avgQ2 = $enrs->avg('q2') ?? null;
                $avgQ3 = $enrs->avg('q3') ?? null;
                $overall = null;
                if ($avgQ1 !== null || $avgQ2 !== null || $avgQ3 !== null) {
                    $vals = array_filter([(float)($avgQ1 ?? 0), (float)($avgQ2 ?? 0), (float)($avgQ3 ?? 0)], function ($v) { return $v !== null; });
                    $overall = $vals ? (int) round(array_sum($vals) / count($vals)) : null;
                }

                $studentAverages[$st->uuid] = [
                    'q1' => $avgQ1 !== null ? (int) round($avgQ1) : null,
                    'q2' => $avgQ2 !== null ? (int) round($avgQ2) : null,
                    'q3' => $avgQ3 !== null ? (int) round($avgQ3) : null,
                    'overall' => $overall,
                ];
            }

            $selectedClass = collect($classes)->firstWhere('id', $classId) ?? [
                'id' => $classId,
                'section' => $user->grade_level ?? 'Advisory',
                'subject' => 'Advisory',
                'students' => count($students),
                'timeSchedule' => '',
                'subject_teacher_uuid' => null,
            ];

            return Inertia::render('teacher/manage-class', [
                'classes' => $classes,
                'selectedClass' => $selectedClass,
                'students' => $students,
                'canEdit' => $user->hasRole('admin') ? true : false,
                'advisorySubjects' => $subjects->map(function ($s) {
                    $teacher = DB::table('subject_teacher')
                        ->where('subject_uuid', $s->uuid)
                        ->join('users', 'subject_teacher.teacher_uuid', '=', 'users.uuid')
                        ->first(['name']);

                    return [ 'uuid' => $s->uuid, 'name' => $s->name, 'teacher' => $teacher->name ?? null ];
                })->toArray(),
                'advisoryMatrix' => $matrix,
                'studentAverages' => $studentAverages,
            ]);
        }

        // Regular subject handling
        // classId may be "{subjectUuid}-{sectionUuid}" or just "{subjectUuid}"
        $parts = explode('-', $classId);
        $sectionUuid = null;
        $subjectUuid = $classId;

        // UUIDs are 36 chars; if we have 2 parts and the last part is a UUID, treat as subject+section
        if (count($parts) === 2 && strlen($parts[1]) === 36) {
            $subjectUuid = $parts[0];
            $sectionUuid = $parts[1];
        }

        $subject = Subject::query()->where('uuid', $subjectUuid)->first();

        if (! $subject) {
            abort(404);
        }

        // check permissions: admin or assigned teacher (including substitute)
        if (! $user->hasRole('admin')) {
            $isGlobalTeacher = DB::table('subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $user->uuid)
                ->exists();

            $isSectionTeacher = DB::table('class_section_subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $user->uuid)
                ->exists();

            if (! $isGlobalTeacher && ! $isSectionTeacher) {
                abort(403);
            }
        }

        $sectionName = null;
        if ($sectionUuid) {
            $sectionModel = ClassSection::query()->where('uuid', $sectionUuid)->first();
            $sectionName = $sectionModel?->name;
        }

        $selectedClass = collect($classes)->first(fn ($c) => ($c['id'] ?? '') === $classId) ?? [
            'id' => $classId,
            'section' => $sectionName ?? $subject->code ?? 'Section',
            'subject' => $subject->name,
            'students' => $sectionName
                ? $subject->enrollments()->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))->whereHas('student', fn ($q) => $q->where('section', $sectionName))->count()
                : $subject->enrollments()->count(),
            'timeSchedule' => $subject->time_schedule ?? '',
            'subject_teacher_uuid' => null,
        ];

        $canEdit = $user->hasRole('admin') || $user->hasRole('staff') || !empty($user->is_adviser);

        $students = StudentSubject::query()->with('student')
            ->where('subject_uuid', $subject->uuid)
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->when($sectionName, fn ($q) => $q->whereHas('student', fn ($sq) => $sq->where('section', $sectionName)))
            ->get();

        $studentRows = $students->map(function ($r) {
            return [
                'name' => $r->student?->name ?? 'Unknown',
                'lrn' => $r->student?->lrn ?? null,
                'studentId' => $r->student?->student_id ?? null,
                'q1' => $r->q1 ?? 0,
                'q2' => $r->q2 ?? 0,
                'q3' => $r->q3 ?? 0,
            ];
        })->toArray();

        return Inertia::render('teacher/manage-class', [
            'classes' => $classes,
            'selectedClass' => $selectedClass,
            'students' => $studentRows,
            'canEdit' => $canEdit,
        ]);
    }
}