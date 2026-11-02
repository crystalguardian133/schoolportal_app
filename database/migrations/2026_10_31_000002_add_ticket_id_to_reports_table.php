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
            if (! Schema::hasColumn('reports', 'ticket_id')) {
                $table->string('ticket_id', 32)->nullable()->unique()->after('id');
            }
        });

        // Backfill existing rows.
        $reports = DB::table('reports')->whereNull('ticket_id')->get();
        foreach ($reports as $r) {
            $year = $r->ticket_year ?: (int) substr((string) $r->created_at, 0, 4);
            $num = $r->ticket_number ?: 0;
            $id = 'DNHS'.$year.'-'.str_pad((string) $num, 4, '0', STR_PAD_LEFT);
            if ($num === 0) {
                $id = 'DNHS'.$year.'-'.substr((string) $r->id, 0, 6);
            }
            DB::table('reports')->where('id', $r->id)->update(['ticket_id' => $id]);
        }
    }

    public function down(): void
    {
        Schema::table('reports', function (Blueprint $table) {
            if (Schema::hasColumn('reports', 'ticket_id')) {
                $table->dropColumn('ticket_id');
            }
        });
    }
};
