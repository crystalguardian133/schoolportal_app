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
        'ticket_number',
        'ticket_year',
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
        'ticket_number' => 'integer',
        'ticket_year' => 'integer',
    ];

    protected $appends = ['ticket_id'];

    public function getTicketIdAttribute(): string
    {
        if ($this->ticket_number && $this->ticket_year) {
            return 'DNHS-'.$this->ticket_year.'-'.str_pad((string) $this->ticket_number, 4, '0', STR_PAD_LEFT);
        }

        return '#'.$this->id;
    }

    public static function nextTicketNumber(int $year): int
    {
        $max = static::where('ticket_year', $year)->max('ticket_number');

        return (int) $max + 1;
    }

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
