<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;
use Symfony\Component\Uid\Uuid;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Role;
use App\Models\Concerns\HasRolesAndPermissions;

#[Fillable(['name', 'email', 'password', 'profile_picture'])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements PasskeyUser
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable, HasRolesAndPermissions;

    protected $appends = ['role'];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_adviser' => 'boolean',
            'adviser_section' => 'string',
        ];
    }

    /**
     * Boot the model and generate UUIDv7 for new users.
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->uuid)) {
                // Requires symfony/uid
                $user->uuid = Uuid::v7()->toRfc4122();
            }
        });
    }

    /**
     * A user can have many roles (many-to-many via role_user pivot).
     */
    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(Role::class, 'role_user', 'user_uuid', 'role_uuid', 'uuid', 'id');
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'user_uuid', 'uuid');
    }

    public function getRoleAttribute(): ?string
    {
        $this->loadMissing('roles');

        foreach (['admin', 'principal', 'registrar', 'staff', 'student'] as $role) {
            if ($this->roles->contains('name', $role)) {
                return $role;
            }
        }

        return $this->roles->first()?->name;
    }
}
