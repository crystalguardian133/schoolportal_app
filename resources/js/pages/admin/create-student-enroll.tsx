import { Head, router, usePage } from '@inertiajs/react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type ClassSection = { uuid: string; name: string; grade_level?: string | null; school_year?: string | null; subject_count: number };

export default function CreateStudentEnroll() {
    const { props } = usePage();
    const classSections: ClassSection[] = props.classSections || [];
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        student_id: '',
        lrn: '',
        birthday: '',
        contact_number: '',
        grade_level: '',
        first_name: '',
        middle_name: '',
        last_name: '',
        address_zone_street: '',
        address_barangay: '',
        address_municipality: '',
        address_province: '',
        previous_school: '',
        last_school_year: '',
        last_grade_level: '',
        previous_section: '',
    });
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [generatedId, setGeneratedId] = useState<string>('');
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
    const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground';
    const inputClass = 'w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15';

    function submit(e: React.FormEvent) {
        e.preventDefault();

        // ensure name is composed from breakdown before submit in format: Last, First M
        const composedName = composeName(form.first_name, form.middle_name, form.last_name);
        const composedAddress = [
            form.address_zone_street,
            form.address_barangay,
            form.address_municipality,
            form.address_province,
        ]
            .map((value) => value.trim())
            .filter(Boolean)
            .join(', ');
        const payload = {
            ...form,
            name: composedName,
            address: composedAddress,
            student_id: form.student_id || generatedId,
        };

        setSubmitting(true);

        // If an avatar file is present, submit as FormData
        if (avatarFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                formData.append(`new_student[${key}]`, value as any);
            });
            formData.append('new_student[avatar]', avatarFile);

            router.post('/admin/enrollments', formData, {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(new CustomEvent('local-toast', { detail: { message: 'Student created and enrolled', type: 'success' } }));
                },
            });
        } else {
            router.post('/admin/enrollments', {
                new_student: payload,
            }, {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    window.dispatchEvent(new CustomEvent('local-toast', { detail: { message: 'Student created and enrolled', type: 'success' } }));
                },
            });
        }
    }

    useEffect(() => {
        // auto-compose name whenever breakdown changes in desired format
        const composed = composeName(form.first_name, form.middle_name, form.last_name);
        setForm((f) => ({ ...f, name: composed }));
    }, [form.first_name, form.middle_name, form.last_name]);

    useEffect(() => {
        // cleanup preview URL when avatarFile changes
        if (!avatarFile) {
            setAvatarPreview(null);
            return;
        }
        const url = URL.createObjectURL(avatarFile);
        setAvatarPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [avatarFile]);

    useEffect(() => {
        // generate initial student id preview on mount
        if (!generatedId) {
            const id = generateStudentId();
            setGeneratedId(id);
            setForm((f) => ({ ...f, student_id: id }));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function generateStudentId() {
        // format: YYYY-XXXX where XXXX is a zero-padded 4-digit random number
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000);
        const padded = String(random).padStart(4, '0');
        return `${year}-${padded}`;
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

    // regenerateId removed — student id is generated on mount only

    return (
        <>
            <Head title="Create & Enroll Student" />
            <PortalPageShell title="Create & Enroll Student" description="Create a new student account and enroll them into a selected class section.">
                <form onSubmit={submit} className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Name breakdown first (personal information) */}
                        <label className="space-y-2 md:col-span-2">
                            <span className={labelClass}>Name Breakdown</span>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <input placeholder="First name" value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className={inputClass} />
                                <input placeholder="Middle name" value={form.middle_name} onChange={(e) => setForm({ ...form, middle_name: e.target.value })} className={inputClass} />
                                <input placeholder="Last name" value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className={inputClass} />
                            </div>
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Birthday</span>
                            <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Contact Number</span>
                            <input value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: e.target.value })} className={inputClass} />
                        </label>

                        <div className="md:col-span-2 rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4">
                            <div className="mb-3 text-sm font-medium text-foreground">Address</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Zone / Street</span>
                                    <input value={form.address_zone_street} onChange={(e) => setForm({ ...form, address_zone_street: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Barangay</span>
                                    <input value={form.address_barangay} onChange={(e) => setForm({ ...form, address_barangay: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Municipality</span>
                                    <input value={form.address_municipality} onChange={(e) => setForm({ ...form, address_municipality: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Province</span>
                                    <input value={form.address_province} onChange={(e) => setForm({ ...form, address_province: e.target.value })} className={inputClass} />
                                </label>
                            </div>
                        </div>

                        <div className="md:col-span-2 rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4">
                            <div className="mb-3 text-sm font-medium text-foreground">Previous Educational Attainment</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Previous School</span>
                                    <input value={form.previous_school} onChange={(e) => setForm({ ...form, previous_school: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Last School Year</span>
                                    <input value={form.last_school_year} onChange={(e) => setForm({ ...form, last_school_year: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Last Grade Level</span>
                                    <input value={form.last_grade_level} onChange={(e) => setForm({ ...form, last_grade_level: e.target.value })} className={inputClass} />
                                </label>

                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Previous Section</span>
                                    <input value={form.previous_section} onChange={(e) => setForm({ ...form, previous_section: e.target.value })} className={inputClass} />
                                </label>
                            </div>
                        </div>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Email</span>
                            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Student ID Preview</span>
                            <input readOnly value={form.student_id || generatedId} className={`${inputClass} bg-muted/60 text-foreground shadow-sm`} />
                        </label>

                        {/* Passwords last */}
                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Password</span>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={`${inputClass} pr-10`} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground" onClick={() => setShowPassword((s) => !s)} role="button" aria-label={showPassword ? 'Hide password' : 'Show password'}>
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </div>
                            </div>
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Confirm Password</span>
                            <div className="relative">
                                <input type={showConfirmPassword ? 'text' : 'password'} value={form.password_confirmation} onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })} className={`${inputClass} pr-10`} />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground" onClick={() => setShowConfirmPassword((s) => !s)} role="button" aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </div>
                            </div>
                        </label>

                        <div className="md:col-span-2 flex justify-end pt-2">
                            <button
                                disabled={submitting || !form.name || !form.email || !form.password || !form.password_confirmation}
                                className="min-w-40 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Creating…' : 'Create & Enroll'}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground">Profile Photo (optional)</label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                if (file) setAvatarFile(file);
                            }}
                            className="mt-2 flex items-center gap-4"
                        >
                            <div className="w-28 h-28 rounded overflow-hidden bg-muted/20 flex items-center justify-center border">
                                {avatarPreview ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">Drop image here</span>}
                            </div>
                            <div>
                                <input id="avatar" type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)} />
                            </div>
                        </div>
                    </div>
                </form>
            </PortalPageShell>
        </>
    );
}
