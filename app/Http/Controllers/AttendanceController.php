<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\ClassSection;
use App\Models\Schedule;
use App\Models\Student;
use App\Models\StudentSubject;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    private function authorizeAttendance(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $isTeacher = method_exists($user, 'hasPermission') && $user->hasPermission('access teacher dashboard');
        $hasManageSchedules = method_exists($user, 'hasPermission') && $user->hasPermission('manage schedules');

        if (! $isTeacher && ! $hasManageSchedules) {
            abort(403);
        }

        return $user;
    }

    public function index(Request $request): Response
    {
        $user = $this->authorizeAttendance($request);

        $schoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        $sessions = AttendanceSession::query()
            ->where('teacher_uuid', $user->uuid)
            ->with(['subject', 'classSection'])
            ->whereHas('schedule', fn ($q) => $q->where('school_year', $schoolYear))
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->get()
            ->map(function (AttendanceSession $session) {
                $totalStudents = StudentSubject::query()
                    ->where('subject_uuid', $session->subject_uuid)
                    ->where('section', $session->classSection?->name)
                    ->count();

                $presentCount = $session->attendances()
                    ->whereIn('status', ['present', 'late'])
                    ->count();

                return [
                    'id' => $session->id,
                    'uuid' => $session->uuid,
                    'subject' => $session->subject?->name,
                    'section' => $session->classSection?->name,
                    'date' => $session->date->format('Y-m-d'),
                    'start_time' => $session->start_time,
                    'end_time' => $session->end_time,
                    'duration_minutes' => $session->duration_minutes,
                    'is_active' => $session->is_active,
                    'total_students' => $totalStudents,
                    'present_count' => $presentCount,
                    'window_start' => $session->windowStart(),
                    'window_end' => $session->windowEnd(),
                ];
            });

        $teacherClasses = $this->getTeacherClasses($user, $schoolYear);

        return Inertia::render('teacher/attendance', [
            'sessions' => $sessions,
            'teacherClasses' => $teacherClasses,
        ]);
    }

    public function store(Request $request)
    {
        $user = $this->authorizeAttendance($request);

        $data = $request->validate([
            'schedule_id' => 'required|integer',
            'date' => 'required|date',
            'duration_minutes' => 'required|integer|min:1|max:120',
        ]);

        $schedule = Schedule::query()->find($data['schedule_id']);
        if (! $schedule) {
            return back()->withErrors(['schedule_id' => 'Schedule not found.']);
        }

        $existing = AttendanceSession::query()
            ->where('teacher_uuid', $user->uuid)
            ->where('schedule_id', $schedule->id)
            ->where('date', $data['date'])
            ->first();

        if ($existing) {
            return back()->withErrors(['schedule_id' => 'A session already exists for this schedule on this date.']);
        }

        $session = AttendanceSession::create([
            'schedule_id' => $schedule->id,
            'teacher_uuid' => $user->uuid,
            'subject_uuid' => $schedule->subject_uuid,
            'class_section_uuid' => $schedule->class_section_uuid,
            'date' => $data['date'],
            'start_time' => $schedule->start_time,
            'end_time' => $schedule->end_time,
            'duration_minutes' => $data['duration_minutes'],
        ]);

        return back()->with('success', "Attendance session created. QR window: {$session->windowStart()} - {$session->windowEnd()}.");
    }

    public function show(Request $request, int $id): Response
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $id)
            ->where('teacher_uuid', $user->uuid)
            ->with(['subject', 'classSection'])
            ->firstOrFail();

        $enrolledStudents = StudentSubject::query()
            ->where('subject_uuid', $session->subject_uuid)
            ->where('section', $session->classSection?->name)
            ->with('student')
            ->get()
            ->map(function ($enrollment) use ($session) {
                $attendance = $session->attendances()
                    ->where('student_uuid', $enrollment->student?->uuid)
                    ->first();

                return [
                    'student_uuid' => $enrollment->student?->uuid,
                    'student_name' => $enrollment->student?->full_name ?? $enrollment->student?->name,
                    'lrn' => $enrollment->student?->lrn,
                    'qr_token' => $enrollment->student?->qr_token,
                    'status' => $attendance?->status ?? 'absent',
                    'recorded_by' => $attendance?->recorded_by ?? null,
                    'scanned_at' => $attendance?->scanned_at?->format('H:i:s'),
                    'recorded_at' => $attendance?->recorded_at?->format('H:i:s'),
                    'notes' => $attendance?->notes,
                ];
            })
            ->sortBy('student_name')
            ->values();

        $enrolledUuids = $enrolledStudents->pluck('student_uuid')->toArray();

        return Inertia::render('teacher/attendance-session', [
            'session' => [
                'id' => $session->id,
                'uuid' => $session->uuid,
                'subject' => $session->subject?->name,
                'section' => $session->classSection?->name,
                'sectionUuid' => $session->class_section_uuid,
                'subjectUuid' => $session->subject_uuid,
                'date' => $session->date->format('Y-m-d'),
                'start_time' => $session->start_time,
                'end_time' => $session->end_time,
                'duration_minutes' => $session->duration_minutes,
                'is_active' => $session->is_active,
                'window_start' => $session->windowStart(),
                'window_end' => $session->windowEnd(),
            ],
            'students' => $enrolledStudents,
            'enrolledUuids' => $enrolledUuids,
        ]);
    }

    public function toggleActive(Request $request, int $id)
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $id)
            ->where('teacher_uuid', $user->uuid)
            ->firstOrFail();

        $session->update(['is_active' => ! $session->is_active]);

        return back()->with('success', $session->is_active ? 'Session activated.' : 'Session deactivated.');
    }

    public function destroy(Request $request, int $id)
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $id)
            ->where('teacher_uuid', $user->uuid)
            ->firstOrFail();

        $session->delete();

        return back()->with('success', 'Session deleted.');
    }

    public function scanStudentQr(Request $request, int $sessionId): JsonResponse
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $sessionId)
            ->where('teacher_uuid', $user->uuid)
            ->first();

        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Session not found.'], 404);
        }

        $data = $request->validate([
            'student_qr_token' => 'required|string',
        ]);

        $student = Student::query()->where('qr_token', $data['student_qr_token'])->first();
        if (! $student) {
            return response()->json([
                'success' => false,
                'message' => 'No student found with this QR code.',
                'reason' => 'unknown_student',
            ], 404);
        }

        $isEnrolled = StudentSubject::query()
            ->where('student_uuid', $student->uuid)
            ->where('subject_uuid', $session->subject_uuid)
            ->where('section', $session->classSection?->name)
            ->exists();

        if (! $isEnrolled) {
            $studentSections = StudentSubject::query()
                ->where('student_uuid', $student->uuid)
                ->with('subject')
                ->get()
                ->pluck('section')
                ->unique()
                ->values()
                ->toArray();

            return response()->json([
                'success' => false,
                'message' => "{$student->full_name} is not enrolled in {$session->classSection?->name}. Student sections: " . implode(', ', $studentSections) . '. Override to record attendance.',
                'reason' => 'wrong_section',
                'student' => [
                    'uuid' => $student->uuid,
                    'name' => $student->full_name,
                    'lrn' => $student->lrn,
                    'sections' => $studentSections,
                ],
            ], 409);
        }

        return $this->recordAttendance($session, $student, 'qr');
    }

    public function overrideScan(Request $request, int $sessionId): JsonResponse
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $sessionId)
            ->where('teacher_uuid', $user->uuid)
            ->first();

        if (! $session) {
            return response()->json(['success' => false, 'message' => 'Session not found.'], 404);
        }

        $data = $request->validate([
            'student_uuid' => 'required|string',
        ]);

        $student = Student::query()->where('uuid', $data['student_uuid'])->first();
        if (! $student) {
            return response()->json(['success' => false, 'message' => 'Student not found.'], 404);
        }

        return $this->recordAttendance($session, $student, 'manual', 'Cross-section override');
    }

    public function searchStudents(Request $request, int $sessionId)
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $sessionId)
            ->where('teacher_uuid', $user->uuid)
            ->firstOrFail();

        $query = $request->query('q', '');

        if (strlen($query) < 2) {
            return response()->json(['students' => []]);
        }

        $students = Student::query()
            ->where('school_year', $session->date->copy()->format('Y') . '-' . $session->date->copy()->addYear()->format('Y'))
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('first_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhere('lrn', 'like', "%{$query}%");
            })
            ->limit(20)
            ->get()
            ->map(function (Student $s) {
                return [
                    'uuid' => $s->uuid,
                    'name' => $s->full_name,
                    'lrn' => $s->lrn,
                    'section' => $s->section,
                ];
            });

        return response()->json(['students' => $students]);
    }

    public function manualRecord(Request $request, int $sessionId)
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $sessionId)
            ->where('teacher_uuid', $user->uuid)
            ->firstOrFail();

        $data = $request->validate([
            'student_uuid' => 'required|string',
            'status' => 'required|in:present,late,absent,excused',
            'notes' => 'nullable|string',
        ]);

        $student = Student::query()->where('uuid', $data['student_uuid'])->first();
        if (! $student) {
            return back()->withErrors(['student_uuid' => 'Student not found.']);
        }

        Attendance::updateOrCreate(
            [
                'attendance_session_id' => $session->id,
                'student_uuid' => $data['student_uuid'],
            ],
            [
                'status' => $data['status'],
                'recorded_by' => 'manual',
                'recorded_at' => now(),
                'notes' => $data['notes'] ?? null,
            ]
        );

        return back()->with('success', "Attendance recorded for {$student->full_name}.");
    }

    public function bulkManualRecord(Request $request, int $sessionId)
    {
        $user = $this->authorizeAttendance($request);

        $session = AttendanceSession::query()
            ->where('id', $sessionId)
            ->where('teacher_uuid', $user->uuid)
            ->firstOrFail();

        $data = $request->validate([
            'records' => 'required|array',
            'records.*.student_uuid' => 'required|string',
            'records.*.status' => 'required|in:present,late,absent,excused',
        ]);

        foreach ($data['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'attendance_session_id' => $session->id,
                    'student_uuid' => $record['student_uuid'],
                ],
                [
                    'status' => $record['status'],
                    'recorded_by' => 'manual',
                    'recorded_at' => now(),
                ]
            );
        }

        return back()->with('success', 'Attendance updated.');
    }

    public function studentQrCode(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $student = Student::query()->where('user_uuid', $user->uuid)->first();

        return Inertia::render('student/qr-code', [
            'student' => $student ? [
                'name' => $student->full_name,
                'lrn' => $student->lrn,
                'section' => $student->section,
                'gradeLevel' => $student->grade_level,
                'qrToken' => $student->qr_token,
            ] : null,
        ]);
    }

    private function recordAttendance(AttendanceSession $session, Student $student, string $method, ?string $notes = null): JsonResponse
    {
        $now = \Carbon\Carbon::now();
        $windowStart = \Carbon\Carbon::parse($session->windowStart());
        $lateThreshold = $windowStart->copy()->addMinutes(5);

        $status = $now->gt($lateThreshold) ? 'late' : 'present';

        Attendance::updateOrCreate(
            [
                'attendance_session_id' => $session->id,
                'student_uuid' => $student->uuid,
            ],
            [
                'status' => $status,
                'recorded_by' => $method,
                'scanned_at' => $method === 'qr' ? $now : null,
                'recorded_at' => $now,
                'notes' => $notes,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => "Attendance recorded for {$student->full_name} as {$status}.",
            'status' => $status,
            'student' => [
                'uuid' => $student->uuid,
                'name' => $student->full_name,
                'lrn' => $student->lrn,
            ],
        ]);
    }

    private function getTeacherClasses($user, $schoolYear): array
    {
        $schedules = Schedule::query()
            ->where('teacher_uuid', $user->uuid)
            ->with(['subject', 'classSection'])
            ->when($schoolYear, fn ($q) => $q->where('school_year', $schoolYear))
            ->get();

        return $schedules->map(fn (Schedule $s) => [
            'id' => $s->id,
            'subject' => $s->subject?->name,
            'section' => $s->classSection?->name,
            'day' => $s->day,
            'start_time' => $s->start_time,
            'end_time' => $s->end_time,
        ])->values()->toArray();
    }
}
