import { Link, usePage } from '@inertiajs/react';
import { ArrowRightLeft, Moon, Sun, Shield, GraduationCap } from 'lucide-react';
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
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2ead4c] shadow-md shadow-[#2ead4c]/20 transition-shadow group-hover:shadow-[#2ead4c]/30">
                        <AppLogoIcon className="size-4 fill-current text-white" />
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {name}
                    </span>
                </Link>

                <div className="flex items-center gap-2">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:shadow dark:border-neutral-800 dark:bg-black/80 dark:text-slate-300 dark:hover:bg-neutral-900"
                    >
                        <ArrowRightLeft className="size-3.5" />
                        Classic
                    </Link>
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
            <main className="relative z-10 flex min-h-svh items-center justify-center px-4 py-20">
                <div className="login-preview-card mx-auto flex w-full max-w-[840px] overflow-hidden rounded-2xl shadow-2xl dark:shadow-black/40">
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
                                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                    <AppLogoIcon className="size-6 fill-current text-white" />
                                </span>
                                <span className="text-base font-semibold text-white">
                                    {name}
                                </span>
                            </div>
                        </div>

                        <div className="relative z-10">
                            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white/80 backdrop-blur-sm">
                                School Portal
                            </div>
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
                            Secure login &middot; Protected data
                        </div>
                    </div>

                    {/* Mobile branding (compact) */}
                    <div className="login-preview-branding-mobile flex flex-col items-center gap-2 px-6 pb-4 pt-20 text-center lg:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                            <AppLogoIcon className="size-5 fill-current text-white" />
                        </span>
                        <h1 className="text-xl font-bold text-white">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-xs text-white/70">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Right form panel */}
                    <div className="flex flex-1 flex-col justify-center bg-white px-6 py-8 sm:px-10 dark:bg-black">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
