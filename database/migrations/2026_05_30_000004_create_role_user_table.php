<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_user', function (Blueprint $table) {
            $table->id();
            $table->uuid('role_uuid');
            $table->string('user_uuid', 36);
            $table->timestamps();

            $table->foreign('role_uuid')->references('id')->on('roles')->onDelete('cascade');
            $table->index('user_uuid');
            $table->unique(['role_uuid', 'user_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_user');
    }
};
