import { Head, Link, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff, Trash2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EditUserModal from '@/components/admin/edit-user-modal';
import { PortalPageShell } from '@/components/portal-page-shell';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type UserRow = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    is_adviser?: boolean;
    adviser_section?: string | null;
};

export default function AdminUsers() {
    const { props } = usePage();
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
    const rolesMap: Record<string, string[]> = props.roles || {};
    const roleOptions: { id: string; name: string }[] = props.roleOptions || [];
    const takenAdviserSections: string[] = props.takenAdviserSections || [];

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: roleOptions[0]?.name || '',
        is_adviser: false,
        adviser_section: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [search, setSearch] = useState((props as any).filters?.search || '');
    const [perPage, setPerPage] = useState(String((props as any).filters?.per_page || 10));
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tableLoading, setTableLoading] = useState(false);
    const [displayUsers, setDisplayUsers] = useState(users);

    useEffect(() => {
        setDisplayUsers(users);
    }, [users]);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            if (event.detail.visit.only?.includes('users')) {
                setDisplayUsers([]);
                setTableLoading(true);
            }
        });
        const removeFinish = router.on('finish', () => setTableLoading(false));
        return () => { removeStart(); removeFinish(); };
    }, []);

    function goToPage(page: number) {
        if (page < 1 || page > lastPage) return;
        router.get(
            '/admin/users',
            { page, search: search || undefined, per_page: perPage },
            { preserveState: true, replace: true, preserveScroll: true, showProgress: false, only: ['users', 'filters'] },
        );
    }

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function composeName(first?: string, middle?: string, last?: string) {
        const f = (first || '').trim();
        const m = (middle || '').trim();
        const l = (last || '').trim();

        const mid = m ? ' ' + m.charAt(0).toUpperCase() : '';

        if (l) {
            return (l + (f ? ', ' + f + mid : '')).trim();
        }

        return (f + (mid ? ' ' + mid : '')).trim();
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        const name = composeName(
            form.first_name,
            form.middle_name,
            form.last_name,
        );
        setSubmitting(true);
        router.post(
            '/admin/users',
            {
                first_name: form.first_name,
                middle_name: form.middle_name,
                last_name: form.last_name,
                email: form.email,
                password: form.password,
                password_confirmation: form.password_confirmation,
                role: form.role,
                is_adviser: form.is_adviser,
                adviser_section: form.adviser_section || null,
                name,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    showToast('User created successfully.', 'success');
                    router.reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to create user.',
                        'error',
                    );
                },
            },
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
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            router.get(
                '/admin/users',
                { search: value || undefined, per_page: perPage, page: 1 },
                { preserveState: true, replace: true, preserveScroll: true, showProgress: false, only: ['users', 'filters'] },
            );
        }, 300);
    }

    function handlePerPage(value: string) {
        setPerPage(value);
        router.get(
            '/admin/users',
            { search: search || undefined, per_page: value, page: 1 },
            { preserveState: true, replace: true, preserveScroll: true, showProgress: false, only: ['users', 'filters'] },
        );
    }

    return (
        <>
            <Head title="Users" />
            <PortalPageShell
                title="Users"
                description="Create and manage platform users."
            >
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="text-sm text-muted-foreground">
                        Manage user accounts, roles, and access.
                    </div>
                    <Link
                        href="/admin/roles"
                        className="rounded-full border border-sidebar-border/70 px-4 py-2 text-sm font-medium text-foreground hover:bg-sidebar/50"
                    >
                        Edit roles & permissions
                    </Link>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm md:col-span-1 dark:border-sidebar-border dark:bg-sidebar"
                    >
                        <div className="mb-3 text-sm font-medium">
                            Create User
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Name</Label>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <Input
                                    placeholder="First"
                                    value={form.first_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            first_name: e.target.value,
                                        })
                                    }
                                />
                                <Input
                                    placeholder="Middle"
                                    value={form.middle_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            middle_name: e.target.value,
                                        })
                                    }
                                />
                                <Input
                                    placeholder="Last"
                                    value={form.last_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            last_name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <Label className="mt-3 text-xs">Email</Label>
                            <Input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                            />

                            <Label className="mt-3 text-xs">Role</Label>
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            >
                                {roleOptions.map((r) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>

                            <label className="mt-3 flex items-center gap-2 text-sm text-foreground dark:text-sidebar-foreground">
                                <input
                                    type="checkbox"
                                    checked={form.is_adviser}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            is_adviser: e.target.checked,
                                            adviser_section: e.target.checked
                                                ? form.adviser_section
                                                : '',
                                        })
                                    }
                                />
                                <span>Is adviser</span>
                            </label>

                            {form.is_adviser ? (
                                <>
                                    <Label className="mt-3 text-xs">
                                        Adviser section
                                    </Label>
                                    <select
                                        value={form.adviser_section}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                adviser_section: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                                    >
                                        <option value="">Select section</option>
                                        {(props.sections || []).filter(
                                            (section: any) =>
                                                !takenAdviserSections.includes(
                                                    section.name,
                                                ),
                                        ).map(
                                            (section: any) => (
                                                <option
                                                    key={section.uuid}
                                                    value={section.name}
                                                >
                                                    {section.name}
                                                </option>
                                            ),
                                        )}
                                    </select>
                                </>
                            ) : null}

                            <Label className="mt-3 text-xs">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                />
                                <div
                                    className="absolute top-2 right-2 cursor-pointer text-muted-foreground"
                                    onClick={() => setShowPassword((s) => !s)}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </div>
                            </div>

                            <Label className="mt-3 text-xs">
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={form.password_confirmation}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password_confirmation:
                                                e.target.value,
                                        })
                                    }
                                />
                                <div
                                    className="absolute top-2 right-2 cursor-pointer text-muted-foreground"
                                    onClick={() =>
                                        setShowConfirmPassword((s) => !s)
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 text-right">
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !form.last_name ||
                                        !form.email ||
                                        !form.password ||
                                        !form.password_confirmation
                                    }
                                >
                                    {submitting ? 'Creating…' : 'Create'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm md:col-span-2 dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                                {search ? `${totalUsers} result${totalUsers === 1 ? '' : 's'} for "${search}"` : `Total users: ${totalUsers}`}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => handleSearch(e.target.value)}
                                        placeholder="Search by name or email..."
                                        className="rounded-xl border border-border bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                    />
                                </div>
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
                        <div className="relative overflow-auto rounded border border-sidebar-border/70">
                            {tableLoading && (
                                <div className="absolute inset-0 z-10 rounded bg-white/70 backdrop-blur-sm dark:bg-sidebar/70">
                                    <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                        <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-3 font-medium">Name</th>
                                                <th className="px-4 py-3 font-medium">Email</th>
                                                <th className="px-4 py-3 font-medium">Roles</th>
                                                <th className="px-4 py-3 font-medium">Adviser</th>
                                                <th className="px-4 py-3 font-medium">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                            {Array.from({ length: Number(perPage) || 10 }).map((_, i) => (
                                                <tr key={i} className="skeleton-glint">
                                                    <td className="px-4 py-3"><div className="h-4 w-32 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 w-44 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 w-16 rounded bg-muted" /></td>
                                                    <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-muted" /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Email
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Roles
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Adviser
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {displayUsers.map((user) => (
                                        <tr
                                            key={user.uuid}
                                            className="hover:bg-sidebar-accent/40"
                                        >
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {user.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {(
                                                    rolesMap[user.uuid] || []
                                                ).join(', ') || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {user.is_adviser
                                                    ? `Yes${user.adviser_section ? ` · ${user.adviser_section}` : ''}`
                                                    : 'No'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <EditUserModal
                                                    user={{
                                                        ...user,
                                                        roles:
                                                            rolesMap[
                                                                user.uuid
                                                            ] || [],
                                                    }}
                                                    roles={roleOptions}
                                                    sections={
                                                        props.sections || []
                                                    }
                                                    takenAdviserSections={
                                                        takenAdviserSections
                                                    }
                                                />
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="ml-3 text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4" />{' '}
                                                            Delete
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            Delete user
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
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
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {lastPage > 1 && (
                            <div className="mt-4 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">
                                    Page {currentPage} of {lastPage} ({totalUsers} total)
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage <= 1}
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Previous
                                    </button>
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
                </div>
            </PortalPageShell>
        </>
    );
}
