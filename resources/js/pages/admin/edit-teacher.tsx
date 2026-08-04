import { Head, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';

type Section = {
    uuid: string;
    name: string;
    grade_level?: string | null;
};

type Role = {
    id: string;
    name: string;
};

type TeacherData = {
    uuid: string;
    name?: string;
    email?: string;
    profile_picture?: string | null;
    is_adviser?: boolean;
    adviser_section?: string | null;
    roles?: string[];
};

export default function EditTeacher() {
    const { props } = usePage();
    const teacher = (props.teacher || {}) as TeacherData;
    const sections = (props.sections || []) as Section[];
    const roles = (props.roles || []) as Role[];
    const takenAdviserSections = (props.takenAdviserSections || []) as string[];

    const currentAvatarUrl = teacher.profile_picture
        ? `/assets/${teacher.profile_picture}`
        : null;

    // Parse name breakdown from "Last, First M." format
    function parseName(name: string) {
        const parts = (name || '').split(',');
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

        return { first_name: first, middle_name: middle, last_name: last };
    }

    const parsed = parseName(teacher.name || '');

    const [form, setForm] = useState({
        first_name: parsed.first_name,
        middle_name: parsed.middle_name,
        last_name: parsed.last_name,
        email: teacher.email || '',
        password: '',
        password_confirmation: '',
        role: (teacher.roles && teacher.roles[0]) || (roles[0]?.name || ''),
        is_adviser: !!teacher.is_adviser,
        adviser_section: teacher.adviser_section || '',
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const avatarPreviewUrlRef = useRef<string | null>(null);

    const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground';
    const inputClass = 'w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15';

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current);
            }
        };
    }, []);

    function handleAvatarFile(file: File | null) {
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

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(new CustomEvent('local-toast', { detail: { message, type } }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!form.last_name || !form.email || !form.role) {
            showToast('Name, email, and role are required.', 'error');

            return;
        }

        if (form.password && form.password !== form.password_confirmation) {
            showToast('Passwords do not match.', 'error');

            return;
        }

        setSubmitting(true);

        const payload: Record<string, any> = {
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            email: form.email,
            role: form.role,
            is_adviser: form.is_adviser ? 1 : 0,
            adviser_section: form.is_adviser ? form.adviser_section || null : null,
        };

        if (form.password) {
            payload.password = form.password;
            payload.password_confirmation = form.password_confirmation;
        }

        if (avatarFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                formData.append(key, value !== null && value !== undefined ? String(value) : '');
            });
            formData.append('avatar', avatarFile);
            formData.append('_method', 'PATCH');

            router.post(`/admin/manage-teachers/${teacher.uuid}`, formData, {
                onFinish: () => setSubmitting(false),
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast((firstError as string) || 'Failed to update teacher.', 'error');
                },
            });
        } else {
            router.patch(`/admin/manage-teachers/${teacher.uuid}`, payload, {
                onFinish: () => setSubmitting(false),
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast((firstError as string) || 'Failed to update teacher.', 'error');
                },
            });
        }
    }

    return (
        <>
            <Head title="Edit Teacher" />
            <PortalPageShell title="Edit Teacher" description={`Editing ${teacher.name || ''}`}>
                <form onSubmit={submit} className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Avatar */}
                        <div className="flex flex-col items-center gap-3 md:col-span-2">
                            <div
                                className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-border bg-muted"
                                onDragOver={(e) => {
 e.preventDefault(); e.stopPropagation(); 
}}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    const file = e.dataTransfer.files?.[0];

                                    if (file) {
handleAvatarFile(file);
}
                                }}
                            >
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-xs text-muted-foreground">Drop image</span>
                                )}
                            </div>
                            <label className="cursor-pointer text-xs text-primary hover:underline">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)} />
                                Change photo
                            </label>
                        </div>

                        {/* Name */}
                        <label className="space-y-2 md:col-span-2">
                            <span className={labelClass}>Name Breakdown</span>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
                                <input placeholder="Middle name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className={inputClass} />
                                <input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
                            </div>
                        </label>

                        {/* Email */}
                        <label className="space-y-2">
                            <span className={labelClass}>Email</span>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                        </label>

                        {/* Role */}
                        <label className="space-y-2">
                            <span className={labelClass}>Role</span>
                            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass}>
                                <option value="">Select role</option>
                                {roles.map((r) => (
                                    <option key={r.id} value={r.name}>{r.name}</option>
                                ))}
                            </select>
                        </label>

                        {/* Adviser */}
                        <div className="space-y-3 md:col-span-2">
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={form.is_adviser}
                                    onChange={(e) => setForm({ ...form, is_adviser: e.target.checked, adviser_section: e.target.checked ? form.adviser_section : '' })}
                                    className="size-4 rounded border-border"
                                />
                                <span className="text-sm font-medium">Adviser</span>
                            </label>
                            {form.is_adviser && (
                                <label className="space-y-2">
                                    <span className={labelClass}>Adviser Section</span>
                                    <select
                                        value={form.adviser_section}
                                        onChange={(e) => setForm({ ...form, adviser_section: e.target.value })}
                                        className={inputClass}
                                    >
                                        <option value="">Select section</option>
                                        {sections
                                            .filter((s) => !takenAdviserSections.includes(s.name) || s.name === teacher.adviser_section)
                                            .map((s) => (
                                                <option key={s.uuid} value={s.name}>{s.name} ({s.grade_level || 'N/A'})</option>
                                            ))}
                                    </select>
                                </label>
                            )}
                        </div>

                        {/* Password */}
                        <label className="space-y-2">
                            <span className={labelClass}>New Password (leave blank to keep current)</span>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass} />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword((s) => !s)}>
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className={labelClass}>Confirm Password</span>
                            <div className="relative">
                                <input type={showConfirm ? 'text' : 'password'} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className={inputClass} />
                                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowConfirm((s) => !s)}>
                                    {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                        </label>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.get('/admin/manage-teachers')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting || !form.last_name || !form.email || !form.role}>
                            {submitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </PortalPageShell>
        </>
    );
}
