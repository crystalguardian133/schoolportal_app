<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_access_preferences(): void
    {
        $this->get('/settings/preferences')->assertRedirect('/login');
        // Web middleware redirects guests to login (no JSON 401 on this stack).
        $this->patchJson('/settings/preferences', ['accent' => 'violet'])
            ->assertRedirect('/login');
    }

    public function test_user_gets_defaults_merged(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->getJson('/settings/preferences');

        $res->assertOk()
            ->assertJsonPath('preferences.accent', 'default')
            ->assertJsonPath('preferences.density', 'comfortable')
            ->assertJsonPath('preferences.widgets', []);
    }

    public function test_partial_update_merges_and_persists(): void
    {
        $user = User::factory()->create(['preferences' => ['accent' => 'rose']]);

        $res = $this->actingAs($user)->patchJson('/settings/preferences', [
            'density' => 'compact',
        ]);

        $res->assertOk()->assertJsonPath('preferences.accent', 'rose');
        $res->assertJsonPath('preferences.density', 'compact');
        $this->assertSame('rose', $user->fresh()->preferences['accent']);
        $this->assertSame('compact', $user->fresh()->preferences['density']);
    }

    public function test_invalid_values_rejected(): void
    {
        $user = User::factory()->create();

        // Web stack redirects back with errors (see session below).
        $this->actingAs($user)->patchJson('/settings/preferences', [
            'accent' => 'hacker',
        ])->assertSessionHasErrors('accent');

        $this->actingAs($user)->patchJson('/settings/preferences', [
            'widgets' => [['section' => 123]],
        ])->assertSessionHasErrors('widgets.0.section');

        $this->actingAs($user)->patchJson('/settings/preferences', [
            'customAccent' => 'not-a-color',
        ])->assertSessionHasErrors('customAccent');

        $this->actingAs($user)->patchJson('/settings/preferences', [
            'radius' => 'xl',
        ])->assertSessionHasErrors('radius');

        // Nothing persisted from the rejected payloads.
        $this->assertNull($user->fresh()->preferences);
    }

    public function test_new_keys_persist_and_merge(): void
    {
        $user = User::factory()->create();

        $res = $this->actingAs($user)->patchJson('/settings/preferences', [
            'accent' => 'custom',
            'customAccent' => '#7c3aed',
            'radius' => 'l',
            'reduceMotion' => true,
        ]);

        $res->assertOk()
            ->assertJsonPath('preferences.accent', 'custom')
            ->assertJsonPath('preferences.customAccent', '#7c3aed')
            ->assertJsonPath('preferences.radius', 'l')
            ->assertJsonPath('preferences.reduceMotion', true)
            ->assertJsonPath('preferences.density', 'comfortable');
    }

    public function test_cannot_set_other_users_preferences(): void
    {
        $me = User::factory()->create();
        $other = User::factory()->create(['preferences' => ['accent' => 'emerald']]);

        // There is no user-scoped route: PATCH always targets the actor.
        $this->actingAs($me)->patchJson('/settings/preferences', [
            'accent' => 'violet',
        ])->assertOk();

        $this->assertSame('emerald', $other->fresh()->preferences['accent']);
        $this->assertSame('violet', $me->fresh()->preferences['accent']);
    }
}
