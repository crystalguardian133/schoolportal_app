import { Head, Link, router, usePage } from '@inertiajs/react';
import { Bug, Lightbulb, MessageSquare, X, Check, Clock, Eye, Search, ChevronLeft, ChevronRight, Trash2, Lock, MessageCircle } from 'lucide-react';
import { lazy, Suspense, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PortalPageShell } from '@/components/portal-page-shell';
import { formatDate } from '@/lib/dates';
import { cn } from '@/lib/utils';

const SimpleBarChart = lazy(() =>
    import('@/components/charts').then((m) => ({ default: m.SimpleBarChart })),
);

type Report = {
    id: string;
    type: string;
    subject: string;
    message: string;
    images: string[] | null;
    status: string;
    closed: boolean;
    replies: { id: string }[];
    user: { id: number; name: string; email: string } | null;
    contact_email: string | null;
    created_at: string;
};

type PaginatedReports = {
    data: Report[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
};

type Props = {
    reports: PaginatedReports;
    stats: {
        total: number;
        pending: number;
        under_review: number;
        accepted: number;
        rejected: number;
        resolved: number;
        unresolved: number;
        closed: number;
    };
    filters: {
        type?: string;
        status?: string;
        search?: string;
        resolution?: string;
    };
};

const typeConfig: Record<string, { label: string; icon: typeof Bug; bg: string }> = {
    bug: { label: 'Bug Report', icon: Bug, bg: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' },
    suggestion: { label: 'Suggestion', icon: Lightbulb, bg: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300' },
    feedback: { label: 'Feedback', icon: MessageSquare, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
};

const statusOptions = [
    { value: 'pending', label: 'Pending', icon: Clock, bg: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    { value: 'under_review', label: 'Under Review', icon: Eye, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    { value: 'accepted', label: 'Accepted', icon: Check, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    { value: 'rejected', label: 'Rejected', icon: X, bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
];

const resolutionOptions = [
    { value: 'unresolved', label: 'Unresolved', icon: Clock, activeBg: 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-300' },
    { value: 'resolved', label: 'Resolved', icon: Check, activeBg: 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300' },
    { value: 'closed', label: 'Closed', icon: Lock, activeBg: 'bg-gray-100 border-gray-400 text-gray-700 dark:bg-gray-900 dark:border-gray-600 dark:text-gray-300' },
];

export default function DeveloperReports({ reports, stats, filters }: Props) {
    const { props } = usePage();
    const flash: any = props.flash || {};
    const [search, setSearch] = useState(filters.search || '');
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    function handleFilter(key: string, value: string) {
        router.get(
            '/developer/reports',
            { ...filters, [key]: value || undefined, page: 1 },
            { preserveState: true, replace: true },
        );
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        handleFilter('search', search);
    }

    function deleteReport() {

        if (!deleteTarget) {
return;
}

        router.delete(`/feedback/${deleteTarget}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    const chartData = [
        { label: 'Pending', value: stats.pending },
        { label: 'Under Review', value: stats.under_review },
        { label: 'Accepted', value: stats.accepted },
        { label: 'Rejected', value: stats.rejected },
    ];

    return (
        <>
            <Head title="Developer Reports" />
            <PortalPageShell
                title="Developer Reports"
                description="View and manage bug reports, suggestions, and feedback from all users."
                showBackLink={false}
            >
                {flash.success && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {flash.success}
                    </div>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Filter:</span>
                    {resolutionOptions.map((r) => {
                        const RIcon = r.icon;
                        const active = filters.resolution === r.value;

                        return (
                            <button
                                key={r.value}
                                onClick={() => handleFilter('resolution', active ? '' : r.value)}
                                className={cn(
                                    'inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-medium transition',
                                    active
                                        ? r.activeBg
                                        : 'border-border text-muted-foreground hover:bg-muted',
                                )}
                            >
                                <RIcon className="size-3.5" />
                                {r.label}
                                <span className="rounded-full bg-background/60 px-1.5 text-[10px] font-semibold">
                                    {stats[r.value as keyof typeof stats]}
                                </span>
                            </button>
                        );
                    })}
                    {filters.resolution && (
                        <button
                            onClick={() => handleFilter('resolution', '')}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted"
                        >
                            <X className="size-3" />
                            Clear
                        </button>
                    )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statusOptions.map((s) => {
                        const Icon = s.icon;

                        return (
                            <button
                                key={s.value}
                                onClick={() => handleFilter('status', filters.status === s.value ? '' : s.value)}
                                className={cn(
                                    'rounded-2xl border p-4 text-left transition',
                                    filters.status === s.value ? 'border-primary ring-2 ring-primary/20' : 'border-sidebar-border/70 hover:shadow-sm',
                                    'bg-white dark:border-sidebar-border dark:bg-sidebar',
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', s.bg)}>
                                        <Icon className="mr-1 inline size-3" />
                                        {s.label}
                                    </span>
                                    <span className="text-2xl font-bold">
                                        {stats[s.value as keyof typeof stats]}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted" />}>
                    <SimpleBarChart title="Status Overview" data={chartData} />
                </Suspense>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex gap-2">
                        {Object.entries(typeConfig).map(([key, cfg]) => {
                            const Icon = cfg.icon;

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleFilter('type', filters.type === key ? '' : key)}
                                    className={cn(
                                        'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                                        filters.type === key
                                            ? 'border-primary bg-primary/5 text-primary'
                                            : 'border-border text-muted-foreground hover:bg-muted',
                                    )}
                                >
                                    <Icon className="size-3" />
                                    {cfg.label}
                                </button>
                            );
                        })}
                    </div>

                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search reports..."
                                className="rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            />
                        </div>
                    </form>
                </div>

                <div className="space-y-4">
                    {reports.data.length === 0 && (
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <MessageSquare className="mx-auto size-10 text-muted-foreground" />
                            <p className="mt-3 text-sm text-muted-foreground">No reports found.</p>
                        </div>
                    )}

                    {reports.data.map((report) => {
                        const cfg = typeConfig[report.type] ?? typeConfig.feedback;
                        const status = statusOptions.find((s) => s.value === report.status) ?? statusOptions[0];
                        const Icon = cfg.icon;
                        const StatusIcon = status.icon;
                        const replyCount = report.replies?.length ?? 0;

                        return (
                            <Link
                                key={report.id}
                                href={`/feedback/${report.id}`}
                                className="block rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition hover:ring-2 hover:ring-primary/20 dark:border-sidebar-border dark:bg-sidebar"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={cn('mt-0.5 rounded-lg p-2', cfg.bg)}>
                                            <Icon className="size-4" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold">{report.subject}</h3>
                                            <p className="text-xs text-muted-foreground">
                                                by {report.user ? `${report.user.name} (${report.user.email})` : (report.contact_email ?? 'Guest')}
                                            </p>
                                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{report.message}</p>
                                            <div className="mt-2 flex items-center gap-3">
                                                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', status.bg)}>
                                                    <StatusIcon className="mr-1 inline size-3" />
                                                    {status.label}
                                                </span>
                                                {report.closed && (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                                        <Lock className="size-3" />
                                                        Closed
                                                    </span>
                                                )}
                                                {replyCount > 0 && (
                                                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                        <MessageCircle className="size-3" />
                                                        {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="mt-3 text-xs text-muted-foreground">
                                    {formatDate(report.created_at, 'MMM d, yyyy h:mm a')}
                                </p>

                                <div className="mt-3 flex items-center gap-2" onClick={(e) => e.preventDefault()}>
                                    <span className="text-xs text-muted-foreground">Status:</span>
                                    {statusOptions.map((s) => {
                                        const StIcon = s.icon;

                                        return (
                                            <button
                                                key={s.value}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    router.patch(`/developer/reports/${report.id}/status`, { status: s.value });
                                                }}
                                                className={cn(
                                                    'inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-medium transition',
                                                    report.status === s.value
                                                        ? 'border-primary bg-primary/5 text-primary'
                                                        : 'border-border text-muted-foreground hover:bg-muted',
                                                )}
                                            >
                                                <StIcon className="size-3" />
                                                {s.label}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            setDeleteTarget(report.id);
                                        }}
                                        className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                        <Trash2 className="size-3" />
                                        Delete
                                    </button>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {reports.last_page > 1 && (
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Page {reports.current_page} of {reports.last_page} ({reports.total} reports)
                        </p>
                        <div className="flex gap-2">
                            {reports.current_page > 1 && (
                                <button
                                    onClick={() => handleFilter('page', String(reports.current_page - 1))}
                                    className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                            )}
                            {reports.current_page < reports.last_page && (
                                <button
                                    onClick={() => handleFilter('page', String(reports.current_page + 1))}
                                    className="rounded-lg border border-border p-1.5 text-muted-foreground transition hover:bg-muted"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <ConfirmDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => {
 if (!open) {
setDeleteTarget(null)
} 
}}
                    onConfirm={deleteReport}
                    title="Delete Report"
                    description="This will permanently delete this report and all its images. This action cannot be undone."
                />
            </PortalPageShell>
        </>
    );
}

DeveloperReports.layout = undefined;
