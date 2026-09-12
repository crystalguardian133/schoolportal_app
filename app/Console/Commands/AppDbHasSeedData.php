<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Throwable;

class AppDbHasSeedData extends Command
{
    protected $signature = 'app:db-has-seed-data';

    protected $description = 'Detect whether any seed-populated table already contains data.';

    protected array $tables = ['roles', 'permissions', 'school_years', 'users'];

    public function handle(): int
    {
        try {
            foreach ($this->tables as $table) {
                if (Schema::hasTable($table) && DB::table($table)->exists()) {
                    $this->line('yes');

                    return 0;
                }
            }
        } catch (Throwable $e) {
            $this->error('Database is unreachable: '.$e->getMessage());

            return 2;
        }

        $this->line('no');

        return 0;
    }
}