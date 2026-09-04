<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushNotificationService
{
    private ?WebPush $webPush = null;

    public function __construct()
    {
        if (! config('push.enabled', false)) {
            return;
        }

        $publicKey = config('push.vapid.public_key');
        $privateKey = config('push.vapid.private_key');
        $subject = config('push.vapid.subject', 'mailto:admin@dnhs.edu.ph');

        if ($publicKey && $privateKey) {
            $this->webPush = new WebPush([
                'VAPID' => [
                    'subject' => $subject,
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
            ]);
        }
    }

    public function isEnabled(): bool
    {
        return $this->webPush !== null;
    }

    public function sendForAnnouncement(Announcement $announcement): void
    {
        if (! $this->webPush) {
            Log::debug('[PUSH] Push notifications disabled or not configured, skipping announcement push.');
            return;
        }

        $payload = json_encode([
            'title' => 'New announcement: '.$announcement->title,
            'body' => str()->limit(strip_tags($announcement->body), 150),
            'url' => '/dashboard',
        ]);

        $subscriptions = $this->relevantSubscriptions($announcement);

        if ($subscriptions->isEmpty()) {
            return;
        }

        $attempted = 0;
        foreach ($subscriptions as $sub) {
            $pushSubscription = $this->buildSubscription($sub);
            if (! $pushSubscription) {
                continue;
            }

            $this->webPush->queueNotification($pushSubscription, $payload);
            $attempted++;
        }

        if ($attempted === 0) {
            return;
        }

        $reports = $this->webPush->flush();

        if (! is_iterable($reports)) {
            return;
        }

        $success = 0;
        $expired = [];
        foreach ($reports as $report) {
            if ($report->isSuccess()) {
                $success++;
            } elseif ($report->isSubscriptionExpired()) {
                $expired[] = $report->getEndpoint();
            }
        }

        $this->pruneExpiredSubscriptions($expired);

        Log::info('[PUSH] Announcement push sent', [
            'announcement_uuid' => $announcement->uuid,
            'scope' => $announcement->scope,
            'attempted' => $attempted,
            'success' => $success,
            'expired' => count($expired),
        ]);
    }

    private function relevantSubscriptions(Announcement $announcement)
    {
        return PushSubscription::query()
            ->whereHas('user', function ($userQuery) use ($announcement) {
                $this->scopeUserQuery($userQuery, $announcement);
            })
            ->get();
    }

    private function scopeUserQuery($userQuery, Announcement $announcement): void
    {
        $scope = $announcement->scope;

        if ($scope === 'system') {
            return;
        }

        if ($scope === 'class' && $announcement->class_section_uuid) {
            $userQuery->whereHas('student', fn ($s) => $s->where('section_uuid', $announcement->class_section_uuid));

            return;
        }

        if ($scope === 'section' && $announcement->section_name) {
            $userQuery->whereHas('student', fn ($s) => $s->where('section', $announcement->section_name));

            return;
        }

        // 'teacher' scope fallback (existing data may use it)
        if ($scope === 'teacher') {
            $userQuery->whereHas('roles', fn ($r) => $r->whereRaw('LOWER(name) = ?', ['teacher']));

            return;
        }

        if ($scope === 'student') {
            $userQuery->whereHas('roles', fn ($r) => $r->whereRaw('LOWER(name) = ?', ['student']));

            return;
        }

        // Unknown or untargetable scope: exclude everyone
        $userQuery->whereRaw('1 = 0');
    }

    private function buildSubscription(PushSubscription $sub): ?Subscription
    {
        try {
            return Subscription::create([
                'endpoint' => $sub->endpoint,
                'keys' => [
                    'auth' => $sub->keys_auth,
                    'p256dh' => $sub->keys_p256dh,
                ],
            ]);
        } catch (\Throwable $e) {
            Log::warning('[PUSH] Invalid subscription data for user '.$sub->user_uuid);

            return null;
        }
    }

    private function pruneExpiredSubscriptions(array $endpoints): void
    {
        foreach ($endpoints as $endpoint) {
            PushSubscription::query()->where('endpoint', $endpoint)->delete();
        }

        if (! empty($endpoints)) {
            Log::info('[PUSH] Removed expired push subscriptions', ['removed' => count($endpoints)]);
        }
    }
}