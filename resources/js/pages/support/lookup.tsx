import { Head, useForm, usePage } from '@inertiajs/react';
import { Check, Clock, Eye, LifeBuoy, LockKeyhole, Mail, MessageCircle, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

type TicketRef = {
    id: string;
    subject: string;
    status: string;
    created_at: string;
    url: string;
};

type Props = {
    query: string | null;
    open_tickets: TicketRef[];
    resolved_tickets: TicketRef[];
};

const statusConfig: Record<string, { label: string; icon: typeof Clock; bg: string }> = {
    pending: { label: 'Pending', icon: Clock, bg: 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300' },
    under_review: { label: 'Under Review', icon: Eye, bg: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
    accepted: { label: 'Solved', icon: Check, bg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' },
    rejected: { label: 'Rejected', icon: X, bg: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300' },
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function StatusBadge({ status }: { status: string }) {
    const cfg = statusConfig[status] ?? statusConfig.pending;
    const Icon = cfg.icon;

    return (
        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium', cfg.bg)}>
            <Icon className="size-3" />
            {cfg.label}
        </span>
    );
}

export default function SupportLookup() {
    const { props } = usePage();
    const { query, open_tickets = [], resolved_tickets = [] } = props as unknown as Props;
    const errors = ((props as any).errors || {}) as { query?: string };
    const flash: any = (props as any).flash || {};

    const [pickerOpen, setPickerOpen] = useState(open_tickets.length > 1);

    const { data, setData, post, processing } = useForm({
        query: query ?? '',
    });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setPickerOpen(false);
        post('/support/tickets/lookup');
    }

    const hasResults = open_tickets.length > 0 || resolved_tickets.length > 0;

    return (
        <>
            <Head title="Find your support ticket" />
            <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-black">
                <header className="border-b border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-4">
                        <LifeBuoy className="size-5 text-emerald-600" />
                        <span className="text-sm font-semibold">DNHS Portal Support</span>
                    </div>
                </header>

                <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
                    {flash.success && (
                        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {flash.success}
                        </div>
                    )}

                    <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                        <div className="border-b border-slate-100 p-4 dark:border-neutral-800">
                            <h1 className="text-base font-semibold">Find your support thread</h1>
                            <p className="mt-0.5 text-xs text-slate-500">
                                Enter the email address you used or your ticket ID (the first 8 characters shown on
                                your thread page).
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3 p-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="lookup-query">Email or ticket ID</Label>
                                <div className="relative">
                                    <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                    <Input
                                        id="lookup-query"
                                        required
                                        minLength={6}
                                        maxLength={255}
                                        value={data.query}
                                        onChange={(e) => setData('query', e.target.value)}
                                        placeholder="name@example.com  ·  or  e3b0c442…"
                                        autoComplete="off"
                                        className="pl-9"
                                    />
                                </div>
                                {errors.query && (
                                    <p className="text-xs text-red-600 dark:text-red-400">{errors.query}</p>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Spinner /> : <Search className="size-4" />}
                                    Find tickets
                                </Button>
                            </div>
                        </form>

                        {hasResults && (
                            <div className="border-t border-slate-100 p-4 dark:border-neutral-800">
                                {open_tickets.length === 0 ? (
                                    <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                                        <Check className="mt-0.5 size-4 shrink-0" />
                                        You have no open tickets{resolved_tickets.length > 0 ? ' — all your requests are resolved below.' : '.'}
                                    </div>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setPickerOpen(true)}
                                        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50 dark:border-neutral-800 dark:hover:bg-neutral-900"
                                    >
                                        You have {open_tickets.length} open {open_tickets.length === 1 ? 'ticket' : 'tickets'} — pick one to continue…
                                    </button>
                                )}

                                {resolved_tickets.length > 0 && (
                                    <div className="mt-4">
                                        <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                                            <LockKeyhole className="size-3" />
                                            Resolved &amp; closed threads
                                        </p>
                                        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-neutral-800 dark:border-neutral-800">
                                            {resolved_tickets.map((t) => (
                                                <li key={t.id}>
                                                    <a
                                                        href={t.url}
                                                        className="flex items-center justify-between gap-3 px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-neutral-900"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-medium">{t.subject}</p>
                                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                                #{t.id.slice(0, 8)} · opened {formatDateTime(t.created_at)}
                                                            </p>
                                                        </div>
                                                        <div className="flex shrink-0 items-center gap-2">
                                                            <StatusBadge status={t.status} />
                                                            <LockKeyhole className="size-3.5 text-slate-400" />
                                                        </div>
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                        <p className="mt-2 text-[11px] text-slate-400">
                                            Closed threads are read-only.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Choose a ticket</DialogTitle>
                        <DialogDescription>
                            Multiple open tickets were found{query ? ` for ${query}` : ''}. Pick the one you want to
                            view.
                        </DialogDescription>
                    </DialogHeader>

                    <ul className="-mx-1 max-h-72 space-y-1 overflow-y-auto px-1">
                        {open_tickets.map((t) => (
                            <li key={t.id}>
                                <a
                                    href={t.url}
                                    className="block rounded-lg border border-slate-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-neutral-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/40"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <p className="truncate text-sm font-medium">{t.subject}</p>
                                        <StatusBadge status={t.status} />
                                    </div>
                                    <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                                        <MessageCircle className="size-3" />#{t.id.slice(0, 8)} · opened{' '}
                                        {formatDateTime(t.created_at)}
                                    </p>
                                </a>
                            </li>
                        ))}
                    </ul>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setPickerOpen(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
