import { router } from '@inertiajs/react';
import { Pencil, Plus, ShieldCheck, ShieldOff, X } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/dates';
import { getLucideIcon } from '@/lib/lucide-icon-map';

type RoleAssignment = {
    id?: string;
    name: string;
    icon?: string | null;
    expires_at?: string | null;
};

type RoleOption = {
    id: string;
    name: string;
    icon?: string | null;
};

type Props = {
    user: { uuid: string; name: string };
    roles: RoleAssignment[];
    roleOptions: RoleOption[];
};

const ROLE_BADGE_CLASSES: Record<string, string> = {
    admin: 'border-transparent bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300',
    principal: 'border-transparent bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
    registrar: 'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    teacher: 'border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300',
    student: 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
};

function roleBadgeClass(role: string, expired: boolean, expiringSoon: boolean): string {
    if (expired) {
        return 'border-transparent bg-muted text-muted-foreground opacity-60 dark:bg-muted/50';
    }

    if (expiringSoon) {
        return 'border border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300';
    }

    const r = role.toLowerCase();

    for (const [key, value] of Object.entries(ROLE_BADGE_CLASSES)) {
        if (r.includes(key)) {
            return value;
        }
    }

    return 'border-transparent bg-muted text-muted-foreground dark:bg-muted/50';
}

function resolveIcon(
    name: string | null | undefined,
): React.ComponentType<{ className?: string }> | null {
    if (!name) {
        return null;
    }

    return getLucideIcon(name) ?? null;
}

function isExpired(dateStr: string | null | undefined): boolean {
    if (!dateStr) {
        return false;
    }

    return new Date(dateStr) < new Date();
}

function isExpiringSoon(dateStr: string | null | undefined): boolean {
    if (!dateStr) {
        return false;
    }

    const diff = new Date(dateStr).getTime() - Date.now();

    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
}

function toDateInputValue(dateStr: string | null | undefined): string {
    if (!dateStr) {
        return '';
    }

    const d = new Date(dateStr);

    return Number.isNaN(d.getTime()) ? '' : d.toISOString().split('T')[0];
}

