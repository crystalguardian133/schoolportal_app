<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Role;
use App\Models\Permission;
use App\Models\ClassSection;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\File;

class AdminUserController extends Controller
{
    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $users = User::query()
            ->select(['uuid', 'name', 'email', 'profile_picture', 'is_adviser', 'adviser_section'])
            ->paginate((int) $request->query('per_page', 25))
            ->withQueryString();

        $roles = DB::table('role_user')
            ->join('roles', 'roles.id', '=', 'role_user.role_uuid')
            ->select(['role_user.user_uuid', 'roles.name as role_name'])
            ->get()
            ->groupBy('user_uuid')
            ->map(fn ($items) => $items->pluck('role_name')->values()->all())
            ->all();

        $permissions = Permission::query()
            ->select(['id', 'name'])
            ->get()
            ->sortBy('name')
            ->map(fn ($permission) => ['id' => $permission->id, 'name' => $permission->name])
            ->values()
            ->all();

        $rolePermissions = DB::table('permission_role')
            ->join('permissions', 'permissions.id', '=', 'permission_role.permission_uuid')
            ->select(['permission_role.role_uuid', 'permissions.name as permission_name'])
            ->get()
            ->groupBy('role_uuid')
            ->map(fn ($items) => $items->pluck('permission_name')->values()->all())
            ->all();

        return inertia('admin/users', [
            'users' => $users,
            'roles' => $roles,
            'roleOptions' => Role::query()->select(['id', 'name'])->get()->sortBy('name')->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values()->all(),
            'permissions' => $permissions,
            'rolePermissions' => $rolePermissions,
            'sections' => ClassSection::query()->select(['uuid', 'name', 'grade_level'])->get()->sortBy('name')->map(fn ($s) => ['uuid' => $s->uuid, 'name' => $s->name, 'grade_level' => $s->grade_level])->values()->all(),
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage users');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function create(Request $request)
    {
        // create page removed; creation handled on combined users page
        abort(404);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'first_name' => 'nullable|string|max:50',
            'middle_name' => 'nullable|string|max:50',
            'last_name' => 'required|string|max:50',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6|confirmed',
            'role' => 'required|string',
            'is_adviser' => 'nullable|boolean',
            'adviser_section' => 'nullable|string',
        ]);

        $first = trim($data['first_name'] ?? '');
        $middle = trim($data['middle_name'] ?? '');
        $last = trim($data['last_name']);

        $middleInitial = $middle ? ' ' . strtoupper(substr($middle, 0, 1)) : '';
        $name = $last . ($first ? ', ' . $first . $middleInitial : '');

        $user = User::create([
            'name' => $name,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_adviser' => ! empty($data['is_adviser']),
            'adviser_section' => ! empty($data['is_adviser']) ? ($data['adviser_section'] ?? null) : null,
        ]);

        if (! empty($data['role'])) {
            $user->assignRole($data['role']);
        }

        return redirect()->route('admin.users')->with('success', 'User created successfully.');
    }

    public function edit(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $user = User::query()->where('uuid', $uuid)->firstOrFail();

        $sections = ClassSection::query()
            ->select(['uuid', 'name', 'grade_level'])
            ->orderBy('name', 'asc')
            ->get()
            ->map(fn ($s) => [
                'uuid' => $s->uuid,
                'name' => $s->name,
                'grade_level' => $s->grade_level,
            ])
            ->values()
            ->all();

        $roles = Role::query()->select(['id', 'name'])->get()->map(fn ($r) => ['id' => $r->id, 'name' => $r->name])->values()->all();

        $userRoles = $user->roles->pluck('name')->values()->all();

        return inertia('admin/edit-user', [
            'user' => [
                'uuid' => $user->uuid,
                'name' => $user->name,
                'email' => $user->email,
                'profile_picture' => $user->profile_picture,
                'is_adviser' => $user->is_adviser,
                'adviser_section' => $user->adviser_section,
                'roles' => $userRoles,
            ],
            'sections' => $sections,
            'roles' => $roles,
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
            'email' => ['required', 'email'],
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
            $adminRoles = ['admin', 'principal', 'registrar'];
            $hasAdminRole = !empty(array_intersect($currentUserRoles, $adminRoles));
            if (!in_array($data['role'], $adminRoles) && $hasAdminRole) {
                return back()->with('error', 'Cannot remove your own admin privileges.');
            }
        }

        // ensure email is unique except for current user
        $exists = DB::table('users')->where('email', $data['email'])->where('uuid', '<>', $user->uuid)->exists();
        if ($exists) {
            return back()->with('error', 'Email already in use by another account.');
        }

        $first = trim($data['first_name'] ?? '');
        $middle = trim($data['middle_name'] ?? '');
        $last = trim($data['last_name']);
        $middleInitial = $middle ? ' ' . strtoupper(substr($middle, 0, 1)) : '';
        $name = $last . ($first ? ', ' . $first . $middleInitial : '');

        $user->name = $name;
        $user->email = $data['email'];
        $user->is_adviser = ! empty($data['is_adviser']);
        $user->adviser_section = ! empty($data['is_adviser']) ? ($data['adviser_section'] ?? null) : null;

        if ($request->hasFile('avatar')) {
            $avatar = $request->file('avatar');
            $subfolder = 'admin-staff';

            if (method_exists($user, 'hasRole')) {
                if ($user->hasRole('student')) {
                    $subfolder = 'students';
                } elseif ($user->hasRole('teacher')) {
                    $subfolder = 'teachers';
                }
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

        return redirect()->route('admin.users')->with('success', 'User updated successfully.');
    }

    public function destroy(Request $request, string $uuid)
    {
        $this->authorizeAdmin($request);

        $user = User::query()->where('uuid', $uuid)->firstOrFail();

        // prevent deleting self
        if ($request->user() && method_exists($request->user(), 'uuid') && $request->user()->uuid === $user->uuid) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // detach roles and delete via query builder
        $user->roles()->detach();
        DB::table('users')->where('uuid', $uuid)->delete();

        return redirect()->route('admin.users')->with('success', 'User deleted successfully.');
    }
}