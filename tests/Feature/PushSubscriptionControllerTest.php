<?php

namespace Tests\Feature;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushSubscriptionControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_cannot_store_a_subscription(): void
    {
        $response = $this->postJson('/push/subscriptions', [
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys' => ['auth' => 'auth-token', 'p256dh' => 'p256dh-key'],
        ]);

        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_store_a_subscription(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/push/subscriptions', [
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys' => ['auth' => 'auth-token', 'p256dh' => 'p256dh-key'],
            'device_name' => 'Pixel 8',
        ]);

        $response->assertOk();
        $response->assertJson(['success' => true]);

        $this->assertDatabaseHas('push_subscriptions', [
            'user_uuid' => $user->uuid,
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys_auth' => 'auth-token',
            'keys_p256dh' => 'p256dh-key',
            'device_name' => 'Pixel 8',
        ]);
    }

    public function test_storing_the_same_endpoint_updates_it(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/push/subscriptions', [
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys' => ['auth' => 'auth-token', 'p256dh' => 'p256dh-key'],
        ])->assertOk();

        $this->actingAs($user)->postJson('/push/subscriptions', [
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys' => ['auth' => 'new-auth', 'p256dh' => 'new-key'],
        ])->assertOk();

        $this->assertDatabaseCount('push_subscriptions', 1);
        $this->assertDatabaseHas('push_subscriptions', [
            'keys_auth' => 'new-auth',
            'keys_p256dh' => 'new-key',
        ]);
    }

    public function test_authenticated_users_can_delete_a_subscription(): void
    {
        $user = User::factory()->create();
        $subscription = PushSubscription::create([
            'user_uuid' => $user->uuid,
            'endpoint' => 'https://push.example.com/sub?id=1',
            'keys_auth' => 'auth-token',
            'keys_p256dh' => 'p256dh-key',
        ]);

        $response = $this->actingAs($user)->deleteJson('/push/subscriptions', [
            'endpoint' => $subscription->endpoint,
        ]);

        $response->assertOk();
        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
