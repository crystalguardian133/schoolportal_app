<?php

namespace App\Http\Controllers;

use App\Models\ClassSection;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;

class AdminTeacherController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();
        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage users');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $q = $request->query('q');
        $perPage = (int) $request->query('per_page', 25);
        $gradeLevel = $request->query('grade_level');
        $sort = $request->query('sort', 'name_asc');

        $sortMap = [
            'name_asc' => ['name', 'asc'],
            'name_desc' => ['name', 'desc'],
            'email_asc' => ['email', 'asc'],
            'email_desc' => ['email', 'desc'],
            'section_asc' => ['adviser_section', 'asc'],
            'section_desc' => ['adviser_section', 'desc'],
            'created_at_asc' => ['created_at', 'asc'],
            'created_at_desc' => ['created_at', 'desc'],
        ];

        [$sortColumn, $sortDirection] = $sortMap[$sort] ?? ['name', 'asc'];

        $sections = ClassSection::query()
            ->select(['uuid', 'name', 'grade_level'])
            ->orderBy('name', 'asc')
            ->get();

        $sectionToGrade = [];
        foreach ($sections as $s) {
            $sectionToGrade[$s->name] = $s->grade_level;
        }

        $query = User::query()
            ->select(['uuid', 'name', 'email', 'profile_picture', 'is_adviser', 'adviser_section'])
            ->whereHas('roles', function ($rq) {
                $rq->where('roles.name', 'TEACHER')
                    ->orWhere('roles.name', 'teacher')
                    ->orWhere('roles.name', 'department-head');
            });

        if (! empty($q)) {
            $query->where(function ($w) use ($q) {
                $w->where('name', 'like', "%{$q}%")
                    ->orWhere('email', 'like', "%{$q}%");
            });
        }

        if (! empty($gradeLevel)) {
            $sectionNames = collect($sectionToGrade)
                ->filter(fn ($g) => $g === $gradeLevel)
                ->keys()
                ->all();

            if (count($sectionNames) > 0) {
                $query->whereIn('adviser_section', $sectionNames);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $query->orderBy($sortColumn, $sortDirection);

        $teachers = $query->paginate($perPage)->withQueryString();

        $roles = DB::table('role_user')
            ->join('roles', 'roles.id', '=', 'role_user.role_uuid')
            ->select(['role_user.user_uuid', 'roles.name as role_name'])
            ->get()
            ->groupBy('user_uuid')
            ->map(fn ($items) => $items->pluck('role_name')->values()->all())
            ->all();

        $sections = $sections
            ->map(fn ($s) => [
                'uuid' => $s->uuid,
                'name' => $s->name,
                'grade_level' => $s->grade_level,
            ])
            ->values()
            ->all();

        $gradeLevels = collect($sectionToGrade)
            ->values()
            ->unique()
            ->sort()
            ->values()
            ->all();

        $adminPermId = DB::table('permissions')->where('name', 'Access Admin')->value('id');
        $adminRoleIds = $adminPermId
            ? DB::table('permission_role')->where('permission_uuid', $adminPermId)->pluck('role_uuid')->toArray()
            : [];

        $roleList = Role::query()
            ->select(['id', 'name'])
            ->whereNotIn('id', $adminRoleIds)
            ->orderBy('name')
            ->get()
            ->pluck('name')
            ->values()
            ->all();

        return inertia('admin/manage-teachers', [
            'teachers' => $teachers,
            'roles' => $roles,
            'sections' => $sections,
            'gradeLevels' => $gradeLevels,
            'roleList' => $roleList,
            'filters' => [
                'q' => $q,
                'per_page' => $perPage,
                'grade_level' => $gradeLevel,
                'sort' => $sort,
            ],
        ]);
    }


    public function update(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $user = User::query()->where('uuid', $uuid)->firstOrFail();

        $data = $request->validate([
            'first_name' => 'nullable|string|max:50',
            'middle_name' => 'nullable|string|max:50',
            'last_name' => 'required|string|max:50',
            'email' => 'required|email',
            'password' => 'nullable|string|min:6|confirmed',
            'role' => 'required|string',
            'is_adviser' => 'nullable|boolean',
            'adviser_section' => 'nullable|string',
            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        // prevent demoting yourself
        $currentUser = $request->user();
        if ($currentUser && method_exists($currentUser, 'uuid') && $currentUser->uuid === $user->uuid) {
            $currentUserRoles = $currentUser->roles->pluck('name')->values()->all();
            $adminRoles = ['admin', 'principal', 'registrar', 'ADMINISTRATOR'];
            $hasAdminRole = ! empty(array_intersect($currentUserRoles, $adminRoles));
            if (! in_array($data['role'], $adminRoles) && $hasAdminRole) {
                return back()->with('error', 'Cannot remove your own admin privileges.');
            }
        }

        // ensure email is unique except for current user
        $exists = DB::table('users')->where('email', $data['email'])->where('uuid', '<>', $user->uuid)->exists();
        if ($exists) {
            return back()->with('error', 'Email already in use by another account.');
        }

        // Validate adviser section isn't already taken by another user
        if (! empty($data['is_adviser']) && ! empty($data['adviser_section'])) {
            $sectionTakenByOther = User::query()
                ->where('is_adviser', true)
                ->where('adviser_section', $data['adviser_section'])
                ->where('uuid', '<>', $user->uuid)
                ->exists();

            if ($sectionTakenByOther) {
                return back()->with('error', 'This section already has an adviser assigned.');
            }
        }

        $first = trim($data['first_name'] ?? '');
        $middle = trim($data['middle_name'] ?? '');
        $last = trim($data['last_name']);
        $middleInitial = $middle ? ' '.strtoupper(substr($middle, 0, 1)) : '';
        $name = $last.($first ? ', '.$first.$middleInitial : '');

        $user->name = $name;
        $user->email = $data['email'];
        $user->is_adviser = ! empty($data['is_adviser']);
        $user->adviser_section = ! empty($data['is_adviser']) ? ($data['adviser_section'] ?? null) : null;

        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $subfolder = 'admin-staff';

            if (method_exists($user, 'hasRole') && $user->hasRole('teacher')) {
                $subfolder = 'teachers';
            }

            $destDir = base_path('resources/assets/profile_pictures/'.$subfolder);
            if (! File::exists($destDir)) {
                File::makeDirectory($destDir, 0755, true);
            }

            $filename = ($user->uuid ?? uniqid()).'.'.$avatar->getClientOriginalExtension();
            $avatar->move($destDir, $filename);

            $user->profile_picture = 'profile_pictures/'.$subfolder.'/'.$filename;
        }

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        // sync single role
        $roleModel = Role::query()->where('name', $data['role'])->first();
        if ($roleModel) {
            $user->roles()->sync([$roleModel->id]);
        }

        return redirect()->route('admin.manage-teachers.index')
            ->with('success', 'Teacher updated successfully.');
    }
}
