<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\MajorSubject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
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

    private function getMajorTeachers(string $majorUuid): Collection
    {
        return User::query()
            ->whereHas('subjects', fn ($q) => $q->where('subjects.major_subject_id', $majorUuid))
            ->orderBy('name')
            ->get(['uuid', 'name']);
    }

    public function index(Request $request): Response
    {
        $this->authorizeDepartment($request);

        $departments = Department::with(['head', 'teachers', 'majors'])->orderBy('name')->get()
            ->map(function (Department $dept) {
                return [
                    'uuid' => $dept->uuid,
                    'name' => $dept->name,
                    'description' => $dept->description,
                    'type' => $dept->type ?? 'general',
                    'majors' => $dept->majors->map(fn (MajorSubject $m) => [
                        'uuid' => $m->uuid,
                        'name' => $m->name,
                        'strand' => $m->pivot->strand,
                    ])->values(),
                    'head' => $dept->head ? ['uuid' => $dept->head->uuid, 'name' => $dept->head->name] : null,
                    'teacher_count' => $dept->teachers->count(),
                    'teachers' => $dept->teachers->map(fn (User $t) => ['uuid' => $t->uuid, 'name' => $t->name]),
                ];
            });

        $allMajors = MajorSubject::orderBy('name')->get(['uuid', 'name', 'code']);

        $allUsers = User::query()
            ->orderBy('name')
            ->get(['uuid', 'name']);

        return Inertia::render('admin/departments', [
            'departments' => $departments,
            'allMajors' => $allMajors,
            'allUsers' => $allUsers,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeDepartment($request);

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:general,shs_unified,shs_strand',
            'majors' => 'nullable|array',
            'majors.*.major_subject_uuid' => 'required|string|exists:major_subjects,uuid',
            'majors.*.strand' => 'nullable|string|max:255',
            'head_uuid' => 'nullable|string|exists:users,uuid',
        ]);

        $this->validateMajorScope($data['type'], $data['majors'] ?? []);

        $dept = Department::create([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'head_uuid' => $data['head_uuid'] ?? null,
        ]);

        $this->syncDepartmentMajors($dept, $data['majors'] ?? []);

        if (($data['head_uuid'] ?? null)) {
            $this->syncHeadRole(null, $data['head_uuid']);
        }

        return back()->with('success', 'Department created.');
    }

    public function update(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'type' => 'required|string|in:general,shs_unified,shs_strand',
            'majors' => 'nullable|array',
            'majors.*.major_subject_uuid' => 'required|string|exists:major_subjects,uuid',
            'majors.*.strand' => 'nullable|string|max:255',
            'head_uuid' => 'nullable|string|exists:users,uuid',
        ]);

        $this->validateMajorScope($data['type'], $data['majors'] ?? []);

        $oldHeadUuid = $dept->head_uuid;
        $newHeadUuid = $data['head_uuid'] ?? null;

        $dept->update([
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'type' => $data['type'],
            'head_uuid' => $newHeadUuid,
        ]);

        $this->syncDepartmentMajors($dept, $data['majors'] ?? []);

        $this->syncHeadRole($oldHeadUuid, $newHeadUuid);

        return back()->with('success', 'Department updated.');
    }

    private function syncDepartmentMajors(Department $dept, array $majors): void
    {
        $payload = [];
        foreach ($majors as $entry) {
            $strand = trim($entry['strand'] ?? '');

            $payload[$entry['major_subject_uuid']] = [
                'strand' => $strand ?: null,
            ];
        }

        $dept->majors()->sync($payload);
    }

    private function validateMajorScope(string $type, array $majors): void
    {
        if (empty($majors)) {
            return;
        }

        $errors = [];

        foreach ($majors as $index => $entry) {
            if ($type === 'shs_strand' && empty(trim($entry['strand'] ?? ''))) {
                $errors["majors.{$index}.strand"] = 'A strand is required for each major in a strand-specific department.';
            }
        }

        if ($errors) {
            throw ValidationException::withMessages($errors);
        }
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

    public function subjectTeachers(Request $request, string $uuid)
    {
        $this->authorizeDepartment($request);

        $dept = Department::where('uuid', $uuid)->with('majors')->firstOrFail();
        $user = $request->user();

        $canBypass = method_exists($user, 'hasPermission')
            && $user->hasPermission('bypass department teacher restriction');

        $firstMajor = $dept->majors->first();

        if ($canBypass || ! $firstMajor) {
            $teachers = User::query()
                ->whereHas('roles', fn ($q) => $q->where('roles.name', 'TEACHER'))
                ->orderBy('name')
                ->get(['uuid', 'name']);
        } else {
            $teachers = $this->getMajorTeachers($firstMajor->uuid);
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

        $dept = Department::where('head_uuid', $user->uuid)->with(['teachers', 'majors'])->first();

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
                'majors' => $dept->majors->map(fn (MajorSubject $m) => [
                    'uuid' => $m->uuid,
                    'name' => $m->name,
                    'strand' => $m->pivot->strand,
                ])->values(),
            ],
            'teachers' => $teachers,
        ]);
    }
}
