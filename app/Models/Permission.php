<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Symfony\Component\Uid\Uuid;

class Permission extends Model
{
    use HasFactory;

    protected $fillable = ['id', 'name', 'guard_name'];

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (self $permission) {
            if (empty($permission->id)) {
                $permission->id = Uuid::v7()->toRfc4122();
            }
        });
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'permission_role', 'permission_uuid', 'role_uuid', 'id', 'id');
    }
}
