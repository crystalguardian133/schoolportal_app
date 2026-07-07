<?php

namespace App\Events;

use App\Models\Announcement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class AnnouncementCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Announcement $announcement;

    public function __construct(Announcement $announcement)
    {
        $this->announcement = $announcement;
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('announcements'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AnnouncementCreated';
    }

    public function broadcastWith(): array
    {
        return [
            'uuid' => $this->announcement->uuid,
            'title' => $this->announcement->title,
            'body' => $this->announcement->body,
            'scope' => $this->announcement->scope,
            'created_by' => $this->announcement->creator?->name,
            'created_at' => $this->announcement->created_at?->toDateTimeString(),
            'image_url' => $this->announcement->image_path ? url('/assets/announcements/'.basename($this->announcement->image_path)) : null,
            'target_label' => $this->announcement->scope === 'system' ? 'System wide' : ($this->announcement->classSection?->name ? 'Class wide: '.$this->announcement->classSection->name : ($this->announcement->section_name ? 'Section wide: '.$this->announcement->section_name : 'Unknown scope')),
        ];
    }
}
