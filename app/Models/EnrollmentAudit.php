<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EnrollmentAudit extends Model
{
    use HasFactory;

    protected $table = 'enrollment_audits';

    protected $fillable = [
        'user_uuid',
        'student_uuid',
        'subject_uuid',
        'school_year',
        'action',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
    ];
}
