<?php

namespace App\Events;

use App\Models\Announcement;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementPublished
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly Announcement $announcement,
    ) {}
}
