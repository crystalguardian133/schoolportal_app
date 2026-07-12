<?php

use App\Http\Controllers\StudentPortalController;
use App\Http\Controllers\TeacherClassController;
use App\Http\Controllers\AdminEnrollmentAuditController;
use App\Http\Controllers\AdminSystemLogController;
use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AdminSectionController;
use App\Http\Controllers\AdminRoleController;
use App\Http\Controllers\AnnouncementController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\AdminAssetController;
use App\Http\Controllers\AdminSubjectController;
use Illuminate\Support\Facades\Route;

Route::redirect('/', '/login');
Route::get('/assets/profile_pictures/{folder}/{filename}', [AdminAssetController::class, 'serveProfilePicture']);

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [StudentPortalController::class, 'dashboard'])->name('dashboard');
    Route::get('student/pre-registration', fn () => inertia('student/pre-registration'))->name('student.pre-registration');
    Route::get('student/grades', [StudentPortalController::class, 'grades'])->name('student.grades');
    Route::get('student/subjects-enrolled', [StudentPortalController::class, 'subjectsEnrolled'])->name('student.subjects-enrolled');
    Route::get('student/announcements', [AnnouncementController::class, 'studentIndex'])->name('student.announcements');
    Route::get('teacher/classes', [TeacherClassController::class, 'index'])->name('teacher.classes');
    Route::get('teacher/classes/{classId}', [TeacherClassController::class, 'show'])->name('teacher.classes.show');
    Route::post('teacher/classes/{classId}/grades', [\App\Http\Controllers\TeacherGradeController::class, 'update'])->name('teacher.classes.grades.update');
    Route::get('admin/assignments', [\App\Http\Controllers\AdminAssignmentController::class, 'index'])->name('admin.assignments');
    Route::post('admin/assignments', [\App\Http\Controllers\AdminAssignmentController::class, 'update'])->name('admin.assignments.update');
    Route::get('admin/enrollments', [\App\Http\Controllers\EnrollmentController::class, 'index'])->name('admin.enrollments');
    Route::post('admin/enrollments', [\App\Http\Controllers\EnrollmentController::class, 'store'])->name('admin.enrollments.store');
    Route::get('admin/create-student', [\App\Http\Controllers\EnrollmentController::class, 'create'])->name('admin.enroll.create');
    Route::get('admin/enrollment-audits', [AdminEnrollmentAuditController::class, 'index'])->name('admin.enrollment-audits');
    Route::get('admin/system-logs', [AdminSystemLogController::class, 'index'])->name('admin.system-logs');
    Route::get('admin/users', [AdminUserController::class, 'index'])->name('admin.users');
    Route::post('admin/users', [AdminUserController::class, 'store'])->name('admin.users.store');
    Route::get('admin/users/{uuid}/edit', [AdminUserController::class, 'edit'])->name('admin.users.edit');
    Route::patch('admin/users/{uuid}', [AdminUserController::class, 'update'])->name('admin.users.update');
    Route::delete('admin/users/{uuid}', [AdminUserController::class, 'destroy'])->name('admin.users.destroy');
    Route::get('admin/roles', [AdminRoleController::class, 'index'])->name('admin.roles');
    Route::post('admin/roles', [AdminRoleController::class, 'store'])->name('admin.roles.store');
    Route::patch('admin/roles/{id}', [AdminRoleController::class, 'update'])->name('admin.roles.update');
    Route::delete('admin/roles/{id}', [AdminRoleController::class, 'destroy'])->name('admin.roles.destroy');
    Route::get('admin/announcements', [AnnouncementController::class, 'index'])->name('admin.announcements');
    Route::post('admin/announcements', [AnnouncementController::class, 'store'])->name('admin.announcements.store');
    Route::patch('admin/announcements/{uuid}', [AnnouncementController::class, 'update'])->name('admin.announcements.update');
    Route::delete('admin/announcements/{uuid}', [AnnouncementController::class, 'destroy'])->name('admin.announcements.destroy');
    Route::get('assets/announcements/{filename}', [AnnouncementController::class, 'serveImage']);
    Route::get('admin/sections', [AdminSectionController::class, 'index'])->name('admin.sections');
    Route::post('admin/sections', [AdminSectionController::class, 'store'])->name('admin.sections.store');
    Route::patch('admin/sections', [AdminSectionController::class, 'update'])->name('admin.sections.update');
    Route::get('/admin/profile-images', [AdminAssetController::class, 'listProfilePictures']);
    Route::get('admin/subjects', [AdminSubjectController::class, 'index'])->name('admin.subjects');
Route::post('admin/subjects', [AdminSubjectController::class, 'store'])->name('admin.subjects.store');
Route::patch('admin/subjects', [AdminSubjectController::class, 'update'])->name('admin.subjects.update');
Route::delete('admin/subjects', [AdminSubjectController::class, 'destroy'])->name('admin.subjects.destroy');
Route::post('admin/subjects/assign-teacher', [AdminSubjectController::class, 'assignTeacher'])->name('admin.subjects.assign-teacher');
Route::delete('admin/subjects/teachers/{teacherUuid}/{subjectUuid}', [AdminSubjectController::class, 'removeTeacher'])->name('admin.subjects.teachers.remove');
    Route::get('admin/id-cards', [\App\Http\Controllers\AdminIdCardController::class, 'index'])->name('admin.id-cards');
    Route::inertia('teacher/schedule', 'teacher/schedule')->name('teacher.schedule');
    Route::get('teacher/announcements', [AnnouncementController::class, 'teacherIndex'])->name('teacher.announcements');
    Route::patch('teacher/announcements/{uuid}', [AnnouncementController::class, 'update'])->name('teacher.announcements.update');
    Route::delete('teacher/announcements/{uuid}', [AnnouncementController::class, 'destroy'])->name('teacher.announcements.destroy');
    Route::get('announcements/new-count', [AnnouncementController::class, 'newCount'])->name('announcements.new-count');
});

require __DIR__.'/settings.php';
