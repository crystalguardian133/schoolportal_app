import { Head, router, usePage, Link } from '@inertiajs/react';
import { Trash2, ShieldCheck } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import IconPicker from '@/components/icon-picker';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ className?: string }>>>();

function resolveIcon(name: string | null): React.ComponentType<{ className?: string }> | null {
    if (!name) {
return null;
}

    if (!iconCache.has(name)) {
        iconCache.set(
            name,
            lazy(() =>
                import('lucide-react').then((mod) => ({
                    default: (mod as Record<string, unknown>)[name] as React.ComponentType<{ className?: string }>,
                })),
            ),
        );
    }

    return iconCache.get(name)!;
}

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

const protectedRoles = [
    'admin',
    'principal',
    'registrar',
    'student',
    'staff',
    'teacher',
];

export default function AdminRoles() {
    const { props } = usePage<any>();
    const roles: RoleRow[] = props.roles || [];
    const permissions: PermissionRow[] = props.permissions || [];
    const hasAccessAdmin: boolean = props.hasAccessAdmin || false;

    /* ── Role editor state ── */
    const [selectedRoleId, setSelectedRoleId] = useState<string>(
        roles[0]?.id || '',
    );
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleIcon, setNewRoleIcon] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedRole =
        roles.find((role) => role.id === selectedRoleId) || roles[0] || null;
    const isProtected =
        selectedRole &&
        protectedRoles.includes(selectedRole.name) &&
        !hasAccessAdmin;
    const [roleName, setRoleName] = useState(selectedRole?.name || '');
    const [selectedIcon, setSelectedIcon] = useState(selectedRole?.icon || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        selectedRole?.permissions || [],
    );

    useEffect(() => {
        setRoleName(selectedRole?.name || '');
        setSelectedIcon(selectedRole?.icon || '');
        setSelectedPermissions(selectedRole?.permissions || []);
    }, [selectedRole?.id]);

    /* ── Role CRUD ── */
    function saveRole(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedRole) {
return;
}

        setSaving(true);
        router.patch(
            `/admin/roles/${selectedRole.id}`,
            { name: roleName, icon: selectedIcon || null, permissions: selectedPermissions },
            {
                onFinish: () => setSaving(false),
                onSuccess: () => router.reload(),
            },
        );
    }

    function createRole(e: React.FormEvent) {
        e.preventDefault();

        if (!newRoleName.trim()) {
return;
}

        setSaving(true);
        router.post(
            '/admin/roles',
            { name: newRoleName, icon: newRoleIcon || null },
            {
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    setNewRoleName('');
                    setNewRoleIcon('');
                    router.reload();
                },
            },
        );
    }

    function deleteRole() {
        if (!selectedRole || isProtected) {
return;
}

        setDeleting(true);
        router.delete(`/admin/roles/${selectedRole.id}`, {
            onFinish: () => setDeleting(true),
            onSuccess: () => {
                setConfirmDelete(false);
                router.reload();
            },
        });
    }

    return (
        <>
            <Head title="Roles & permissions" />
            <PortalPageShell
                title="Roles & permissions"
                description="Manage roles and their permissions."
            >
                <PageLoader skeleton="list">
                <div className="mb-4 flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center rounded-full border border-sidebar-border/70 bg-sidebar px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/80"
                    >
                        Back to users
                    </Link>
                </div>

                {/* ═══════════════════════════════════════════
                    SECTION 1: Role CRUD
                ═══════════════════════════════════════════ */}
                <div className="grid gap-4 lg:grid-cols-3">
                    <form
                        onSubmit={createRole}
                        className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-colors dark:border-sidebar-border dark:bg-sidebar dark:shadow-none"
                    >
                        <div className="mb-3 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                            Create Role
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                Role name
                            </Label>
                            <Input
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="e.g. counselor"
                            />
                            <Label className="mt-1 text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                Icon
                            </Label>
                            <IconPicker
                                value={newRoleIcon}
                                onChange={setNewRoleIcon}
                            />
                            <Button
                                type="submit"
                                disabled={saving || !newRoleName.trim()}
                            >
                                Create Role
                            </Button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-colors lg:col-span-2 dark:border-sidebar-border dark:bg-sidebar dark:shadow-none">
                        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div>
                                <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                    Roles
                                </div>
                                <div className="space-y-2">
                                    <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-9 animate-pulse rounded-xl bg-muted" />)}</div>}>
                                    {roles.map((role) => {
                                        const RoleIcon = resolveIcon(role.icon) || ShieldCheck;

                                        return (
                                            <button
                                                key={role.id}
                                                type="button"
                                                onClick={() =>
                                                    setSelectedRoleId(role.id)
                                                }
                                                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition ${selectedRole?.id === role.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200' : 'border-sidebar-border/70 bg-white text-foreground hover:bg-sidebar/50 dark:border-sidebar-border/70 dark:bg-sidebar/90 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/60'}`}
                                            >
                                                <RoleIcon className="size-4 shrink-0 opacity-60" />
                                                {role.name}
                                            </button>
                                        );
                                    })}
                                    </Suspense>
                                </div>
                            </div>

                            <form onSubmit={saveRole} className="space-y-4">
                                <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                        Edit Role
                                    </div>
                                    {selectedRole ? (
                                        <Input
                                            value={roleName}
                                            onChange={(e) =>
                                                setRoleName(e.target.value)
                                            }
                                        />
                                    ) : (
                                        <div className="text-sm text-muted-foreground dark:text-sidebar-foreground/70">
                                            No roles available.
                                        </div>
                                    )}
                                </div>

                                {selectedRole && (
                                    <div>
                                        <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                            Icon
                                        </div>
                                        <IconPicker
                                            value={selectedIcon}
                                            onChange={setSelectedIcon}
                                        />
                                    </div>
                                )}

                                <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                        Permissions
                                    </div>
                                    <div className="grid max-h-64 gap-2 overflow-y-auto rounded-xl border border-sidebar-border/70 p-2 sm:grid-cols-2 dark:border-sidebar-border">
                                        {permissions.map((permission) => {
                                            const checked =
                                                selectedPermissions.includes(
                                                    permission.id,
                                                );

                                            return (
                                                <label
                                                    key={permission.id}
                                                    className="flex items-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar/40 px-3 py-2 text-sm text-foreground transition-colors hover:bg-sidebar/60 dark:border-sidebar-border/70 dark:bg-sidebar/80 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/50"
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => {
                                                            setSelectedPermissions(
                                                                (current) =>
                                                                    current.includes(
                                                                        permission.id,
                                                                    )
                                                                        ? current.filter(
                                                                              (
                                                                                  id,
                                                                              ) =>
                                                                                  id !==
                                                                                  permission.id,
                                                                          )
                                                                        : [
                                                                              ...current,
                                                                              permission.id,
                                                                          ],
                                                            );
                                                        }}
                                                    />
                                                    <span>
                                                        {permission.name}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2">
                                    {!isProtected && selectedRole && (
                                        <>
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                onClick={() =>
                                                    setConfirmDelete(true)
                                                }
                                                disabled={deleting}
                                            >
                                                <Trash2 className="size-4" />
                                                Delete Role
                                            </Button>
                                            <ConfirmDialog
                                                open={confirmDelete}
                                                onOpenChange={setConfirmDelete}
                                                title="Delete Role"
                                                description={`Are you sure you want to delete "${selectedRole.name}"? This action cannot be undone.`}
                                                confirmLabel="Delete"
                                                onConfirm={deleteRole}
                                            />
                                        </>
                                    )}
                                    <Button
                                        type="submit"
                                        disabled={saving || !selectedRole}
                                    >
                                        Save Role
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                </PageLoader>
            </PortalPageShell>
        </>
    );
}
