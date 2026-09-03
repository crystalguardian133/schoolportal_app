<?php

use App\Http\Controllers\StudentPortalController;
use App\Http\Controllers\TeacherClassController;
use App\Http\Controllers\AdminSystemLogController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminStudentController;
use App\Http\Controllers\AdminTeacherController;
use App\Http\Controllers\AdminSectionController;
use App\Http\Controllers\AdminRoleController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\PushSubscriptionController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\AdminAssetController;
use App\Http\Controllers\AdminSubjectController;
use App\Http\Controllers\AdminSchoolYearController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');
Route::get('/assets/profile_pictures/{folder}/{filename}', [AdminAssetController::class, 'serveProfilePicture']);

// Public support tickets (locked-out users, guests)
Route::post('support/tickets', [\App\Http\Controllers\SupportTicketController::class, 'store'])->name('support.tickets.store');
Route::get('support/tickets/lookup', [\App\Http\Controllers\SupportTicketController::class, 'lookupPage'])->name('support.tickets.lookup.page');
Route::post('support/tickets/lookup', [\App\Http\Controllers\SupportTicketController::class, 'lookup'])->name('support.tickets.lookup');
Route::get('support/tickets/{report}', [\App\Http\Controllers\SupportTicketController::class, 'show'])->name('support.tickets.show');
Route::post('support/tickets/{report}/reply', [\App\Http\Controllers\SupportTicketController::class, 'reply'])->name('support.tickets.reply');

// Account unlock (public page; manual table gated by "Unlock Accounts" permission)
Route::get('account-unlock', [\App\Http\Controllers\AccountUnlockController::class, 'page'])->name('account-unlock.page');
Route::post('account-unlock/request', [\App\Http\Controllers\AccountUnlockController::class, 'sendLink'])->name('account-unlock.request');
Route::get('account-unlock/{user}', [\App\Http\Controllers\AccountUnlockController::class, 'unlockViaLink'])
    ->middleware('signed')
    ->name('account-unlock.link');
