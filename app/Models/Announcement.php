<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Symfony\Component\Uid\Uuid;

class Announcement extends Model
{
    use HasFactory;

    public $incrementing = false;

    protected $keyType = 'string';

    protected $primaryKey = 'uuid';

    protected $fillable = [
        'title',
        'body',
        'scope',
        'class_section_uuid',
        'section_name',
        'image_path',
        'created_by_user_uuid',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $announcement) {
            if (empty($announcement->uuid)) {
                $announcement->uuid = (string) Uuid::v7();
            }
        });
    }

    public function classSection(): BelongsTo
    {
        return $this->belongsTo(ClassSection::class, 'class_section_uuid', 'uuid');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_uuid', 'uuid');
    }
}
