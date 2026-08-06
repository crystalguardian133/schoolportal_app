import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronLeft,
    ChevronRight,
    GraduationCap,
    LayoutGrid,
    Search,
    ShieldCheck,
    Trash2,
    UserPlus,
    Users,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import CreateUserModal from '@/components/admin/create-user-modal';
import EditUserModal from '@/components/admin/edit-user-modal';
import UserRoleCell from '@/components/admin/user-role-cell';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';

type UserRow = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    is_adviser?: boolean;
    adviser_section?: string | null;
    created_at?: string | null;
};

type RoleAssignment = {
    id?: string;
    name: string;
    icon?: string | null;
    expires_at?: string | null;
};

type PagePropsShape = {
    users?: {
        data: UserRow[];
        current_page: number;
        last_page: number;
        total: number;
    };
    roles?: Record<string, RoleAssignment[]>;
    roleOptions?: { id: string; name: string; icon?: string | null }[];
    sections?: { uuid: string; name: string; grade_level?: string | null }[];
    takenAdviserSections?: string[];
    stats?: {
        total_users: number;
        total_advisers: number;
        total_roles: number;
        role_counts?: Record<string, number>;
    };
    filters?: { search?: string | null; per_page?: string | number; role?: string | null };
};

function avatarInitials(name: string): string {
    const [lastPart, rest] = name.split(',');
    const firstInitial = (rest || lastPart || '').trim().charAt(0) || '';
    const lastInitial = (lastPart || '').trim().charAt(0) || '';

    return (lastInitial + firstInitial).toUpperCase() || '?';
}

