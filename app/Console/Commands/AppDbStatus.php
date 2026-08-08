<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AppDbStatus extends Command
{
    protected $signature = 'app:db-status';

    protected $description = 'Detect whether the application database already contains data (empty, provisioned, or external).';

    public function handle(): int
    {
        try {
            $migrationCount = Schema::hasTable('migrations') ? DB::table('migrations')->count() : 0;
            $usersExists = Schema::hasTable('users');
        } catch (Throwable $e) {
            $this->error('Database is unreachable: '.$e->getMessage());

            return 2;
        }

        if ($migrationCount > 0) {
            $this->line('provisioned');

            return 0;
        }

        if (! $usersExists) {
            $this->line('empty');

            return 0;
        }

        $this->line('external');

        return 0;
    }
}
