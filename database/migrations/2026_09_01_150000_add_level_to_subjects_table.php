<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->string('level')->nullable()->after('strand');
        });

        // Subjects with a track or strand are senior-high scoped; JHS subjects
        // carry no track/strand.
        DB::table('subjects')
            ->where(function ($query) {
                $query->whereNotNull('track')->orWhereNotNull('strand');
            })
            ->update(['level' => 'shs', 'updated_at' => now()]);
    }

    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropColumn('level');
        });
    }
};