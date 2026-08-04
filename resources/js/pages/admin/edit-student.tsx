import { Head, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';

type CommonAddress = {
    id: number;
    label: string;
    address_zone_street?: string | null;
    address_barangay?: string | null;
    address_municipality?: string | null;
    address_province?: string | null;
};

type ClassSection = {
    uuid: string;
    name: string;
    grade_level?: string | null;
};

type StudentData = {
    uuid: string;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    lrn?: string | null;
    student_id?: string | null;
    birthday?: string | null;
    contact_number?: string | null;
    address_zone_street?: string | null;
    address_barangay?: string | null;
    address_municipality?: string | null;
    address_province?: string | null;
    previous_school?: string | null;
    last_school_year?: string | null;
    last_grade_level?: string | null;
    previous_section?: string | null;
    grade_level?: string | null;
    section?: string | null;
    section_uuid?: string | null;
    profile_picture?: string | null;
    email?: string | null;
};

function keepDigits(value: string) {
    return value.replace(/\D/g, '');
}

function hasOnlyDigits(value: string) {
    return /^\d*$/.test(value);
}

function hasOnlyDigitsAndHyphen(value: string) {
    return /^\d*$|^\d+(?:-\d+)*$/.test(value);
}

export default function EditStudent() {
    const { props } = usePage();
    const student = (props.student || {}) as StudentData;
    const classSections = (props.classSections || []) as ClassSection[];
    const commonAddresses = (props.commonAddresses || []) as CommonAddress[];

    const currentAvatarUrl = student.profile_picture
        ? `/assets/${student.profile_picture}`
        : null;

    const [form, setForm] = useState({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        birthday: student.birthday || '',
        contact_number: student.contact_number || '',
        address_zone_street: student.address_zone_street || '',
        address_barangay: student.address_barangay || '',
        address_municipality: student.address_municipality || '',
        address_province: student.address_province || '',
        lrn: student.lrn || '',
        student_id: student.student_id || '',
        grade_level: student.grade_level || '',
        section_uuid: student.section_uuid || '',
        previous_school: student.previous_school || '',
        last_school_year: student.last_school_year || '',
        last_grade_level: student.last_grade_level || '',
        previous_section: student.previous_section || '',
    });

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl);
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

    function applyCommonAddress(address: CommonAddress) {
        setForm((c) => ({
            ...c,
            address_zone_street: address.address_zone_street || '',
            address_barangay: address.address_barangay || '',
            address_municipality: address.address_municipality || '',
            address_province: address.address_province || '',
        }));
    }

    function handleAddressBlur(field: keyof Pick<CommonAddress, 'address_zone_street' | 'address_barangay' | 'address_municipality' | 'address_province'>, value: string) {
        const query = value.trim().toLowerCase();

        if (!query) {
return;
}

        const match = commonAddresses.find((a) => (a[field] || '').trim().toLowerCase().startsWith(query));

        if (match) {
applyCommonAddress(match);
}
    }

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(new CustomEvent('local-toast', { detail: { message, type } }));
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!hasOnlyDigits(form.contact_number)) {
            showToast('Contact number can only contain digits.', 'error');

            return;
        }

        if (form.last_school_year && !hasOnlyDigitsAndHyphen(form.last_school_year)) {
            showToast('Last school year can only contain digits and hyphens.', 'error');

            return;
        }

        if (form.last_grade_level && !hasOnlyDigits(form.last_grade_level)) {
            showToast('Last grade level can only contain digits.', 'error');

            return;
        }

        setSubmitting(true);

        const payload: Record<string, any> = {
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            email: form.email,
            birthday: form.birthday || null,
            contact_number: form.contact_number,
            address_zone_street: form.address_zone_street,
            address_barangay: form.address_barangay,
            address_municipality: form.address_municipality,
            address_province: form.address_province,
            lrn: form.lrn,
            student_id: form.student_id,
            grade_level: form.grade_level,
            section_uuid: form.section_uuid || null,
            previous_school: form.previous_school,
            last_school_year: form.last_school_year,
            last_grade_level: form.last_grade_level,
            previous_section: form.previous_section,
        };

        if (avatarFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                if (value !== null && value !== undefined) {
                    formData.append(key, String(value));
                }
            });
            formData.append('avatar', avatarFile);
            formData.append('_method', 'PUT');

            router.post(`/admin/manage-students/${student.uuid}`, formData, {
                onFinish: () => setSubmitting(false),
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast((firstError as string) || 'Failed to update student.', 'error');
                },
            });
        } else {
            router.put(`/admin/manage-students/${student.uuid}`, payload, {
                onFinish: () => setSubmitting(false),
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast((firstError as string) || 'Failed to update student.', 'error');
                },
            });
        }
    }

    return (
        <>
            <Head title="Edit Student" />
            <PortalPageShell title="Edit Student" description={`Editing ${student.first_name || ''} ${student.last_name || ''}`}>
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
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => handleAvatarFile(e.target.files?.[0] || null)}
                                />
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

                        {/* Birthday */}
                        <label className="space-y-2">
                            <span className={labelClass}>Birthday</span>
                            <input type="date" value={form.birthday} onChange={(e) => setForm({ ...form, birthday: e.target.value })} className={inputClass} />
                        </label>

                        {/* Contact */}
                        <label className="space-y-2">
                            <span className={labelClass}>Contact Number</span>
                            <input inputMode="numeric" pattern="[0-9]*" value={form.contact_number} onChange={(e) => setForm({ ...form, contact_number: keepDigits(e.target.value) })} className={inputClass} />
                        </label>

                        {/* LRN */}
                        <label className="space-y-2">
                            <span className={labelClass}>LRN</span>
                            <input value={form.lrn} onChange={(e) => setForm({ ...form, lrn: e.target.value })} className={inputClass} />
                        </label>

                        {/* Student ID */}
                        <label className="space-y-2">
                            <span className={labelClass}>Student ID</span>
                            <input value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className={inputClass} />
                        </label>

                        {/* Grade Level */}
                        <label className="space-y-2">
                            <span className={labelClass}>Grade Level</span>
                            <select value={form.grade_level} onChange={(e) => setForm({ ...form, grade_level: e.target.value })} className={inputClass}>
                                <option value="">Select grade</option>
                                {['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </label>

                        {/* Section */}
                        <label className="space-y-2">
                            <span className={labelClass}>Section</span>
                            <select value={form.section_uuid} onChange={(e) => setForm({ ...form, section_uuid: e.target.value })} className={inputClass}>
                                <option value="">Select section</option>
                                {classSections.map((s) => (
                                    <option key={s.uuid} value={s.uuid}>{s.name} ({s.grade_level || 'N/A'})</option>
                                ))}
                            </select>
                        </label>

                        {/* Address */}
                        <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4 md:col-span-2">
                            <div className="mb-3 text-sm font-medium text-foreground">Address</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Zone / Street</span>
                                    <input value={form.address_zone_street} onChange={(e) => setForm({ ...form, address_zone_street: e.target.value })} onBlur={(e) => handleAddressBlur('address_zone_street', e.target.value)} list="edit-address-zone-street" className={inputClass} />
                                    <datalist id="edit-address-zone-street">
                                        {commonAddresses.map((a) => a.address_zone_street).filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).map((v) => <option key={v} value={v as string} />)}
                                    </datalist>
                                </label>
                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Barangay</span>
                                    <input value={form.address_barangay} onChange={(e) => setForm({ ...form, address_barangay: e.target.value })} onBlur={(e) => handleAddressBlur('address_barangay', e.target.value)} list="edit-address-barangay" className={inputClass} />
                                    <datalist id="edit-address-barangay">
                                        {commonAddresses.map((a) => a.address_barangay).filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).map((v) => <option key={v} value={v as string} />)}
                                    </datalist>
                                </label>
                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Municipality</span>
                                    <input value={form.address_municipality} onChange={(e) => setForm({ ...form, address_municipality: e.target.value })} onBlur={(e) => handleAddressBlur('address_municipality', e.target.value)} list="edit-address-municipality" className={inputClass} />
                                    <datalist id="edit-address-municipality">
                                        {commonAddresses.map((a) => a.address_municipality).filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).map((v) => <option key={v} value={v as string} />)}
                                    </datalist>
                                </label>
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Province</span>
                                    <input value={form.address_province} onChange={(e) => setForm({ ...form, address_province: e.target.value })} onBlur={(e) => handleAddressBlur('address_province', e.target.value)} list="edit-address-province" className={inputClass} />
                                    <datalist id="edit-address-province">
                                        {commonAddresses.map((a) => a.address_province).filter((v, i, arr) => Boolean(v) && arr.indexOf(v) === i).map((v) => <option key={v} value={v as string} />)}
                                    </datalist>
                                </label>
                            </div>
                        </div>

                        {/* Previous School Info */}
                        <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4 md:col-span-2">
                            <div className="mb-3 text-sm font-medium text-foreground">Previous School Information</div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>Previous School</span>
                                    <input value={form.previous_school} onChange={(e) => setForm({ ...form, previous_school: e.target.value })} className={inputClass} />
                                </label>
                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>Last School Year</span>
                                    <input value={form.last_school_year} onChange={(e) => setForm({ ...form, last_school_year: e.target.value })} placeholder="e.g. 2024-2025" className={inputClass} />
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
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => router.get('/admin/manage-students')}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? 'Saving…' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </PortalPageShell>
        </>
    );
}
