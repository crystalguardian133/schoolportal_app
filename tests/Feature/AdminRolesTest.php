<?php

namespace Tests\Feature;

use App\Models\Permission;
use App\Models\Role;
use App\Models\User;
use Database\Seeders\PermissionsTableSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\RolesTableSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminRolesTest extends TestCase
{
    use RefreshDatabase;

    private function seedRolesAndPermissions(): void
    {
        $this->seed([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            RolePermissionSeeder::class,
        ]);
    }

    private function administrator(): User
    {
        $this->seedRolesAndPermissions();

        $user = User::factory()->create();
        $user->assignRole('ADMINISTRATOR');

        return $user;
    }

    /** Has "manage roles" but deliberately NOT "access admin". */
    private function roleManager(): User
    {
        $this->seedRolesAndPermissions();

        $role = Role::query()->firstOrCreate(
            ['name' => 'ROLE MANAGER'],
            ['guard_name' => 'web'],
        );

        $permission = Permission::query()->where('name', 'Manage Roles')->firstOrFail();
        $role->permissions()->syncWithoutDetaching([$permission->id]);

        $user = User::factory()->create();
        $user->assignRole($role->id);

        return $user;
    }

    private function customRole(string $name): Role
    {
        return Role::query()->firstOrCreate(
            ['name' => $name],
            ['guard_name' => 'web'],
        );
    }

    public function test_guests_are_redirected_from_the_roles_page(): void
    {
        $this->get('/admin/roles')->assertRedirect('/login');
    }

    public function test_user_without_manage_roles_permission_is_forbidden(): void
    {
        $this->actingAs(User::factory()->create())
            ->get('/admin/roles')
            ->assertForbidden();
    }

    public function test_role_manager_can_view_the_roles_page(): void
    {
        $this->actingAs($this->roleManager())
            ->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/roles')
                ->has('roles')
                ->has('permissions')
                ->where('hasAccessAdmin', false)
            );
    }

    public function test_seeded_administrator_role_is_reported_with_permissions(): void
    {
        $this->actingAs($this->administrator())
            ->get('/admin/roles')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/roles')
                ->where('hasAccessAdmin', true)
                ->where('roles', function ($roles) {
                    $administrator = collect($roles)->firstWhere('name', 'ADMINISTRATOR');

                    return $administrator !== null
                        && $administrator['name'] === 'ADMINISTRATOR'
                        && count($administrator['permissions']) > 0;
                })
            );
    }

    public function test_protected_role_cannot_be_deleted_without_access_admin(): void
    {
        $user = $this->roleManager();
        $role = Role::query()->where('name', 'ADMINISTRATOR')->firstOrFail();

        $this->actingAs($user)
            ->delete("/admin/roles/{$role->id}")
            ->assertRedirect();

        $this->assertDatabaseHas('roles', ['id' => $role->id]);
    }

    public function test_protected_role_can_be_deleted_with_access_admin(): void
    {
        $user = $this->administrator();
        $role = Role::query()->where('name', 'STUDENT')->firstOrFail();

        // The seeded role name is upper case, which exercises the
        // case-insensitive protected-role guard.
        $this->actingAs($user)
            ->delete("/admin/roles/{$role->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_custom_role_can_be_deleted_by_a_role_manager(): void
    {
        $user = $this->roleManager();
        $role = $this->customRole('COUNSELOR');

        $this->actingAs($user)
            ->delete("/admin/roles/{$role->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('roles', ['id' => $role->id]);
    }

    public function test_updating_a_role_syncs_its_permissions(): void
    {
        $user = $this->administrator();
        $role = Role::query()->where('name', 'STAFF')->firstOrFail();
        $permission = Permission::query()->where('name', 'Manage Users')->firstOrFail();

        $this->actingAs($user)
            ->patch("/admin/roles/{$role->id}", [
                'name' => 'STAFF',
                'icon' => 'shield',
                'permissions' => [$permission->id],
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('permission_role', [
            'role_uuid' => $role->id,
            'permission_uuid' => $permission->id,
        ]);

        $this->assertSame(
            [$permission->id],
            $role->permissions()->get()->pluck('id')->all(),
        );
    }

    public function test_role_names_must_be_unique(): void
    {
        $user = $this->administrator();
        $this->customRole('GUIDANCE COUNSELOR');

        $this->actingAs($user)
            ->post('/admin/roles', ['name' => 'GUIDANCE COUNSELOR'])
            ->assertSessionHasErrors('name');
    }
}
