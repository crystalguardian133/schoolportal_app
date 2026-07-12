<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\SystemLog;

class CleanOldSystemLogs extends Command
{
    protected $signature = 'logs:clean-old';

    protected $description = 'Delete system logs older than 30 days';

    public function handle(): void
    {
        $deleted = SystemLog::where('created_at', '<', now()->subDays(30))->delete();
        $this->info("Deleted {$deleted} old system logs.");
    }
}