import { Head, router, usePage, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type RoleRow = {
    id: string;
    name: string;
    permissions: string[];
};

type PermissionRow = {
    id: string;
    name: string;
};

export default function AdminRoles() {
    const { props } = usePage();
    const roles: RoleRow[] = props.roles || [];
    const permissions: PermissionRow[] = props.permissions || [];
    const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || '');
    const [newRoleName, setNewRoleName] = useState('');
    const [saving, setSaving] = useState(false);

    const selectedRole = roles.find((role) => role.id === selectedRoleId) || roles[0] || null;
    const [roleName, setRoleName] = useState(selectedRole?.name || '');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>(selectedRole?.permissions || []);

    useEffect(() => {
        setRoleName(selectedRole?.name || '');
        setSelectedPermissions(selectedRole?.permissions || []);
    }, [selectedRole?.id]);

    function saveRole(e: React.FormEvent) {
        e.preventDefault();

        if (!selectedRole) {
return;
}

        setSaving(true);
        router.patch(`/admin/roles/${selectedRole.id}`, {
            name: roleName,
            permissions: selectedPermissions,
        }, {
            onFinish: () => setSaving(false),
            onSuccess: () => router.reload(),
        });
    }

    function createRole(e: React.FormEvent) {
        e.preventDefault();

        if (!newRoleName.trim()) {
return;
}

        setSaving(true);
        router.post('/admin/roles', { name: newRoleName }, {
            onFinish: () => setSaving(false),
            onSuccess: () => {
                setNewRoleName('');
                router.reload();
            },
        });
    }

    return (
        <>
            <Head title="Roles & permissions" />
            <PortalPageShell title="Roles & permissions" description="Edit role names and the permissions attached to each role.">
                <div className="mb-4 flex items-center gap-3">
                    <Link
                        href="/admin/users"
                        className="inline-flex items-center rounded-full border border-sidebar-border/70 bg-sidebar px-4 py-2 text-sm font-medium text-foreground shadow-sm transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground dark:bg-sidebar dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/80"
                    >
                        Back to users
                    </Link>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                    <form onSubmit={createRole} className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-colors dark:border-sidebar-border dark:bg-sidebar dark:shadow-none">
                        <div className="mb-3 text-sm font-semibold text-foreground dark:text-sidebar-foreground">Create Role</div>
                        <div className="grid gap-2">
                            <Label className="text-xs text-muted-foreground dark:text-sidebar-foreground/80">Role name</Label>
                            <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="e.g. counselor" />
                            <Button type="submit" disabled={saving || !newRoleName.trim()}>Create Role</Button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition-colors dark:border-sidebar-border dark:bg-sidebar dark:shadow-none lg:col-span-2">
                        <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                            <div>
                                <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">Roles</div>
                                <div className="space-y-2">
                                    {roles.map((role) => (
                                        <button
                                            key={role.id}
                                            type="button"
                                            onClick={() => setSelectedRoleId(role.id)}
                                            className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${selectedRole?.id === role.id ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/15 dark:text-indigo-200' : 'border-sidebar-border/70 bg-white text-foreground hover:bg-sidebar/50 dark:border-sidebar-border/70 dark:bg-sidebar/90 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/60'}`}
                                        >
                                            {role.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={saveRole} className="space-y-4">
                                <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">Edit Role</div>
                                    {selectedRole ? (
                                        <Input
                                            value={roleName}
                                            onChange={(e) => setRoleName(e.target.value)}
                                        />
                                    ) : (
                                        <div className="text-sm text-muted-foreground dark:text-sidebar-foreground/70">No roles available.</div>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 text-sm font-semibold text-foreground dark:text-sidebar-foreground">Permissions</div>
                                    <div className="grid gap-2 sm:grid-cols-2">
                                        {permissions.map((permission) => {
                                            const checked = selectedPermissions.includes(permission.id);

                                            return (
                                                <label key={permission.id} className="flex items-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar/40 px-3 py-2 text-sm text-foreground transition-colors hover:bg-sidebar/60 dark:border-sidebar-border/70 dark:bg-sidebar/80 dark:text-sidebar-foreground dark:hover:bg-sidebar-accent/50">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => {
                                                            setSelectedPermissions((current) =>
                                                                current.includes(permission.id)
                                                                    ? current.filter((id) => id !== permission.id)
                                                                    : [...current, permission.id],
                                                            );
                                                        }}
                                                    />
                                                    <span>{permission.name}</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit" disabled={saving || !selectedRole}>Save Role</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