export default function UserRoleCell({ user, roles, roleOptions }: Props) {
    const [assignOpen, setAssignOpen] = useState(false);
    const [assignRoleId, setAssignRoleId] = useState('');
    const [assignExpiresAt, setAssignExpiresAt] = useState('');
    const [assigning, setAssigning] = useState(false);

    const [removeTarget, setRemoveTarget] = useState<{
        roleId: string;
        roleName: string;
    } | null>(null);
    const [confirmRemove, setConfirmRemove] = useState(false);

    const [editingExpiry, setEditingExpiry] = useState<{
        roleId: string;
        roleName: string;
        currentExpiry: string | null;
    } | null>(null);
    const [editExpiryValue, setEditExpiryValue] = useState('');
    const [savingExpiry, setSavingExpiry] = useState(false);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function reload() {
        router.reload();
    }

    function openAssign() {
        setAssignRoleId('');
        setAssignExpiresAt('');
        setAssignOpen(true);
    }

    function assignRole() {
        if (!assignRoleId) {
            return;
        }

        setAssigning(true);
        router.post(
            '/admin/roles/assign-user-role',
            {
                user_uuid: user.uuid,
                role_uuid: assignRoleId,
                expires_at: assignExpiresAt || null,
            },
            {
                onFinish: () => setAssigning(false),
                onSuccess: () => {
                    setAssignOpen(false);
                    reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];

                    if (firstError) {
                        showToast(firstError as string, 'error');
                    }
                },
            },
        );
    }

    function openRemove(roleId: string, roleName: string) {
        setRemoveTarget({ roleId, roleName });
        setConfirmRemove(true);
    }

    function removeRole() {
        if (!removeTarget) {
            return;
        }

        router.post(
            '/admin/roles/remove-user-role',
            {
                user_uuid: user.uuid,
                role_uuid: removeTarget.roleId,
            },
            {
                onSuccess: () => {
                    setConfirmRemove(false);
                    setRemoveTarget(null);
                    reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];

                    if (firstError) {
                        showToast(firstError as string, 'error');
                    }
                },
            },
        );
    }

    function openEditExpiry(
        roleId: string,
        roleName: string,
        currentExpiry: string | null,
    ) {
        setEditingExpiry({ roleId, roleName, currentExpiry });
        setEditExpiryValue(toDateInputValue(currentExpiry));
    }

    function saveExpiry() {
        if (!editingExpiry) {
            return;
        }

        setSavingExpiry(true);
        router.post(
            '/admin/roles/update-user-role-expiry',
            {
                user_uuid: user.uuid,
                role_uuid: editingExpiry.roleId,
                expires_at: editExpiryValue || null,
            },
            {
                onFinish: () => setSavingExpiry(false),
                onSuccess: () => {
                    setEditingExpiry(null);
                    reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];

                    if (firstError) {
                        showToast(firstError as string, 'error');
                    }
                },
            },
        );
    }

    const assignableRoles = roleOptions.filter(
        (option) => !roles.some((role) => role.id === option.id),
    );
    const today = new Date().toISOString().split('T')[0];

    return (
        <>
            <div className="flex flex-wrap gap-1.5">
                {roles.length === 0 && (
                    <span className="text-xs italic text-muted-foreground">
                        No roles
                    </span>
                )}
                {roles.map((role) => {
                    const expired = isExpired(role.expires_at);
                    const expiringSoon = isExpiringSoon(role.expires_at);
                    const RoleIcon = expired
                        ? ShieldOff
                        : resolveIcon(role.icon) || ShieldCheck;

                    return (
                        <div
                            key={role.id ?? role.name}
                            className="group/role inline-flex items-center gap-1"
                        >
                            <Badge
                                className={roleBadgeClass(
                                    role.name,
                                    expired,
                                    expiringSoon,
                                )}
                            >
                                <RoleIcon className="size-3" />
                                {role.name}
                                {role.expires_at && (
                                    <span className="opacity-70">
                                        · {formatDate(role.expires_at)}
                                    </span>
                                )}
                            </Badge>
                            <button
                                type="button"
                                onClick={() =>
                                    openEditExpiry(
                                        role.id || role.name,
                                        role.name,
                                        role.expires_at ?? null,
                                    )
                                }
                                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-foreground group-hover/role:opacity-100"
                                title="Edit expiry"
                            >
                                <Pencil className="size-3" />
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    openRemove(role.id || role.name, role.name)
                                }
                                className="rounded p-0.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive group-hover/role:opacity-100"
                                title="Remove role"
                            >
                                <X className="size-3" />
                            </button>
                        </div>
                    );
                })}
                <button
                    type="button"
                    onClick={openAssign}
                    className="inline-flex items-center gap-1 rounded-md border border-dashed border-sidebar-border/70 px-2 py-1 text-xs font-medium text-muted-foreground transition hover:border-sidebar-border hover:bg-sidebar-accent/40 hover:text-foreground"
                >
                    <Plus className="size-3" />
                    Role
                </button>
            </div>

            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogTitle>Assign role</DialogTitle>
                    <DialogDescription>
                        Assign a role to <strong>{user.name}</strong>. Set an
                        expiry date to make it temporary, or leave blank for a
                        permanent role.
                    </DialogDescription>

                    <div className="mt-4 grid gap-4">
                        <div className="grid gap-2">
                            <Label className="text-xs">Role</Label>
                            <select
                                value={assignRoleId}
                                onChange={(e) =>
                                    setAssignRoleId(e.target.value)
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            >
                                <option value="">
                                    {assignableRoles.length > 0
                                        ? 'Select a role…'
                                        : 'All roles already assigned'}
                                </option>
                                {assignableRoles.map((option) => (
                                    <option
                                        key={option.id}
                                        value={option.id}
                                    >
                                        {option.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid gap-2">
                            <Label className="text-xs">
                                Expiry date (optional)
                            </Label>
                            <Input
                                type="date"
                                value={assignExpiresAt}
                                onChange={(e) =>
                                    setAssignExpiresAt(e.target.value)
                                }
                                min={today}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button variant="secondary" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            onClick={assignRole}
                            disabled={assigning || !assignRoleId}
                        >
                            {assigning ? 'Assigning…' : 'Assign role'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editingExpiry && (
                <Dialog
                    open
                    onOpenChange={(open) => {
                        if (!open) {
                            setEditingExpiry(null);
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-sm">
                        <DialogTitle>Edit role expiry</DialogTitle>
                        <DialogDescription>
                            Update the expiry for{' '}
                            <strong>{editingExpiry.roleName}</strong> on{' '}
                            <strong>{user.name}</strong>. Leave blank for a
                            permanent role.
                        </DialogDescription>

                        <div className="mt-4 grid gap-2">
                            <Label className="text-xs">Expiry date</Label>
                            <Input
                                type="date"
                                value={editExpiryValue}
                                onChange={(e) =>
                                    setEditExpiryValue(e.target.value)
                                }
                            />
                        </div>

                        <DialogFooter className="gap-2">
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={saveExpiry}
                                disabled={savingExpiry}
                            >
                                {savingExpiry ? 'Saving…' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <ConfirmDialog
                open={confirmRemove}
                onOpenChange={setConfirmRemove}
                title="Remove role"
                description={`Remove "${removeTarget?.roleName}" from "${user.name}"?`}
                confirmLabel="Remove"
                onConfirm={removeRole}
            />
        </>
    );
}
