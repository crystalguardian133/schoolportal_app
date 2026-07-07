<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Announcement;

class CleanOldAnnouncements extends Command
{
    protected $signature = 'announcements:clean-old';
    protected $description = 'Delete announcements older than 2 weeks';

    public function handle(): void
    {
        $deleted = Announcement::where('created_at', '<', now()->subWeeks(2))->delete();
        $this->info("Deleted {$deleted} old announcements.");
    }
}
