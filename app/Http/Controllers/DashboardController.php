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
    /**
     * Build a composite dashboard: every role section the user is
     * allowed to see is rendered, in priority order, instead of
     * showing a single first-match dashboard.
     */
    public function __invoke(Request $request): Response
    {
        $user = $request->user();
        $permissions = $user->getAllPermissions()
            ->pluck('name')
            ->map(fn ($name) => strtolower($name))
            ->values();

        $sections = [];

        $order = [
            'access school head dashboard' => 'schoolHeadSection',
            'access admin dashboard' => 'adminSection',
            'access department head dashboard' => 'departmentHeadSection',
            'access teacher dashboard' => 'teacherSection',
            'access staff dashboard' => 'staffSection',
            'access developer dashboard' => 'developerSection',
        ];

        foreach ($order as $permission => $method) {
            if ($permissions->contains($permission)) {
                $sections[] = $this->{$method}($request);
            }
        }

        $studentSection = $this->studentSection($request);
        if ($studentSection) {
            $sections[] = $studentSection;
        }

        if (empty($sections)) {
            $sections[] = [
                'key' => 'empty',
                'label' => 'Your Account',
                'message' => 'No dashboard sections are available for your account yet.',
            ];
        }

        return Inertia::render('dashboard', [
            'user' => ['name' => $user->name, 'email' => $user->email],
            'sections' => $sections,
        ]);
    }

    private function recentAnnouncements(): array
    {
        return Announcement::latest('created_at')
            ->take(5)
            ->get()
            ->map(fn ($a) => [
                'title' => $a->title,
                'body' => $a->body,
                'scope' => $a->scope,
                'created_at' => $a->created_at->diffForHumans(),
            ])
            ->all();
    }

    private function schoolHeadSection(Request $request): array
    {
        $activeSchoolYear = SchoolYear::where('status', 'active')->first();

        return [
            'key' => 'school-head',
            'label' => 'School Administration',
            'stats' => [
                ['label' => 'Total Students', 'value' => Student::count()],
                ['label' => 'Total Teachers', 'value' => User::whereHas('roles', fn ($q) => $q->where('name', 'teacher'))->count()],
                ['label' => 'Total Sections', 'value' => ClassSection::count()],
                ['label' => 'Total Subjects', 'value' => Subject::count()],
            ],
            'tools' => [
                ['label' => 'Enrollments', 'href' => '/admin/enrollments'],
                ['label' => 'Subjects', 'href' => '/admin/subjects'],
                ['label' => 'Sections', 'href' => '/admin/sections'],
                ['label' => 'Users', 'href' => '/admin/users'],
                ['label' => 'Announcements', 'href' => '/admin/announcements'],
                ['label' => 'School Year', 'href' => '/admin/school-years'],
            ],
            'activeSchoolYear' => $activeSchoolYear ? [
                'name' => $activeSchoolYear->name,
                'start_date' => $activeSchoolYear->start_date,
                'end_date' => $activeSchoolYear->end_date,
            ] : null,
            'recentAnnouncements' => $this->recentAnnouncements(),
        ];
    }

    private function adminSection(Request $request): array
    {
        return [
            'key' => 'admin',
            'label' => 'Administrative Tools',
            'stats' => [
                ['label' => 'Total Students', 'value' => Student::count()],
                ['label' => 'Total Sections', 'value' => ClassSection::count()],
                ['label' => 'Total Subjects', 'value' => Subject::count()],
            ],
            'tools' => [
                ['label' => 'Assignments', 'href' => '/admin/assignments'],
                ['label' => 'Enrollments', 'href' => '/admin/enrollments'],
                ['label' => 'Manage Users', 'href' => '/admin/users'],
            ],
            'recentAnnouncements' => $this->recentAnnouncements(),
        ];
    }

    private function departmentHeadSection(Request $request): array
    {
        $user = $request->user();

        $assignedSubjects = Subject::whereHas('teachers', fn ($q) => $q->where('users.uuid', $user->uuid))->count();

        return [
            'key' => 'department-head',
            'label' => 'Department Management',
            'stats' => [
                ['label' => 'Total Subjects', 'value' => Subject::count()],
                ['label' => 'Total Sections', 'value' => ClassSection::count()],
                ['label' => 'My Assigned Subjects', 'value' => $assignedSubjects],
            ],
            'tools' => [
                ['label' => 'Manage Subjects', 'href' => '/admin/subjects'],
                ['label' => 'Sections', 'href' => '/admin/sections'],
                ['label' => 'Announcements', 'href' => '/admin/announcements'],
                ['label' => 'Grades', 'href' => '/teacher/grades'],
            ],
            'recentAnnouncements' => $this->recentAnnouncements(),
        ];
    }

    private function teacherSection(Request $request): array
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

        return [
            'key' => 'teacher',
            'label' => 'Teaching',
            'stats' => [
                ['label' => 'Assigned Subjects', 'value' => $assignedSubjects],
                ['label' => 'Total Students', 'value' => $totalStudents],
            ],
            'tools' => [
                ['label' => 'My Classes', 'href' => '/teacher/classes'],
                ['label' => 'Edit Grades', 'href' => '/teacher/grades'],
                ['label' => 'Schedule', 'href' => '/teacher/schedule'],
                ['label' => 'Announcements', 'href' => '/teacher/announcements'],
            ],
            'recentAnnouncements' => $this->recentAnnouncements(),
        ];
    }

    private function staffSection(Request $request): array
    {
        return [
            'key' => 'staff',
            'label' => 'Staff Portal',
            'tools' => [
                ['label' => 'Classes', 'href' => '/teacher/classes'],
                ['label' => 'Schedule', 'href' => '/teacher/schedule'],
                ['label' => 'Announcements', 'href' => '/teacher/announcements'],
                ['label' => 'Subjects', 'href' => '/student/subjects-enrolled'],
            ],
            'recentAnnouncements' => $this->recentAnnouncements(),
        ];
    }

    private function developerSection(Request $request): array
    {
        $totalReports = Report::count();
        $pendingReports = Report::where('status', 'pending')->count();
        $underReviewReports = Report::where('status', 'under_review')->count();
        $acceptedReports = Report::where('status', 'accepted')->count();
        $rejectedReports = Report::where('status', 'rejected')->count();
        $totalUsers = User::count();

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
            ])
            ->all();

        return [
            'key' => 'developer',
            'label' => 'Developer',
            'stats' => [
                ['label' => 'Total Reports', 'value' => $totalReports],
                ['label' => 'Pending', 'value' => $pendingReports],
                ['label' => 'Under Review', 'value' => $underReviewReports],
                ['label' => 'Total Users', 'value' => $totalUsers],
            ],
            'typeBreakdown' => [
                'bugs' => Report::where('type', 'bug')->count(),
                'suggestions' => Report::where('type', 'suggestion')->count(),
                'feedback' => Report::where('type', 'feedback')->count(),
            ],
            'statusBreakdown' => [
                'accepted' => $acceptedReports,
                'rejected' => $rejectedReports,
            ],
            'recentReports' => $recentReports,
            'tools' => [
                ['label' => 'Developer Reports', 'href' => '/developer/reports'],
            ],
        ];
    }

    private function studentSection(Request $request): ?array
    {
        $user = $request->user();
        $student = $user->student()->first();

        if (! $student) {
            return null;
        }

        $currentSchoolYear = $student->school_year;

        $enrollments = $student->enrollments()
            ->when($currentSchoolYear, fn ($query) => $query->where('school_year', $currentSchoolYear))
            ->get();

        return [
            'key' => 'student',
            'label' => 'Student',
            'student' => [
                'name' => $student->full_name ?: $student->name,
                'firstName' => $student->first_name,
                'middleName' => $student->middle_name,
                'lastName' => $student->last_name,
                'gradeLevel' => $student->grade_level,
                'section' => $student->section,
                'schoolYear' => $student->school_year,
                'lrn' => $student->lrn,
                'qrToken' => $student->qr_token,
            ],
            'subjectsEnrolledCount' => $enrollments->count(),
            'averageGrade' => $enrollments->isNotEmpty() ? round($enrollments->avg('total') ?? 0, 2) : null,
            'unseenAnnouncementsCount' => Announcement::where('created_at', '>', now()->subDays(7))->count(),
        ];
    }
}
