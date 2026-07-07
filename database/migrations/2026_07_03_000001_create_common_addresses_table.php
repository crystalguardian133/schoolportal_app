<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('common_addresses', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('address_zone_street')->nullable();
            $table->string('address_barangay')->nullable();
            $table->string('address_municipality')->nullable();
            $table->string('address_province')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('common_addresses');
    }
};