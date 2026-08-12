<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Student;
use App\Models\StudentSubject;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;

class AdviserDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        if (!$user || !$user->is_adviser || !$user->adviser_section) {
            abort(403, 'Unauthorized. You are not assigned as an adviser.');
        }

        $activeSchoolYear = DB::table('school_years')
            ->where('status', 'active')
            ->value('name');

        // Get students in this section for the active school year
        $students = Student::query()
            ->where('section', $user->adviser_section)
            ->where('school_year', $activeSchoolYear)
            ->orderBy('last_name')
            ->get();

        $studentUuids = $students->pluck('uuid');

        // Get grades overview
        $enrollments = StudentSubject::query()
            ->whereIn('student_uuid', $studentUuids)
            ->where('school_year', $activeSchoolYear)
            ->get();

        // Get attendance overview
        $attendances = Attendance::query()
            ->whereIn('student_uuid', $studentUuids)
            ->whereHas('session', function($q) use ($activeSchoolYear) {
                $q->whereHas('schedule', function($q2) use ($activeSchoolYear) {
                    $q2->where('school_year', $activeSchoolYear);
                });
            })
            ->get();

        $studentsData = $students->map(function ($student) use ($enrollments, $attendances) {
            $studentGrades = $enrollments->where('student_uuid', $student->uuid);
            $totalSubjects = $studentGrades->count();
            $average = $totalSubjects > 0 ? round($studentGrades->avg('total') ?? 0, 1) : null;
            $failing = $studentGrades->filter(fn($g) => $g->total !== null && $g->total < 75)->count();

            $studentAttendance = $attendances->where('student_uuid', $student->uuid);
            $totalClasses = $studentAttendance->count();
            $present = $studentAttendance->whereIn('status', ['present', 'late'])->count();
            $absent = $studentAttendance->where('status', 'absent')->count();
            
            $attendanceRate = $totalClasses > 0 ? round(($present / $totalClasses) * 100) : 0;

            return [
                'uuid' => $student->uuid,
                'name' => $student->full_name ?: $student->name,
                'lrn' => $student->lrn,
                'grades' => [
                    'average' => $average,
                    'failing_count' => $failing,
                    'subjects_count' => $totalSubjects,
                ],
                'attendance' => [
                    'rate' => $attendanceRate,
                    'present' => $present,
                    'absent' => $absent,
                ],
            ];
        });

        return Inertia::render('adviser/dashboard', [
            'section' => $user->adviser_section,
            'schoolYear' => $activeSchoolYear,
            'students' => $studentsData,
        ]);
    }
}
