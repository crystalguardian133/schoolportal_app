<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemLog extends Model
{
    use HasFactory;

    protected $table = 'system_logs';

    protected $fillable = [
        'user_uuid',
        'action',
        'route_name',
        'method',
        'path',
        'ip_address',
        'user_agent',
        'status_code',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}