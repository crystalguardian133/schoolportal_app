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
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        return $this->belongsToMany(Role::class, 'role_user', 'user_uuid', 'role_uuid', 'uuid', 'id')
            ->withPivot('expires_at')
            ->withTimestamps();
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class, 'user_uuid', 'uuid');
    }

    public function getRoleAttribute(): ?string
    {
        $this->loadMissing('roles');

        $roleMap = [
            'admin' => 'admin',
            'principal' => 'principal',
            'registrar' => 'registrar',
            'staff' => 'staff',
            'student' => 'student',
            'teacher' => 'teacher',
            'department-head' => 'department-head',
            'school-head' => 'school-head',
            'ADMINISTRATOR' => 'admin',
            'TEACHER' => 'teacher',
        ];

        $activeRoles = $this->roles->filter(fn ($role) => ! $this->isRoleExpired($role));

        foreach ($activeRoles as $role) {
            $mapped = $roleMap[$role->name] ?? strtolower($role->name);
            if ($mapped) {
                return $mapped;
            }
        }

        return $activeRoles->first()?->name;
    }

    public function getAllPermissions(): \Illuminate\Support\Collection
    {
        $this->loadMissing('roles.permissions');
        return $this->roles
            ->filter(fn ($role) => ! $this->isRoleExpired($role))
            ->pluck('permissions')
            ->flatten()
            ->unique('id')
            ->values();
    }

    private function isRoleExpired($role): bool
    {
        $expiresAt = $role->pivot->expires_at ?? null;
        if (! $expiresAt) {
            return false;
        }

        return \Carbon\Carbon::parse($expiresAt)->isPast();
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'subject_teacher', 'teacher_uuid', 'subject_uuid', 'uuid', 'uuid')
            ->withPivot('is_substitute')
            ->withTimestamps();
    }
}
