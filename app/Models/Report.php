<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Report extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'subject',
        'message',
        'images',
        'status',
        'developer_reply',
        'closed',
    ];

    protected $casts = [
        'images' => 'array',
        'closed' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ReportReply::class)->oldest();
    }

    public function scopeOfType($query, ?string $type)
    {
        if ($type) {
            $query->where('type', $type);
        }
    }

    public function scopeOfStatus($query, ?string $status)
    {
        if ($status) {
            $query->where('status', $status);
        }
    }
}
