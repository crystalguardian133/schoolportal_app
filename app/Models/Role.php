<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Symfony\Component\Uid\Uuid;

class Role extends Model
{
    use HasFactory;

    protected $fillable = ['id', 'name', 'icon', 'guard_name'];

    public $incrementing = false;

    protected $keyType = 'string';

    protected static function booted(): void
    {
        static::creating(function (self $role) {
            if (empty($role->id)) {
                $role->id = Uuid::v7()->toRfc4122();
            }
        });
    }

    public function permissions(): BelongsToMany
    {
        return $this->belongsToMany(Permission::class, 'permission_role', 'role_uuid', 'permission_uuid', 'id', 'id');
    }

    public function users(): BelongsToMany
    {
        // pivot stores user_uuid
        return $this->belongsToMany(User::class, 'role_user', 'role_uuid', 'user_uuid', 'id', 'uuid');
    }
}