Route::post('account-unlock/{uuid}/manual', [\App\Http\Controllers\AccountUnlockController::class, 'unlockManual'])
    ->name('account-unlock.manual');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [\App\Http\Controllers\DashboardController::class, '__invoke'])->name('dashboard');
    Route::get('student/pre-registration', fn () => inertia('student/pre-registration'))->name('student.pre-registration');
    Route::get('student/profile', [StudentPortalController::class, 'profile'])->name('student.profile');
    Route::get('student/grades', [StudentPortalController::class, 'grades'])->name('student.grades');
    Route::get('student/attendance', [StudentPortalController::class, 'attendance'])->name('student.attendance');
    Route::get('student/subjects-enrolled', [\App\Http\Controllers\ScheduleController::class, 'studentSubjectsEnrolled'])->name('student.subjects-enrolled');
    Route::get('student/announcements', [AnnouncementController::class, 'studentIndex'])->name('student.announcements');
    Route::get('teacher/classes', [\App\Http\Controllers\ScheduleController::class, 'teacherClasses'])->name('teacher.classes');
    Route::get('teacher/classes/{classId}', [TeacherClassController::class, 'show'])->name('teacher.classes.show');
    Route::post('teacher/classes/{classId}/grades', [\App\Http\Controllers\TeacherGradeController::class, 'update'])->name('teacher.classes.grades.update');
    Route::get('teacher/grades', [\App\Http\Controllers\TeacherGradeController::class, 'index'])->name('teacher.grades');
    Route::post('teacher/grades/{subjectUuid}', [\App\Http\Controllers\TeacherGradeController::class, 'update'])->name('teacher.grades.update');
    Route::get('admin/enrollments', [\App\Http\Controllers\EnrollmentController::class, 'index'])->name('admin.enrollments');
    Route::post('admin/enrollments', [\App\Http\Controllers\EnrollmentController::class, 'store'])->name('admin.enrollments.store');
    Route::post('admin/students/{uuid}/promote', [\App\Http\Controllers\EnrollmentController::class, 'promote'])->name('admin.students.promote');
    Route::get('admin/create-student', [\App\Http\Controllers\EnrollmentController::class, 'create'])->name('admin.enroll.create');

    Route::get('admin/system-logs', [AdminSystemLogController::class, 'index'])->name('admin.system-logs');
    Route::get('admin/users', [AdminUserController::class, 'index'])->name('admin.users');
    Route::post('admin/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::get('admin/create-teacher', [AdminUserController::class, 'createTeacher'])->name('admin.create-teacher');
    Route::post('admin/create-teacher', [AdminUserController::class, 'storeTeacher'])->name('admin.create-teacher.store');
    Route::get('admin/users/{uuid}/edit', [AdminUserController::class, 'edit'])->name('admin.users.edit');
    Route::patch('admin/users/{uuid}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{uuid}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    Route::post('admin/users/{uuid}/unlock', [AdminUserController::class, 'unlock'])->name('admin.users.unlock');
    Route::get('admin/manage-students', [AdminStudentController::class, 'index'])->name('admin.manage-students.index');
    Route::get('admin/manage-students/{uuid}/edit', [AdminStudentController::class, 'edit'])->name('admin.manage-students.edit');
    Route::put('admin/manage-students/{uuid}', [AdminStudentController::class, 'update'])->name('admin.manage-students.update');
    Route::delete('admin/manage-students/{uuid}', [AdminStudentController::class, 'destroy'])->name('admin.manage-students.destroy');
    Route::get('admin/manage-teachers', [AdminTeacherController::class, 'index'])->name('admin.manage-teachers.index');
    Route::patch('admin/manage-teachers/{uuid}', [AdminTeacherController::class, 'update'])->name('admin.manage-teachers.update');
    Route::get('admin/roles', [AdminRoleController::class, 'index'])->name('admin.roles');
    Route::post('admin/roles', [AdminRoleController::class, 'store'])->name('admin.roles.store');
    Route::patch('admin/roles/{id}', [AdminRoleController::class, 'update'])->name('admin.roles.update');
    Route::delete('admin/roles/{id}', [AdminRoleController::class, 'destroy'])->name('admin.roles.destroy');
    Route::post('admin/roles/assign-user-role', [AdminRoleController::class, 'assignUserRole'])->name('admin.roles.assign-user-role');
    Route::post('admin/roles/remove-user-role', [AdminRoleController::class, 'removeUserRole'])->name('admin.roles.remove-user-role');
    Route::post('admin/roles/update-user-role-expiry', [AdminRoleController::class, 'updateUserRoleExpiry'])->name('admin.roles.update-user-role-expiry');
    Route::get('admin/announcements', [AnnouncementController::class, 'index'])->name('admin.announcements');
    Route::post('admin/announcements', [AnnouncementController::class, 'store'])->name('admin.announcements.store');
    Route::patch('admin/announcements/{uuid}', [AnnouncementController::class, 'update'])->name('admin.announcements.update');
    Route::delete('admin/announcements/{uuid}', [AnnouncementController::class, 'destroy'])->name('admin.announcements.destroy');
    Route::get('assets/announcements/{filename}', [AnnouncementController::class, 'serveImage']);
    Route::get('admin/sections', [AdminSectionController::class, 'index'])->name('admin.sections');
    Route::post('admin/sections', [AdminSectionController::class, 'store'])->name('admin.sections.store');
    Route::patch('admin/sections', [AdminSectionController::class, 'update'])->name('admin.sections.update');
    Route::delete('admin/sections/{uuid}/clear-students', [AdminSectionController::class, 'clearStudents'])->name('admin.sections.clear-students');
    Route::delete('admin/sections/{uuid}', [AdminSectionController::class, 'destroy'])->name('admin.sections.destroy');
    Route::get('/admin/profile-images', [AdminAssetController::class, 'listProfilePictures']);
    Route::get('admin/subjects', [AdminSubjectController::class, 'index'])->name('admin.subjects');
Route::post('admin/subjects', [AdminSubjectController::class, 'store'])->name('admin.subjects.store');
Route::patch('admin/subjects', [AdminSubjectController::class, 'update'])->name('admin.subjects.update');
Route::delete('admin/subjects', [AdminSubjectController::class, 'destroy'])->name('admin.subjects.destroy');
Route::post('admin/subjects/assign-teacher', [AdminSubjectController::class, 'assignTeacher'])->name('admin.subjects.assign-teacher');
Route::post('admin/subject-majors', [AdminSubjectController::class, 'storeMajor'])->name('admin.subject-majors.store');
Route::delete('admin/subjects/teachers/{teacherUuid}/{subjectUuid}', [AdminSubjectController::class, 'removeTeacher'])->name('admin.subjects.teachers.remove');
    Route::get('admin/schedules', [\App\Http\Controllers\ScheduleController::class, 'create'])->name('admin.schedules');
    Route::post('admin/schedules', [\App\Http\Controllers\ScheduleController::class, 'store'])->name('admin.schedules.store');
    Route::delete('admin/schedules/{id}', [\App\Http\Controllers\ScheduleController::class, 'destroy'])->name('admin.schedules.destroy');
    Route::get('admin/id-cards', [\App\Http\Controllers\AdminIdCardController::class, 'index'])->name('admin.id-cards');
    Route::get('admin/school-years', [AdminSchoolYearController::class, 'index'])->name('admin.school-years');
    Route::post('admin/school-years', [AdminSchoolYearController::class, 'store'])->name('admin.school-years.store');
    Route::post('admin/school-years/{id}/end', [AdminSchoolYearController::class, 'endYear'])->name('admin.school-years.end');
    Route::delete('admin/school-years/{id}', [AdminSchoolYearController::class, 'destroy'])->name('admin.school-years.destroy');
    Route::get('teacher/schedule', [\App\Http\Controllers\ScheduleController::class, 'teacherSchedule'])->name('teacher.schedule');
    Route::get('teacher/announcements', [AnnouncementController::class, 'teacherIndex'])->name('teacher.announcements');
    Route::post('teacher/announcements', [AnnouncementController::class, 'teacherStore'])->name('teacher.announcements.store');
    Route::patch('teacher/announcements/{uuid}', [AnnouncementController::class, 'update'])->name('teacher.announcements.update');
    Route::delete('teacher/announcements/{uuid}', [AnnouncementController::class, 'destroy'])->name('teacher.announcements.destroy');
    Route::get('announcements/new-count', [AnnouncementController::class, 'newCount'])->name('announcements.new-count');
    Route::get('adviser/dashboard', [\App\Http\Controllers\AdviserDashboardController::class, 'index'])->name('adviser.dashboard');
    Route::get('adviser/assign-subjects', [\App\Http\Controllers\AdviserAssignmentController::class, 'index'])->name('adviser.assign-subjects');
    Route::post('adviser/assign-subjects', [\App\Http\Controllers\AdviserAssignmentController::class, 'assignTeacher'])->name('adviser.assign-subjects.store');
    Route::delete('adviser/assign-subjects/{teacherUuid}/{subjectUuid}', [\App\Http\Controllers\AdviserAssignmentController::class, 'removeTeacher'])->name('adviser.assign-subjects.remove');
    Route::get('teacher/attendance', [\App\Http\Controllers\AttendanceController::class, 'index'])->name('teacher.attendance');
    Route::post('teacher/attendance/sessions', [\App\Http\Controllers\AttendanceController::class, 'store'])->name('teacher.attendance.store');
    Route::get('teacher/attendance/sessions/{id}', [\App\Http\Controllers\AttendanceController::class, 'show'])->name('teacher.attendance.show');
    Route::patch('teacher/attendance/sessions/{id}/toggle', [\App\Http\Controllers\AttendanceController::class, 'toggleActive'])->name('teacher.attendance.toggle');
    Route::delete('teacher/attendance/sessions/{id}', [\App\Http\Controllers\AttendanceController::class, 'destroy'])->name('teacher.attendance.destroy');
    Route::post('teacher/attendance/sessions/{sessionId}/manual', [\App\Http\Controllers\AttendanceController::class, 'manualRecord'])->name('teacher.attendance.manual');
    Route::post('teacher/attendance/sessions/{sessionId}/bulk-manual', [\App\Http\Controllers\AttendanceController::class, 'bulkManualRecord'])->name('teacher.attendance.bulk-manual');
    Route::post('teacher/attendance/sessions/{sessionId}/scan', [\App\Http\Controllers\AttendanceController::class, 'scanStudentQr'])->name('teacher.attendance.scan');
    Route::post('teacher/attendance/sessions/{sessionId}/override', [\App\Http\Controllers\AttendanceController::class, 'overrideScan'])->name('teacher.attendance.override');
    Route::get('teacher/attendance/sessions/{sessionId}/search-students', [\App\Http\Controllers\AttendanceController::class, 'searchStudents'])->name('teacher.attendance.search');
    Route::get('attendance/scan/{token}', [\App\Http\Controllers\AttendanceController::class, 'scanPage'])->name('attendance.scan');
    Route::post('attendance/submit', [\App\Http\Controllers\AttendanceController::class, 'submitScan'])->name('attendance.submit');

    // Reports / Feedback
    Route::get('feedback', [\App\Http\Controllers\ReportController::class, 'index'])->name('feedback.index');
    Route::get('feedback/{report}', [\App\Http\Controllers\ReportController::class, 'show'])->name('feedback.show');
    Route::post('feedback', [\App\Http\Controllers\ReportController::class, 'store'])->name('feedback.store');
    Route::post('feedback/{report}/reply', [\App\Http\Controllers\ReportController::class, 'reply'])->name('feedback.reply');
    Route::post('feedback/{report}/close', [\App\Http\Controllers\ReportController::class, 'close'])->name('feedback.close');
    Route::post('feedback/{report}/reopen', [\App\Http\Controllers\ReportController::class, 'reopen'])->name('feedback.reopen');
    Route::delete('feedback/{report}', [\App\Http\Controllers\ReportController::class, 'destroy'])->name('feedback.destroy');

    // Developer Reports Dashboard
    Route::get('developer/reports', [\App\Http\Controllers\ReportController::class, 'developerIndex'])
        ->middleware('permission:access developer dashboard')
        ->name('developer.reports');
    Route::patch('developer/reports/{report}/status', [\App\Http\Controllers\ReportController::class, 'updateStatus'])
        ->middleware('permission:access developer dashboard')
        ->name('developer.reports.update-status');

    // Developer Music Player
    Route::prefix('developer/music')->middleware('permission:access music player')->group(function () {
        Route::get('/', [\App\Http\Controllers\MusicController::class, 'index'])->name('developer.music');
        Route::post('search', [\App\Http\Controllers\MusicController::class, 'search'])->name('developer.music.search');
        Route::get('stream', [\App\Http\Controllers\MusicController::class, 'stream'])->name('developer.music.stream');
        Route::post('pre-cache', [\App\Http\Controllers\MusicController::class, 'preCache'])->name('developer.music.pre-cache');
        Route::post('check-cached', [\App\Http\Controllers\MusicController::class, 'checkCached'])->name('developer.music.check-cached');
    });

    // Push notification subscriptions
    Route::post('push/subscriptions', [PushSubscriptionController::class, 'store'])
        ->name('push.subscriptions.store');
    Route::delete('push/subscriptions', [PushSubscriptionController::class, 'destroy'])
        ->name('push.subscriptions.destroy');

    // Departments
    Route::get('admin/departments', [\App\Http\Controllers\DepartmentController::class, 'index'])->name('admin.departments');
    Route::post('admin/departments', [\App\Http\Controllers\DepartmentController::class, 'store'])->name('admin.departments.store');
    Route::patch('admin/departments/{uuid}', [\App\Http\Controllers\DepartmentController::class, 'update'])->name('admin.departments.update');
    Route::delete('admin/departments/{uuid}', [\App\Http\Controllers\DepartmentController::class, 'destroy'])->name('admin.departments.destroy');
    Route::post('admin/departments/{uuid}/assign-teacher', [\App\Http\Controllers\DepartmentController::class, 'assignTeacher'])->name('admin.departments.assign-teacher');
    Route::post('admin/departments/{uuid}/remove-teacher', [\App\Http\Controllers\DepartmentController::class, 'removeTeacher'])->name('admin.departments.remove-teacher');
    Route::get('admin/departments/{uuid}/subject-teachers', [\App\Http\Controllers\DepartmentController::class, 'subjectTeachers'])->name('admin.departments.subject-teachers');
    Route::get('department-head/dashboard', [\App\Http\Controllers\DepartmentController::class, 'headView'])->name('department-head.dashboard');
});

require __DIR__.'/settings.php';
