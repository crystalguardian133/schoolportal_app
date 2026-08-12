<?php

namespace App\Listeners;

use App\Events\AnnouncementPublished;
use App\Services\PushNotificationService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;

class SendAnnouncementPushNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public function __construct(
        private readonly PushNotificationService $pushService
    ) {}

    public function handle(AnnouncementPublished $event): void
    {
        try {
            $this->pushService->sendForAnnouncement($event->announcement);
        } catch (\Throwable $e) {
            Log::error('[PUSH] Failed to send announcement push notification', [
                'announcement_uuid' => $event->announcement->uuid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
