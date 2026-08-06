<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\PushSubscription;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;
use Throwable;

class PushNotificationService
{
    public function sendToUser(string $userUuid, string $title, string $body, array $options = []): void
    {
        $subscriptions = PushSubscription::query()
            ->where('user_uuid', $userUuid)
            ->get();

        $this->send($subscriptions, $title, $body, $options);
    }

    public function sendAnnouncement(Announcement $announcement): void
    {
        $title = $announcement->scope === 'system'
            ? 'New announcement'
            : 'New announcement for your section';

        $options = [
            'url' => '/student/announcements',
            'tag' => 'announcement-'.$announcement->uuid,
        ];

        match ($announcement->scope) {
            'system' => $this->sendToAll($title, $announcement->title, $options),
            'section' => $this->sendToSections([$announcement->section_name], $title, $announcement->title, $options),
            'class' => $this->sendToSections([$announcement->classSection?->name], $title, $announcement->title, $options),
            default => null,
        };
    }

    public function sendToSections(array $sectionNames, string $title, string $body, array $options = []): void
    {
        $subscriptions = PushSubscription::query()
            ->whereIn('user_uuid', function ($query) use ($sectionNames) {
                $query->select('user_uuid')
                    ->from('students')
                    ->whereIn('section', $sectionNames);
            })
            ->get();

        $this->send($subscriptions, $title, $body, $options);
    }

    public function sendToAll(string $title, string $body, array $options = []): void
    {
        $this->send(PushSubscription::query()->get(), $title, $body, $options);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, PushSubscription>  $subscriptions
     */
    private function send($subscriptions, string $title, string $body, array $options): void
    {
        if (! config('push.enabled')) {
            return;
        }

        $publicKey = config('push.vapid.public_key');
        $privateKey = config('push.vapid.private_key');

        if (! $publicKey || ! $privateKey || $subscriptions->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('push.vapid.subject'),
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ],
                'timeout' => 10,
            ]);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'url' => $options['url'] ?? '/dashboard',
                'tag' => $options['tag'] ?? 'announcement',
                'icon' => '/pwa-icons/icon-192x192.png',
                'badge' => '/pwa-icons/icon-192x192.png',
            ]);

            foreach ($subscriptions as $subscription) {
                try {
                    $webPush->queueNotification(
                        Subscription::create([
                            'endpoint' => $subscription->endpoint,
                            'publicKey' => $subscription->keys_p256dh,
                            'authToken' => $subscription->keys_auth,
                            'contentEncoding' => 'aes128gcm',
                        ]),
                        $payload
                    );
                } catch (Throwable $e) {
                    report($e);
                }
            }

            $expiredEndpoints = [];
            foreach ($webPush->flush() as $report) {
                if ($report->isSubscriptionExpired()) {
                    $expiredEndpoints[] = $report->getEndpoint();
                }
            }

            if (! empty($expiredEndpoints)) {
                PushSubscription::query()
                    ->whereIn('endpoint', $expiredEndpoints)
                    ->delete();
            }
        } catch (Throwable $e) {
            report($e);
        }
    }
}
