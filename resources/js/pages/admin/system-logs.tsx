import { Head, router, usePage } from '@inertiajs/react';
import { Clock3, FileText, Search, UserRound } from 'lucide-react';
import { useState } from 'react';

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
        return '-';
    }

    if (typeof metadata === 'string') {
        return metadata;
    }

    return JSON.stringify(metadata, null, 2);
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

export default function SystemLogs() {
    const { props } = usePage();
    const logsProp = props.logs || { data: [], current_page: 1, last_page: 1, total: 0 };
    const logs = toArray(logsProp.data);
    const filters = props.filters || { q: '', per_page: 25 };
    const [query, setQuery] = useState(filters.q ?? '');
    const [perPage, setPerPage] = useState(String(filters.per_page ?? 25));

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
            page: 1,
        });
    }

    return (
        <div className="min-h-screen bg-background px-4 py-6 text-foreground">
            <Head title="System Logs" />

            <div className="mx-auto max-w-7xl space-y-6">
                <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
                    <div className="relative px-6 py-8 sm:px-8">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(148,163,184,0.08),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(100,116,139,0.06),_transparent_34%)]" />
                        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl space-y-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                                    <FileText className="size-3.5" />
                                    System Monitoring
                                </div>
                                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">System Logs</h1>
                                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                                    Track activity across the system, including user actions, route visits, response status, and request metadata.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Logs</div>
                                    <div className="mt-1 text-2xl font-semibold">{logsProp.total ?? 0}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Page</div>
                                    <div className="mt-1 text-2xl font-semibold">{logsProp.current_page ?? 1}</div>
                                </div>
                                <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Results</div>
                                    <div className="mt-1 text-2xl font-semibold text-emerald-600 dark:text-emerald-400">{logs.length}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="rounded-3xl border border-border bg-card p-5 shadow-sm">
                    <form onSubmit={handleSubmit} className="grid gap-3 md:grid-cols-[1fr_160px_auto] md:items-end">
                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Search</label>
                            <div className="flex items-center gap-2 rounded-2xl border border-input bg-background px-3 py-3 focus-within:border-ring focus-within:ring-4 focus-within:ring-ring/15">
                                <Search className="size-4 text-muted-foreground" />
                                <input
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="Search by user, route, action, path, or IP"
                                    className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/70"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">Per page</label>
                            <select
                                value={perPage}
                                onChange={(event) => setPerPage(event.target.value)}
                                className="w-full rounded-2xl border border-input bg-background px-3 py-3 text-sm outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/15"
                            >
                                {[10, 25, 50, 100].map((count) => (
                                    <option key={count} value={count}>{count}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            className="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-ring/20"
                        >
                            Filter
                        </button>
                    </form>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-border">
                        <table className="min-w-full divide-y divide-border text-left text-sm">
                            <thead className="bg-muted text-xs uppercase tracking-wide text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">Actor</th>
                                    <th className="px-4 py-3 font-medium">Action</th>
                                    <th className="px-4 py-3 font-medium">Method</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Route / Path</th>
                                    <th className="px-4 py-3 font-medium">Metadata</th>
                                    <th className="px-4 py-3 font-medium">Created</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-background">
                                {logs.length > 0 ? logs.map((log) => (
                                    <tr key={log.id} className="align-top hover:bg-muted/60">
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
                                                        {log.user_email ?? log.ip_address ?? '-'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{log.action}</td>
                                        <td className="px-4 py-3">
                                            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-foreground">
                                                {log.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusTone(log.status_code)}`}>
                                                {log.status_code ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-medium text-foreground">{log.route_name ?? '-'}</div>
                                            <div className="text-xs text-muted-foreground break-all">{log.path}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <pre className="max-w-md whitespace-pre-wrap break-words rounded-2xl border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                                                {formatMetadata(log.metadata)}
                                            </pre>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <Clock3 className="size-4" />
                                                {log.created_at}
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted-foreground">
                                            No logs found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            Page {logsProp.current_page} of {logsProp.last_page} · {logsProp.total ?? 0} total
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                disabled={(logsProp.current_page || 1) <= 1}
                                onClick={() => reload({ q: query, per_page: perPage, page: (logsProp.current_page || 1) - 1 })}
                                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Prev
                            </button>
                            <button
                                type="button"
                                disabled={(logsProp.current_page || 1) >= (logsProp.last_page || 1)}
                                onClick={() => reload({ q: query, per_page: perPage, page: (logsProp.current_page || 1) + 1 })}
                                className="rounded-2xl border border-border bg-background px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}