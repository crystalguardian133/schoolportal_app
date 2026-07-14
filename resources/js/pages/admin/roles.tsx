import { Head, router, usePage, Link } from '@inertiajs/react';
import { Trash2, Plus, Clock, ShieldCheck, ShieldOff, Pencil, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { PortalPageShell } from '@/components/portal-page-shell';
import SearchableSelect from '@/components/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/dates';

type RoleRow = {
    id: string;
    name: string;
    permissions: string[];
};

type PermissionRow = {
    id: string;
    name: string;
};

type UserRoleAssignment = {
    id: string;
    name: string;
    expires_at: string | null;
};

type UserRow = {
    uuid: string;
    name: string;
    email: string;
    roles: UserRoleAssignment[];
};

const protectedRoles = [
    'admin',
    'principal',
    'registrar',
    'student',
    'staff',
    'teacher',
];

function isExpired(dateStr: string | null): boolean {
    if (!dateStr) {
return false;
}

    return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string | null): boolean {
    if (!dateStr) {
return false;
}

    const d = new Date(dateStr);
    const now = new Date();
    const diff = d.getTime() - now.getTime();

    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function formatDateRole(dateStr: string | null): string {
    if (!dateStr) return 'Permanent';
    return formatDate(dateStr, 'MMM d, yyyy');
}

export default function AdminRoles() {
    const { props } = usePage();
    const roles: RoleRow[] = props.roles || [];
    const permissions: PermissionRow[] = props.permissions || [];
    const users: UserRow[] = props.users || [];
    const hasAccessAdmin: boolean = props.hasAccessAdmin || false;

    /* ── Role editor state ── */
    const [selectedRoleId, setSelectedRoleId] = useState<string>(
        roles[0]?.id || '',
    );
    const [deleting, setDeleting] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedRole =
        roles.find((role) => role.id === selectedRoleId) || roles[0] || null;
    const isProtected =
        selectedRole &&
        protectedRoles.includes(selectedRole.name) &&
        !hasAccessAdmin;
    const [roleName, setRoleName] = useState(selectedRole?.name || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
        selectedRole?.permissions || [],
    );

    useEffect(() => {
        setRoleName(selectedRole?.name || '');
        setSelectedPermissions(selectedRole?.permissions || []);
    }, [selectedRole?.id]);

    /* ── User role assignment state ── */
    const [userSearch, setUserSearch] = useState('');
    const [showAssignDialog, setShowAssignDialog] = useState(false);
    const [assignUserUuid, setAssignUserUuid] = useState('');
    const [assignRoleId, setAssignRoleId] = useState('');
    const [assignExpiresAt, setAssignExpiresAt] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [confirmRemove, setConfirmRemove] = useState(false);
    const [removeTarget, setRemoveTarget] = useState<{
        userUuid: string;
        roleId: string;
        roleName: string;
        userName: string;
    } | null>(null);
    const [removing, setRemoving] = useState(false);
    const [editingExpiry, setEditingExpiry] = useState<{
        userUuid: string;
        roleId: string;
        currentExpiry: string | null;
    } | null>(null);
    const [editExpiryValue, setEditExpiryValue] = useState('');
    const [savingExpiry, setSavingExpiry] = useState(false);

    const filteredUsers = users.filter(
        (u) =>
            u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
            u.email.toLowerCase().includes(userSearch.toLowerCase()),
    );

    /* ── Role CRUD ── */
    function saveRole(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedRole) {
return;
}

        setSaving(true);
        router.patch(
            `/admin/roles/${selectedRole.id}`,
            { name: roleName, permissions: selectedPermissions },
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
            { name: newRoleName },
            {
                onFinish: () => setSaving(false),
                onSuccess: () => {
                    setNewRoleName('');
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

    /* ── Assign role to user ── */
    function assignUserRole() {
        if (!assignUserUuid || !assignRoleId) {
return;
}

        setAssigning(true);
        router.post(
            '/admin/roles/assign-user-role',
            {
                user_uuid: assignUserUuid,
                role_uuid: assignRoleId,
                expires_at: assignExpiresAt || null,
            },
            {
                onFinish: () => setAssigning(false),
                onSuccess: () => {
                    setShowAssignDialog(false);
                    setAssignUserUuid('');
                    setAssignRoleId('');
                    setAssignExpiresAt('');
                    router.reload();
                },
            },
        );
    }

    /* ── Remove role from user ── */
    function removeUserRole() {
        if (!removeTarget) {
return;
}

        setRemoving(true);
        router.post(
            '/admin/roles/remove-user-role',
            {
                user_uuid: removeTarget.userUuid,
                role_uuid: removeTarget.roleId,
            },
            {
                onFinish: () => setRemoving(false),
                onSuccess: () => {
                    setConfirmRemove(false);
                    setRemoveTarget(null);
                    router.reload();
                },
            },
        );
    }

    /* ── Edit expiry ── */
    function saveExpiry() {
        if (!editingExpiry) {
return;
}

        setSavingExpiry(true);
        router.post(
            '/admin/roles/update-user-role-expiry',
            {
                user_uuid: editingExpiry.userUuid,
                role_uuid: editingExpiry.roleId,
                expires_at: editExpiryValue || null,
            },
            {
                onFinish: () => setSavingExpiry(false),
                onSuccess: () => {
                    setEditingExpiry(null);
                    router.reload();
                },
            },
        );
    }

    return (
        <>
            <Head title="Roles & permissions" />
            <PortalPageShell
                title="Roles & permissions"
                description="Manage roles, their permissions, and assign roles to users."
            >
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
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedRoleId(role.id)
                                            }
                                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedRole?.id === role.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200' : 'border-sidebar-border/70 bg-white text-foreground hover:bg-sidebar/50 dark:border-sidebar-border/70 dark:bg-sidebar/90 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/60'}`}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
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

                                <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                        Permissions
                                    </div>
                                    <div className="grid gap-2 sm:grid-cols-2">
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

                {/* ═══════════════════════════════════════════
                    SECTION 2: User Role Assignments
                ═══════════════════════════════════════════ */}
                <div className="mt-8 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-colors dark:border-sidebar-border dark:bg-sidebar dark:shadow-none">
                    <div className="mb-4 flex items-center justify-between">
                        <div>
                            <div className="text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                User Role Assignments
                            </div>
                            <div className="mt-0.5 text-xs text-muted-foreground dark:text-sidebar-foreground/70">
                                Assign multiple roles to users. Roles can be
                                permanent or temporary.
                            </div>
                        </div>
                        <Button
                            size="sm"
                            onClick={() => setShowAssignDialog(true)}
                        >
                            <Plus className="size-4" />
                            Assign Role
                        </Button>
                    </div>

                    {/* Search bar */}
                    <div className="mb-4">
                        <Input
                            placeholder="Search users by name or email..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                        />
                    </div>

                    {/* Users table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-sidebar-border/70 text-xs font-medium uppercase tracking-wider text-muted-foreground dark:text-sidebar-foreground/70">
                                    <th className="px-3 py-2">User</th>
                                    <th className="px-3 py-2">Assigned Roles</th>
                                    <th className="px-3 py-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={3}
                                            className="px-3 py-8 text-center text-sm text-muted-foreground"
                                        >
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                                {filteredUsers.map((user) => (
                                    <tr
                                        key={user.uuid}
                                        className="border-b border-sidebar-border/40 last:border-0"
                                    >
                                        <td className="px-3 py-2.5">
                                            <div className="font-medium text-foreground">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5">
                                            <div className="flex flex-wrap gap-1.5">
                                                {user.roles.length === 0 && (
                                                    <span className="text-xs italic text-muted-foreground">
                                                        No roles
                                                    </span>
                                                )}
                                                {user.roles.map((role) => {
                                                    const expired = isExpired(
                                                        role.expires_at,
                                                    );
                                                    const expiringSoon =
                                                        isExpiringSoon(
                                                            role.expires_at,
                                                        );

                                                    return (
                                                        <div
                                                            key={role.id}
                                                            className="group/role inline-flex items-center gap-1"
                                                        >
                                                            <Badge
                                                                variant={
                                                                    expired
                                                                        ? 'secondary'
                                                                        : expiringSoon
                                                                          ? 'outline'
                                                                          : 'default'
                                                                }
                                                                className={`gap-1 ${
                                                                    expired
                                                                        ? 'opacity-50'
                                                                        : expiringSoon
                                                                          ? 'border-amber-400 text-amber-700 dark:text-amber-300'
                                                                          : ''
                                                                }`}
                                                            >
                                                                {expired ? (
                                                                    <ShieldOff className="size-3" />
                                                                ) : (
                                                                    <ShieldCheck className="size-3" />
                                                                )}
                                                                {role.name}
                                                                {role.expires_at && (
                                                                    <span className="opacity-70">
                                                                        ·{' '}
                                                                        {formatDateRole(
                                                                            role.expires_at,
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </Badge>
                                                            {/* Edit expiry */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setEditingExpiry(
                                                                        {
                                                                            userUuid:
                                                                                user.uuid,
                                                                            roleId:
                                                                                role.id,
                                                                            currentExpiry:
                                                                                role.expires_at,
                                                                        },
                                                                    );
                                                                    setEditExpiryValue(
                                                                        role.expires_at
                                                                            ? new Date(
                                                                                  role.expires_at,
                                                                              )
                                                                                  .toISOString()
                                                                                  .split(
                                                                                      'T',
                                                                                  )[0]
                                                                            : '',
                                                                    );
                                                                }}
                                                                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover/role:opacity-100"
                                                                title="Edit expiry"
                                                            >
                                                                <Pencil className="size-3" />
                                                            </button>
                                                            {/* Remove */}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setRemoveTarget(
                                                                        {
                                                                            userUuid:
                                                                                user.uuid,
                                                                            roleId:
                                                                                role.id,
                                                                            roleName:
                                                                                role.name,
                                                                            userName:
                                                                                user.name,
                                                                        },
                                                                    );
                                                                    setConfirmRemove(
                                                                        true,
                                                                    );
                                                                }}
                                                                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover/role:opacity-100"
                                                                title="Remove role"
                                                            >
                                                                <X className="size-3" />
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2.5 text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setAssignUserUuid(
                                                        user.uuid,
                                                    );
                                                    setAssignRoleId('');
                                                    setAssignExpiresAt('');
                                                    setShowAssignDialog(true);
                                                }}
                                            >
                                                <Plus className="size-3" />
                                                Add Role
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ═══════════════════════════════════════════
                    DIALOGS
                ═══════════════════════════════════════════ */}

                {/* Assign Role Dialog */}
                {showAssignDialog && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="mx-4 w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-sidebar">
                            <div className="mb-4 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                Assign Role to User
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        User
                                    </Label>
                                    <SearchableSelect
                                        options={users.map((u) => ({
                                            value: u.uuid,
                                            label: u.name,
                                            sublabel: u.email,
                                        }))}
                                        value={assignUserUuid}
                                        onChange={setAssignUserUuid}
                                        placeholder="Select a user..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Role
                                    </Label>
                                    <SearchableSelect
                                        options={roles.map((r) => ({
                                            value: r.id,
                                            label: r.name,
                                        }))}
                                        value={assignRoleId}
                                        onChange={setAssignRoleId}
                                        placeholder="Select a role..."
                                    />
                                </div>

                                <div>
                                    <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                        Expiry date (optional — leave blank for
                                        permanent)
                                    </Label>
                                    <Input
                                        type="date"
                                        value={assignExpiresAt}
                                        onChange={(e) =>
                                            setAssignExpiresAt(e.target.value)
                                        }
                                        min={new Date()
                                            .toISOString()
                                            .split('T')[0]}
                                    />
                                </div>
                            </div>

                            <div className="mt-5 flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => {
                                        setShowAssignDialog(false);
                                        setAssignUserUuid('');
                                        setAssignRoleId('');
                                        setAssignExpiresAt('');
                                    }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={assignUserRole}
                                    disabled={
                                        assigning ||
                                        !assignUserUuid ||
                                        !assignRoleId
                                    }
                                >
                                    {assigning ? 'Assigning...' : 'Assign Role'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Remove Role Confirmation */}
                <ConfirmDialog
                    open={confirmRemove}
                    onOpenChange={setConfirmRemove}
                    title="Remove Role"
                    description={`Remove "${removeTarget?.roleName}" from "${removeTarget?.userName}"?`}
                    confirmLabel="Remove"
                    onConfirm={removeUserRole}
                />

                {/* Edit Expiry Dialog */}
                {editingExpiry && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                        <div className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-sidebar">
                            <div className="mb-4 text-sm font-semibold text-foreground dark:text-sidebar-foreground">
                                Edit Role Expiry
                            </div>
                            <div>
                                <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">
                                    Expiry date (blank = permanent)
                                </Label>
                                <Input
                                    type="date"
                                    value={editExpiryValue}
                                    onChange={(e) =>
                                        setEditExpiryValue(e.target.value)
                                    }
                                />
                            </div>
                            <div className="mt-5 flex justify-end gap-2">
                                <Button
                                    variant="secondary"
                                    onClick={() => setEditingExpiry(null)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={saveExpiry}
                                    disabled={savingExpiry}
                                >
                                    {savingExpiry ? 'Saving...' : 'Save'}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </PortalPageShell>
        </>
    );
}
