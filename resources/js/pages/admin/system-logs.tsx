import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    Clock3,
    FileText,
    Search,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

function toArray(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (value && Array.isArray(value.data)) {
        return value.data;
    }
    return [];
}

function formatMetadata(metadata) {
    if (!metadata) {
        return null;
    }
    if (typeof metadata === 'string') {
        try {
            return JSON.parse(metadata);
        } catch {
            return metadata;
        }
    }
    return metadata;
}

function statusTone(statusCode) {
    if (!statusCode) {
        return 'bg-muted text-muted-foreground';
    }
    if (statusCode >= 500) {
        return 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';
    }
    if (statusCode >= 400) {
        return 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300';
    }
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300';
}

type SortDirection = 'asc' | 'desc';

type SortableColumn =
    | 'created_at'
    | 'action'
    | 'method'
    | 'status_code'
    | 'route_name';

type LogRow = {
    id: number;
    user_uuid?: string | null;
    user_name?: string | null;
    user_email?: string | null;
    action: string;
    route_name?: string | null;
    method: string;
    path: string;
    ip_address?: string | null;
    user_agent?: string | null;
    status_code: number;
    metadata?: unknown;
    created_at: string;
};

function SortIcon({
    column,
    sortBy,
    sortDir,
}: {
    column: SortableColumn;
    sortBy: SortableColumn;
    sortDir: SortDirection;
}) {
    if (sortBy !== column) {
        return <ArrowUpDown className="size-3.5 opacity-40" />;
    }
    return sortDir === 'asc' ? (
        <ArrowUp className="size-3.5" />
    ) : (
        <ArrowDown className="size-3.5" />
    );
}

