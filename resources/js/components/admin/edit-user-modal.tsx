import { router } from '@inertiajs/react';
import { Eye, EyeOff, Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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

export default function EditUserModal({ user, sections, takenAdviserSections = [] }: any) {
    const [open, setOpen] = useState(false);
    const currentAvatarUrl = user.profile_picture
        ? `/assets/${user.profile_picture}`
        : null;
    const createInitialForm = () => {
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

        return {
            first_name: first,
            middle_name: middle,
            last_name: last,
            email: user.email || '',
            password: '',
            password_confirmation: '',
            is_adviser: !!user.is_adviser,
            adviser_section: user.adviser_section || '',
        };
    };

    const [form, setForm] = useState(createInitialForm);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(
        currentAvatarUrl,
    );
    const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const avatarPreviewUrlRef = useRef<string | null>(null);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function handleAvatarChange(file: File | null) {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        setAvatarFile(file);

        if (!file) {
            setAvatarPreview(currentAvatarUrl);

            return;
        }

        const url = URL.createObjectURL(file);
        avatarPreviewUrlRef.current = url;
        setAvatarPreview(url);
    }

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current);
            }
        };
    }, []);

    function resetForm() {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        setForm(createInitialForm());
        setAvatarFile(null);
        setAvatarPreview(currentAvatarUrl);
        setShowPassword(false);
        setShowConfirm(false);
    }

    function submit(e: any) {
        e.preventDefault();
        const name = `${form.last_name}${form.first_name ? ', ' + form.first_name + (form.middle_name ? ' ' + form.middle_name.charAt(0).toUpperCase() : '') : ''}`;

        if (avatarFile) {
            const formData = new FormData();
            formData.append('_method', 'PATCH');
            Object.entries({ ...form, name }).forEach(([key, value]) => {
                formData.append(key, value as any);
            });
            formData.append('avatar', avatarFile);

            router.post(`/admin/users/${user.uuid}`, formData, {
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        showToast(page.props.flash.error, 'error');
                    } else {
                        setOpen(false);
                        showToast('User updated successfully.', 'success');
                    }
                    router.reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to update user.',
                        'error',
                    );
                },
            });

            return;
        }

        router.patch(
            `/admin/users/${user.uuid}`,
            {
                ...form,
                name,
            },
            {
                onSuccess: (page) => {
                    if (page.props.flash?.error) {
                        showToast(page.props.flash.error, 'error');
                    } else {
                        setOpen(false);
                        showToast('User updated successfully.', 'success');
                    }
                    router.reload();
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to update user.',
                        'error',
                    );
                },
            },
        );
    }

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
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5 text-indigo-600"
                >
                    <Pencil className="size-3.5" />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl">
                <DialogTitle>Edit user</DialogTitle>
                <DialogDescription>
                    Update details for <strong>{user.name}</strong>
                </DialogDescription>

                <form onSubmit={submit} className="mt-4 grid gap-4">
                    <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
                        <div
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDraggingAvatar(true);
                            }}
                            onDragLeave={() => setIsDraggingAvatar(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingAvatar(false);
                                handleAvatarChange(
                                    e.dataTransfer.files?.[0] ?? null,
                                );
                            }}
                            className={`grid gap-4 rounded-3xl border-2 border-dashed p-4 transition ${isDraggingAvatar ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/20' : 'border-border bg-background/80'}`}
                        >
                            <div className="space-y-2">
                                <Label className="text-xs">Profile photo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="h-28 w-28 overflow-hidden rounded-2xl border border-border bg-muted/20 shadow-sm">
                                        {avatarPreview ? (
                                            <img
                                                src={avatarPreview}
                                                alt="Profile preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
                                                No photo
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground">
                                            Drop a new image here.
                                        </p>
                                        <p>JPG, PNG, or WEBP up to 2MB.</p>
                                    </div>
                                </div>
                            </div>

                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                    handleAvatarChange(
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                                className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90"
                            />
                        </div>

                        <div className="space-y-4 rounded-3xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="grid gap-2 sm:grid-cols-3">
                                <div className="grid gap-2">
                                    <Label className="text-xs">
                                        First name
                                    </Label>
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
                                    <Label className="text-xs">
                                        Middle name
                                    </Label>
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
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-xs">Roles</Label>
                                <div className="rounded-md border border-dashed border-sidebar-border/70 px-3 py-2 text-sm text-muted-foreground">
                                    Roles are managed from the user list with
                                    the "Role" button.
                                </div>
                            </div>

                            <label className="flex items-center gap-2 rounded-2xl border border-border px-3 py-3 text-sm text-foreground dark:text-sidebar-foreground">
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
                                <div className="grid gap-2">
                                    <Label className="text-xs">
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
                                        {sections.filter((section: any) =>
                                            section.name === user.adviser_section ||
                                            !takenAdviserSections.includes(section.name),
                                        ).map((section: any) => (
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
                                    <Label className="text-xs">
                                        Password (leave blank to keep current)
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
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
                                            onClick={() =>
                                                setShowPassword((s) => !s)
                                            }
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
                                    <Label className="text-xs">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={
                                                showConfirm
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
                                                setShowConfirm((s) => !s)
                                            }
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
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2">
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Save changes</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
