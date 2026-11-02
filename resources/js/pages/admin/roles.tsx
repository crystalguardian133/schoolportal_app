import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    KeyRound,
    Layers,
    Lock,
    Pencil,
    Plus,
    RotateCcw,
    Search,
    ShieldCheck,
    Trash2,
    X,
} from 'lucide-react';
import { createElement, useMemo, useState } from 'react';
import IconPicker from '@/components/icon-picker';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getLucideIcon } from '@/lib/lucide-icon-map';

type RoleRow = {
    id: string;
    name: string;
    icon: string | null;
    permissions: string[];
};

type PermissionRow = {
    id: string;
    name: string;
};

const PROTECTED_ROLE_NAMES = [
    'admin',
    'administrator',
    'principal',
    'registrar',
    'student',
    'staff',
    'teacher',
];

const PERMISSION_GROUPS: { key: string; label: string }[] = [
    { key: 'access', label: 'Access & Dashboards' },
    { key: 'manage', label: 'Management' },
    { key: 'view', label: 'Viewing' },
    { key: 'edit', label: 'Editing' },
    { key: 'assign', label: 'Assignments' },
    { key: 'create', label: 'Creation' },
    { key: 'bypass', label: 'Overrides' },
    { key: 'other', label: 'Other' },
];

function isProtectedRole(name: string): boolean {
    return PROTECTED_ROLE_NAMES.includes(name.trim().toLowerCase());
}

function permissionGroupKey(name: string): string {
    const first = name.trim().split(/\s+/)[0]?.toLowerCase() ?? '';

    return PERMISSION_GROUPS.some((g) => g.key === first) ? first : 'other';
}

function RoleGlyph({
    name,
    className,
}: {
    name: string | null;
    className?: string;
}) {
    const Icon = (name && getLucideIcon(name)) || ShieldCheck;

    return createElement(Icon, { className });
}

function sameIds(a: string[], b: string[]): boolean {
    if (a.length !== b.length) {
        return false;
    }

    const left = [...a].sort();
    const right = [...b].sort();

    return left.every((id, i) => id === right[i]);
}

