import { Head, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    LockKeyhole,
    Search,
    ShieldCheck,
    Unlock,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type UserRow = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    failed_login_attempts?: number;
    locked_at?: string | null;
    created_at?: string | null;
};

type PagePropsShape = {
    users?: {
        data: UserRow[];
        current_page: number;
        last_page: number;
        total: number;
        per_page?: number;
    };
    filters?: {
        search?: string | null;
        per_page?: string | null;
    };
    stats?: {
        locked: number;
    };
};

function avatarInitials(name: string): string {
    const [lastPart, rest] = name.split(',');
    const firstInitial = (rest || lastPart || '').trim().charAt(0) || '';
    const lastInitial = (lastPart || '').trim().charAt(0) || '';

    return (lastInitial + firstInitial).toUpperCase() || '?';
}

function formatDateTime(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function pageNumbers(current: number, last: number): (number | '...')[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const candidates = [1, last, current, current - 1, current + 1];
    const sorted = [...new Set(candidates)]
        .filter((p) => p >= 1 && p <= last)
        .sort((a, b) => a - b);
    const out: (number | '...')[] = [];
    let prev = 0;

    for (const p of sorted) {
        if (p - prev > 1) {
            out.push('...');
        }

        out.push(p);
        prev = p;
    }

    return out;
}

/**
 * Staff-facing locked-accounts directory (requires "unlock accounts").
 * Rendered by the /account-unlock route only for permitted users; everyone
 * else gets the public request-a-link form.
 */
export default function UnlockAccounts() {
    const { props } = usePage<PagePropsShape>();
    const usersProp = props.users || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const users: UserRow[] = usersProp.data || [];
    const currentPage = usersProp.current_page || 1;
    const lastPage = usersProp.last_page || 1;
    const totalUsers = usersProp.total || 0;
    const stats = props.stats || { locked: 0 };

    const [search, setSearch] = useState(props.filters?.search || '');
    const [perPage, setPerPage] = useState(
        String(props.filters?.per_page || 10),
    );
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            if (event.detail.visit.only?.includes('users')) {
                setTableLoading(true);
            }
        });
        const removeFinish = router.on('finish', () => setTableLoading(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function reload(params: Record<string, string | number | undefined>) {
        router.get('/account-unlock', params, {
            preserveState: true,
            replace: true,
            preserveScroll: true,
            showProgress: false,
            only: ['users', 'filters'],
        });
    }

    function handleSearch(value: string) {
        setSearch(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            reload({
                search: value || undefined,
                per_page: perPage,
                page: 1,
            });
        }, 300);
    }

    function handlePerPage(value: string) {
        setPerPage(value);
        reload({
            search: search || undefined,
            per_page: value,
            page: 1,
        });
    }

    function goToPage(page: number) {
        if (page < 1 || page > lastPage) {
            return;
        }

        reload({
            page,
            search: search || undefined,
            per_page: perPage,
        });
    }

    function unlockUser(uuid: string, name: string) {
        router.post(
            `/account-unlock/${uuid}/unlock`,
            {},
            {
                preserveScroll: true,
                onSuccess: () =>
                    showToast(`Account unlocked for ${name}.`, 'success'),
                onError: () => showToast('Unable to unlock account.', 'error'),
            },
        );
    }

    return (
        <>
            <Head title="Unlock Accounts" />
            <PortalPageShell
                title="Unlock Accounts"
                description="Accounts locked after too many failed sign-in attempts. Unlock an account to let its owner sign in again."
            >
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-rose-100 p-2.5 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400">
                                <LockKeyhole className="h-5 w-5" />
                            </div>
                            <div className="min-w-0">
                                <div className="text-2xl font-bold">
                                    {stats.locked}
                                </div>
                                <div className="truncate text-sm text-muted-foreground">
                                    Locked accounts
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {search
                                ? `${totalUsers} result${totalUsers === 1 ? '' : 's'} for "${search}"`
                                : `Locked accounts: ${totalUsers}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        handleSearch(e.target.value)
                                    }
                                    placeholder="Search by name or email..."
                                    className="rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                />
                            </div>
                            <select
                                value={perPage}
                                onChange={(e) =>
                                    handlePerPage(e.target.value)
                                }
                                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            >
                                <option value="10">10 / page</option>
                                <option value="25">25 / page</option>
                                <option value="50">50 / page</option>
                                <option value="100">100 / page</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative overflow-auto rounded-xl border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        Account
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Failed attempts
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Locked since
                                    </th>
                                    <th className="px-4 py-3 font-medium">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {users.length === 0 && !tableLoading && (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950/40">
                                                <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-sidebar-foreground">
                                                No locked accounts
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {search
                                                    ? 'No locked accounts match your search.'
                                                    : 'Every account is currently able to sign in.'}
                                            </p>
                                        </td>
                                    </tr>
                                )}
                                {users.map((user) => (
                                    <tr
                                        key={user.uuid}
                                        className="hover:bg-sidebar-accent/40"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-9">
                                                    <AvatarImage
                                                        src={
                                                            user.profile_picture
                                                                ? `/assets/${user.profile_picture}`
                                                                : undefined
                                                        }
                                                        alt={user.name}
                                                    />
                                                    <AvatarFallback>
                                                        {avatarInitials(
                                                            user.name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate font-medium text-sidebar-foreground">
                                                            {user.name}
                                                        </span>
                                                        <Badge className="border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300">
                                                            <LockKeyhole className="mr-1 size-3" />
                                                            Locked
                                                        </Badge>
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {user.failed_login_attempts ?? 0}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDateTime(user.locked_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-9 gap-1.5 text-emerald-700 dark:text-emerald-400"
                                                onClick={() =>
                                                    unlockUser(
                                                        user.uuid,
                                                        user.name,
                                                    )
                                                }
                                            >
                                                <Unlock className="size-4" />
                                                Unlock
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {lastPage > 1 && (
                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            <p className="text-sm text-muted-foreground">
                                Page {currentPage} of {lastPage} ({totalUsers}{' '}
                                total)
                            </p>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                >
                                    <ChevronLeft className="size-4" />
                                    Previous
                                </button>
                                {pageNumbers(currentPage, lastPage).map(
                                    (page, index) =>
                                        page === '...' ? (
                                            <span
                                                key={`gap-${index}`}
                                                className="px-2 text-sm text-muted-foreground"
                                            >
                                                …
                                            </span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page)}
                                                className={`size-8 rounded-lg border text-sm font-medium transition ${
                                                    page === currentPage
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border text-muted-foreground hover:bg-muted'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ),
                                )}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= lastPage}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight className="size-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </PortalPageShell>
        </>
    );
}
