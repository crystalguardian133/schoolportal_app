<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('permission_role', function (Blueprint $table) {
            $table->id();
            $table->uuid('permission_uuid');
            $table->uuid('role_uuid');
            $table->timestamps();

            $table->foreign('permission_uuid')->references('id')->on('permissions')->onDelete('cascade');
            $table->foreign('role_uuid')->references('id')->on('roles')->onDelete('cascade');
            $table->unique(['permission_uuid', 'role_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('permission_role');
    }
};
