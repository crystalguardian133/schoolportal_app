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
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function LoginForm({ status, canResetPassword }: Props) {
    const [emailValue, setEmailValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');

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
                className="flex flex-col gap-4"
            >
                {({ processing, errors }) => (
                    <>
                        {/* Email */}
                        <div className="space-y-1.5">
                            <Label htmlFor="login-email" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                Email
                            </Label>
                            <div className="relative">
                                <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                                <Input
                                    id="login-email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="name@school.edu"
                                    value={emailValue}
                                    onChange={(e) => setEmailValue(e.target.value)}
                                    className="h-11 pl-10"
                                />
                            </div>
                            <InputError message={errors.email} />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="login-password" className="text-xs font-medium text-slate-600 dark:text-slate-400">
                                    Password
                                </Label>
                                {canResetPassword && (
                                    <TextLink
                                        href={request()}
                                        className="text-xs"
                                        tabIndex={5}
                                    >
                                        Need help?
                                    </TextLink>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500 dark:text-slate-500" />
                                <PasswordInput
                                    id="login-password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Enter your password"
                                    value={passwordValue}
                                    onChange={(e: any) =>
                                        setPasswordValue(e.target.value)
                                    }
                                    className="h-11 pl-10"
                                />
                            </div>
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
                                className="text-sm font-normal text-slate-600 dark:text-slate-400"
                            >
                                Keep me signed in
                            </Label>
                        </div>

                        {/* Submit */}
                        <Button
                            type="submit"
                            className={`mt-1 h-11 w-full text-sm font-semibold transition-all duration-200 ${
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

            <p className="text-center text-xs text-slate-500 dark:text-slate-500">
                Contact the school office if you need an account.
            </p>
        </div>
    );
}
