<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    private function authorizeDepartment(Request $request): User
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $hasAccessAdmin = method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
        $hasManageDepts = method_exists($user, 'hasPermission') && $user->hasPermission('manage departments');

        if (! $hasAccessAdmin && ! $hasManageDepts) {
            abort(403);
        }

        return $user;
    }

    private function syncHeadRole(?string $oldHeadUuid, ?string $newHeadUuid): void
    {
        $roleUuid = DB::table('roles')->where('name', 'DEPARTMENT HEAD')->value('id');

        if (! $roleUuid) {
            return;
        }

        // Assign role to new head if not already in role_user
        if ($newHeadUuid) {
            $hasRole = DB::table('role_user')
                ->where('role_uuid', $roleUuid)
                ->where('user_uuid', $newHeadUuid)
                ->exists();

            if (! $hasRole) {
                DB::table('role_user')->insertOrIgnore([
                    'role_uuid' => $roleUuid,
                    'user_uuid' => $newHeadUuid,
                ]);
            }
        }

        // Remove role from old head if they are no longer head of any department
        if ($oldHeadUuid && $oldHeadUuid !== $newHeadUuid) {
            $stillHead = Department::where('head_uuid', $oldHeadUuid)->exists();

            if (! $stillHead) {
                DB::table('role_user')
                    ->where('role_uuid', $roleUuid)
                    ->where('user_uuid', $oldHeadUuid)
                    ->delete();
            }
        }
    }

    private function removeHeadRoleIfExists(?string $headUuid): void
    {
        if (! $headUuid) {
            return;
        }

        $roleUuid = DB::table('roles')->where('name', 'DEPARTMENT HEAD')->value('id');

        if (! $roleUuid) {
            return;
        }

        $stillHead = Department::where('head_uuid', $headUuid)->exists();

        if (! $stillHead) {
            DB::table('role_user')
                ->where('role_uuid', $roleUuid)
                ->where('user_uuid', $headUuid)
                ->delete();
        }
    }

    private function getSubjectTeachers(string $subjectUuid): Collection
    {
        return User::query()
            ->whereHas('subjects', fn ($q) => $q->where('subjects.uuid', $subjectUuid))
            ->orderBy('name')
            ->get(['uuid', 'name']);
    }

    public function index(Request $request): Response
    {
        $this->authorizeDepartment($request);

        $departments = Department::with(['head', 'teachers', 'subject'])->orderBy('name')->get()
            ->map(function (Department $dept) {
                return [
                    'uuid' => $dept->uuid,
                    'name' => $dept->name,
                    'description' => $dept->description,
                    'subject' => $dept->subject ? ['uuid' => $dept->subject->uuid, 'name' => $dept->subject->name] : null,
                    'head' => $dept->head ? ['uuid' => $dept->head->uuid, 'name' => $dept->head->name] : null,
                    'teacher_count' => $dept->teachers->count(),
                    'teachers' => $dept->teachers->map(fn (User $t) => ['uuid' => $t->uuid, 'name' => $t->name]),
                ];
            });

        $allSubjects = Subject::orderBy('name')->get(['uuid', 'name']);

        $allUsers = User::query()
            ->orderBy('name')
            ->get(['uuid', 'name']);

        return Inertia::render('admin/departments', [
            'departments' => $departments,
            'allSubjects' => $allSubjects,
            'allUsers' => $allUsers,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeDepartment($request);

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject_uuid' => 'nullable|string|exists:subjects,uuid',
            'head_uuid' => 'nullable|string|exists:users,uuid',
        ]);

        Department::create([
            'name' => $request->name,
            'description' => $request->description,
            'subject_uuid' => $request->subject_uuid,
            'head_uuid' => $request->head_uuid,
        ]);

        if ($request->head_uuid) {
            $this->syncHeadRole(null, $request->head_uuid);
        }

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'subject_uuid' => 'nullable|string|exists:subjects,uuid',
            'head_uuid' => 'nullable|string|exists:users,uuid',
        ]);

        $oldHeadUuid = $dept->head_uuid;
        $newHeadUuid = $request->head_uuid;

        $dept->update([
            'name' => $request->name,
            'description' => $request->description,
            'subject_uuid' => $request->subject_uuid,
            'head_uuid' => $newHeadUuid,
        ]);

        $this->syncHeadRole($oldHeadUuid, $newHeadUuid);

        return back()->with('success', 'Department updated.');
    }

    public function destroy(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();

        $this->removeHeadRoleIfExists($dept->head_uuid);

        $dept->delete();

        return back()->with('success', 'Department deleted.');
    }

    public function assignTeacher(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();

        $request->validate([
            'user_uuid' => 'required|string|exists:users,uuid',
        ]);

        $dept->teachers()->syncWithoutDetaching([$request->user_uuid]);

        return back()->with('success', 'Teacher assigned to department.');
    }

    public function removeTeacher(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();

        $request->validate([
            'user_uuid' => 'required|string',
        ]);

        $dept->teachers()->detach($request->user_uuid);

        return back()->with('success', 'Teacher removed from department.');
    }

    public function subjectTeachers(Request $request, string $uuid): Response
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();
        $user = $request->user();

        $canBypass = method_exists($user, 'hasPermission')
            && $user->hasPermission('bypass department teacher restriction');

        if ($canBypass || ! $dept->subject_uuid) {
            $teachers = User::query()
                ->whereHas('roles', fn ($q) => $q->where('roles.name', 'TEACHER'))
                ->orderBy('name')
                ->get(['uuid', 'name']);
        } else {
            $teachers = $this->getSubjectTeachers($dept->subject_uuid);
        }

        return response()->json([
            'teachers' => $teachers->map(fn (User $t) => ['uuid' => $t->uuid, 'name' => $t->name]),
        ]);
    }

    public function headView(Request $request): Response
    {
        $user = $request->user();
        if (! $user) {
            abort(403);
        }

        $dept = Department::where('head_uuid', $user->uuid)->with(['teachers', 'subject'])->first();

        if (! $dept) {
            abort(404);
        }

        $teachers = $dept->teachers->map(function (User $t) {
            return [
                'uuid' => $t->uuid,
                'name' => $t->name,
                'email' => $t->email,
            ];
        });

        return Inertia::render('department-head/dashboard', [
            'department' => [
                'uuid' => $dept->uuid,
                'name' => $dept->name,
                'description' => $dept->description,
                'subject' => $dept->subject ? ['uuid' => $dept->subject->uuid, 'name' => $dept->subject->name] : null,
            ],
            'teachers' => $teachers,
        ]);
    }
}
