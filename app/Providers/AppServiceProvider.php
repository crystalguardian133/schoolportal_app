<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Event;
use App\Events\AnnouncementPublished;
use App\Listeners\SendAnnouncementPushNotification;
use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Laravel\Fortify\Events\ValidTwoFactorAuthenticationCodeProvided;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if ($this->app->environment('local') && str_contains(config('app.url'), 'ngrok')) {
            URL::forceScheme('https');
        }

        Event::listen(
            AnnouncementPublished::class,
            SendAnnouncementPushNotification::class,
        );

        Event::listen(Logout::class, function (Logout $event) {
            if ($event->user instanceof User) {
                $event->user->forceFill(['current_session_id' => null])->save();
            }
        });

        Event::listen(Login::class, function (Login $event) {
            if (request()->hasSession()) {
                request()->session()->put('force_claim_session', true);
            }
        });

        Event::listen(ValidTwoFactorAuthenticationCodeProvided::class, function (ValidTwoFactorAuthenticationCodeProvided $event) {
            $user = $event->user;
            if ($user instanceof User && app(\App\Services\ActiveSessionChecker::class)->hasActiveSession($user, request()->session()->getId())) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'code' => __('This account is currently signed in on another device. Please sign out there first.'),
                ]);
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
