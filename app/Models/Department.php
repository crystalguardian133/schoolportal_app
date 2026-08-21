<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Symfony\Component\Uid\Uuid;

class Department extends Model
{
    use HasFactory;

    protected $primaryKey = 'uuid';

    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'uuid',
        'name',
        'description',
        'subject_uuid',
        'head_uuid',
    ];

    protected static function booted(): void
    {
        static::creating(function (Department $dept) {
            if (empty($dept->uuid)) {
                $dept->uuid = Uuid::v4()->toRfc4122();
            }
        });
    }

    public function head(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_uuid', 'uuid');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'subject_uuid', 'uuid');
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'department_user', 'department_uuid', 'user_uuid', 'uuid', 'uuid')
            ->withTimestamps();
    }
}
