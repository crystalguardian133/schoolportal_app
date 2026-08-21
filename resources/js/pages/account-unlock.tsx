import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { LifeBuoy, LockKeyhole, MailCheck, ShieldCheck, Unlock, X } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type LockedUser = {
    uuid: string;
    name: string;
    email: string;
    failed_login_attempts: number;
    locked_at: string | null;
};

type Props = {
    canManage: boolean;
    lockedUsers: LockedUser[];
    status?: string | null;
};

function formatDateTime(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function timeAgo(iso: string | null) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
}

function initials(name: string) {
    return name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('');
}

export default function AccountUnlock() {
    const { props } = usePage();
    const { canManage, lockedUsers, status } = props as unknown as Props;
    const flash: any = (props as any).flash || {};

    const [unlocking, setUnlocking] = useState<string | null>(null);
    const [emailOpen, setEmailOpen] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({ email: '' });

    function sendLink(e: React.FormEvent) {
        e.preventDefault();
        post('/account-unlock/request', {
            onSuccess: () => {
                reset();
                setEmailOpen(false);
            },
        });
    }

    function unlockManually(uuid: string) {
        setUnlocking(uuid);
        router.post(
            `/account-unlock/${uuid}/manual`,
            {},
            {
                onFinish: () => setUnlocking(null),
                preserveScroll: true,
            },
        );
    }

    const banner = status || flash.success;

    return (
        <>
            <Head title="Unlock Account - DNHS School Portal" />
            <div className="flex min-h-screen flex-col bg-slate-100 dark:bg-black">
                <header className="border-b border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
                    <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-2.5">
                            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600/10">
                                <LockKeyhole className="size-4.5 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold leading-tight">DNHS School Portal</p>
                                <p className="text-[11px] leading-tight text-slate-500">Account Unlock</p>
                            </div>
                        </div>
                        {!canManage && (
                            <Link
                                href="/login"
                                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-900"
                            >
                                Back to sign in
                            </Link>
                        )}
                    </div>
                </header>

                <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
                    {/* Page heading */}
                    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                                {canManage ? 'Locked Accounts' : 'Unlock your account'}
                            </h1>
                            <p className="mt-1 max-w-xl text-sm text-slate-500 dark:text-neutral-400">
                                {canManage
                                    ? 'Accounts are locked automatically after repeated failed sign-in attempts. Unlock them manually below.'
                                    : 'Was your account locked after too many failed sign-in attempts? Request a secure unlock link below.'}
                            </p>
                        </div>
                        {canManage && (
                            <Button onClick={() => setEmailOpen(true)} className="gap-2">
                                <MailCheck className="size-4" />
                                Email unlock link
                            </Button>
                        )}
                    </div>

                    {banner && (
                        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                            {banner}
                        </div>
                    )}

                    {canManage ? (
                        /* ---------------- Manual unlock (staff) ---------------- */
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                            <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4 dark:border-neutral-800">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="size-4 text-emerald-600" />
                                    <h2 className="text-sm font-semibold">Manual unlock</h2>
                                </div>
                                <Badge
                                    variant={lockedUsers.length > 0 ? 'destructive' : 'secondary'}
                                    className="tabular-nums"
                                >
                                    {lockedUsers.length} locked
                                </Badge>
                            </div>

                            {lockedUsers.length === 0 ? (
                                <div className="flex flex-col items-center px-6 py-14 text-center">
                                    <div className="flex size-12 items-center justify-center rounded-full bg-emerald-600/10">
                                        <Unlock className="size-5 text-emerald-600" />
                                    </div>
                                    <p className="mt-3 text-sm font-medium">All clear</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        No accounts are currently locked.
                                    </p>
                                </div>
                            ) : (
                                <ul className="divide-y divide-slate-100 dark:divide-neutral-800">
                                    {lockedUsers.map((u) => (
                                        <li
                                            key={u.uuid}
                                            className="flex items-center gap-4 px-5 py-4 transition hover:bg-slate-50/70 dark:hover:bg-neutral-900/50"
                                        >
                                            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                                                {initials(u.name)}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">{u.name}</p>
                                                <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                                                <p className="mt-1 text-[11px] text-muted-foreground">
                                                    {u.failed_login_attempts} failed attempts · locked{' '}
                                                    {timeAgo(u.locked_at)}
                                                    <span className="hidden sm:inline"> · {formatDateTime(u.locked_at)}</span>
                                                </p>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => unlockManually(u.uuid)}
                                                disabled={unlocking === u.uuid}
                                                className="shrink-0 gap-1.5"
                                            >
                                                {unlocking === u.uuid ? (
                                                    <Spinner />
                                                ) : (
                                                    <Unlock className="size-4" />
                                                )}
                                                Unlock
                                            </Button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ) : (
                        /* ---------------- Email link (guests) ---------------- */
                        <section className="mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950">
                            <form onSubmit={sendLink} className="space-y-4 p-6">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-600/10">
                                    <MailCheck className="size-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold">Request an unlock link</h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Enter the account&apos;s email and we&apos;ll send a secure one-time
                                        unlock link, valid for 30 minutes.
                                    </p>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="unlock-email">Account email</Label>
                                    <Input
                                        id="unlock-email"
                                        type="email"
                                        required
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="name@school.edu"
                                    />
                                    <InputError message={errors.email} />
                                </div>
                                <Button type="submit" disabled={processing} className="w-full">
                                    {processing && <Spinner />}
                                    Send unlock link
                                </Button>
                            </form>
                        </section>
                    )}

                    <p className="mt-8 flex items-start justify-center gap-1.5 px-4 text-center text-xs leading-relaxed text-slate-500">
                        {canManage ? (
                            <>
                                <LifeBuoy className="mt-0.5 size-3.5 shrink-0" />
                                Users without staff access can unlock their own account through the
                                emailed link, or reach administrators via &ldquo;Need help signing
                                in?&rdquo; on the login page.
                            </>
                        ) : (
                            <>
                                <LifeBuoy className="mt-0.5 size-3.5 shrink-0" />
                                No email access? Use the &ldquo;Need help signing in?&rdquo; link on the
                                login page to contact support.
                            </>
                        )}
                    </p>
                </main>

                {/* Email unlock link modal (staff) */}
                <Dialog open={emailOpen} onOpenChange={setEmailOpen}>
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <MailCheck className="size-5 text-emerald-600" />
                                Email unlock link
                            </DialogTitle>
                            <DialogDescription>
                                Send a secure one-time unlock link to the account owner&apos;s email.
                                The link expires after 30 minutes.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={sendLink} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="unlock-email-modal">Account email</Label>
                                <Input
                                    id="unlock-email-modal"
                                    type="email"
                                    required
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="name@school.edu"
                                />
                                <InputError message={errors.email} />
                            </div>
                            <DialogFooter className="flex-row gap-2 sm:justify-end">
                                <Button type="button" variant="ghost" onClick={() => setEmailOpen(false)}>
                                    <X className="size-4" />
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Send link
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    );
}
