<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Uid\Uuid;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('users')
            ->whereNull('uuid')
            ->orderBy('id')
            ->get()
            ->each(function ($user) {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update(['uuid' => Uuid::v7()->toRfc4122()]);
            });
    }

    public function down(): void
    {
        // UUID backfill is not reversible.
    }
};
