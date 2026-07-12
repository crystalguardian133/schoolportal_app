<?php

namespace App\Http\Controllers;

use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSubjectController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage subjects');
        $canAssignTeacher = $user && (
            $user->is_adviser
            || (method_exists($user, 'hasPermission') && $user->hasPermission('assign subject teacher'))
        );
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $canAssignTeacher && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);

        $subjects = Subject::query()
            ->select(['uuid', 'name', 'code', 'description'])
            ->with('teachers')
            ->when($q, fn ($query, $search) => $query->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            }))
            ->orderBy('name')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (Subject $subject) => [
                'uuid' => $subject->uuid,
                'name' => $subject->name,
                'code' => $subject->code,
                'description' => $subject->description,
                'teachers' => $subject->teachers->map(fn ($teacher) => [
                    'uuid' => $teacher->uuid,
                    'name' => $teacher->name,
                    'email' => $teacher->email,
                    'pivot' => [
                        'is_substitute' => $teacher->pivot->is_substitute ?? false,
                    ],
                ]),
            ]);

        $assignableTeachers = \App\Models\User::query()
            ->where(function ($query) {
                $query->whereHas('roles', function ($q) {
                    $q->where('name', 'staff');
                })
                ->orWhereHas('roles.permissions', function ($q) {
                    $q->whereRaw('LOWER(name) = ?', ['assign subject teacher']);
                })
                ->orWhere('is_adviser', true);
            })
            ->get(['uuid', 'name', 'email', 'profile_picture']);

        return inertia('admin/subjects', [
            'subjects' => $subjects,
            'assignableTeachers' => $assignableTeachers,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $subject = Subject::query()->create([
            'name' => trim($data['name']),
            'code' => $data['code'] ? strtoupper(trim($data['code'])) : null,
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('success', 'Subject created successfully.');
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $hasManagePermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage subjects');
        $isAdviser = $user && ! empty($user->is_adviser);
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasManagePermission && ! $hasRole && ! $isAdviser)) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'name' => 'required|string|max:100',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        $subject->update([
            'name' => trim($data['name']),
            'code' => $data['code'] ? strtoupper(trim($data['code'])) : null,
            'description' => $data['description'] ?? null,
        ]);

        return back()->with('success', 'Subject updated successfully.');
    }

    public function assignTeacher(Request $request)
    {
        $user = $request->user();
        $canAssignTeacher = $user && (
            $user->is_adviser
            || (method_exists($user, 'hasPermission') && $user->hasPermission('assign subject teacher'))
        );
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $canAssignTeacher && ! $hasRole)) {
            abort(403);
        }

        $data = $request->validate([
            'subject_uuid' => 'required|string',
            'teacher_uuid' => 'nullable|string',
            'is_substitute' => 'nullable|boolean',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        if ($data['teacher_uuid']) {
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

        return back()->with('success', 'Subject teacher assigned successfully.');
    }

    public function removeTeacher(Request $request, string $teacherUuid, string $subjectUuid)
    {
        $user = $request->user();
        $canAssignTeacher = $user && (
            $user->is_adviser
            || (method_exists($user, 'hasPermission') && $user->hasPermission('assign subject teacher'))
        );
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $canAssignTeacher && ! $hasRole)) {
            abort(403);
        }

        $deleted = DB::table('subject_teacher')
            ->where('subject_uuid', $subjectUuid)
            ->where('teacher_uuid', $teacherUuid)
            ->delete();

        if ($deleted) {
            return back()->with('success', 'Teacher removed from subject.');
        }

        return back()->with('error', 'Assignment not found.');
    }

    public function destroy(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'subject_uuid' => 'required|string',
        ]);

        $subject = Subject::query()->where('uuid', $data['subject_uuid'])->first();

        if (! $subject) {
            return back()->with('error', 'Subject not found.');
        }

        $subject->delete();

        return back()->with('success', 'Subject deleted successfully.');
    }
}