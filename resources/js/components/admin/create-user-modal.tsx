import { router } from '@inertiajs/react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateUserModal({
    roles,
    sections,
    takenAdviserSections = [],
}: any) {
    const [open, setOpen] = useState(false);
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: (roles && roles[0] && roles[0].name) || '',
        is_adviser: false,
        adviser_section: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

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

    function resetForm() {
        setForm({
            first_name: '',
            middle_name: '',
            last_name: '',
            email: '',
            password: '',
            password_confirmation: '',
            role: (roles && roles[0] && roles[0].name) || '',
            is_adviser: false,
            adviser_section: '',
        });
        setShowPassword(false);
        setShowConfirm(false);
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
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
                name: composeName(form.first_name, form.middle_name, form.last_name),
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    setOpen(false);
                    resetForm();
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

    const canSubmit =
        !submitting &&
        form.last_name.trim() &&
        form.email.trim() &&
        form.password &&
        form.password_confirmation;

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                setOpen(nextOpen);

                if (nextOpen) {
                    resetForm();
                }
            }}
        >
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="h-4 w-4" />
                    Create User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogTitle>Create user</DialogTitle>
                <DialogDescription>
                    Add a new account and assign it a role. Passwords must be
                    at least 6 characters.
                </DialogDescription>

                <form onSubmit={submit} className="mt-4 grid gap-4">
                    <div className="grid gap-2 sm:grid-cols-3">
                        <div className="grid gap-2">
                            <Label className="text-xs">First name</Label>
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
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Middle name</Label>
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
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Last name</Label>
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
                    </div>

                    <div className="grid gap-2">
                        <Label className="text-xs">Email</Label>
                        <Input
                            type="email"
                            placeholder="name@school.edu"
                            value={form.email}
                            onChange={(e) =>
                                setForm({ ...form, email: e.target.value })
                            }
                        />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label className="text-xs">Role</Label>
                            <select
                                value={form.role}
                                onChange={(e) =>
                                    setForm({ ...form, role: e.target.value })
                                }
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm"
                            >
                                {roles.map((r: any) => (
                                    <option key={r.id} value={r.name}>
                                        {r.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm text-foreground dark:text-sidebar-foreground">
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
                    </div>

                    {form.is_adviser ? (
                        <div className="grid gap-2">
                            <Label className="text-xs">Adviser section</Label>
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
                                {(sections || [])
                                    .filter(
                                        (section: any) =>
                                            !takenAdviserSections.includes(
                                                section.name,
                                            ),
                                    )
                                    .map((section: any) => (
                                        <option
                                            key={section.uuid}
                                            value={section.name}
                                        >
                                            {section.name}
                                        </option>
                                    ))}
                            </select>
                        </div>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="grid gap-2">
                            <Label className="text-xs">Password</Label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Minimum 6 characters"
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
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    type={showConfirm ? 'text' : 'password'}
                                    placeholder="Repeat password"
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
                                    onClick={() => setShowConfirm((s) => !s)}
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <DialogClose asChild>
                            <Button variant="secondary" type="button">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={!canSubmit}>
                            {submitting ? 'Creating…' : 'Create user'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
