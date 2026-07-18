<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Announcement;
use App\Models\SchoolYear;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $permissions = $user->getAllPermissions()->pluck('name')->map(fn ($name) => strtolower($name))->values();

        if ($permissions->contains('access school head dashboard')) {
            return $this->schoolHeadDashboard($request);
        }

        if ($permissions->contains('access admin dashboard')) {
            return $this->adminDashboard($request);
        }

        if ($permissions->contains('access department head dashboard')) {
            return $this->departmentHeadDashboard($request);
        }

        if ($permissions->contains('access teacher dashboard')) {
            return $this->teacherDashboard($request);
        }

        if ($permissions->contains('access staff dashboard')) {
            return $this->staffDashboard($request);
        }

        if ($permissions->contains('access developer dashboard')) {
            return $this->developerDashboard($request);
        }

        return $this->fallbackDashboard($request);
    }

    private function schoolHeadDashboard(Request $request): Response
    {
        $user = $request->user();

        $totalStudents = Student::count();
        $totalTeachers = \App\Models\User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))->count();
        $totalSections = ClassSection::count();
        $totalSubjects = Subject::count();

        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        $recentAnnouncements = Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('school-head/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'stats' => [
                'totalStudents' => $totalStudents,
                'totalTeachers' => $totalTeachers,
                'totalSections' => $totalSections,
                'totalSubjects' => $totalSubjects,
            ],
            'activeSchoolYear' => $activeSchoolYear ? [
                'name' => $activeSchoolYear->name,
                'start_date' => $activeSchoolYear->start_date,
                'end_date' => $activeSchoolYear->end_date,
            ] : null,
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    private function adminDashboard(Request $request): Response
    {
        $user = $request->user();

        $totalStudents = Student::count();
        $totalSections = ClassSection::count();
        $totalSubjects = Subject::count();

        $recentAnnouncements = Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('admin/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email, 'roles' => $user->roles()->pluck('name')->all()],
            'tools' => [
                ['label' => 'Assignments', 'href' => '/admin/assignments'],
                ['label' => 'Enrollments', 'href' => '/admin/enrollments'],
                ['label' => 'Manage Users', 'href' => '/admin/users'],
            ],
            'stats' => [
                'totalStudents' => $totalStudents,
                'totalSections' => $totalSections,
                'totalSubjects' => $totalSubjects,
            ],
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    private function departmentHeadDashboard(Request $request): Response
    {
        $user = $request->user();

        $totalSubjects = Subject::count();
        $totalSections = ClassSection::count();

        $assignedSubjects = Subject::whereHas('teachers', fn ($q) => $q->where('users.uuid', $user->uuid))->count();

        $recentAnnouncements = Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('department-head/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'stats' => [
                'totalSubjects' => $totalSubjects,
                'totalSections' => $totalSections,
                'assignedSubjects' => $assignedSubjects,
            ],
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    private function teacherDashboard(Request $request): Response
    {
        $user = $request->user();

        $assignedSubjects = Subject::whereHas('teachers', fn ($q) => $q->where('users.uuid', $user->uuid))->count();

        $totalStudents = Student::whereHas('enrollments', function ($q) use ($user) {
            $q->whereIn('subject_uuid', function ($sq) use ($user) {
                $sq->select('subject_uuid')
                    ->from('subject_teacher')
                    ->where('teacher_uuid', $user->uuid);
            });
        })->count();

        $recentAnnouncements = Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('teacher/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'stats' => [
                'assignedSubjects' => $assignedSubjects,
                'totalStudents' => $totalStudents,
            ],
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    private function staffDashboard(Request $request): Response
    {
        $user = $request->user();

        $recentAnnouncements = Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ]);

        return Inertia::render('staff/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'recentAnnouncements' => $recentAnnouncements,
        ]);
    }

    private function developerDashboard(Request $request): Response
    {
        $user = $request->user();

        $totalReports = Report::count();
        $pendingReports = Report::where('status', 'pending')->count();
        $underReviewReports = Report::where('status', 'under_review')->count();
        $acceptedReports = Report::where('status', 'accepted')->count();
        $rejectedReports = Report::where('status', 'rejected')->count();
        $totalUsers = User::count();

        $bugReports = Report::where('type', 'bug')->count();
        $suggestionReports = Report::where('type', 'suggestion')->count();
        $feedbackReports = Report::where('type', 'feedback')->count();

        $recentReports = Report::with('user')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn ($r) => [
                'id' => $r->id,
                'type' => $r->type,
                'subject' => $r->subject,
                'status' => $r->status,
                'user_name' => $r->user->name,
                'created_at' => $r->created_at->diffForHumans(),
            ]);

        return Inertia::render('developer/dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'stats' => [
                'totalReports' => $totalReports,
                'pendingReports' => $pendingReports,
                'underReviewReports' => $underReviewReports,
                'acceptedReports' => $acceptedReports,
                'rejectedReports' => $rejectedReports,
                'totalUsers' => $totalUsers,
            ],
            'typeBreakdown' => [
                'bugs' => $bugReports,
                'suggestions' => $suggestionReports,
                'feedback' => $feedbackReports,
            ],
            'recentReports' => $recentReports,
        ]);
    }

    private function fallbackDashboard(Request $request): Response
    {
        $user = $request->user();

        $student = $user->student()->first();
        $currentSchoolYear = $student?->school_year;

        $enrollments = $student
            ? $student->enrollments()
                ->when($currentSchoolYear, fn ($query) => $query->where('school_year', $currentSchoolYear))
                ->get()
            : collect();

        $subjectsEnrolledCount = $enrollments->count();
        $averageGrade = $enrollments->isNotEmpty() ? round($enrollments->avg('total') ?? 0, 2) : null;

        $unseenAnnouncementsCount = Announcement::where('created_at', '>', now()->subDays(7))->count();

        return Inertia::render('dashboard', [
            'student' => $student ? [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
                'lrn' => $student->lrn,
                'qrToken' => $student->qr_token,
            ] : null,
            'subjectsEnrolledCount' => $subjectsEnrolledCount,
            'averageGrade' => $averageGrade,
            'unseenAnnouncementsCount' => $unseenAnnouncementsCount,
        ]);
    }
}
