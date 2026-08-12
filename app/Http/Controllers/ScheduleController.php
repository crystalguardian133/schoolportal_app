<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\Schedule;
use App\Models\StudentSubject;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ScheduleController extends Controller
{
    private function authorizeSchedule(Request $request): User
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasManageSchedules = method_exists($user, 'hasPermission') && $user->hasPermission('manage schedules');
        $isAdviser = ! empty($user->is_adviser) && ! empty($user->adviser_section);

        if (! $hasAccessAdmin && ! $hasManageSchedules && ! $isAdviser) {
            abort(403);
        }

        return $user;
    }

    public function create(Request $request): Response
    {
        $user = $this->authorizeSchedule($request);

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasManageSchedules = method_exists($user, 'hasPermission') && $user->hasPermission('manage schedules');
        $isAdviser = ! empty($user->is_adviser) && ! empty($user->adviser_section);
        $canSwitchSections = ($hasAccessAdmin || $hasManageSchedules) && ! $isAdviser;

        $section = null;
        if ($canSwitchSections && $request->query('section_uuid')) {
            $section = ClassSection::query()->where('uuid', $request->query('section_uuid'))->first();
        } elseif ($canSwitchSections) {
            $section = ClassSection::query()->orderBy('name')->first();
        } else {
            $section = ClassSection::query()->where('name', $user->adviser_section)->first();
        }

        if (! $section) {
            return Inertia::render('admin/schedule-create', [
                'section' => null,
                'subjects' => [],
                'schedules' => [],
                'allSections' => [],
                'hasAccessAdmin' => $canSwitchSections,
                'schoolYear' => null,
            ]);
        }

        $subjectUuids = DB::table('class_section_subjects')
            ->where('class_section_uuid', $section->uuid)
            ->pluck('subject_uuid');

        $sectionAssignments = DB::table('class_section_subject_teacher')
            ->where('class_section_uuid', $section->uuid)
            ->get()
            ->keyBy(fn ($row) => $row->subject_uuid);

        $subjects = Subject::query()
            ->select(['uuid', 'name', 'code'])
            ->whereIn('uuid', $subjectUuids)
            ->orderBy('name')
            ->get()
            ->map(function (Subject $subject) use ($sectionAssignments) {
                $assignment = $sectionAssignments->get($subject->uuid);
                $teacher = null;
                if ($assignment) {
                    $teacher = User::query()->where('uuid', $assignment->teacher_uuid)->first(['uuid', 'name']);
                }

                return [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'teacher' => $teacher ? ['uuid' => $teacher->uuid, 'name' => $teacher->name] : null,
                ];
            })
            ->values();

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        $allSchedules = Schedule::query()
            ->where('school_year', $schoolYear)
            ->with(['subject', 'teacher'])
            ->get()
            ->map(function(Schedule $s) {
                $sectionName = ClassSection::query()->where('uuid', $s->class_section_uuid)->value('name');
                return [
                    'id' => $s->id,
                    'class_section_uuid' => $s->class_section_uuid,
                    'section_name' => $sectionName,
                    'subject' => $s->subject?->name,
                    'subject_code' => $s->subject?->code,
                    'teacher_uuid' => $s->teacher_uuid,
                    'teacher' => $s->teacher?->name,
                    'day' => $s->day,
                    'start_time' => $s->start_time,
                    'end_time' => $s->end_time,
                    'room' => $s->room,
                ];
            })
            ->values();

        $allTeachers = User::query()
            ->whereIn('uuid', DB::table('class_section_subject_teacher')->pluck('teacher_uuid'))
            ->orderBy('name')
            ->get(['uuid', 'name']);

        $allRooms = Schedule::query()
            ->where('school_year', $schoolYear)
            ->whereNotNull('room')
            ->where('room', '!=', '')
            ->distinct()
            ->orderBy('room')
            ->pluck('room');

        return Inertia::render('admin/schedule-create', [
            'section' => [
                'uuid' => $section->uuid,
                'name' => $section->name,
                'grade_level' => $section->grade_level,
            ],
            'subjects' => $subjects,
            'allSchedules' => $allSchedules,
            'allTeachers' => $allTeachers,
            'allRooms' => $allRooms,
            'allSections' => $canSwitchSections
                ? ClassSection::query()->select(['uuid', 'name', 'grade_level'])->orderBy('name')->get()
                : [],
            'hasAccessAdmin' => $canSwitchSections,
            'schoolYear' => $schoolYear,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->authorizeSchedule($request);

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasManageSchedules = method_exists($user, 'hasPermission') && $user->hasPermission('manage schedules');
        $isAdviser = ! empty($user->is_adviser) && ! empty($user->adviser_section);
        $canSwitchSections = ($hasAccessAdmin || $hasManageSchedules) && ! $isAdviser;

        $validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        $dayRule = implode(',', $validDays);

        $entries = $request->validate([
            'section_uuid' => 'required|string',
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'required|string',
            'entries' => 'required|array|min:1',
            'entries.*.day' => ['required', "in:{$dayRule}"],
            'entries.*.start_time' => 'required|string',
            'entries.*.end_time' => 'required|string',
            'entries.*.room' => 'nullable|string',
        ]);

        $section = ClassSection::query()->where('uuid', $entries['section_uuid'])->first();
        if (! $section) {
            return back()->with('error', 'Section not found.');
        }

        if (! $canSwitchSections) {
            if ($section->name !== $user->adviser_section) {
                abort(403);
            }
        }

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        foreach ($entries['entries'] as $entry) {
            $teacherOverlap = Schedule::query()
                ->where('teacher_uuid', $entries['teacher_uuid'])
                ->where('school_year', $schoolYear)
                ->where('day', $entry['day'])
                ->where(function ($query) use ($entry) {
                    $query->where('start_time', '<', $entry['end_time'])
                          ->where('end_time', '>', $entry['start_time']);
                })
                ->exists();

            if ($teacherOverlap) {
                return back()->with('error', "Teacher has a schedule overlap on {$entry['day']} between {$entry['start_time']} and {$entry['end_time']}.");
            }

            if (!empty($entry['room'])) {
                $roomOverlap = Schedule::query()
                    ->where('room', $entry['room'])
                    ->where('school_year', $schoolYear)
                    ->where('day', $entry['day'])
                    ->where(function ($query) use ($entry) {
                        $query->where('start_time', '<', $entry['end_time'])
                              ->where('end_time', '>', $entry['start_time']);
                    })
                    ->exists();

                if ($roomOverlap) {
                    return back()->with('error', "Room {$entry['room']} is already booked on {$entry['day']} between {$entry['start_time']} and {$entry['end_time']}.");
                }
            }

            Schedule::create([
                'class_section_uuid' => $entries['section_uuid'],
                'subject_uuid' => $entries['subject_uuid'],
                'teacher_uuid' => $entries['teacher_uuid'],
                'day' => $entry['day'],
                'start_time' => $entry['start_time'],
                'end_time' => $entry['end_time'],
                'room' => $entry['room'] ?? null,
                'school_year' => $schoolYear,
            ]);
        }

        return back()->with('success', 'Schedule entries created.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeSchedule($request);

        $schedule = Schedule::query()->where('id', $id)->first();
        if (! $schedule) {
            return back()->with('error', 'Schedule entry not found.');
        }

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasManageSchedules = method_exists($user, 'hasPermission') && $user->hasPermission('manage schedules');
        $isAdviser = ! empty($user->is_adviser) && ! empty($user->adviser_section);
        $canSwitchSections = ($hasAccessAdmin || $hasManageSchedules) && ! $isAdviser;

        if (! $canSwitchSections) {
            $section = ClassSection::query()->where('uuid', $schedule->class_section_uuid)->first();
            if (! $section || $section->name !== $user->adviser_section) {
                abort(403);
            }
        }

        $schedule->delete();

        return back()->with('success', 'Schedule entry removed.');
    }

    public function teacherSchedule(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        $schedules = Schedule::query()
            ->where('teacher_uuid', $user->uuid)
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->with(['subject', 'classSection'])
            ->get()
            ->map(fn (Schedule $s) => [
                'day' => $s->day,
                'start_time' => $s->start_time,
                'end_time' => $s->end_time,
                'subject' => $s->subject?->name ?? '',
                'section' => $s->classSection?->name ?? '',
                'room' => $s->room ?? '',
            ])
            ->values();

        return Inertia::render('teacher/schedule', [
            'schedules' => $schedules,
        ]);
    }

    public function studentSubjectsEnrolled(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $student = $user->student()->first();
        if (! $student) {
            return Inertia::render('student/subjects-enrolled', [
                'student' => null,
                'currentSchoolYear' => null,
                'enrolledSubjects' => [],
            ]);
        }

        $currentSchoolYear = $student->school_year;

        $enrolledSubjects = $student->enrollments()
            ->with('subject')
            ->when($currentSchoolYear, fn ($q) => $q->where('school_year', $currentSchoolYear))
            ->get()
            ->sortBy(fn ($e) => $e->subject?->name ?? '')
            ->values()
            ->map(function ($enrollment) {
                $subject = $enrollment->subject;

                $scheduleEntry = null;
                if ($subject && $enrollment->student?->section) {
                    $section = ClassSection::query()
                        ->where('name', $enrollment->student->section)
                        ->where('school_year', $enrollment->school_year)
                        ->first();
                    if ($section) {
                        $scheduleEntry = Schedule::query()
                            ->where('class_section_uuid', $section->uuid)
                            ->where('subject_uuid', $subject->uuid)
                            ->orderBy('day')
                            ->orderBy('start_time')
                            ->get()
                            ->map(fn ($s) => $s->day . ' ' . $s->start_time . ' - ' . $s->end_time)
                            ->implode(', ');
                    }
                }

                $teacher = null;
                if ($subject && $enrollment->student?->section) {
                    $section = ClassSection::query()
                        ->where('name', $enrollment->student->section)
                        ->where('school_year', $enrollment->school_year)
                        ->first();
                    if ($section) {
                        $assignment = DB::table('class_section_subject_teacher')
                            ->where('class_section_uuid', $section->uuid)
                            ->where('subject_uuid', $subject->uuid)
                            ->first();
                        if ($assignment) {
                            $teacherUser = User::query()->where('uuid', $assignment->teacher_uuid)->first();
                            $teacher = $teacherUser?->name;
                        }
                    }
                }

                return [
                    'subjectName' => $subject?->name,
                    'subjectCode' => $subject?->code,
                    'timeSchedule' => $scheduleEntry ?: $subject?->time_schedule,
                    'subjectTeacher' => $teacher ?: $subject?->subject_teacher,
                ];
            })
            ->all();

        return Inertia::render('student/subjects-enrolled', [
            'student' => [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
            ],
            'currentSchoolYear' => $currentSchoolYear,
            'enrolledSubjects' => $enrolledSubjects,
        ]);
    }

    public function teacherClasses(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        $assignedSubjectUuids = DB::table('subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->pluck('subject_uuid')
            ->toArray();

        $sectionAssignments = DB::table('class_section_subject_teacher')
            ->where('teacher_uuid', $user->uuid)
            ->get();

        // Subjects with per-section assignments should not expand from global
        $subjectsWithPerSection = $sectionAssignments->pluck('subject_uuid')->unique()->toArray();

        $classes = [];

        foreach ($assignedSubjectUuids as $subjectUuid) {
            if (in_array($subjectUuid, $subjectsWithPerSection)) continue;

            $subject = Subject::query()->where('uuid', $subjectUuid)->first();
            if (! $subject) continue;

            $sections = $subject->classSections
                ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear));

            if ($sections->isEmpty()) continue;

            foreach ($sections as $section) {
                $enrollmentCount = StudentSubject::query()
                    ->where('subject_uuid', $subjectUuid)
                    ->where('school_year', $schoolYear)
                    ->where('section', $section->name)
                    ->count();

                $scheduleEntries = Schedule::query()
                    ->where('subject_uuid', $subjectUuid)
                    ->where('class_section_uuid', $section->uuid)
                    ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                    ->get()
                    ->map(fn ($s) => $s->day . ' ' . $s->start_time . ' - ' . $s->end_time)
                    ->implode(', ');

                $classes[] = [
                    'id' => $subject->uuid . '-' . $section->uuid,
                    'subjectId' => $subject->uuid,
                    'sectionUuid' => $section->uuid,
                    'section' => $section->name,
                    'gradeLevel' => $section->grade_level,
                    'subject' => $subject->name,
                    'students' => $enrollmentCount,
                    'timeSchedule' => $scheduleEntries ?: ($subject->time_schedule ?? ''),
                    'subject_teacher_uuid' => $user->uuid,
                ];
            }
        }

        foreach ($sectionAssignments as $assignment) {
            $alreadyAdded = false;
            foreach ($classes as $c) {
                if ($c['subjectId'] === $assignment->subject_uuid && $c['sectionUuid'] === $assignment->class_section_uuid) {
                    $alreadyAdded = true;
                    break;
                }
            }
            if ($alreadyAdded) continue;

            $section = ClassSection::query()->where('uuid', $assignment->class_section_uuid)->first();
            if (! $section) continue;

            if ($schoolYear && $section->school_year !== $schoolYear) continue;

            $subject = Subject::query()->where('uuid', $assignment->subject_uuid)->first();
            if (! $subject) continue;

            $enrollmentCount = StudentSubject::query()
                ->where('subject_uuid', $assignment->subject_uuid)
                ->where('school_year', $schoolYear)
                ->where('section', $section->name)
                ->count();

            $scheduleEntries = Schedule::query()
                ->where('subject_uuid', $assignment->subject_uuid)
                ->where('class_section_uuid', $assignment->class_section_uuid)
                ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                ->get()
                ->map(fn ($s) => $s->day . ' ' . $s->start_time . ' - ' . $s->end_time)
                ->implode(', ');

            $classes[] = [
                'id' => $subject->uuid . '-' . $section->uuid,
                'subjectId' => $subject->uuid,
                'sectionUuid' => $section->uuid,
                'section' => $section->name,
                'gradeLevel' => $section->grade_level,
                'subject' => $subject->name,
                'students' => $enrollmentCount,
                'timeSchedule' => $scheduleEntries ?: ($subject->time_schedule ?? ''),
                'subject_teacher_uuid' => $user->uuid,
            ];
        }

        if (! empty($user->is_adviser) && ! empty($user->adviser_section)) {
            $advisorySection = ClassSection::query()
                ->where('name', $user->adviser_section)
                ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                ->first();

            if ($advisorySection) {
                $advisoryStudents = \App\Models\Student::query()
                    ->where('section_uuid', $advisorySection->uuid)
                    ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
                    ->count();

                $classes[] = [
                    'id' => 'advisory-' . $advisorySection->uuid,
                    'subjectId' => 'advisory',
                    'sectionUuid' => $advisorySection->uuid,
                    'section' => $advisorySection->name,
                    'gradeLevel' => $advisorySection->grade_level,
                    'subject' => 'Advisory',
                    'students' => $advisoryStudents,
                    'timeSchedule' => '',
                    'subject_teacher_uuid' => null,
                ];
            }
        }

        $grouped = collect($classes)
            ->groupBy('section')
            ->map(fn ($items, $sectionName) => [
                'section' => $sectionName,
                'gradeLevel' => $items->first()['gradeLevel'],
                'classes' => $items->values(),
            ])
            ->values();

        return Inertia::render('teacher/classes', [
            'classes' => $classes,
            'sections' => $grouped,
        ]);
    }
}
