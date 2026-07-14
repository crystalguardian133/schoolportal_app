<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Subject;
use App\Models\User;
use App\Models\ClassSection;
use Illuminate\Support\Facades\DB;

class AdminAssignmentController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage assignments');

        if (! $user || ! $hasPermission) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $user = $request->user();

        $teachers = User::query()
            ->where(function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'staff');
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['assign subject teacher']);
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['access admin']);
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['access teacher dashboard']);
                })
                ->orWhere('is_adviser', true);
            })
            ->get(['uuid', 'name', 'email', 'is_adviser', 'adviser_section', 'profile_picture']);

        $teacherMap = $teachers->keyBy('uuid');

        $subjectsQuery = Subject::query()
            ->select(['uuid', 'name', 'code'])
            ->with('teachers')
            ->orderBy('name', 'asc');

        // Advisers only see subjects linked to their section
        if (! $user->hasRole('admin') && ! $user->hasRole('principal') && ! $user->hasRole('registrar')) {
            $isAdviser = ! empty($user->is_adviser);
            $hasManageAssignments = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage assignments');

            if ($isAdviser && ! $hasManageAssignments && ! empty($user->adviser_section)) {
                $sectionUuids = ClassSection::query()
                    ->where('name', $user->adviser_section)
                    ->pluck('uuid');

                $subjectUuids = DB::table('class_section_subjects')
                    ->whereIn('class_section_uuid', $sectionUuids)
                    ->pluck('subject_uuid');

                $subjectsQuery->whereIn('uuid', $subjectUuids);
            }
        }

        $subjects = $subjectsQuery
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

        if (! $user || ! $hasManageAssignmentsPermission) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'nullable|string',
            'teacher_uuids' => 'nullable|array',
            'teacher_uuids.*' => 'string',
            'is_substitute' => 'nullable|boolean',
            'reassign_from_subject_uuid' => 'nullable|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();
        if (! $subject) {
            return back()->with('error', 'Subject not found');
        }

        // Handle reassign (detach from source subject)
        $sourceSubjectUuid = $data['reassign_from_subject_uuid'] ?? null;

        if (! empty($sourceSubjectUuid) && $sourceSubjectUuid !== $subject->uuid) {
            $sourceSubject = Subject::query()->where('uuid', $sourceSubjectUuid)->first();

            if ($sourceSubject) {
                $teacherUuidForReassign = $data['teacher_uuid'] ?? null;
                if ($teacherUuidForReassign) {
                    DB::table('subject_teacher')
                        ->where('subject_uuid', $sourceSubject->uuid)
                        ->where('teacher_uuid', $teacherUuidForReassign)
                        ->delete();
                }
            }
        }

        // Collect teacher UUIDs: support both single (teacher_uuid) and batch (teacher_uuids)
        $teacherUuids = [];
        if (! empty($data['teacher_uuids']) && is_array($data['teacher_uuids'])) {
            $teacherUuids = $data['teacher_uuids'];
        } elseif (! empty($data['teacher_uuid'])) {
            $teacherUuids = [$data['teacher_uuid']];
        }

        // Attach each teacher to the subject
        foreach ($teacherUuids as $teacherUuid) {
            $exists = DB::table('subject_teacher')
                ->where('subject_uuid', $subject->uuid)
                ->where('teacher_uuid', $teacherUuid)
                ->exists();

            if (! $exists) {
                $subject->teachers()->attach($teacherUuid, [
                    'is_substitute' => $data['is_substitute'] ?? false,
                ]);
            }
        }

        return back()->with('success', 'Assignment updated');
    }
}