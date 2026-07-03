import { Link, usePage } from '@inertiajs/react';
import {} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/lib/home';
import type { AuthLayoutProps } from '@/types';

export default function LoginPortalLayout({ children, title, description }: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="min-h-svh bg-[#f4f7fb] text-slate-950">
            <div className="grid min-h-svh lg:grid-cols-[1.08fr_0.92fr]">
                <aside className="relative hidden overflow-hidden bg-[#0f2747] px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(120,180,255,0.28),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(244,189,75,0.18),_transparent_35%)]" />
                    <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.09),transparent_36%,rgba(255,255,255,0.03))]" />

                    <div className="relative z-10 flex items-center gap-3">
                        <Link
                            href={home()}
                            className="flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur"
                        >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                                <AppLogoIcon className="size-6 fill-current text-white" />
                            </span>
                            <span className="text-sm font-medium tracking-wide">{name}</span>
                        </Link>
                    </div>

                    <div className="relative z-10 max-w-xl">
                        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-sky-100">Portal choice</div>
                        <h1 className="max-w-lg text-5xl font-semibold leading-tight text-white">Sign in to your school portal</h1>
                        <p className="mt-4 max-w-xl text-base leading-7 text-slate-200">Choose Student or Staff to access the tools and information specific to your role.</p>
                    </div>
                </aside>

                <main className="flex items-center justify-center px-6 py-12">
                    <div className="mx-auto w-full max-w-md">
                        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950">{title}</h2>
                        {description && <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>}

                        <div className="mt-6 px-6 py-8 sm:px-10 bg-white rounded-2xl shadow-sm">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
