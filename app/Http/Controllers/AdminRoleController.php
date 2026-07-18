<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminRoleController extends Controller
{
    private function authorizeAdmin(Request $request): void
    {
        $user = $request->user();

        $hasPermission = $user && method_exists($user, 'hasPermission') && $user->hasPermission('manage roles');
        $hasRole = $user && method_exists($user, 'hasRole') && ($user->hasRole('admin') || $user->hasRole('principal') || $user->hasRole('registrar'));

        if (! $user || (! $hasPermission && ! $hasRole)) {
            abort(403);
        }
    }

    public function index(Request $request)
    {
        $this->authorizeAdmin($request);

        $roles = Role::query()
            ->with('permissions')
            ->get()
            ->map(fn (Role $role) => [
                'id' => $role->id,
                'name' => $role->name,
                'icon' => $role->icon,
                'permissions' => $role->permissions->pluck('id')->values()->all(),
            ])
            ->values()
            ->all();

        $permissions = Permission::query()
            ->get()
            ->map(fn (Permission $permission) => [
                'id' => $permission->id,
                'name' => $permission->name,
            ])
            ->values()
            ->all();

        $usersQuery = User::query()
            ->with(['roles' => function ($q) {
                $q->withPivot('expires_at');
            }]);

        if ($request->filled('search')) {
            $search = $request->search;
            $usersQuery->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $perPage = (int) $request->query('per_page', 10);
        $pageName = 'users_page';

        $usersPaginator = $usersQuery
            ->orderBy('name')
            ->paginate($perPage, ['*'], $pageName)
            ->withQueryString();

        $users = $usersPaginator
            ->getCollection()
            ->map(function (User $user) {
                $activeRoles = $user->roles->filter(fn ($role) => ! $role->pivot->expires_at || \Carbon\Carbon::parse($role->pivot->expires_at)->isFuture());

                return [
                    'uuid' => $user->uuid,
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $activeRoles->map(fn ($role) => [
                        'id' => $role->id,
                        'name' => $role->name,
                        'icon' => $role->icon,
                        'expires_at' => $role->pivot->expires_at?->toIso8601String(),
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        return inertia('admin/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
            'users' => $users,
            'usersPagination' => [
                'current_page' => $usersPaginator->currentPage(),
                'last_page' => $usersPaginator->lastPage(),
                'total' => $usersPaginator->total(),
            ],
            'filters' => $request->only(['search', 'per_page']),
            'hasAccessAdmin' => $request->user()->hasPermission('access admin'),
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
            'icon' => 'nullable|string|max:255',
        ]);

        Role::create([
            'name' => $data['name'],
            'icon' => $data['icon'] ?? null,
            'guard_name' => 'web',
        ]);

        return back()->with('success', 'Role created successfully.');
    }

    public function update(Request $request, string $id)
    {
        $this->authorizeAdmin($request);

        $role = Role::query()->where('id', $id)->firstOrFail();

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name,'.$role->id.',id',
            'icon' => 'nullable|string|max:255',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,id',
        ]);

        DB::transaction(function () use ($role, $data) {
            $role->name = $data['name'];
            $role->icon = $data['icon'] ?? null;
            $role->save();

            $role->permissions()->sync($data['permissions'] ?? []);
        });

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, string $id)
    {
        $this->authorizeAdmin($request);

        $user = $request->user();
        $role = Role::query()->where('id', $id)->firstOrFail();

        $protectedRoles = ['admin', 'principal', 'registrar', 'student', 'staff', 'teacher'];
        if (in_array($role->name, $protectedRoles)) {
            $hasAccessAdmin = $user && method_exists($user, 'hasPermission') && $user->hasPermission('access admin');
            if (! $hasAccessAdmin) {
                return back()->with('error', 'This role is protected and cannot be deleted.');
            }
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }

    /** Assign a role to a user (multi-role support with optional expiry). */
    public function assignUserRole(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'user_uuid' => 'required|string|exists:users,uuid',
            'role_uuid' => 'required|string|exists:roles,id',
            'expires_at' => 'nullable|date|after:now',
        ]);

        $user = User::query()->where('uuid', $data['user_uuid'])->firstOrFail();

        // Check if user already has this active role
        $alreadyHas = $user->activeRoles()->where('roles.id', $data['role_uuid'])->exists();
        if ($alreadyHas) {
            return back()->with('error', 'User already has this role.');
        }

        $user->assignRole($data['role_uuid'], $data['expires_at'] ?? null);

        return back()->with('success', 'Role assigned successfully.');
    }

    /** Remove a role from a user. */
    public function removeUserRole(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'user_uuid' => 'required|string|exists:users,uuid',
            'role_uuid' => 'required|string|exists:roles,id',
        ]);

        $user = User::query()->where('uuid', $data['user_uuid'])->firstOrFail();
        $user->removeRole($data['role_uuid']);

        return back()->with('success', 'Role removed successfully.');
    }

    /** Update expiry date for a user-role assignment. */
    public function updateUserRoleExpiry(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'user_uuid' => 'required|string|exists:users,uuid',
            'role_uuid' => 'required|string|exists:roles,id',
            'expires_at' => 'nullable|date',
        ]);

        DB::table('role_user')
            ->where('user_uuid', $data['user_uuid'])
            ->where('role_uuid', $data['role_uuid'])
            ->update(['expires_at' => $data['expires_at']]);

        return back()->with('success', 'Role expiry updated.');
    }
}
