<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Symfony\Component\Uid\Uuid;

class Subject extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'uuid';

    protected $fillable = [
        'name',
        'code',
        'time_schedule',
        'subject_teacher',
        'subject_teacher_uuid',
    ];

    protected static function booted(): void
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Uuid::v7();
            }
        });
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentSubject::class, 'subject_uuid', 'uuid');
    }

    public function classSections(): BelongsToMany
    {
        return $this->belongsToMany(ClassSection::class, 'class_section_subjects', 'subject_uuid', 'class_section_uuid', 'uuid', 'uuid');
    }
}
