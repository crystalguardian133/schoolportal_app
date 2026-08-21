import { Form, Head } from '@inertiajs/react';
import { KeyRound, Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
    passwordRules: string;
};

export default function ResetPassword({ token, email, passwordRules }: Props) {
    const isMobile = useIsMobile();
    const [passwordValue, setPasswordValue] = useState('');
    const [confirmValue, setConfirmValue] = useState('');
    const [passwordFocused, setPasswordFocused] = useState(false);
    const [confirmFocused, setConfirmFocused] = useState(false);

    const floatingLabel = (focused: boolean, value: string) =>
        focused || value !== '' ? 'top-2 translate-y-0 text-xs' : 'top-1/2 -translate-y-1/2 text-[15px]';

    const passwordsMatch =
        confirmValue.length > 0 && passwordValue.length > 0 && passwordValue === confirmValue;

    return (
        <>
            <Head title="Reset password" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-6 md:gap-4">
                        {/* Email */}
                        <div className="space-y-2 md:space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="hidden text-sm font-medium text-black md:block md:text-xs dark:text-white"
                            >
                                Email
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="email"
                                    value={email}
                                    readOnly
                                    tabIndex={1}
                                    className="h-12 cursor-default pl-11 pt-6 pb-1 opacity-80 md:h-11 md:py-1 md:pl-10"
                                />
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                <label
                                    htmlFor="email"
                                    className={cn(
                                        'pointer-events-none absolute left-10 z-10 text-black select-none md:hidden dark:text-white',
                                        'top-2 translate-y-0 text-xs',
                                    )}
                                >
                                    Email
                                </label>
                            </div>
                            <InputError message={errors.email} className="mt-2" />
                        </div>

                        {/* Password */}
                        <div className="space-y-2 md:space-y-1.5">
                            <Label
                                htmlFor="password"
                                className="hidden text-sm font-medium text-black md:block md:text-xs dark:text-white"
                            >
                                New password
                            </Label>
                            <div className="relative">
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    autoComplete="new-password"
                                    autoFocus
                                    tabIndex={2}
                                    placeholder={isMobile ? ' ' : 'Enter new password'}
                                    passwordrules={passwordRules}
                                    value={passwordValue}
                                    onFocus={() => setPasswordFocused(true)}
                                    onBlur={() => setPasswordFocused(false)}
                                    onChange={(e: any) => setPasswordValue(e.target.value)}
                                    className="h-12 pl-11 pt-6 pb-1 md:h-11 md:py-1 md:pl-10"
                                />
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                <label
                                    htmlFor="password"
                                    className={cn(
                                        'pointer-events-none absolute left-10 z-10 text-black transition-all duration-150 select-none md:hidden dark:text-white',
                                        floatingLabel(passwordFocused, passwordValue),
                                    )}
                                >
                                    New password
                                </label>
                            </div>
                            <InputError message={errors.password} />
                        </div>

                        {/* Confirm */}
                        <div className="space-y-2 md:space-y-1.5">
                            <Label
                                htmlFor="password_confirmation"
                                className="hidden text-sm font-medium text-black md:block md:text-xs dark:text-white"
                            >
                                Confirm password
                            </Label>
                            <div className="relative">
                                <PasswordInput
                                    id="password_confirmation"
                                    name="password_confirmation"
                                    autoComplete="new-password"
                                    tabIndex={3}
                                    placeholder={isMobile ? ' ' : 'Re-enter new password'}
                                    passwordrules={passwordRules}
                                    value={confirmValue}
                                    onFocus={() => setConfirmFocused(true)}
                                    onBlur={() => setConfirmFocused(false)}
                                    onChange={(e: any) => setConfirmValue(e.target.value)}
                                    className="h-12 pl-11 pt-6 pb-1 md:h-11 md:py-1 md:pl-10"
                                />
                                <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                <label
                                    htmlFor="password_confirmation"
                                    className={cn(
                                        'pointer-events-none absolute left-10 z-10 text-black transition-all duration-150 select-none md:hidden dark:text-white',
                                        floatingLabel(confirmFocused, confirmValue),
                                    )}
                                >
                                    Confirm password
                                </label>
                            </div>
                            {!errors.password_confirmation && passwordsMatch && (
                                <p className="text-xs font-medium text-emerald-600">Passwords match</p>
                            )}
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            tabIndex={4}
                            className={`mt-1 h-12 w-full text-sm font-semibold transition-all duration-200 md:h-11 ${
                                passwordValue.trim() && confirmValue.trim()
                                    ? 'bg-[#2ead4c] text-white shadow-lg shadow-[#2ead4c]/25 hover:bg-[#25c043] hover:shadow-xl hover:shadow-[#2ead4c]/30'
                                    : 'bg-slate-300 text-slate-600 hover:bg-slate-300 dark:bg-neutral-900 dark:text-slate-500 dark:hover:bg-neutral-900'
                            }`}
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Reset password
                        </Button>
                    </div>
                )}
            </Form>
        </>
    );
}

ResetPassword.layout = {
    title: 'Reset password',
    description: 'Choose a new password for your account',
};
