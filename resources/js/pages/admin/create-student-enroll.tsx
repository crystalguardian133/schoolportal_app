import { Head, router, usePage } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type CommonAddress = {
    id: number;
    label: string;
    address_zone_street?: string | null;
    address_barangay?: string | null;
    address_municipality?: string | null;
    address_province?: string | null;
};

function generateStudentId() {
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

function keepDigits(value: string) {
    return value.replace(/\D/g, '');
}

function keepDigitsAndHyphen(value: string) {
    return value.replace(/[^\d-]/g, '');
}

function hasOnlyDigits(value: string) {
    return /^\d*$/.test(value);
}

function hasOnlyDigitsAndHyphen(value: string) {
    return /^\d*$|^\d+(?:-\d+)*$/.test(value);
}

function createInitialForm() {
    return {
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        student_id: generateStudentId(),
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
    };
}

export default function CreateStudentEnroll() {
    const { props } = usePage();
    const commonAddresses: CommonAddress[] = props.commonAddresses || [];
    const [form, setForm] = useState(createInitialForm);
    const composedName = composeName(
        form.first_name,
        form.middle_name,
        form.last_name,
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState<boolean>(false);
    const [showConfirmPassword, setShowConfirmPassword] =
        useState<boolean>(false);
    const avatarPreviewUrlRef = useRef<string | null>(null);
    const labelClass =
        'block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground';
    const inputClass =
        'w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15';

    function applyCommonAddress(address: CommonAddress) {
        setForm((current) => ({
            ...current,
            address_zone_street: address.address_zone_street || '',
            address_barangay: address.address_barangay || '',
            address_municipality: address.address_municipality || '',
            address_province: address.address_province || '',
        }));
    }

    function getAddressFieldValue(
        address: CommonAddress,
        field: keyof Pick<
            CommonAddress,
            | 'address_zone_street'
            | 'address_barangay'
            | 'address_municipality'
            | 'address_province'
        >,
    ) {
        return (address[field] || '').trim().toLowerCase();
    }

    function findCommonAddress(
        field: keyof Pick<
            CommonAddress,
            | 'address_zone_street'
            | 'address_barangay'
            | 'address_municipality'
            | 'address_province'
        >,
        value: string,
    ) {
        const query = value.trim().toLowerCase();

        if (!query) {
            return null;
        }

        return (
            commonAddresses.find((address) =>
                getAddressFieldValue(address, field).startsWith(query),
            ) ?? null
        );
    }

    function handleAddressBlur(
        field: keyof Pick<
            CommonAddress,
            | 'address_zone_street'
            | 'address_barangay'
            | 'address_municipality'
            | 'address_province'
        >,
        value: string,
    ) {
        const suggestion = findCommonAddress(field, value);

        if (suggestion) {
            applyCommonAddress(suggestion);
        }
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!hasOnlyDigits(form.contact_number)) {
            window.dispatchEvent(
                new CustomEvent('local-toast', {
                    detail: {
                        message: 'Contact number can only contain digits.',
                        type: 'error',
                    },
                }),
            );

            return;
        }

        if (!hasOnlyDigitsAndHyphen(form.last_school_year)) {
            window.dispatchEvent(
                new CustomEvent('local-toast', {
                    detail: {
                        message:
                            'Last school year can only contain digits and hyphens.',
                        type: 'error',
                    },
                }),
            );

            return;
        }

        if (!hasOnlyDigits(form.last_grade_level)) {
            window.dispatchEvent(
                new CustomEvent('local-toast', {
                    detail: {
                        message: 'Last grade level can only contain digits.',
                        type: 'error',
                    },
                }),
            );

            return;
        }

        // ensure name is composed from breakdown before submit in format: Last, First M
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
            student_id: form.student_id,
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
                    resetForm();
                    window.dispatchEvent(
                        new CustomEvent('local-toast', {
                            detail: {
                                message: 'Student created and enrolled',
                                type: 'success',
                            },
                        }),
                    );
                },
            });
        } else {
            router.post(
                '/admin/enrollments',
                {
                    new_student: payload,
                },
                {
                    onFinish: () => setSubmitting(false),
                    onSuccess: () => {
                        resetForm();
                        window.dispatchEvent(
                            new CustomEvent('local-toast', {
                                detail: {
                                    message: 'Student created and enrolled',
                                    type: 'success',
                                },
                            }),
                        );
                    },
                },
            );
        }
    }

    function resetForm() {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        setAvatarFile(null);
        setAvatarPreview(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
        setForm(createInitialForm());
    }

    function handleAvatarFile(file: File | null) {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        setAvatarFile(file);

        if (!file) {
            setAvatarPreview(null);

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

    return (
        <>
            <Head title="Create & Enroll Student" />
            <PortalPageShell
                title="Create & Enroll Student"
                description="Create a new student account and enroll them into a selected class section."
                showBackLink={false}
            >
                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Name breakdown first (personal information) */}
                        <label className="space-y-2 md:col-span-2">
                            <span className={labelClass}>
                                Name Breakdown{' '}
                                <span className="text-destructive">*</span>
                            </span>
                            <div className="grid gap-2 sm:grid-cols-3">
                                <input
                                    placeholder="First name"
                                    value={form.first_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            first_name: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                                <input
                                    placeholder="Middle name"
                                    value={form.middle_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            middle_name: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                                <input
                                    placeholder="Last name"
                                    value={form.last_name}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            last_name: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                            </div>
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Birthday</span>
                            <input
                                type="date"
                                value={form.birthday}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        birthday: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>Contact Number</span>
                            <input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.contact_number}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        contact_number: keepDigits(
                                            e.target.value,
                                        ),
                                    })
                                }
                                className={inputClass}
                            />
                        </label>

                        <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4 md:col-span-2">
                            <div className="mb-3 text-sm font-medium text-foreground">
                                <span>Address</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>
                                        Zone / Street
                                    </span>
                                    <input
                                        value={form.address_zone_street}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                address_zone_street:
                                                    e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            handleAddressBlur(
                                                'address_zone_street',
                                                e.target.value,
                                            )
                                        }
                                        list="common-address-zone-street"
                                        className={inputClass}
                                    />
                                    <datalist id="common-address-zone-street">
                                        {commonAddresses
                                            .map(
                                                (address) =>
                                                    address.address_zone_street,
                                            )
                                            .filter(
                                                (value, index, values) =>
                                                    Boolean(value) &&
                                                    values.indexOf(value) ===
                                                        index,
                                            )
                                            .map((value) => (
                                                <option
                                                    key={value}
                                                    value={value as string}
                                                />
                                            ))}
                                    </datalist>
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>
                                        Barangay{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        value={form.address_barangay}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                address_barangay:
                                                    e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            handleAddressBlur(
                                                'address_barangay',
                                                e.target.value,
                                            )
                                        }
                                        list="common-address-barangay"
                                        className={inputClass}
                                    />
                                    <datalist id="common-address-barangay">
                                        {commonAddresses
                                            .map(
                                                (address) =>
                                                    address.address_barangay,
                                            )
                                            .filter(
                                                (value, index, values) =>
                                                    Boolean(value) &&
                                                    values.indexOf(value) ===
                                                        index,
                                            )
                                            .map((value) => (
                                                <option
                                                    key={value}
                                                    value={value as string}
                                                />
                                            ))}
                                    </datalist>
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>
                                        Municipality{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        value={form.address_municipality}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                address_municipality:
                                                    e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            handleAddressBlur(
                                                'address_municipality',
                                                e.target.value,
                                            )
                                        }
                                        list="common-address-municipality"
                                        className={inputClass}
                                    />
                                    <datalist id="common-address-municipality">
                                        {commonAddresses
                                            .map(
                                                (address) =>
                                                    address.address_municipality,
                                            )
                                            .filter(
                                                (value, index, values) =>
                                                    Boolean(value) &&
                                                    values.indexOf(value) ===
                                                        index,
                                            )
                                            .map((value) => (
                                                <option
                                                    key={value}
                                                    value={value as string}
                                                />
                                            ))}
                                    </datalist>
                                </label>

                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>
                                        Province{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        value={form.address_province}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                address_province:
                                                    e.target.value,
                                            })
                                        }
                                        onBlur={(e) =>
                                            handleAddressBlur(
                                                'address_province',
                                                e.target.value,
                                            )
                                        }
                                        list="common-address-province"
                                        className={inputClass}
                                    />
                                    <datalist id="common-address-province">
                                        {commonAddresses
                                            .map(
                                                (address) =>
                                                    address.address_province,
                                            )
                                            .filter(
                                                (value, index, values) =>
                                                    Boolean(value) &&
                                                    values.indexOf(value) ===
                                                        index,
                                            )
                                            .map((value) => (
                                                <option
                                                    key={value}
                                                    value={value as string}
                                                />
                                            ))}
                                    </datalist>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-sidebar-border/60 bg-sidebar/30 p-4 md:col-span-2">
                            <div className="mb-3 text-sm font-medium text-foreground">
                                <span>Previous Educational Attainment</span>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>
                                        Previous School{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        value={form.previous_school}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                previous_school: e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>
                                        Last School Year{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        inputMode="numeric"
                                        pattern="[0-9-]*"
                                        value={form.last_school_year}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                last_school_year:
                                                    keepDigitsAndHyphen(
                                                        e.target.value,
                                                    ),
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </label>

                                <label className="space-y-2 text-sm">
                                    <span className={labelClass}>
                                        Last Year Level{' '}
                                        <span className="text-destructive">
                                            *
                                        </span>
                                    </span>
                                    <input
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        value={form.last_grade_level}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                last_grade_level: keepDigits(
                                                    e.target.value,
                                                ),
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </label>

                                <label className="space-y-2 text-sm md:col-span-2">
                                    <span className={labelClass}>
                                        Previous Section
                                    </span>
                                    <input
                                        value={form.previous_section}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                previous_section:
                                                    e.target.value,
                                            })
                                        }
                                        className={inputClass}
                                    />
                                </label>
                            </div>
                        </div>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>
                                Email{' '}
                                <span className="text-destructive">*</span>
                            </span>
                            <input
                                type="email"
                                value={form.email}
                                onChange={(e) =>
                                    setForm({ ...form, email: e.target.value })
                                }
                                className={inputClass}
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>LRN</span>
                            <input
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={form.lrn}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        lrn: keepDigits(e.target.value),
                                    })
                                }
                                className={inputClass}
                            />
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>
                                Student ID Preview
                            </span>
                            <input
                                readOnly
                                value={form.student_id}
                                className={`${inputClass} bg-muted/60 text-foreground shadow-sm`}
                            />
                        </label>

                        {/* Passwords last */}
                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>
                                Password{' '}
                                <span className="text-destructive">*</span>
                            </span>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            password: e.target.value,
                                        })
                                    }
                                    className={`${inputClass} pr-10`}
                                />
                                <div
                                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() => setShowPassword((s) => !s)}
                                    role="button"
                                    aria-label={
                                        showPassword
                                            ? 'Hide password'
                                            : 'Show password'
                                    }
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </div>
                            </div>
                        </label>

                        <label className="space-y-2 text-sm">
                            <span className={labelClass}>
                                Confirm Password{' '}
                                <span className="text-destructive">*</span>
                            </span>
                            <div className="relative">
                                <input
                                    type={
                                        showConfirmPassword
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
                                    className={`${inputClass} pr-10`}
                                />
                                <div
                                    className="absolute top-1/2 right-2 -translate-y-1/2 cursor-pointer text-muted-foreground"
                                    onClick={() =>
                                        setShowConfirmPassword((s) => !s)
                                    }
                                    role="button"
                                    aria-label={
                                        showConfirmPassword
                                            ? 'Hide confirm password'
                                            : 'Show confirm password'
                                    }
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </div>
                            </div>
                        </label>

                        <div className="flex justify-end pt-2 md:col-span-2">
                            <button
                                disabled={
                                    submitting ||
                                    !composedName ||
                                    !form.email ||
                                    !form.password ||
                                    !form.password_confirmation ||
                                    !form.address_barangay ||
                                    !form.address_municipality ||
                                    !form.address_province ||
                                    !form.previous_school ||
                                    !form.last_school_year ||
                                    !form.last_grade_level
                                }
                                className="min-w-40 rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
                            >
                                {submitting ? 'Creating…' : 'Create & Enroll'}
                            </button>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-foreground">
                            Profile Photo
                        </label>
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                                e.preventDefault();
                                const file = e.dataTransfer.files?.[0];
                                handleAvatarFile(file ?? null);
                            }}
                            className="mt-2 grid gap-4 rounded-3xl border border-dashed border-border/70 bg-gradient-to-br from-background to-muted/20 p-4 md:grid-cols-[160px_minmax(0,1fr)]"
                        >
                            <div className="flex h-40 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-background shadow-sm">
                                {avatarPreview ? (
                                    <img
                                        src={avatarPreview}
                                        alt="preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="px-4 text-center">
                                        <div className="text-sm font-medium text-foreground">
                                            No photo selected
                                        </div>
                                        <div className="mt-1 text-xs text-muted-foreground">
                                            Drop or choose a student photo
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        Upload a profile image
                                    </p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        PNG, JPG, JPEG, or WEBP. Drag and drop
                                        or select a file.
                                    </p>
                                </div>
                                <input
                                    id="avatar"
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        handleAvatarFile(
                                            e.target.files?.[0] ?? null,
                                        )
                                    }
                                    className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90"
                                />
                            </div>
                        </div>
                    </div>
                </form>
            </PortalPageShell>
        </>
    );
}
