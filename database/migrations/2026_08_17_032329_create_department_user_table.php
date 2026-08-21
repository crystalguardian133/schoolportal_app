<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_user', function (Blueprint $table) {
            $table->id();
            $table->uuid('department_uuid');
            $table->string('user_uuid', 36);
            $table->timestamps();

            $table->foreign('department_uuid')->references('uuid')->on('departments')->onDelete('cascade');
            $table->index('user_uuid');
            $table->unique(['department_uuid', 'user_uuid']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_user');
    }
};
