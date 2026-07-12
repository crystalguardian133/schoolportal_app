<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->uuid('uuid')->primary();
            $table->string('title');
            $table->text('body');
            $table->string('scope')->index();
            $table->string('class_section_uuid', 36)->nullable()->index();
            $table->string('section_name')->nullable()->index();
            $table->string('image_path')->nullable();
            $table->string('created_by_user_uuid', 36)->nullable()->index();
            $table->timestamps();
            $table->foreign('class_section_uuid')->references('uuid')->on('class_sections')->nullOnDelete();
            $table->foreign('created_by_user_uuid')->references('uuid')->on('users')->nullOnDelete();
        });
    }
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};