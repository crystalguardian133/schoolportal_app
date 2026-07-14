<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_section_uuid',
        'subject_uuid',
        'teacher_uuid',
        'day',
        'start_time',
        'end_time',
        'room',
        'school_year',
    ];

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class, 'class_section_uuid', 'uuid');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_uuid', 'uuid');
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_uuid', 'uuid');
    }
}
