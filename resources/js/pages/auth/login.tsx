import { Form, Head } from '@inertiajs/react';
import { GraduationCap, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

type Portal = 'student' | 'staff';

const portalContent: Record<
    Portal,
    {
        label: string;
        badge: string;
        title: string;
        description: string;
        emailLabel: string;
        emailPlaceholder: string;
        passwordLabel: string;
        passwordPlaceholder: string;
        rememberLabel: string;
        cta: string;
        helpText: string;
        forgotText: string;
        icon: typeof GraduationCap;
    }
> = {
    student: {
        label: 'Student portal',
        badge: 'For learners',
        title: 'Sign in as a student',
        description:
            'Check classes, assignments, announcements, and your school schedule.',
        emailLabel: 'Student email address',
        emailPlaceholder: 'name@school.edu',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Student password',
        rememberLabel: 'Keep me signed in',
        cta: 'Sign in to student portal',
        helpText: 'Student accounts are managed by the school office.',
        forgotText: 'Need help signing in?',
        icon: GraduationCap,
    },
    staff: {
        label: 'Teacher / admin portal',
        badge: 'For teachers and admins',
        title: 'Sign in as staff',
        description:
            'Access records, class tools, staff notices, and administrative resources.',
        emailLabel: 'Staff email address',
        emailPlaceholder: 'name@school.edu',
        passwordLabel: 'Password',
        passwordPlaceholder: 'Staff password',
        rememberLabel: 'Keep me signed in',
        cta: 'Sign in to staff portal',
        helpText: 'Staff accounts are issued by the school office or IT team.',
        forgotText: 'Need help signing in?',
        icon: ShieldCheck,
    },
};

export default function Login({ status, canResetPassword }: Props) {
    const [portal, setPortal] = useState<Portal>('student');
    const [isSliding, setIsSliding] = useState(false);
    const [emailValue, setEmailValue] = useState('');
    const [passwordValue, setPasswordValue] = useState('');
    const slideTimeout = useRef<number | null>(null);
    const content = portalContent[portal];

    useEffect(() => {
        return () => {
            if (slideTimeout.current !== null) {
                window.clearTimeout(slideTimeout.current);
            }
        };
    }, []);

    const handlePortalClick = (option: Portal) => {
        if (isSliding) {
            return;
        }

        const nextPortal = option === portal
            ? portal === 'student'
                ? 'staff'
                : 'student'
            : option;

        setPortal(nextPortal);
        setIsSliding(true);

        if (slideTimeout.current !== null) {
            window.clearTimeout(slideTimeout.current);
        }

        slideTimeout.current = window.setTimeout(() => {
            setIsSliding(false);
            slideTimeout.current = null;
        }, 300);
    };

    return (
        <>
            <Head title={`${content.title} - School portal`} />

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="flex flex-col gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <Input type="hidden" name="portal" value={portal} />

                        <div className="grid gap-6">
                            <div className="space-y-3">
                                <div className="relative rounded-full bg-slate-100 p-1 shadow-inner ring-1 ring-slate-200">
                                    <div
                                        className={`pointer-events-none absolute top-1 bottom-1 w-1/2 rounded-full bg-white shadow-sm transition-transform duration-300 ease-out will-change-transform ${
                                            portal === 'staff'
                                                ? 'translate-x-full'
                                                : 'translate-x-0'
                                        }`}
                                    />
                                    <div className="relative grid grid-cols-2 gap-1">
                                        {(Object.keys(portalContent) as Portal[]).map(
                                            (option) => {
                                                const optionContent =
                                                    portalContent[option];
                                                const isActive =
                                                    portal === option;
                                                const Icon = optionContent.icon;

                                                return (
                                                    <button
                                                        key={option}
                                                        type="button"
                                                        onClick={() =>
                                                            handlePortalClick(option)
                                                        }
                                                        aria-pressed={isActive}
                                                        className="relative z-10 flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors"
                                                    >
                                                        <Icon
                                                            className={`size-4 ${
                                                                isActive
                                                                    ? 'text-slate-950'
                                                                    : 'text-slate-500'
                                                            }`}
                                                        />
                                                        <span
                                                            className={
                                                                isActive
                                                                    ? 'text-slate-950'
                                                                    : 'text-slate-500'
                                                            }
                                                        >
                                                            {optionContent.label}
                                                        </span>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                </div>

                                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
                                    {content.badge}
                                </div>
                            </div>

                            <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4">
                                <h3 className="mt-2 text-xl font-semibold text-slate-950">
                                    {content.title}
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                    {content.description}
                                </p>
                            </div>

                            <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {content.emailLabel}
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder={content.emailPlaceholder}
                                        value={emailValue}
                                        onChange={(e) => setEmailValue(e.target.value)}
                                    />
                                    <InputError message={errors.email} />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">
                                            {content.passwordLabel}
                                        </Label>
                                        {canResetPassword && (
                                            <TextLink
                                                href={request()}
                                                className="ml-auto text-sm"
                                                tabIndex={5}
                                            >
                                                {content.forgotText}
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder={content.passwordPlaceholder}
                                        value={passwordValue}
                                        onChange={(e: any) => setPasswordValue(e.target.value)}
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox
                                        id="remember"
                                        name="remember"
                                        tabIndex={3}
                                    />
                                    <Label htmlFor="remember">
                                        {content.rememberLabel}
                                    </Label>
                                </div>

                                {/**
                                 * Keep the button visually 'greyed' until both fields
                                 * contain values. Button remains functional; color changes
                                 * when both fields are filled.
                                 */}
                                <Button
                                    type="submit"
                                    className={`mt-4 w-full transition-shadow ${
                                        emailValue.trim() && passwordValue.trim()
                                            ? 'bg-[#2ead4c] text-white shadow-sm focus-visible:ring-4 focus-visible:ring-[#2ead4c]/25 hover:bg-[#2ead4c] hover:shadow-[0_8px_24px_rgba(46,173,76,0.12)]'
                                            : 'bg-slate-200 text-slate-600 hover:bg-slate-200'
                                    }`}
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    {content.cta}
                                </Button>
                            </div>

                            <div className="text-center text-sm text-slate-500">
                                {content.helpText}
                            </div>
                        </div>
                    </>
                )}
            </Form>

            {status && (
                <div className="mb-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-center text-sm font-medium text-sky-800">
                    {status}
                </div>
            )}
        </>
    );
}

Login.layout = {
    title: 'Welcome back to the school portal',
    description: 'Choose your portal type and sign in to continue.',
};
