<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('report_replies', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('ALTER TABLE report_replies MODIFY user_id BIGINT UNSIGNED NULL');

        Schema::table('report_replies', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        DB::statement('DELETE FROM report_replies WHERE user_id IS NULL');

        Schema::table('report_replies', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
        });

        DB::statement('ALTER TABLE report_replies MODIFY user_id BIGINT UNSIGNED NOT NULL');

        Schema::table('report_replies', function (Blueprint $table) {
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
        });
    }
};