function LogRowComponent({
    log,
    sortBy,
    sortDir,
    onOpenLog,
}: {
    log: LogRow;
    sortBy: SortableColumn;
    sortDir: SortDirection;
    onOpenLog: (log: LogRow) => void;
}) {
    return (
        <tr
            className="cursor-pointer align-top hover:bg-muted/60"
            onClick={() => onOpenLog(log)}
        >
            <td className="px-4 py-3">
                <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded-xl border border-border bg-muted p-2 text-muted-foreground">
                        <UserRound className="size-4" />
                    </div>
                    <div>
                        <div className="font-medium text-foreground">
                            {log.user_name ?? 'Guest'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                            {log.user_email ?? '-'}
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
                {log.action}
            </td>
            <td className="px-4 py-3">
                <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                    {log.method}
                </span>
            </td>
            <td className="px-4 py-3">
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(log.status_code)}`}
                >
                    {log.status_code ?? '-'}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="text-sm font-medium text-foreground">
                    {log.route_name ?? '-'}
                </div>
                <div className="text-xs break-all text-muted-foreground">
                    {log.path}
                </div>
            </td>
            <td className="px-4 py-3 text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Clock3 className="size-4" />
                    {log.created_at}
                </div>
            </td>
        </tr>
    );
}

export default function SystemLogs() {
    const { props } = usePage();
    const logsProp = props.logs || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const logs = toArray(logsProp.data) as LogRow[];
    const filters = props.filters || {
        q: '',
        per_page: 25,
        sort_by: 'created_at',
        sort_dir: 'desc',
    };
    const [query, setQuery] = useState(filters.q ?? '');
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 25));
    const [sortBy, setSortBy] = useState<SortableColumn>(
        (filters.sort_by as SortableColumn) ?? 'created_at',
    );
    const [sortDir, setSortDir] = useState<SortDirection>(
        (filters.sort_dir as SortDirection) ?? 'desc',
    );
    const [selectedLog, setSelectedLog] = useState<LogRow | null>(null);

    function reload(params = {}) {
        router.get('/admin/system-logs', params, {
            preserveScroll: true,
            replace: true,
        });
    }

    function handleSubmit(event) {
        event.preventDefault();
        reload({
            q: query,
            per_page: perPage,
            sort_by: sortBy,
            sort_dir: sortDir,
            page: 1,
        });
    }

    function handleSort(column: SortableColumn) {
        const nextDir =
            sortBy === column && sortDir === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortDir(nextDir);
        reload({
            q: query,
            per_page: perPage,
            sort_by: column,
            sort_dir: nextDir,
            page: 1,
        });
    }

    function openLog(log: LogRow) {
        setSelectedLog(log);
    }

    return (
        <>
            <Head title="System Logs" />
            <div className="min-h-screen bg-background px-4 py-6 text-foreground">
                <div className="mx-auto max-w-7xl space-y-6">
                    <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                        <div className="relative px-6 py-8 sm:px-8">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.08),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(100,116,139,0.06),_transparent_34%)]" />
                            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="max-w-2xl space-y-3">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                        <FileText className="size-3.5" />
                                        System Monitoring
                                    </div>
                                    <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                        System Logs
                                    </h1>
                                    <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                        Track activity across the system,
                                        including user actions, route visits,
                                        response status, and request details.
                                        Click a row to view full metadata.
                                    </p>
                                </div>

                                <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                                    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                        <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Logs
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold">
                                            {logsProp.total ?? 0}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                        <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Page
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold">
                                            {logsProp.current_page ?? 1}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                        <div className="text-xs tracking-wide text-muted-foreground uppercase">
                                            Results
                                        </div>
                                        <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                                            {logs.length}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end"
                        >
                            <div className="space-y-2">
                                <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Search
                                </label>
                                <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-3 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                                    <Search className="size-4 text-muted-foreground" />
                                    <input
                                        value={query}
                                        onChange={(event) =>
                                            setQuery(event.target.value)
                                        }
                                        placeholder="Search by user, route, action, or path"
                                        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-xs font-medium tracking-wide text-muted-foreground uppercase">
                                    Per page
                                </label>
                                <select
                                    value={perPage}
                                    onChange={(event) =>
                                        setPerPage(event.target.value)
                                    }
                                    className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
                                >
                                    {[10, 25, 50, 100].map((count) => (
                                        <option key={count} value={count}>
                                            {count}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:ring-4 focus:ring-ring/20 focus:outline-none"
                            >
                                Filter
                            </button>
                        </form>

                        <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                            <table className="min-w-full divide-y divide-border text-left text-sm">
                                <thead className="bg-muted text-xs tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Actor
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('action')}
                                                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                                Action
                                                <SortIcon column="action" sortBy={sortBy} sortDir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('method')}
                                                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                                Method
                                                <SortIcon column="method" sortBy={sortBy} sortDir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('status_code')}
                                                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                                Status
                                                <SortIcon column="status_code" sortBy={sortBy} sortDir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('route_name')}
                                                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                                Route / Path
                                                <SortIcon column="route_name" sortBy={sortBy} sortDir={sortDir} />
                                            </button>
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            <button
                                                type="button"
                                                onClick={() => handleSort('created_at')}
                                                className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                                            >
                                                Created
                                                <SortIcon column="created_at" sortBy={sortBy} sortDir={sortDir} />
                                            </button>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border bg-background">
                                    {logs.length > 0 ? (
                                        logs.map((log) => (
                                            <LogRowComponent
                                                key={log.id}
                                                log={log}
                                                sortBy={sortBy}
                                                sortDir={sortDir}
                                                onOpenLog={openLog}
                                            />
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="px-4 py-10 text-center text-sm text-muted-foreground"
                                            >
                                                No logs found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                                Page {logsProp.current_page} of{' '}
                                {logsProp.last_page} · {logsProp.total ?? 0}{' '}
                                total
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled={(logsProp.current_page || 1) <= 1}
                                    onClick={() =>
                                        reload({
                                            q: query,
                                            per_page: perPage,
                                            sort_by: sortBy,
                                            sort_dir: sortDir,
                                            page:
                                                (logsProp.current_page || 1) -
                                                1,
                                        })
                                    }
                                    className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Prev
                                </button>
                                <button
                                    type="button"
                                    disabled={
                                        (logsProp.current_page || 1) >=
                                        (logsProp.last_page || 1)
                                    }
                                    onClick={() =>
                                        reload({
                                            q: query,
                                            per_page: perPage,
                                            sort_by: sortBy,
                                            sort_dir: sortDir,
                                            page:
                                                (logsProp.current_page || 1) +
                                                1,
                                        })
                                    }
                                    className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            <Dialog
                open={!!selectedLog}
                onOpenChange={(open) => !open && setSelectedLog(null)}
            >
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Log Details</DialogTitle>
                    </DialogHeader>
                    {selectedLog && (
                        <div className="mt-4 space-y-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        User
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {selectedLog.user_name ?? 'Guest'}
                                        {selectedLog.user_email && (
                                            <span className="text-muted-foreground">
                                                {' '}
                                                ({selectedLog.user_email})
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        IP Address
                                    </div>
                                    <div className="mt-1 font-mono text-sm">
                                        {selectedLog.ip_address ?? '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Action
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {selectedLog.action}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Method
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {selectedLog.method}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Route
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {selectedLog.route_name ?? '-'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Path
                                    </div>
                                    <div className="mt-1 text-sm break-all">
                                        {selectedLog.path}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Status Code
                                    </div>
                                    <div className="mt-1">
                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(selectedLog.status_code)}`}
                                        >
                                            {selectedLog.status_code}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Created At
                                    </div>
                                    <div className="mt-1 text-sm">
                                        {selectedLog.created_at}
                                    </div>
                                </div>
                            </div>

                            {selectedLog.user_agent && (
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        User Agent
                                    </div>
                                    <div className="mt-1 text-xs break-all text-muted-foreground">
                                        {selectedLog.user_agent}
                                    </div>
                                </div>
                            )}

                            {selectedLog.metadata && (
                                <div>
                                    <div className="text-xs font-medium text-muted-foreground uppercase">
                                        Metadata
                                    </div>
                                    <pre className="mt-1 max-h-64 overflow-auto rounded-2xl border border-border bg-muted/40 p-3 text-xs break-words whitespace-pre-wrap">
                                        {JSON.stringify(
                                            formatMetadata(
                                                selectedLog.metadata,
                                            ),
                                            null,
                                            2,
                                        )}
                                    </pre>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}
