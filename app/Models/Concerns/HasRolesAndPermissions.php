<?php

namespace App\Models\Concerns;

use App\Models\Role;
use App\Models\Permission;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

trait HasRolesAndPermissions
{
    public function canAccessPortal(string $portal): bool
    {
        if ($this->hasPermission('access admin')) {
            return true;
        }

        if ($this->hasPermission('access developer dashboard')) {
            return true;
        }

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
    public function assignRole($role, ?string $expiresAt = null): void
    {
        $roleUuid = $this->resolveRoleUuid($role);

        if (! $roleUuid) {
            return;
        }

        $existing = DB::table('role_user')
            ->where('user_uuid', $this->uuid)
            ->where('role_uuid', $roleUuid)
            ->first();

        if ($existing) {
            // Update expiry even if role already exists (re-activate expired roles)
            DB::table('role_user')
                ->where('user_uuid', $this->uuid)
                ->where('role_uuid', $roleUuid)
                ->update(['expires_at' => $expiresAt ? Carbon::parse($expiresAt) : null]);
        } else {
            DB::table('role_user')->insert([
                'user_uuid' => $this->uuid,
                'role_uuid' => $roleUuid,
                'expires_at' => $expiresAt ? Carbon::parse($expiresAt) : null,
            ]);
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

    /** Check if the model has a given role (name or UUID), excluding expired. */
    public function hasRole($role): bool
    {
        $query = $this->activeRoles();

        if (preg_match('/^[0-9a-fA-F-]{36}$/', (string) $role)) {
            return $query->where('id', (string) $role)->exists();
        }

        return $query->where('roles.name', (string) $role)->exists();
    }

    /** Check if model has a permission via roles (case-insensitive), excluding expired roles. */
    public function hasPermission(string $permission): bool
    {
        return $this->hasPermissionRaw($permission);
    }

    private function hasPermissionRaw(string $permission): bool
    {
        return $this->activeRoles()->whereHas('permissions', function ($q) use ($permission) {
            $q->whereRaw('LOWER(name) = ?', [strtolower($permission)]);
        })->exists();
    }

    /** Scope: only non-expired roles. */
    public function activeRoles()
    {
        return $this->roles()->where(function ($q) {
            $q->whereNull('role_user.expires_at')
              ->orWhere('role_user.expires_at', '>', Carbon::now());
        });
    }

    /** Detach all expired role assignments for this user. */
    public function cleanupExpiredRoles(): int
    {
        return $this->roles()
            ->whereNotNull('role_user.expires_at')
            ->where('role_user.expires_at', '<=', Carbon::now())
            ->detach();
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
