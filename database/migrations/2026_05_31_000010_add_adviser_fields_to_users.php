<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'is_adviser')) {
                $table->boolean('is_adviser')->default(false)->after('email');
            }

            if (! Schema::hasColumn('users', 'adviser_section')) {
                $table->string('adviser_section')->nullable()->after('is_adviser');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (Schema::hasColumn('users', 'adviser_section')) {
                $table->dropColumn('adviser_section');
            }

            if (Schema::hasColumn('users', 'is_adviser')) {
                $table->dropColumn('is_adviser');
            }
        });
    }
};
