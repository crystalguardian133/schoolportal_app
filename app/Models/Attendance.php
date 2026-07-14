<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Symfony\Component\Uid\Uuid;

class Attendance extends Model
{
    use HasFactory;

    protected $fillable = [
        'uuid',
        'attendance_session_id',
        'student_uuid',
        'status',
        'recorded_by',
        'scanned_at',
        'recorded_at',
        'notes',
    ];

    protected $casts = [
        'scanned_at' => 'datetime',
        'recorded_at' => 'datetime',
    ];

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Attendance $attendance) {
            if (empty($attendance->uuid)) {
                $attendance->uuid = (string) Uuid::v7();
            }
            if (is_null($attendance->recorded_at)) {
                $attendance->recorded_at = now();
            }
        });
    }

    public function session(): BelongsTo
    {
        return $this->belongsTo(AttendanceSession::class, 'attendance_session_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class, 'student_uuid', 'uuid');
    }
}
