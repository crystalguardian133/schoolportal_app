<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeArchive extends Model
{
    protected $table = 'grade_archives';

    protected $fillable = [
        'student_uuid',
        'subject_uuid',
        'school_year',
        'section',
        'year_level',
        'q1',
        'q2',
        'q3',
        'total',
        'grade',
    ];

    protected $casts = [
        'q1' => 'integer',
        'q2' => 'integer',
        'q3' => 'integer',
        'total' => 'integer',
        'grade' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_uuid', 'uuid');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_uuid', 'uuid');
    }
}
