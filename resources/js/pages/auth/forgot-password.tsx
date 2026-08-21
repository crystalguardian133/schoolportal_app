// Components
import { Form, Head } from '@inertiajs/react';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { login } from '@/routes';
import { email } from '@/routes/password';

export default function ForgotPassword({ status }: { status?: string }) {
    const isMobile = useIsMobile();
    const [emailValue, setEmailValue] = useState('');
    const [emailFocused, setEmailFocused] = useState(false);

    const floatingLabel = (focused: boolean, value: string) =>
        focused || value !== '' ? 'top-2 translate-y-0 text-xs' : 'top-1/2 -translate-y-1/2 text-[15px]';

    return (
        <>
            <Head title="Forgot password" />

            {status && (
                <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {status}
                </div>
            )}

            <Form {...email.form()}>
                {({ processing, errors }) => (
                    <div className="flex flex-col gap-6 md:gap-4">
                        <div className="space-y-2 md:space-y-1.5">
                            <Label
                                htmlFor="email"
                                className="hidden text-sm font-medium text-black md:block md:text-xs dark:text-white"
                            >
                                Email address
                            </Label>
                            <div className="relative">
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    autoComplete="off"
                                    autoFocus
                                    tabIndex={1}
                                    placeholder={isMobile ? ' ' : 'name@school.edu'}
                                    value={emailValue}
                                    onFocus={() => setEmailFocused(true)}
                                    onBlur={() => setEmailFocused(false)}
                                    onChange={(e) => setEmailValue(e.target.value)}
                                    className="h-12 pl-11 pt-6 pb-1 md:h-11 md:py-1 md:pl-10"
                                />
                                <Mail className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-4 -translate-y-1/2 text-slate-500 md:left-3 dark:text-slate-500" />
                                <label
                                    htmlFor="email"
                                    className={cn(
                                        'pointer-events-none absolute left-10 z-10 text-black transition-all duration-150 select-none md:hidden dark:text-white',
                                        floatingLabel(emailFocused, emailValue),
                                    )}
                                >
                                    Email address
                                </label>
                            </div>

                            <InputError message={errors.email} />
                        </div>

                        <Button
                            type="submit"
                            tabIndex={2}
                            className={`mt-1 h-12 w-full text-sm font-semibold transition-all duration-200 md:h-11 ${
                                emailValue.trim()
                                    ? 'bg-[#2ead4c] text-white shadow-lg shadow-[#2ead4c]/25 hover:bg-[#25c043] hover:shadow-xl hover:shadow-[#2ead4c]/30'
                                    : 'bg-slate-300 text-slate-600 hover:bg-slate-300 dark:bg-neutral-900 dark:text-slate-500 dark:hover:bg-neutral-900'
                            }`}
                            disabled={processing}
                            data-test="email-password-reset-link-button"
                        >
                            {processing && <Spinner />}
                            Email password reset link
                        </Button>
                    </div>
                )}
            </Form>

            <div className="space-x-1 text-center text-sm text-muted-foreground">
                <span>Or, return to</span>
                <TextLink href={login()}>log in</TextLink>
            </div>
        </>
    );
}

ForgotPassword.layout = {
    title: 'Forgot password',
    description: 'Enter your email to receive a password reset link',
};
