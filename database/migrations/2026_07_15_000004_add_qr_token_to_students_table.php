<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\Uid\Uuid;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->string('qr_token', 64)->nullable()->unique()->after('uuid');
        });

        DB::table('students')
            ->whereNull('qr_token')
            ->orderBy('uuid')
            ->each(function ($student) {
                DB::table('students')
                    ->where('uuid', $student->uuid)
                    ->update(['qr_token' => bin2hex(random_bytes(32))]);
            });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn('qr_token');
        });
    }
};
