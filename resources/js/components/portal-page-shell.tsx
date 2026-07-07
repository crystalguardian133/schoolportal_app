import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import Toast from '@/components/ui/toast';
import { dashboard } from '@/routes';

type PortalPageShellProps = {
    title: string;
    description: string;
    children?: ReactNode;
    showBackLink?: boolean;
};

export function PortalPageShell({ title, description, children, showBackLink = true }: PortalPageShellProps) {
    const { props } = usePage();
    const flash: any = props.flash || {};
    const message = flash.success ?? flash.error ?? null;
    const type = flash.success ? 'success' : flash.error ? 'error' : 'info';
    const [localToast, setLocalToast] = useState<{ message: string; type?: string; link?: string; linkLabel?: string } | null>(null);

    useEffect(() => {
        function handler(e: any) {
            const detail = e?.detail;

            if (detail?.message) {
                setLocalToast({ message: detail.message, type: detail.type ?? 'success' });

                setTimeout(() => setLocalToast(null), detail.ttl ?? 3000);
            }
        }

        window.addEventListener('local-toast', handler as EventListener);

        return () => window.removeEventListener('local-toast', handler as EventListener);
    }, []);

    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
            <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                <h1 className="text-2xl font-semibold">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>

                {showBackLink ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            href={dashboard()}
                            className="inline-flex items-center rounded-md border border-sidebar-border/70 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                ) : null}
            </section>

            {children}
            <Toast
                message={message ?? localToast?.message ?? null}
                type={(message ? type : (localToast?.type as any)) ?? 'info'}
                onClose={() => setLocalToast(null)}
                link={localToast?.link ?? null}
                linkLabel={localToast?.linkLabel ?? 'View'}
            />
        </div>
    );
}
