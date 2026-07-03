import { Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

type SectionShellProps = {
    id: string;
    title: string;
    description: string;
    icon: LucideIcon;
    iconClassName: string;
    linkHref?: string;
    linkLabel?: string;
    linkClassName?: string;
    children?: ReactNode;
};

export function SectionShell({
    id,
    title,
    description,
    icon: Icon,
    iconClassName,
    linkHref = '#dashboard',
    linkLabel = 'Back to top',
    linkClassName = 'text-sky-700 hover:underline',
    children,
}: SectionShellProps) {
    const content = (
        <>
            <div className="flex items-center gap-3">
                <Icon className={iconClassName} />
                <h3 className="text-lg font-semibold">{title}</h3>
            </div>

            <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>

            {children}

            <span className={`mt-4 inline-flex items-center gap-2 text-sm font-medium ${linkClassName}`}>
                {linkLabel}
            </span>
        </>
    );

    return (
        <Link
            id={id}
            href={linkHref}
            className="rounded-2xl border border-sidebar-border/70 bg-white p-5 text-left shadow-sm transition-transform hover:-translate-y-0.5 dark:border-sidebar-border dark:bg-sidebar"
        >
            {content}
        </Link>
    );
}
