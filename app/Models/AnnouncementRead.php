<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AnnouncementRead extends Model
{
    protected $fillable = [
        'user_uuid',
        'announcement_uuid',
    ];
}