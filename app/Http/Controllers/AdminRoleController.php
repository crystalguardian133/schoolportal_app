<?php

namespace App\Http\Controllers;

use App\Models\Permission;
use App\Models\Role;
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

        return inertia('admin/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:roles,name',
        ]);

        Role::create([
            'name' => $data['name'],
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
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,id',
        ]);

        DB::transaction(function () use ($role, $data) {
            $role->name = $data['name'];
            $role->save();

            $role->permissions()->sync($data['permissions'] ?? []);
        });

        return back()->with('success', 'Role updated successfully.');
    }

    public function destroy(Request $request, string $id)
    {
        $this->authorizeAdmin($request);

        $role = Role::query()->where('id', $id)->firstOrFail();

        // Prevent deletion of protected roles
        $protectedRoles = ['admin', 'principal', 'registrar', 'student', 'staff', 'teacher'];
        if (in_array($role->name, $protectedRoles)) {
            return back()->with('error', 'This role is protected and cannot be deleted.');
        }

        $role->delete();

        return back()->with('success', 'Role deleted successfully.');
    }
}