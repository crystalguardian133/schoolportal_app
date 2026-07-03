import { useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';

export default function EditUserModal({ user, roles, sections }: any) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: user.email || '',
        password: '',
        password_confirmation: '',
        role: (user.roles && user.roles[0]) || (roles && roles[0] && roles[0].name) || '',
        is_adviser: !!user.is_adviser,
        adviser_section: user.adviser_section || '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(new CustomEvent('local-toast', { detail: { message, type } }));
    }

    useEffect(() => {
        if (!open) {
            return;
        }

        const parts = (user.name || '').split(',');
        let first = '';
        let middle = '';
        let last = '';

        if (parts.length >= 1) {
            last = parts[0].trim();
        }

        if (parts.length >= 2) {
            const rest = parts[1].trim().split(' ');
            first = rest[0] || '';
            middle = rest[1] || '';
        }

        setForm({
            first_name: first,
            middle_name: middle,
            last_name: last,
            email: user.email || '',
            password: '',
            password_confirmation: '',
            role: (user.roles && user.roles[0]) || (roles && roles[0] && roles[0].name) || '',
            is_adviser: !!user.is_adviser,
            adviser_section: user.adviser_section || '',
        });
    }, [open, user.uuid]);

    function submit(e: any) {
        e.preventDefault();
        const name = `${form.last_name}${form.first_name ? ', ' + form.first_name + (form.middle_name ? ' ' + form.middle_name.charAt(0).toUpperCase() : '') : ''}`;
        router.patch(`/admin/users/${user.uuid}`, {
            ...form,
            name,
        }, {
            onSuccess: () => {
                setOpen(false);
                showToast('User updated successfully.', 'success');
                router.reload();
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast((firstError as string) || 'Unable to update user.', 'error');
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button type="button" className="inline-flex items-center gap-2 text-indigo-600">Edit</button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>Update details for <strong>{user.name}</strong></DialogDescription>

                <form onSubmit={submit} className="grid gap-3 mt-4">
                    <div className="grid sm:grid-cols-3 gap-2">
                        <Input placeholder="First" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                        <Input placeholder="Middle" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} />
                        <Input placeholder="Last" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                    </div>

                    <Label className="text-xs">Email</Label>
                    <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

                    <Label className="text-xs">Role</Label>
                    <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                        {roles.map((r: any) => (<option key={r.id} value={r.name}>{r.name}</option>))}
                    </select>

                    <label className="flex items-center gap-2 text-sm text-foreground dark:text-sidebar-foreground">
                        <input
                            type="checkbox"
                            checked={form.is_adviser}
                            onChange={(e) => setForm({ ...form, is_adviser: e.target.checked, adviser_section: e.target.checked ? form.adviser_section : '' })}
                        />
                        <span>Is adviser</span>
                    </label>

                    {form.is_adviser ? (
                        <div className="grid gap-2">
                            <Label className="text-xs">Adviser section</Label>
                            <select value={form.adviser_section} onChange={(e) => setForm({ ...form, adviser_section: e.target.value })} className="w-full rounded-md border bg-transparent px-3 py-2 text-sm">
                                <option value="">Select section</option>
                                {sections.map((section: any) => (
                                    <option key={section.uuid} value={section.name}>{section.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="grid sm:grid-cols-2 gap-2">
                        <div>
                            <Label className="text-xs">Password (leave blank to keep current)</Label>
                            <div className="relative">
                                <Input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                                <div className="absolute right-2 top-2 cursor-pointer text-muted-foreground" onClick={() => setShowPassword((s) => !s)}>{showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs">Confirm Password</Label>
                            <div className="relative">
                                <Input type={showConfirm ? 'text' : 'password'} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} />
                                <div className="absolute right-2 top-2 cursor-pointer text-muted-foreground" onClick={() => setShowConfirm((s) => !s)}>{showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 mt-3">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
