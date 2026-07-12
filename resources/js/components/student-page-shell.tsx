import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { dashboard } from '@/routes';

type StudentPageShellProps = {
    title: string;
    description: string;
    children?: ReactNode;
};

export function StudentPageShell({
    title,
    description,
    children,
}: StudentPageShellProps) {
    return (
        <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
            <section className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                <p className="text-sm text-muted-foreground">Student section</p>
                <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {description}
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                        href={dashboard()}
                        className="inline-flex items-center rounded-md border border-sidebar-border/70 px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                        Back to dashboard
                    </Link>
                </div>
            </section>

            {children}
        </div>
    );
}
