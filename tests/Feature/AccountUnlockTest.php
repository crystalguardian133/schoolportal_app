<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\PermissionsTableSeeder;
use Database\Seeders\RolePermissionSeeder;
use Database\Seeders\RolesTableSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AccountUnlockTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        $this->seed([
            RolesTableSeeder::class,
            PermissionsTableSeeder::class,
            RolePermissionSeeder::class,
        ]);

        $admin = User::factory()->create();
        $admin->assignRole('ADMINISTRATOR');

        return $admin;
    }

    private function lockedUser(): User
    {
        $user = User::factory()->create();
        $user->forceFill([
            'locked_at' => now(),
            'failed_login_attempts' => 5,
        ])->save();

        return $user;
    }

    public function test_guests_see_public_request_page(): void
    {
        $this->get('/account-unlock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('account-unlock'));
    }

    public function test_user_without_permission_sees_public_request_page(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->get('/account-unlock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('account-unlock'));
    }

    public function test_user_with_permission_sees_locked_accounts_table(): void
    {
        $admin = $this->admin();
        $locked = $this->lockedUser();
        User::factory()->create();

        $this->actingAs($admin)
            ->get('/account-unlock')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/unlock-accounts')
                ->has('users.data', 1)
                ->where('users.data.0.uuid', $locked->uuid)
                ->where('stats.locked', 1)
            );
    }

    public function test_search_filters_locked_accounts(): void
    {
        $admin = $this->admin();

        $alice = User::factory()->create([
            'name' => 'Alice Locked',
            'email' => 'alice@example.com',
        ]);
        $alice->forceFill(['locked_at' => now(), 'failed_login_attempts' => 5])->save();

        $bob = User::factory()->create([
            'name' => 'Bob Locked',
            'email' => 'bob@example.com',
        ]);
        $bob->forceFill(['locked_at' => now(), 'failed_login_attempts' => 5])->save();

        $this->actingAs($admin)
            ->get('/account-unlock?search=Alice')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/unlock-accounts')
                ->has('users.data', 1)
                ->where('users.data.0.uuid', $alice->uuid)
            );
    }

    public function test_permitted_user_can_unlock_an_account(): void
    {
        $admin = $this->admin();
        $locked = $this->lockedUser();

        $this->actingAs($admin)
            ->post("/account-unlock/{$locked->uuid}/unlock")
            ->assertRedirect();

        $locked->refresh();
        $this->assertNull($locked->locked_at);
        $this->assertSame(0, $locked->failed_login_attempts);
    }

    public function test_user_without_permission_cannot_unlock(): void
    {
        $user = User::factory()->create();
        $locked = $this->lockedUser();

        $this->actingAs($user)
            ->post("/account-unlock/{$locked->uuid}/unlock")
            ->assertForbidden();

        $this->assertNotNull($locked->fresh()->locked_at);
    }

    public function test_guests_cannot_unlock(): void
    {
        $locked = $this->lockedUser();

        $this->post("/account-unlock/{$locked->uuid}/unlock")
            ->assertRedirect('/login');

        $this->assertNotNull($locked->fresh()->locked_at);
    }
}
