<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolYear extends Model
{
    protected $fillable = [
        'name',
        'start_date',
        'end_date',
        'enrollment_start',
        'enrollment_end',
        'status',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public static function current(): ?self
    {
        return static::active()->first();
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'school_year', 'name');
    }

    public function enrollments()
    {
        return $this->hasMany(StudentSubject::class, 'school_year', 'name');
    }
}
