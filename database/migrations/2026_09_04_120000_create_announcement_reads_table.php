<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcement_reads', function (Blueprint $table) {
            $table->id();
            $table->string('user_uuid', 36)->index();
            $table->uuid('announcement_uuid')->index();
            $table->timestamps();
            $table->unique(['user_uuid', 'announcement_uuid'], 'announcement_reads_user_announcement_unique');
            $table->foreign('user_uuid')->references('uuid')->on('users')->cascadeOnDelete();
            $table->foreign('announcement_uuid')->references('uuid')->on('announcements')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('announcement_reads');
    }
};