<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use App\Services\CaptchaService;
use App\Services\LoginThrottleService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Laravel\Fortify\Features;
use Laravel\Fortify\Fortify;

class FortifyServiceProvider extends ServiceProvider
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
        $this->configureActions();
        $this->configureViews();
        $this->configureAuthentication();
        $this->configureRateLimiting();
    }

    /**
     * Configure Fortify actions.
     */
    private function configureActions(): void
    {
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);
        Fortify::createUsersUsing(CreateNewUser::class);
    }

    /**
     * Configure Fortify views.
     */
    private function configureViews(): void
    {
        Fortify::loginView(fn (Request $request) => Inertia::render('auth/login', [
            'canResetPassword' => Features::enabled(Features::resetPasswords()),
            'status' => $request->session()->get('status'),
        ]));

        Fortify::resetPasswordView(fn (Request $request) => Inertia::render('auth/reset-password', [
            'email' => $request->email,
            'token' => $request->route('token'),
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::requestPasswordResetLinkView(fn (Request $request) => Inertia::render('auth/forgot-password', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::verifyEmailView(fn (Request $request) => Inertia::render('auth/verify-email', [
            'status' => $request->session()->get('status'),
        ]));

        Fortify::registerView(fn () => Inertia::render('auth/register', [
            'passwordRules' => Password::defaults()->toPasswordRulesString(),
        ]));

        Fortify::twoFactorChallengeView(fn () => Inertia::render('auth/two-factor-challenge'));

        Fortify::confirmPasswordView(fn () => Inertia::render('auth/confirm-password'));
    }

    /**
     * Authenticate using email + password only.
     */
    private function configureAuthentication(): void
    {
        Fortify::authenticateUsing(function (Request $request) {
            $request->validate([
                Fortify::username() => ['required', 'string', 'email'],
                'password' => ['required', 'string'],
            ]);

            $throttle = app(LoginThrottleService::class);
            $captcha = app(CaptchaService::class);

            // Per-IP flood guard (independent of email)
            $ipKey = 'login-ip:' . $request->ip();
            if (RateLimiter::tooManyAttempts($ipKey, 20)) {
                $seconds = RateLimiter::availableIn($ipKey);

                throw ValidationException::withMessages([
                    'rate_limited' => __('Too many login attempts from this device. Please try again in :seconds seconds.', ['seconds' => $seconds]),
                ]);
            }
            RateLimiter::hit($ipKey, 60);

            // Per-email flood guard (stops rapid-fire retries before lockout)
            $emailKey = 'login-email:' . Str::lower($request->input(Fortify::username()));
            if (RateLimiter::tooManyAttempts($emailKey, 10)) {
                $seconds = RateLimiter::availableIn($emailKey);

                throw ValidationException::withMessages([
                    'rate_limited' => __('Too many login attempts for this email. Please try again in :seconds seconds.', ['seconds' => $seconds]),
                ]);
            }
            RateLimiter::hit($emailKey, 60);

            $email = Str::lower($request->input(Fortify::username()));
            $user = User::query()->where('email', $email)->first();

            if ($throttle->isLocked($user)) {
                throw ValidationException::withMessages([
                    'locked' => __('This account has been locked after too many failed sign-in attempts. An administrator must unlock it before you can sign in again.'),
                ]);
            }

            $needsCaptcha = $throttle->requiresCaptcha($user);

            if ($needsCaptcha) {
                if (!$captcha->verify($request->input('captcha_token'), $request->input('captcha_answer'))) {
                    // Failed challenges count toward lockout too
                    if ($user) {
                        $throttle->recordFailure($user);
                    }

                    if ($user && $throttle->isLocked($user)) {
                        throw ValidationException::withMessages([
                            'locked' => __('This account has been locked after too many failed sign-in attempts. An administrator must unlock it before you can sign in again.'),
                        ]);
                    }

                    $challenge = $captcha->challenge();

                    throw ValidationException::withMessages([
                        'captcha' => __('Please solve the security check to continue.'),
                        'captcha_token' => $challenge['token'],
                        'captcha_question' => $challenge['question'],
                    ]);
                }
            }

            if (!$user || !Hash::check($request->input('password'), $user->password)) {
                if ($user) {
                    $throttle->recordFailure($user);
                }

                $messages = [
                    Fortify::username() => __('These credentials do not match our records.'),
                ];

                if ($user && $throttle->requiresCaptcha($user)) {
                    $challenge = $captcha->challenge();
                    $messages['captcha_token'] = $challenge['token'];
                    $messages['captcha_question'] = $challenge['question'];
                }

                throw ValidationException::withMessages($messages);
            }

            $throttle->recordSuccess($user);

            return $user;
        });
    }

    /**
     * Configure rate limiting.
     */
    private function configureRateLimiting(): void
    {
        RateLimiter::for('two-factor', function (Request $request) {
            return Limit::perMinute(5)->by($request->session()->get('login.id'));
        });

        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower($request->input(Fortify::username())).'|'.$request->ip());

            return Limit::perMinute(5)->by($throttleKey);
        });

        RateLimiter::for('passkeys', function (Request $request) {
            return Limit::perMinute(10)->by(
                ($request->input('credential.id') ?: $request->session()->getId()).'|'.$request->ip(),
            );
        });
    }
}
