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
        'description',
        'units',
        'time_schedule',
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

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'subject_teacher', 'subject_uuid', 'teacher_uuid', 'uuid', 'uuid')
            ->withPivot('is_substitute')
            ->withTimestamps();
    }

    public function sectionTeachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'class_section_subject_teacher', 'subject_uuid', 'teacher_uuid', 'uuid', 'uuid')
            ->withPivot('class_section_uuid', 'is_substitute')
            ->withTimestamps();
    }
}