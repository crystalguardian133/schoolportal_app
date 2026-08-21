import { Head, router, useForm } from '@inertiajs/react';
import { LifeBuoy, LockKeyhole, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import { usePage } from '@inertiajs/react';

type Message = {
    id: string;
    author: string;
    is_staff: boolean;
    message: string;
    images: string[] | null;
    created_at: string;
};

type Ticket = {
    id: string;
    subject: string;
    status: string;
    closed: boolean;
    created_at: string;
    messages: Message[];
};

type Props = {
    ticket: Ticket;
    token: string;
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function SupportThread() {
    const { props } = usePage();
    const { ticket, token } = props as unknown as Props;
    const flash: any = (props as any).flash || {};

    const { data, setData, post, processing, reset } = useForm({ message: '' });

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(`/support/tickets/${ticket.id}/reply?token=${token}`, {
            onSuccess: () => reset(),
        });
    }

    return (
        <>
            <Head title={`Support — ${ticket.subject}`} />
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
                        <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-4 dark:border-neutral-800">
                            <div>
                                <h1 className="text-base font-semibold">{ticket.subject}</h1>
                                <p className="mt-0.5 text-xs text-slate-500">
                                    Opened {formatDateTime(ticket.created_at)} · Ticket #{ticket.id.slice(0, 8)}
                                </p>
                            </div>
                            {ticket.closed ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                                    <LockKeyhole className="size-3" />
                                    Closed
                                </span>
                            ) : (
                                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                                    Open
                                </span>
                            )}
                        </div>

                        <div className="space-y-4 p-4">
                            {ticket.messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={cn(
                                        'flex flex-col gap-1 rounded-lg p-3',
                                        m.is_staff
                                            ? 'bg-emerald-50 dark:bg-emerald-950/40'
                                            : 'bg-slate-50 dark:bg-neutral-900',
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-semibold">
                                            {m.author}
                                            {m.is_staff && (
                                                <span className="ml-1.5 rounded bg-emerald-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
                                                    Staff
                                                </span>
                                            )}
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {formatDateTime(m.created_at)}
                                        </span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                                </div>
                            ))}
                        </div>

                        {!ticket.closed && (
                            <form onSubmit={handleSubmit} className="space-y-3 border-t border-slate-100 p-4 dark:border-neutral-800">
                                <Label htmlFor="reply-message" className="text-xs">
                                    Reply
                                </Label>
                                <textarea
                                    id="reply-message"
                                    required
                                    rows={3}
                                    maxLength={2000}
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    placeholder="Write a reply…"
                                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 outline-none"
                                />
                                <div className="flex justify-end">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? <Spinner /> : <Send className="size-4" />}
                                        Send reply
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>

                    <p className="mt-4 text-center text-xs text-slate-500">
                        Keep this page link private — anyone with it can read this thread.
                    </p>
                </main>
            </div>
        </>
    );
}
