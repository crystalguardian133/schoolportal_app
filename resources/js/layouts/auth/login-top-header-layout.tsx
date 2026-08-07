import { Link, usePage } from '@inertiajs/react';
import { Moon, Sun, Shield, GraduationCap } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { useAppearance } from '@/hooks/use-appearance';
import { home } from '@/lib/home';
import type { AuthLayoutProps } from '@/types';

export default function LoginTopHeaderLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;
    const { resolvedAppearance, updateAppearance } = useAppearance();

    return (
        <div className="relative min-h-svh bg-slate-100 dark:bg-black">
            {/* Subtle background pattern */}
            <div className="login-preview-bg" aria-hidden="true" />

            {/* Floating top bar */}
            <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-between px-4 py-4 sm:px-6">
                <Link href={home()} className="group flex items-center gap-2.5">
                    <AppLogoIcon className="size-10" />
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {name}
                    </span>
                </Link>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() =>
                            updateAppearance(
                                resolvedAppearance === 'dark' ? 'light' : 'dark',
                            )
                        }
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/80 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow dark:border-neutral-800 dark:bg-black/80 dark:hover:bg-neutral-900"
                        aria-label="Toggle dark mode"
                    >
                        {resolvedAppearance === 'dark' ? (
                            <Sun className="size-4 text-amber-400" />
                        ) : (
                            <Moon className="size-4 text-slate-600" />
                        )}
                    </button>
                </div>
            </div>

            {/* Centered card */}
            <main className="relative z-10 flex min-h-svh items-center justify-center px-3 py-4 sm:px-4 sm:py-20">
                <div className="login-preview-card mx-auto flex w-full max-w-[840px] flex-col overflow-hidden rounded-2xl shadow-2xl lg:flex-row dark:shadow-black/40">
                    {/* Left branding panel */}
                    <div className="login-preview-branding relative hidden w-[380px] shrink-0 flex-col justify-between p-8 lg:flex xl:w-[420px]">
                        {/* Decorative grid */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute inset-0 login-preview-grid" />
                            <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/10 blur-3xl" />
                            <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                        </div>

                        <div className="relative z-10">
                            <div className="mb-8 flex items-center gap-3">
                                <AppLogoIcon className="size-14" />
                                <span className="text-base font-semibold text-white">
                                    {name}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <h1 className="text-3xl font-bold leading-tight text-white">
                                {title}
                            </h1>
                            {description && (
                                <p className="mt-3 text-sm leading-relaxed text-white/70">
                                    {description}
                                </p>
                            )}

                            {/* Feature bullets */}
                            <div className="mt-8 space-y-3">
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                                        <GraduationCap className="size-3.5" />
                                    </span>
                                    Track grades, schedules &amp; attendance
                                </div>
                                <div className="flex items-center gap-3 text-sm text-white/80">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10">
                                        <Shield className="size-3.5" />
                                    </span>
                                    Manage classes &amp; announcements
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10 text-xs text-white/50">
                            Secure login  &middot;  Protected data
                        </div>
                    </div>

                    {/* Mobile branding (full-width top block) */}
                    <div className="login-preview-branding-mobile relative flex w-full flex-col items-center gap-3 overflow-hidden px-6 pt-16 pb-8 text-center lg:hidden">
                        <div
                            className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"
                            aria-hidden="true"
                        />
                        <div
                            className="absolute -bottom-16 -left-10 h-48 w-48 rounded-full bg-white/10 blur-3xl"
                            aria-hidden="true"
                        />
                        <div className="login-preview-grid absolute inset-0" aria-hidden="true" />
                        <h1 className="relative z-10 text-xl font-bold text-white">
                            {title}
                        </h1>
                        {description && (
                            <p className="relative z-10 text-xs leading-relaxed text-white/70">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Right form panel */}
                    <div className="flex w-full flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 lg:px-12 dark:bg-black">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
