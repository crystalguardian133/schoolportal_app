import { Form, router, usePage } from '@inertiajs/react';
import { Mail, Lock, ShieldCheck, LifeBuoy, LockKeyhole, TimerReset, Send, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

type Errors = Partial<Record<string, string>>;

function DelayedConfirmButton({
    label,
    onClick,
    className,
    seconds = 5,
}: {
    label: string;
    onClick: () => void;
    className?: string;
    seconds?: number;
}) {
    const [remaining, setRemaining] = useState(seconds);

    useEffect(() => {
        if (remaining <= 0) {
return;
}

        const t = setTimeout(() => setRemaining((r) => r - 1), 1000);

        return () => clearTimeout(t);
    }, [remaining]);

    const disabled = remaining > 0;

    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={disabled}
            tabIndex={1}
            className={cn('min-w-28', className)}
        >
            {disabled ? `${label} (${remaining})` : label}
        </Button>
    );
}

export default function LoginForm({ status, canResetPassword }: Props) {
    const isMobile = useIsMobile();
    const [emailValue, setEmailValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    // Support ticket dialog
    const [supportOpen, setSupportOpen] = useState(false);
    const [supportSent, setSupportSent] = useState<string | null>(null);
    const [supportProcessing, setSupportProcessing] = useState(false);
    const [supportErrors, setSupportErrors] = useState<Errors>({});
    const [supportForm, setSupportForm] = useState({ email: '', subject: '', message: '' });

    // Blocking modals
    const [lockoutOpen, setLockoutOpen] = useState(false);
    const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);

    const pageProps = usePage().props as any;
    const threadUrl: string | null = pageProps.flash?.support_thread_url ?? null;

    const floatingLabel = (focused: boolean, value: string) =>
        focused || value !== '' ? 'top-2 translate-y-0 text-xs' : 'top-1/2 -translate-y-1/2 text-[15px]';

    function submitSupport(e: React.FormEvent) {
        e.preventDefault();
        setSupportProcessing(true);
        setSupportErrors({});

        router.post('/support/tickets', supportForm, {
            onSuccess: (page) => {
                const flash = (page.props as any).flash || {};
                setSupportSent(flash.success ?? 'Support request submitted.');
                setSupportForm({ email: '', subject: '', message: '' });
            },
            onError: (errors) => setSupportErrors(errors as Errors),
            onFinish: () => setSupportProcessing(false),
            preserveScroll: true,
        });
    }

    return (
        <div className="flex flex-col gap-6">
            {status && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6 md:gap-4"
            >
                {({ processing, errors }) => {
                    const typedErrors = errors as Errors;
                    const captchaToken = typedErrors.captcha_token;
                    const captchaQuestion = typedErrors.captcha_question;

                    return (
                        <>
                            {/* Email */}
                            <div className="space-y-2 md:space-y-1.5">
                                <Label
                                    htmlFor="login-email"
                                    className="hidden text-sm font-medium text-black md:block md:text-xs dark:text-white"
                                >
                                    Email
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="login-email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder={isMobile ? ' ' : 'name@school.edu'}
                                        value={emailValue}
                                        onFocus={() => setEmailFocused(true)}
                                        onBlur={() => setEmailFocused(false)}
                                        onChange={(e) => setEmailValue(e.target.value)}
                                        className="h-12 pl-11 pt-6 pb-1 md:h-11 md:py-1 md:pl-10"
                                    />
                                    <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                    <label
                                        htmlFor="login-email"
                                        className={cn(
                                            'pointer-events-none absolute left-10 z-10 text-black transition-all duration-150 select-none md:hidden dark:text-white',
                                            floatingLabel(emailFocused, emailValue),
                                        )}
                                    >
                                        Email
                                    </label>
                                </div>
                                {!typedErrors.locked && !rateLimitShown(typedErrors) && (
                                    <InputError message={typedErrors.email} />
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2 md:space-y-1.5">
                                <div className="hidden items-center justify-between md:flex">
                                    <Label
                                        htmlFor="login-password"
                                        className="text-xs font-medium text-black dark:text-white"
                                    >
                                        Password
                                    </Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="text-xs"
                                            tabIndex={5}
                                        >
                                            Reset password
                                        </TextLink>
                                    )}
                                </div>
                                <div className="relative">
                                    <PasswordInput
                                        id="login-password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder={isMobile ? ' ' : 'Enter your password'}
                                        value={passwordValue}
                                        onFocus={() => setPasswordFocused(true)}
                                        onBlur={() => setPasswordFocused(false)}
                                        onChange={(e: any) =>
                                            setPasswordValue(e.target.value)
                                        }
                                        className="h-12 pl-11 pt-6 pb-1 md:h-11 md:py-1 md:pl-10"
                                    />
                                    <Lock className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                    <label
                                        htmlFor="login-password"
                                        className={cn(
                                            'pointer-events-none absolute left-10 z-10 text-black transition-all duration-150 select-none md:hidden dark:text-white',
                                            floatingLabel(passwordFocused, passwordValue),
                                        )}
                                    >
                                        Password
                                    </label>
                                </div>
                                {canResetPassword && (
                                    <div className="flex justify-end md:hidden">
                                        <TextLink
                                            href={request()}
                                            className="text-sm"
                                            tabIndex={5}
                                        >
                                            Reset password
                                        </TextLink>
                                    </div>
                                )}
                                <InputError message={typedErrors.password} />
                            </div>

                            {/* Captcha */}
                            {captchaToken && captchaQuestion && (
                                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 md:space-y-1.5 dark:border-neutral-800 dark:bg-neutral-900/50">
                                    <input type="hidden" name="captcha_token" value={captchaToken} />
                                    <Label
                                        htmlFor="login-captcha"
                                        className="flex items-center gap-1.5 text-xs font-medium text-black dark:text-white"
                                    >
                                        <ShieldCheck className="size-3.5 text-emerald-600" />
                                        Security check — {captchaQuestion}
                                    </Label>
                                    <Input
                                        id="login-captcha"
                                        name="captcha_answer"
                                        required
                                        tabIndex={3}
                                        autoComplete="off"
                                        placeholder="Your answer"
                                        className="h-10"
                                    />
                                    <InputError message={typedErrors.captcha} />
                                </div>
                            )}

                            {/* Remember */}
                            <div className="flex items-center space-x-2.5 pt-1">
                                <Checkbox
                                    id="login-remember"
                                    name="remember"
                                    tabIndex={4}
                                />
                                <Label
                                    htmlFor="login-remember"
                                    className="text-sm font-normal text-black dark:text-white"
                                >
                                    Keep me signed in
                                </Label>
                            </div>

                            {/* Submit */}
                            <Button
                                type="submit"
                                className={`mt-1 h-12 w-full text-sm font-semibold transition-all duration-200 md:h-11 ${
                                    emailValue.trim() && passwordValue.trim()
                                        ? 'bg-[#2ead4c] text-white shadow-lg shadow-[#2ead4c]/25 hover:bg-[#25c043] hover:shadow-xl hover:shadow-[#2ead4c]/30'
                                        : 'bg-slate-300 text-slate-600 hover:bg-slate-300 dark:bg-neutral-900 dark:text-slate-500 dark:hover:bg-neutral-900'
                                }`}
                                tabIndex={5}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Sign in
                            </Button>

                            <ErrorEffects errors={typedErrors} onLocked={() => setLockoutOpen(true)} onRateLimit={setRateLimitMsg} />
                        </>
                    );
                }}
            </Form>

            <div className="flex flex-col items-center gap-1 text-center">
                <button
                    type="button"
                    onClick={() => {
                        setSupportSent(null);
                        setSupportOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    tabIndex={6}
                >
                    <LifeBuoy className="size-3.5" />
                    Need help signing in?
                </button>
                <p className="text-xs text-black dark:text-white">
                    Contact the school office if you need an account.
                </p>
            </div>

            {/* Lockout modal */}
            <Dialog open={lockoutOpen} onOpenChange={setLockoutOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LockKeyhole className="size-5 text-rose-600" />
                            Account locked
                        </DialogTitle>
                        <DialogDescription>
                            This email cannot be used to sign in until an administrator unlocks it.
                            This happens after too many failed sign-in attempts.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="text-sm">
                        <TextLink href="/account-unlock" className="font-medium text-emerald-700 dark:text-emerald-400">
                            Unlock via email link or staff page →
                        </TextLink>
                    </div>
                    <DialogFooter className="flex-row gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setLockoutOpen(false);
                                setSupportSent(null);
                                setSupportOpen(true);
                            }}
                        >
                            <LifeBuoy className="size-4" />
                            Contact Support
                        </Button>
                        <DelayedConfirmButton label="Confirm" seconds={5} onClick={() => setLockoutOpen(false)} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Rate limit modal */}
            <Dialog open={!!rateLimitMsg} onOpenChange={(open) => !open && setRateLimitMsg(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <TimerReset className="size-5 text-amber-600" />
                            Too many attempts
                        </DialogTitle>
                        <DialogDescription>{rateLimitMsg}</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DelayedConfirmButton label="Confirm" seconds={5} onClick={() => setRateLimitMsg(null)} />
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Support dialog */}
            <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <LifeBuoy className="size-5 text-emerald-600" />
                            Get sign-in help
                        </DialogTitle>
                        <DialogDescription>
                            Locked out or can&apos;t access your account? Send a message to the
                            administrators and they will reach out to you.
                        </DialogDescription>
                    </DialogHeader>

                    {supportSent ? (
                        <div className="space-y-4 py-2">
                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                                {supportSent}
                            </div>
                            {threadUrl && (
                                <TextLink
                                    href={threadUrl}
                                    className="text-sm font-medium text-emerald-700 dark:text-emerald-400"
                                >
                                    View your support thread →
                                </TextLink>
                            )}
                            <TextLink
                                href="/support/tickets/lookup"
                                className="text-xs text-slate-500 dark:text-neutral-400"
                            >
                                Lost the link? Find your tickets by email or ID →
                            </TextLink>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setSupportOpen(false)}>
                                    Done
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={submitSupport} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="support-email">Your email</Label>
                                <Input
                                    id="support-email"
                                    type="email"
                                    required
                                    value={supportForm.email}
                                    onChange={(e) => setSupportForm((f) => ({ ...f, email: e.target.value }))}
                                    placeholder="name@example.com"
                                />
                                <InputError message={supportErrors.email} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="support-subject">Subject (optional)</Label>
                                <Input
                                    id="support-subject"
                                    value={supportForm.subject}
                                    onChange={(e) => setSupportForm((f) => ({ ...f, subject: e.target.value }))}
                                    placeholder="Account locked"
                                    maxLength={255}
                                />
                                <InputError message={supportErrors.subject} />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="support-message">Message</Label>
                                <textarea
                                    id="support-message"
                                    required
                                    rows={4}
                                    maxLength={5000}
                                    value={supportForm.message}
                                    onChange={(e) => setSupportForm((f) => ({ ...f, message: e.target.value }))}
                                    placeholder="Describe your issue — e.g. your account is locked and you need it unlocked."
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                                />
                                <InputError message={supportErrors.message} />
                            </div>
                            <DialogFooter className="flex-row gap-2 sm:justify-end">
                                <Button type="button" variant="ghost" onClick={() => setSupportOpen(false)}>
                                    <X className="size-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={supportProcessing}>
                                    {supportProcessing ? <Spinner /> : <Send className="size-4" />}
                                    Send request
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

function rateLimitShown(errors: Errors): boolean {
    return !!errors.rate_limited || (!!errors.email && /too many login attempts/i.test(errors.email));
}

/**
 * Bridges Inertia form errors into modal state after each failed submit.
 */
function ErrorEffects({
    errors,
    onLocked,
    onRateLimit,
}: {
    errors: Errors;
    onLocked: () => void;
    onRateLimit: (msg: string | null) => void;
}) {
    useEffect(() => {
        if (errors.locked) {
onLocked();
}

        const msg =
            errors.rate_limited ||
            (errors.email && /too many login attempts/i.test(errors.email) ? errors.email : null) ||
            null;
        onRateLimit(msg);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors.locked, errors.rate_limited, errors.email]);

    return null;
}
