<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminAssignmentController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage assignments');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $teachers = User::query()
            ->where(function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'staff');
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['assign subject teacher']);
                })
                ->orWhere('is_adviser', true);
            })
            ->get(['uuid', 'name', 'email', 'is_adviser', 'adviser_section', 'profile_picture']);

        $teacherMap = $teachers->keyBy('uuid');

        $subjects = Subject::query()
            ->select(['uuid', 'name', 'code'])
            ->with('teachers')
            ->orderBy('name', 'asc')
            ->get()
            ->map(function (Subject $subject) use ($teacherMap) {
                $assignedTeachers = $subject->teachers->map(function ($teacher) {
                    return [
                        'uuid' => $teacher->uuid,
                        'name' => $teacher->name,
                        'email' => $teacher->email,
                        'is_substitute' => $teacher->pivot->is_substitute ?? false,
                    ];
                });

                return [
                    'uuid' => $subject->uuid,
                    'name' => $subject->name,
                    'code' => $subject->code,
                    'teachers' => $assignedTeachers,
                ];
            })
            ->values();

        return Inertia::render('admin/assignments', [
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $hasManageAssignmentsPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage assignments');
        $isAdviser = $user && ! empty($user->is_adviser);
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasManageAssignmentsPermission && ! $hasRole && ! $isAdviser)) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'nullable|string',
            'is_substitute' => 'nullable|boolean',
            'reassign_from_subject_uuid' => 'nullable|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();
        if (! $subject) {
            return back()->with('error', 'Subject not found');
        }

        $sourceSubjectUuid = $data['reassign_from_subject_uuid'] ?? null;

        if (! empty($sourceSubjectUuid) && $sourceSubjectUuid !== $subject->uuid) {
            $sourceSubject = Subject::query()->where('uuid', $sourceSubjectUuid)->first();

            if ($sourceSubject) {
                $exists = DB::table('subject_teacher')
                    ->where('subject_uuid', $sourceSubject->uuid)
                    ->where('teacher_uuid', $data['teacher_uuid'])
                    ->exists();

                if ($exists) {
                    DB::table('subject_teacher')
                        ->where('subject_uuid', $sourceSubject->uuid)
                        ->where('teacher_uuid', $data['teacher_uuid'])
                        ->delete();
                }
            }
        }

        if (! empty($data['teacher_uuid'])) {
            $exists = DB::table('subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $data['teacher_uuid'])
                ->exists();

            if (! $exists) {
                $subject->teachers()->attach($data['teacher_uuid'], [
                    'is_substitute' => $data['is_substitute'] ?? false,
                ]);
            }
        }

        return back()->with('success', 'Assignment updated');
    }
}