export default function AdminRoles() {
    const { props } = usePage<any>();
    const roles: RoleRow[] = useMemo(() => props.roles || [], [props.roles]);
    const permissions: PermissionRow[] = useMemo(
        () => props.permissions || [],
        [props.permissions],
    );
    const hasAccessAdmin: boolean = props.hasAccessAdmin || false;
    const flash = props.flash as
        | { success?: string; error?: string }
        | undefined;
    const errors = (props.errors ?? {}) as Record<string, string>;

    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [roleSearch, setRoleSearch] = useState('');

    const [createOpen, setCreateOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleIcon, setNewRoleIcon] = useState('');
    const [creating, setCreating] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);
    const [deleting, setDeleting] = useState(false);

    const selectedRole =
        roles.find((role) => role.id === selectedRoleId) ?? roles[0] ?? null;

    const filteredRoles = useMemo(() => {
        const q = roleSearch.trim().toLowerCase();

        if (!q) {
            return roles;
        }

        return roles.filter((role) => role.name.toLowerCase().includes(q));
    }, [roles, roleSearch]);

    const stats = useMemo(() => {
        const protectedCount = roles.filter((r) =>
            isProtectedRole(r.name),
        ).length;
        const assigned = roles.reduce(
            (sum, role) => sum + role.permissions.length,
            0,
        );

        return {
            total: roles.length,
            permissions: permissions.length,
            assigned,
            protected: protectedCount,
        };
    }, [roles, permissions]);

    function createRole(e: React.FormEvent) {
        e.preventDefault();

        if (!newRoleName.trim()) {
            return;
        }

        setCreating(true);

        router.post(
            '/admin/roles',
            { name: newRoleName, icon: newRoleIcon || null },
            {
                onFinish: () => setCreating(false),
                onSuccess: () => {
                    setNewRoleName('');
                    setNewRoleIcon('');
                    setCreateOpen(false);
                    router.reload();
                },
            },
        );
    }

    function deleteRole() {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        router.delete(`/admin/roles/${deleteTarget.id}`, {
            onFinish: () => setDeleting(false),
            onSuccess: () => {
                setDeleteTarget(null);
                setSelectedRoleId('');
                router.reload();
            },
        });
    }

    return (
        <>
            <Head title="Roles & permissions" />
            <PortalPageShell
                title="Roles & Permissions"
                description="Define what each role can do across the portal."
            >
                <PageLoader skeleton="list">
                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="/admin/users"
                            className="inline-flex items-center gap-2 rounded-xl border border-sidebar-border/70 bg-white px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent dark:border-sidebar-border dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/80"
                        >
                            <RotateCcw className="size-4" />
                            Back to users
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                            <X className="mt-0.5 size-4 shrink-0" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <StatCard
                            icon={
                                <ShieldCheck className="size-5 text-sky-600 dark:text-sky-400" />
                            }
                            label="Roles"
                            value={stats.total}
                            tone="bg-sky-100 dark:bg-sky-900/30"
                        />
                        <StatCard
                            icon={
                                <KeyRound className="size-5 text-indigo-600 dark:text-indigo-400" />
                            }
                            label="Permissions"
                            value={stats.permissions}
                            tone="bg-indigo-100 dark:bg-indigo-900/30"
                        />
                        <StatCard
                            icon={
                                <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                            }
                            label="Assigned"
                            value={stats.assigned}
                            tone="bg-emerald-100 dark:bg-emerald-900/30"
                        />
                        <StatCard
                            icon={
                                <Lock className="size-5 text-amber-600 dark:text-amber-400" />
                            }
                            label="Protected"
                            value={stats.protected}
                            tone="bg-amber-100 dark:bg-amber-900/30"
                        />
                    </div>

                    <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
                        {/* Role list */}
                        <div className="flex flex-col rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-sm font-semibold text-foreground">
                                        Roles
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        {filteredRoles.length} of {roles.length}{' '}
                                        shown
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => setCreateOpen(true)}
                                >
                                    <Plus className="size-4" />
                                    New
                                </Button>
                            </div>

                            <div className="relative mb-3">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={roleSearch}
                                    onChange={(e) =>
                                        setRoleSearch(e.target.value)
                                    }
                                    placeholder="Search roles..."
                                    className="w-full rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                />
                            </div>

                            <div className="max-h-[28rem] space-y-1.5 overflow-y-auto pr-1">
                                {filteredRoles.length === 0 ? (
                                    <p className="rounded-xl border border-dashed border-sidebar-border/70 px-3 py-6 text-center text-xs text-muted-foreground dark:border-sidebar-border">
                                        No roles match your search.
                                    </p>
                                ) : (
                                    filteredRoles.map((role) => {
                                        const isSelected =
                                            selectedRole?.id === role.id;
                                        const protectedRole =
                                            isProtectedRole(role.name);

                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedRoleId(role.id)
                                                }
                                                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                                                    isSelected
                                                        ? 'border-sky-500 bg-sky-50 text-sky-700 dark:border-sky-400 dark:bg-sky-500/15 dark:text-sky-200'
                                                        : 'border-sidebar-border/70 bg-white text-foreground hover:bg-sidebar/50 dark:border-sidebar-border/70 dark:bg-sidebar/90 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/60'
                                                }`}
                                            >
                                                <span
                                                    className={`inline-flex size-8 shrink-0 items-center justify-center rounded-lg ${
                                                        isSelected
                                                            ? 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300'
                                                            : 'bg-sidebar text-muted-foreground'
                                                    }`}
                                                >
                                                    <RoleGlyph
                                                        name={role.icon}
                                                        className="size-4"
                                                    />
                                                </span>
                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center gap-1.5">
                                                        <span className="truncate font-medium">
                                                            {role.name}
                                                        </span>
                                                        {protectedRole && (
                                                            <Lock className="size-3 shrink-0 text-amber-500" />
                                                        )}
                                                    </span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {role.permissions.length}{' '}
                                                        permission
                                                        {role.permissions.length ===
                                                        1
                                                            ? ''
                                                            : 's'}
                                                    </span>
                                                </span>
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Role editor */}
                        {selectedRole ? (
                            <RoleEditor
                                key={selectedRole.id}
                                role={selectedRole}
                                permissions={permissions}
                                hasAccessAdmin={hasAccessAdmin}
                                onDelete={() => setDeleteTarget(selectedRole)}
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                                <ShieldCheck className="size-10 text-muted-foreground/50" />
                                <p className="mt-3 text-sm font-medium text-foreground">
                                    No roles available
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Create a role to start assigning
                                    permissions.
                                </p>
                            </div>
                        )}
                    </div>
                </PageLoader>
            </PortalPageShell>

            {/* Create Role Dialog */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                <Plus className="size-4" />
                            </span>
                            Create Role
                        </DialogTitle>
                        <DialogDescription>
                            Add a new role. You can assign permissions to it
                            right after.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={createRole} className="space-y-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="new-role-name" className="text-xs">
                                Role name *
                            </Label>
                            <Input
                                id="new-role-name"
                                value={newRoleName}
                                onChange={(e) =>
                                    setNewRoleName(e.target.value)
                                }
                                placeholder="e.g. counselor"
                                aria-invalid={!!errors.name}
                            />
                            {errors.name && (
                                <p className="text-xs text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-1.5">
                            <Label className="text-xs">Icon</Label>
                            <IconPicker
                                value={newRoleIcon}
                                onChange={setNewRoleIcon}
                            />
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={creating || !newRoleName.trim()}
                            >
                                <Plus className="size-4" />
                                {creating ? 'Creating…' : 'Create Role'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Role Dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <span className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                <Trash2 className="size-4" />
                            </span>
                            Delete Role
                        </DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete{' '}
                            <strong>{deleteTarget?.name}</strong>? Users with
                            this role will lose all of its permissions. This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={deleteRole}
                            disabled={deleting}
                        >
                            <Trash2 className="size-4" />
                            {deleting ? 'Deleting…' : 'Delete Role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function RoleEditor({
    role,
    permissions,
    hasAccessAdmin,
    onDelete,
}: {
    role: RoleRow;
    permissions: PermissionRow[];
    hasAccessAdmin: boolean;
    onDelete: () => void;
}) {
    const [roleName, setRoleName] = useState(role.name);
    const [icon, setIcon] = useState(role.icon || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        role.permissions,
    );
    const [permissionSearch, setPermissionSearch] = useState('');
    const [saving, setSaving] = useState(false);

    const protectedRole = isProtectedRole(role.name);
    const canDelete = !protectedRole || hasAccessAdmin;

    const filteredPermissions = useMemo(() => {
        const q = permissionSearch.trim().toLowerCase();

        if (!q) {
            return permissions;
        }

        return permissions.filter((p) =>
            p.name.toLowerCase().includes(q),
        );
    }, [permissions, permissionSearch]);

    const grouped = useMemo(() => {
        const buckets = new Map<string, PermissionRow[]>();

        for (const permission of filteredPermissions) {
            const key = permissionGroupKey(permission.name);

            if (!buckets.has(key)) {
                buckets.set(key, []);
            }

            buckets.get(key)!.push(permission);
        }

        return PERMISSION_GROUPS.filter((g) => buckets.has(g.key)).map((g) => ({
            ...g,
            items: buckets.get(g.key)!,
        }));
    }, [filteredPermissions]);

    const dirty =
        roleName !== role.name ||
        icon !== (role.icon || '') ||
        !sameIds(selectedPermissions, role.permissions);

    const allVisibleSelected =
        filteredPermissions.length > 0 &&
        filteredPermissions.every((p) =>
            selectedPermissions.includes(p.id),
        );

    function togglePermission(id: string) {
        setSelectedPermissions((current) =>
            current.includes(id)
                ? current.filter((x) => x !== id)
                : [...current, id],
        );
    }

    function toggleAllVisible(checked: boolean) {
        const visibleIds = filteredPermissions.map((p) => p.id);

        setSelectedPermissions((current) =>
            checked
                ? Array.from(new Set([...current, ...visibleIds]))
                : current.filter((id) => !visibleIds.includes(id)),
        );
    }

    function resetChanges() {
        setRoleName(role.name);
        setIcon(role.icon || '');
        setSelectedPermissions(role.permissions);
    }

    function saveRole(e: React.FormEvent) {
        e.preventDefault();

        setSaving(true);

        router.patch(
            `/admin/roles/${role.id}`,
            {
                name: roleName,
                icon: icon || null,
                permissions: selectedPermissions,
            },
            {
                onFinish: () => setSaving(false),
                onSuccess: () => router.reload(),
            },
        );
    }

    return (
        <form
            onSubmit={saveRole}
            className="flex flex-col rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
        >
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                    <span className="inline-flex size-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                        <RoleGlyph name={role.icon} className="size-5" />
                    </span>
                    <div>
                        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                            Edit Role
                            {protectedRole && (
                                <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                    <Lock className="size-3" />
                                    Protected
                                </Badge>
                            )}
                        </h2>
                        <p className="text-xs text-muted-foreground">
                            {selectedPermissions.length} of {permissions.length}{' '}
                            permissions enabled
                        </p>
                    </div>
                </div>
                {dirty && (
                    <Badge className="border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Unsaved changes
                    </Badge>
                )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                    <Label htmlFor="role-name" className="text-xs">
                        Role name *
                    </Label>
                    <Input
                        id="role-name"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="Role name"
                    />
                </div>
                <div className="grid gap-1.5">
                    <Label className="text-xs">Icon</Label>
                    <IconPicker value={icon} onChange={setIcon} />
                </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-foreground">
                            Permissions
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            Tick everything this role should be allowed to do.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                value={permissionSearch}
                                onChange={(e) =>
                                    setPermissionSearch(e.target.value)
                                }
                                placeholder="Filter permissions..."
                                className="w-full rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 sm:w-56 dark:bg-sidebar"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleAllVisible(!allVisibleSelected)}
                            disabled={filteredPermissions.length === 0}
                        >
                            <Layers className="size-3.5" />
                            {allVisibleSelected ? 'Clear all' : 'Select all'}
                        </Button>
                    </div>
                </div>

                <div className="max-h-96 space-y-4 overflow-y-auto rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3 dark:border-sidebar-border dark:bg-sidebar/30">
                    {grouped.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">
                            No permissions match your filter.
                        </p>
                    ) : (
                        grouped.map((group) => (
                            <div key={group.key}>
                                <p className="mb-2 text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                    {group.label}
                                </p>
                                <div className="grid gap-1.5 sm:grid-cols-2">
                                    {group.items.map((permission) => {
                                        const checked =
                                            selectedPermissions.includes(
                                                permission.id,
                                            );

                                        return (
                                            <label
                                                key={permission.id}
                                                className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2 text-sm transition-colors ${
                                                    checked
                                                        ? 'border-sky-300 bg-sky-50 text-sky-800 dark:border-sky-700 dark:bg-sky-500/10 dark:text-sky-200'
                                                        : 'border-sidebar-border/70 bg-white text-foreground hover:bg-sidebar/60 dark:border-sidebar-border/70 dark:bg-sidebar/80 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/50'
                                                }`}
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        togglePermission(
                                                            permission.id,
                                                        )
                                                    }
                                                />
                                                <span className="truncate">
                                                    {permission.name}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                <div className="flex items-center gap-2">
                    {canDelete ? (
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={onDelete}
                        >
                            <Trash2 className="size-4" />
                            Delete Role
                        </Button>
                    ) : (
                        <p className="text-xs text-muted-foreground">
                            <Lock className="mr-1 inline size-3" />
                            This role is protected and cannot be deleted.
                        </p>
                    )}
                    {dirty && (
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={resetChanges}
                        >
                            <RotateCcw className="size-4" />
                            Reset
                        </Button>
                    )}
                </div>

                <Button
                    type="submit"
                    disabled={saving || !dirty || !roleName.trim()}
                >
                    <Pencil className="size-4" />
                    {saving ? 'Saving…' : 'Save Role'}
                </Button>
            </div>
        </form>
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
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${tone}`}>{icon}</div>
                <div className="min-w-0">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="truncate text-xs text-muted-foreground">
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}
