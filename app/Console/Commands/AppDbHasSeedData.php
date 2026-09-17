<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AppDbHasSeedData extends Command
{
    protected $signature = 'app:db-has-seed-data';

    protected $description = 'Detect whether the application was fully seeded (admin user exists).';

    public function handle(): int
    {
        try {
            $seeded = Schema::hasTable('users')
                && DB::table('users')->where('email', 'admin@example.com')->exists();
        } catch (Throwable $e) {
            $this->error('Database is unreachable: '.$e->getMessage());

            return 2;
        }

        $this->line($seeded ? 'yes' : 'no');

        return 0;
    }
}