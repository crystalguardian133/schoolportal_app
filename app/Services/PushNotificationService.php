<?php

namespace App\Services;

use App\Models\Announcement;
use App\Models\PushSubscription;
use Illuminate\Support\Facades\Log;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class PushNotificationService
{
    private ?WebPush $webPush = null;

    public function __construct()
    {
        $publicKey = config('services.webpush.public_key');
        $privateKey = config('services.webpush.private_key');
        $subject = config('services.webpush.subject', 'mailto:admin@dnhs.edu.ph');

        if ($publicKey && $privateKey) {
            $this->webPush = new WebPush([
                'VAPID' => [
                    'subject' => $subject,
                    'publicKey' => $publicKey,
                    'privateKey' => $privateKey,
                ]
            ]);
        }
    }

    public function sendForAnnouncement(Announcement $announcement): void
    {
        if (! $this->webPush) {
            Log::warning('[PUSH] WebPush not configured, skipping announcement push.');
            return;
        }

        $payload = json_encode([
            'title' => 'New Announcement: ' . $announcement->title,
            'body' => str()->limit(strip_tags($announcement->content), 100),
            'url' => '/dashboard',
        ]);

        // Find relevant subscriptions based on scope
        $query = PushSubscription::query();

        if ($announcement->scope === 'system') {
            // all subscriptions
        } elseif ($announcement->scope === 'teacher') {
            $query->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'teacher')));
        } elseif ($announcement->scope === 'student') {
            $query->whereHas('user', fn($q) => $q->whereHas('roles', fn($r) => $r->where('name', 'student')));
        } elseif ($announcement->scope === 'section' && $announcement->section_name) {
             $query->whereHas('user', fn($q) => $q->whereHas('student', fn($s) => $s->where('section', $announcement->section_name)));
        } elseif ($announcement->scope === 'class' && $announcement->class_section_uuid) {
             $query->whereHas('user', fn($q) => $q->whereHas('student', fn($s) => $s->where('section_uuid', $announcement->class_section_uuid)));
        } else {
            return; // Unknown scope or missing target
        }

        $subscriptions = $query->get();
        $count = 0;

        foreach ($subscriptions as $sub) {
            try {
                $pushSubscription = Subscription::create(json_decode($sub->data, true));
                $this->webPush->queueNotification($pushSubscription, $payload);
                $count++;
            } catch (\Throwable $e) {
                Log::warning('[PUSH] Invalid subscription data for user ' . $sub->user_uuid);
            }
        }

        if ($count > 0) {
            $reports = $this->webPush->flush();
            $success = 0;
            $failed = 0;
            
            if (is_iterable($reports)) {
                foreach ($reports as $report) {
                    if ($report->isSuccess()) {
                        $success++;
                    } else {
                        $failed++;
                        // Optionally, if $report->isSubscriptionExpired(), we could delete it from the DB
                    }
                }
            }

            Log::info('[PUSH] Announcement push sent', [
                'announcement' => $announcement->uuid,
                'attempted' => $count,
                'success' => $success,
                'failed' => $failed
            ]);
        }
    }
}