function formatDate(value?: string | null): string {
    if (!value) {
        return '—';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return '—';
    }

    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
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

export default function AdminUsers() {
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
    const rolesMap: Record<string, RoleAssignment[]> = props.roles || {};
    const roleOptions: { id: string; name: string }[] = props.roleOptions || [];
    const takenAdviserSections: string[] = props.takenAdviserSections || [];
    const stats = props.stats || {
        total_users: 0,
        total_advisers: 0,
        total_roles: 0,
        role_counts: {},
    };
    const sections = props.sections || [];

    const [search, setSearch] = useState(props.filters?.search || '');
    const [perPage, setPerPage] = useState(
        String(props.filters?.per_page || 10),
    );
    const [roleFilter, setRoleFilter] = useState(
        props.filters?.role || 'all',
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

    function reload(params: Record<string, string | number | undefined>) {
        router.get(
            '/admin/users',
            params,
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                showProgress: false,
                only: ['users', 'filters'],
            },
        );
    }

    function goToPage(page: number) {
        if (page < 1 || page > lastPage) {
            return;
        }

        reload({
            page,
            search: search || undefined,
            per_page: perPage,
            role: roleFilter,
        });
    }

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function deleteUser(uuid: string) {
        router.delete(`/admin/users/${uuid}`, {
            onSuccess: () => {
                showToast('User deleted successfully.', 'success');
                router.reload();
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast(
                    (firstError as string) || 'Unable to delete user.',
                    'error',
                );
            },
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
                role: roleFilter,
            });
        }, 300);
    }

    function handlePerPage(value: string) {
        setPerPage(value);
        reload({
            search: search || undefined,
            per_page: value,
            page: 1,
            role: roleFilter,
        });
    }

    function handleRole(value: string) {
        setRoleFilter(value);
        reload({
            search: search || undefined,
            per_page: perPage,
            page: 1,
            role: value === 'all' ? undefined : value,
        });
    }

    return (
        <>
            <Head title="Manage Users" />
            <PortalPageShell
                title="Manage Users"
                description="Create accounts, assign roles, and control access across the portal."
            >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                        Manage user accounts, roles, and access.
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/roles"
                            className="inline-flex items-center gap-2 rounded-lg border border-sidebar-border/70 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-sidebar/50 dark:text-sidebar-foreground"
                        >
                            <ShieldCheck className="size-4" />
                            Roles & permissions
                        </Link>
                        <CreateUserModal
                            roles={roleOptions}
                            sections={sections}
                            takenAdviserSections={takenAdviserSections}
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        icon={<Users className="h-5 w-5" />}
                        label="Total Users"
                        value={stats.total_users}
                        tone="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
                    />
                    <StatCard
                        icon={<GraduationCap className="h-5 w-5" />}
                        label="Advisers"
                        value={stats.total_advisers}
                        tone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                    />
                    <StatCard
                        icon={<ShieldCheck className="h-5 w-5" />}
                        label="Roles"
                        value={stats.total_roles}
                        tone="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        icon={<LayoutGrid className="h-5 w-5" />}
                        label="Class Sections"
                        value={sections.length}
                        tone="bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400"
                    />
                </div>

                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {search
                                ? `${totalUsers} result${totalUsers === 1 ? '' : 's'} for "${search}"`
                                : roleFilter !== 'all'
                                  ? `${totalUsers} user${totalUsers === 1 ? '' : 's'} with the role "${roleFilter}"`
                                  : `Total users: ${totalUsers}`}
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                />
                            </div>
                            <select
                                value={roleFilter}
                                onChange={(e) => handleRole(e.target.value)}
                                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            >
                                <option value="all">All roles</option>
                                {roleOptions.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={perPage}
                                onChange={(e) => handlePerPage(e.target.value)}
                                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            >
                                <option value="10">10 / page</option>
                                <option value="25">25 / page</option>
                                <option value="50">50 / page</option>
                                <option value="100">100 / page</option>
                            </select>
                        </div>
                    </div>

                    <div className="table-scroll-container relative overflow-auto rounded-xl border border-sidebar-border/70">
                        {tableLoading && (
                            <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-sm dark:bg-sidebar/70">
                                <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                    <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">User</th>
                                            <th className="px-4 py-3 font-medium">Roles</th>
                                            <th className="px-4 py-3 font-medium">Adviser</th>
                                            <th className="px-4 py-3 font-medium">Joined</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                        {Array.from({ length: Number(perPage) || 10 }).map((_, i) => (
                                            <tr key={i} className="skeleton-glint">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-9 w-9 rounded-full bg-muted" />
                                                        <div className="space-y-1.5">
                                                            <div className="h-3.5 w-32 rounded bg-muted" />
                                                            <div className="h-3 w-44 rounded bg-muted" />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-muted" /></td>
                                                <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-muted" /></td>
                                                <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-muted" /></td>
                                                <td className="px-4 py-3"><div className="h-6 w-28 rounded bg-muted" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">User</th>
                                    <th className="px-4 py-3 font-medium">Roles</th>
                                    <th className="px-4 py-3 font-medium">Adviser</th>
                                    <th className="px-4 py-3 font-medium">Joined</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {users.length === 0 && !tableLoading && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-4 py-12 text-center"
                                        >
                                            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-muted">
                                                <UserPlus className="size-5 text-muted-foreground" />
                                            </div>
                                            <p className="mt-3 text-sm font-medium text-sidebar-foreground">
                                                No users found
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {search
                                                    ? `Try a different search or clear the "${roleFilter === 'all' ? 'role' : roleFilter}" filter.`
                                                    : 'Create a user to get started.'}
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
                                                    <div className="truncate font-medium text-sidebar-foreground">
                                                        {user.name}
                                                    </div>
                                                    <div className="truncate text-xs text-muted-foreground">
                                                        {user.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <UserRoleCell
                                                user={{
                                                    uuid: user.uuid,
                                                    name: user.name,
                                                }}
                                                roles={
                                                    rolesMap[user.uuid] || []
                                                }
                                                roleOptions={roleOptions}
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            {user.is_adviser ? (
                                                <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                                    {user.adviser_section
                                                        ? user.adviser_section
                                                        : 'Adviser'}
                                                </Badge>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    —
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {formatDate(user.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <EditUserModal
                                                    user={user}
                                                    sections={sections}
                                                    takenAdviserSections={
                                                        takenAdviserSections
                                                    }
                                                />
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9 text-red-600"
                                                            aria-label="Delete user"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            Delete user
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you want
                                                            to delete{' '}
                                                            <strong>
                                                                {user.name}
                                                            </strong>
                                                            ? This action cannot
                                                            be undone.
                                                        </DialogDescription>
                                                        <DialogFooter>
                                                            <DialogClose
                                                                asChild
                                                            >
                                                                <Button variant="secondary">
                                                                    Cancel
                                                                </Button>
                                                            </DialogClose>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() =>
                                                                    deleteUser(
                                                                        user.uuid,
                                                                    )
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
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

function StatCard({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    tone: string;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div
                    className={`rounded-lg p-2.5 ${tone}`}
                >
                    {icon}
                </div>
                <div className="min-w-0">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="truncate text-sm text-muted-foreground">
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}
