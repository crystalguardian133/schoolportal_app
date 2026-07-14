<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Symfony\Component\Uid\Uuid;

class AttendanceSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'schedule_id',
        'teacher_uuid',
        'subject_uuid',
        'class_section_uuid',
        'date',
        'start_time',
        'end_time',
        'duration_minutes',
        'qr_token',
        'is_active',
    ];

    protected $casts = [
        'date' => 'date',
        'is_active' => 'boolean',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (AttendanceSession $session) {
            if (empty($session->uuid)) {
                $session->uuid = (string) Uuid::v7();
            }
            if (empty($session->qr_token)) {
                $session->qr_token = bin2hex(random_bytes(32));
            }
        });
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(Schedule::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_uuid', 'uuid');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_uuid', 'uuid');
    }

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class, 'class_section_uuid', 'uuid');
    }

    public function attendances(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function windowStart(): string
    {
        return $this->start_time;
    }

    public function windowEnd(): string
    {
        $start = \Carbon\Carbon::parse($this->start_time);
        $windowEnd = $start->copy()->addMinutes($this->duration_minutes);
        $scheduleEnd = \Carbon\Carbon::parse($this->end_time);

        return $windowEnd->gt($scheduleEnd) ? $scheduleEnd->format('H:i:s') : $windowEnd->format('H:i:s');
    }

    public function isWithinWindow(): bool
    {
        if (! $this->is_active) {
            return false;
        }

        $now = \Carbon\Carbon::now();
        $sessionDate = $this->date->toDateString();

        if ($now->toDateString() !== $sessionDate) {
            return false;
        }

        $currentTime = $now->format('H:i:s');

        return $currentTime >= $this->windowStart() && $currentTime <= $this->windowEnd();
    }
}
