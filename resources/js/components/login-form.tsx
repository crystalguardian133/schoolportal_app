import { Form } from '@inertiajs/react';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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

export default function LoginForm({ status, canResetPassword }: Props) {
    const isMobile = useIsMobile();
    const [emailValue, setEmailValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);
    const [passwordFocused, setPasswordFocused] = useState(false);

    const floatingLabel = (focused: boolean, value: string) =>
        focused || value !== '' ? 'top-2 translate-y-0 text-xs' : 'top-1/2 -translate-y-1/2 text-[15px]';

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
                {({ processing, errors }) => (
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
                            <InputError message={errors.email} />
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
                            <InputError message={errors.password} />
                        </div>

                        {/* Remember */}
                        <div className="flex items-center space-x-2.5 pt-1">
                            <Checkbox
                                id="login-remember"
                                name="remember"
                                tabIndex={3}
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
                            tabIndex={4}
                            disabled={processing}
                            data-test="login-button"
                        >
                            {processing && <Spinner />}
                            Sign in
                        </Button>
                    </>
                )}
            </Form>

            <p className="text-center text-xs text-black dark:text-white">
                Contact the school office if you need an account.
            </p>
        </div>
    );
}
