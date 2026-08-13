<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\Attendance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentPortalController extends Controller
{
    private function student(Request $request): ?Student
    {
        $user = $request->user();

        if (! $user) {
            return null;
        }

        return $user->student()->first();
    }

    public function subjectsEnrolled(Request $request): Response
    {
        $student = $this->student($request);

        $currentSchoolYear = $student?->school_year;

        $enrolledSubjects = $student
            ? $student->enrollments()
                ->with('subject')
                ->when($currentSchoolYear, fn ($query) => $query->where('school_year', $currentSchoolYear))
                ->get()
                ->sortBy(fn (StudentSubject $enrollment) => $enrollment->subject?->name ?? '')
                ->values()
                ->map(fn (StudentSubject $enrollment) => [
                    'subjectName' => $enrollment->subject?->name,
                    'subjectCode' => $enrollment->subject?->code,
                    'timeSchedule' => $enrollment->subject?->time_schedule,
                    'subjectTeacher' => $enrollment->subject?->subject_teacher,
                ])
                ->all()
            : [];

        return Inertia::render('student/subjects-enrolled', [
            'student' => $student ? [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
            ] : null,
            'currentSchoolYear' => $currentSchoolYear,
            'enrolledSubjects' => $enrolledSubjects,
        ]);
    }

    public function dashboard(Request $request): Response
    {
        $student = $this->student($request);
        $user = $request->user();

        // If user is admin/principal/registrar/staff, show admin dashboard with tools (bypass portal restrictions)
        if ($user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar') || $user->hasRole('staff'))) {
            return Inertia::render('admin/dashboard', [
                'user' => $user ? ['name' => $user->name, 'email' => $user->email, 'roles' => $user->roles()->pluck('name')->all()] : null,
                'tools' => [
                    ['label' => 'Assignments', 'href' => '/admin/assignments'],
                    ['label' => 'Enrollments', 'href' => '/admin/enrollments'],
                    ['label' => 'Manage Users', 'href' => '/admin/users'],
                ],
            ]);
        }

        $currentSchoolYear = $student?->school_year;

        $enrollments = $student
            ? $student->enrollments()
                ->when($currentSchoolYear, fn ($query) => $query->where('school_year', $currentSchoolYear))
                ->get()
            : collect();

        $subjectsEnrolledCount = $enrollments->count();

        $averageGrade = $enrollments->isNotEmpty()
            ? round($enrollments->avg('total') ?? 0, 1)
            : null;

        $announcements = $this->getVisibleAnnouncements($request);
        $unseenAnnouncementsCount = $announcements->count();

        return Inertia::render('dashboard', [
            'student' => $student ? [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name ?: strtok($student->name, ' ') ?: $student->name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
            ] : null,
            'subjectsEnrolledCount' => $subjectsEnrolledCount,
            'averageGrade' => $averageGrade,
            'unseenAnnouncementsCount' => $unseenAnnouncementsCount,
        ]);
    }

    public function profile(Request $request): Response
    {
        $student = $this->student($request);

        if (! $student) {
            abort(404, 'Student profile not found.');
        }

        return Inertia::render('student/profile', [
            'student' => $student,
        ]);
    }

    private function getVisibleAnnouncements(Request $request)
    {
        $user = $request->user();
        $studentSection = null;
        $classSectionUuid = null;

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $studentSection = $user->student?->section;
            if ($studentSection) {
                $classSectionUuid = \App\Models\ClassSection::query()->where('name', $studentSection)->value('uuid');
            }
        }

        $query = \App\Models\Announcement::query();

        if ($user && method_exists($user, 'hasRole') && $user->hasRole('student')) {
            $query->where(function ($builder) use ($studentSection, $classSectionUuid) {
                $builder->where('scope', 'system');

                if ($studentSection !== null) {
                    $builder->orWhere(function ($sectionQuery) use ($studentSection) {
                        $sectionQuery->where('scope', 'section')
                            ->where('section_name', $studentSection);
                    });
                }

                if ($classSectionUuid !== null) {
                    $builder->orWhere(function ($classQuery) use ($classSectionUuid) {
                        $classQuery->where('scope', 'class')
                            ->where('class_section_uuid', $classSectionUuid);
                    });
                }
            });
        }

        return $query->get();
    }

    public function grades(Request $request): Response
    {
        $student = $this->student($request);

        $yearLevelGroups = $student
            ? $student->enrollments()
                ->with('subject')
                ->get()
                ->groupBy(fn (StudentSubject $enrollment) => $enrollment->year_level.'|'.$enrollment->school_year)
                ->map(function ($enrollments, string $groupKey) use ($student) {
                    [$yearLevel, $schoolYear] = explode('|', $groupKey, 2);
                    $firstEnrollment = $enrollments->first();

                    return [
                        'yearLevel' => $yearLevel,
                        'schoolYear' => $schoolYear,
                        'section' => $firstEnrollment?->section ?? $student->section,
                        'rows' => $enrollments
                            ->sortBy(fn (StudentSubject $enrollment) => $enrollment->subject?->name ?? '')
                            ->values()
                            ->map(fn (StudentSubject $enrollment) => [
                                'subjectCode' => $enrollment->subject?->code,
                                'subjectName' => $enrollment->subject?->name,
                                'quarters' => [
                                    (int) ($enrollment->q1 ?? 0),
                                    (int) ($enrollment->q2 ?? 0),
                                    (int) ($enrollment->q3 ?? 0),
                                ],
                                'total' => (int) ($enrollment->total ?? round(((int) ($enrollment->q1 ?? 0) + (int) ($enrollment->q2 ?? 0) + (int) ($enrollment->q3 ?? 0)) / 3)),
                            ])
                            ->all(),
                    ];
                })
                ->values()
                ->all()
            : [];

        return Inertia::render('student/grades', [
            'student' => $student ? [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
            ] : null,
            'yearLevelGroups' => $yearLevelGroups,
        ]);
    }

    public function attendance(Request $request): Response
    {
        $student = $this->student($request);

        if (! $student) {
            abort(403, 'Student profile not found.');
        }

        // Get overall stats
        $totalClasses = Attendance::where('student_uuid', $student->uuid)->count();
        $presentCount = Attendance::where('student_uuid', $student->uuid)->where('status', 'present')->count();
        $lateCount = Attendance::where('student_uuid', $student->uuid)->where('status', 'late')->count();
        $absentCount = Attendance::where('student_uuid', $student->uuid)->where('status', 'absent')->count();

        $overallRate = $totalClasses > 0 ? round((($presentCount + $lateCount) / $totalClasses) * 100) : 0;

        // Group attendance by subject
        $attendanceBySubject = \App\Models\Subject::whereHas('attendanceSessions', function ($q) use ($student) {
            $q->whereHas('attendances', function ($q2) use ($student) {
                $q2->where('student_uuid', $student->uuid);
            });
        })->with(['attendanceSessions' => function ($q) use ($student) {
            $q->whereHas('attendances', function ($q2) use ($student) {
                $q2->where('student_uuid', $student->uuid);
            })->with(['attendances' => function ($q2) use ($student) {
                $q2->where('student_uuid', $student->uuid);
            }]);
        }])->get()->map(function ($subject) {
            $total = $subject->attendanceSessions->count();
            $present = 0;
            $late = 0;
            $absent = 0;
            
            $history = $subject->attendanceSessions->map(function ($session) use (&$present, &$late, &$absent) {
                $attendance = $session->attendances->first();
                if ($attendance) {
                    if ($attendance->status === 'present') $present++;
                    if ($attendance->status === 'late') $late++;
                    if ($attendance->status === 'absent') $absent++;
                }
                
                return [
                    'date' => $session->date->format('Y-m-d'),
                    'time' => $session->start_time,
                    'status' => $attendance ? $attendance->status : 'unknown',
                    'notes' => $attendance ? $attendance->notes : null,
                ];
            })->sortByDesc('date')->values();
            
            return [
                'subjectName' => $subject->name,
                'subjectCode' => $subject->code,
                'stats' => [
                    'total' => $total,
                    'present' => $present,
                    'late' => $late,
                    'absent' => $absent,
                    'rate' => $total > 0 ? round((($present + $late) / $total) * 100) : 0,
                ],
                'history' => $history,
            ];
        });

        return Inertia::render('student/attendance', [
            'student' => [
                'name' => $student->full_name ?: $student->name,
                'lrn' => $student->lrn,
            ],
            'stats' => [
                'overallRate' => $overallRate,
                'present' => $presentCount,
                'late' => $lateCount,
                'absent' => $absentCount,
                'total' => $totalClasses,
            ],
            'attendanceBySubject' => $attendanceBySubject,
        ]);
    }
}