<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Symfony\Component\Uid\Uuid;

class Student extends Model
{
    use HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $primaryKey = 'uuid';

    protected $fillable = [
        'profile_picture',
        'user_uuid',
        'lrn',
        'student_id',
        'birthday',
        'address',
        'contact_number',
        'address_zone_street',
        'address_barangay',
        'address_municipality',
        'address_province',
        'previous_school',
        'last_school_year',
        'last_grade_level',
        'previous_section',
        'first_name',
        'middle_name',
        'last_name',
        'name',
        'section',
        'age',
        'grade_level',
        'school_year',
        'grades',
    ];

    protected $casts = [
        'grades' => 'array',
    ];

    protected static function booted()
    {
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Uuid::v7();
            }
            if (empty($model->name)) {
                $model->name = self::composeName($model->first_name ?? null, $model->middle_name ?? null, $model->last_name ?? null);
            }
        });

        static::saving(function ($model) {
            $model->name = self::composeName($model->first_name ?? null, $model->middle_name ?? null, $model->last_name ?? null);
        });
    }

    private static function composeName(?string $first, ?string $middle, ?string $last): string
    {
        $first = trim((string) ($first ?? ''));
        $middle = trim((string) ($middle ?? ''));
        $last = trim((string) ($last ?? ''));

        $middleInitial = '';
        if ($middle !== '') {
            $middleInitial = ' ' . strtoupper(substr($middle, 0, 1));
        }

        if ($last !== '') {
            return trim($last . ', ' . ($first ? ($first . $middleInitial) : ''));
        }

        // fallback to first + middle
        return trim($first . ($middleInitial ? ' ' . $middleInitial : ''));
    }

    public function getFullNameAttribute(): string
    {
        return trim(implode(' ', array_filter([
            $this->first_name,
            $this->middle_name,
            $this->last_name,
        ])));
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_uuid', 'uuid');
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentSubject::class, 'student_uuid', 'uuid');
    }
}
