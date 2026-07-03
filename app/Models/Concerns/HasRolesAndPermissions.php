<?php

namespace App\Models\Concerns;

use App\Models\Role;
use App\Models\Permission;

trait HasRolesAndPermissions
{
    public function canAccessPortal(string $portal): bool
    {
        return match ($portal) {
            'student' => $this->hasRole('student'),
            'staff' => $this->hasRole('staff')
                || $this->hasRole('principal')
                || $this->hasRole('registrar')
                || $this->hasRole('admin')
                || $this->hasPermission('view grades')
                || $this->hasPermission('edit grades')
                || $this->hasPermission('view schedules'),
            default => false,
        };
    }

    /** Assign a role to the model (by UUID, name or Role model). */
    public function assignRole($role): void
    {
        $roleUuid = $this->resolveRoleUuid($role);

        if ($roleUuid) {
            $this->roles()->syncWithoutDetaching([$roleUuid]);
        }
    }

    /** Remove a role from the model. */
    public function removeRole($role): void
    {
        $roleUuid = $this->resolveRoleUuid($role);

        if ($roleUuid) {
            $this->roles()->detach($roleUuid);
        }
    }

    /** Check if the model has a given role (name or UUID). */
    public function hasRole($role): bool
    {
        if (preg_match('/^[0-9a-fA-F-]{36}$/', (string) $role)) {
            return $this->roles()->where('id', (string) $role)->exists();
        }

        return $this->roles()->where('name', (string) $role)->exists();
    }

    /** Check if model has a permission via roles. */
    public function hasPermission(string $permission): bool
    {
        return $this->roles()->whereHas('permissions', function ($q) use ($permission) {
            $q->where('name', $permission);
        })->exists();
    }

    private function resolveRoleUuid($role)
    {
        if ($role instanceof Role) {
            return $role->id;
        }

        if (preg_match('/^[0-9a-fA-F-]{36}$/', (string) $role)) {
            return (string) $role;
        }

        $r = Role::query()->where('name', $role)->first();
        return $r ? $r->id : null;
    }
}
