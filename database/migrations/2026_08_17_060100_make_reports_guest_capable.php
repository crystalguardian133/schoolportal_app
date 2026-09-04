<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            if (!Schema::hasColumn('reports', 'contact_email')) {
                $table->string('contact_email')->nullable()->after('user_id');
            }
            if (!Schema::hasColumn('reports', 'access_token')) {
                $table->string('access_token', 64)->nullable()->unique()->after('contact_email');
            }
        });

        // Allow guest-submitted support tickets (no user account)
        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE reports ALTER COLUMN user_id DROP NOT NULL');
        } else {
            DB::statement('ALTER TABLE reports MODIFY user_id BIGINT UNSIGNED NULL');
        }
    }

    public function down(): void
    {
        DB::statement('DELETE FROM reports WHERE user_id IS NULL');

        $driver = DB::getDriverName();
        if ($driver === 'pgsql') {
            DB::statement('ALTER TABLE reports ALTER COLUMN user_id SET NOT NULL');
        } else {
            DB::statement('ALTER TABLE reports MODIFY user_id BIGINT UNSIGNED NOT NULL');
        }

        Schema::table('reports', function (Blueprint $table) {
            $table->dropColumn(['contact_email', 'access_token']);
        });
    }
};