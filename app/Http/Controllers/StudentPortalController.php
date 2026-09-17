<?php

namespace App\Http\Controllers;

use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\Attendance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
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
                    ['label' => 'Subjects', 'href' => '/admin/subjects'],
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
            'student' => $student ? [
                'uuid' => $student->uuid,
                'name' => $student->full_name ?: $student->name,
                'first_name' => $student->first_name,
                'middle_name' => $student->middle_name,
                'last_name' => $student->last_name,
                'email' => $student->user?->email,
                'lrn' => $student->lrn,
                'student_id' => $student->student_id,
                'grade_level' => $student->grade_level,
                'section' => $student->section,
                'school_year' => $student->school_year,
                'birthday' => $student->birthday,
                'age' => $student->age,
                'contact_number' => $student->contact_number,
                'address' => $student->address,
                'address_zone_street' => $student->address_zone_street,
                'address_barangay' => $student->address_barangay,
                'address_municipality' => $student->address_municipality,
                'address_province' => $student->address_province,
                'previous_school' => $student->previous_school,
                'last_school_year' => $student->last_school_year,
                'last_grade_level' => $student->last_grade_level,
                'previous_section' => $student->previous_section,
                'profile_picture' => $student->profile_picture ?: $student->user?->profile_picture,
            ] : null,
        ]);
    }

    public function updateProfile(Request $request): RedirectResponse
    {
        $student = $this->student($request);

        if (! $student) {
            abort(404, 'Student profile not found.');
        }

        $user = $student->user;

        $data = $request->validate([
            'first_name' => 'nullable|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'birthday' => 'nullable|date',
            'contact_number' => ['nullable', 'string', 'max:50', 'regex:/^\d*$/'],
            'address_zone_street' => 'nullable|string|max:255',
            'address_barangay' => 'nullable|string|max:255',
            'address_municipality' => 'nullable|string|max:255',
            'address_province' => 'nullable|string|max:255',
            'previous_school' => 'nullable|string|max:255',
            'last_school_year' => ['nullable', 'string', 'max:50', 'regex:/^\d*(?:-\d+)*$/'],
            'last_grade_level' => ['nullable', 'string', 'max:100', 'regex:/^\d*$/'],
            'previous_section' => 'nullable|string|max:255',
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        if (! empty($data['email']) && $user) {
            $emailTaken = DB::table('users')
                ->where('email', $data['email'])
                ->where('uuid', '<>', $user->uuid)
                ->exists();

            if ($emailTaken) {
                return back()->with('error', 'Email already in use by another account.');
            }
        }

        $student->fill(collect($data)->except(['email', 'avatar', 'lrn', 'student_id'])->toArray());

        if (isset($data['lrn']) && $data['lrn'] !== null) {
            $normalizedLrn = preg_replace('/\D/', '', (string) $data['lrn']);
            $normalizedLrn = $normalizedLrn === '' ? null : $normalizedLrn;
            $data['lrn'] = $normalizedLrn;
        }

        if (! empty($data['lrn']) && $data['lrn'] !== $student->lrn) {
            $lrnTaken = DB::table('students')
                ->where('lrn', $data['lrn'])
                ->where('uuid', '<>', $student->uuid)
                ->exists();

            if ($lrnTaken) {
                return back()->with('error', 'LRN already in use by another student.');
            }
            $student->lrn = $data['lrn'];
        } elseif (array_key_exists('lrn', $data)) {
            $student->lrn = $data['lrn'];
        }

        if (! empty($data['student_id']) && $data['student_id'] !== $student->student_id) {
            $idTaken = DB::table('students')
                ->where('student_id', $data['student_id'])
                ->where('uuid', '<>', $student->uuid)
                ->exists();

            if ($idTaken) {
                return back()->with('error', 'Student ID already in use by another student.');
            }
            $student->student_id = $data['student_id'];
        } elseif (array_key_exists('student_id', $data)) {
            $student->student_id = $data['student_id'];
        }

        $student->address = trim(implode(', ', array_filter([
            $data['address_zone_street'] ?? null,
            $data['address_barangay'] ?? null,
            $data['address_municipality'] ?? null,
            $data['address_province'] ?? null,
        ]))) ?: null;
        $student->save();

        if ($user && isset($data['email'])) {
            $user->email = $data['email'];
            $user->save();
        }

        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $destDir = base_path('resources/assets/profile_pictures/students');
            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $filename = ($student->uuid ?? uniqid()).'.'.$avatar->getClientOriginalExtension();
            $avatar->move($destDir, $filename);

            $student->profile_picture = 'profile_pictures/students/'.$filename;
            $student->save();

            if ($user) {
                $user->profile_picture = $student->profile_picture;
                $user->save();
            }
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return back();
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