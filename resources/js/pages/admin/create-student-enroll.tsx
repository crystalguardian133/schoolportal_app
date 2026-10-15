import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    MapPin,
    School,
    UserRound,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
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
    school_year?: string | null;
    subject_count: number;
    subjects: { uuid: string; name: string; code?: string | null }[];
};

type WizardStep = 1 | 2 | 3;

const STEPS: { n: WizardStep; label: string }[] = [
    { n: 1, label: 'Identity' },
    { n: 2, label: 'Address & history' },
    { n: 3, label: 'Section & review' },
];

const EMAIL_RE = /.+@.+\..+/;

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

type CreateStudentEnrollProps = PageProps & {
    commonAddresses?: CommonAddress[];
    classSections?: ClassSection[];
};

type AddressField =
    | 'address_zone_street'
    | 'address_barangay'
    | 'address_municipality'
    | 'address_province';

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <label className="block space-y-2 text-sm">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {label}{' '}
                {required && <span className="text-destructive">*</span>}
            </span>
            {children}
            {error && (
                <span className="block text-sm text-destructive">{error}</span>
            )}
        </label>
    );
}

export default function CreateStudentEnroll() {
    const { props } = usePage<CreateStudentEnrollProps>();
    const commonAddresses: CommonAddress[] = props.commonAddresses || [];
    const classSections: ClassSection[] = props.classSections || [];
    const [step, setStep] = useState<WizardStep>(1);
    const [classSectionUuid, setClassSectionUuid] = useState<string>('');
    const selectedClassSection =
        classSections.find((section) => section.uuid === classSectionUuid) ??
        null;
    const [form, setForm] = useState(createInitialForm);
    const composedName = composeName(
        form.first_name,
        form.middle_name,
        form.last_name,
    );
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const avatarPreviewUrlRef = useRef<string | null>(null);
    const inputClass =
        'w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-ring focus:ring-4 focus:ring-ring/15';

    const step1Valid =
        composedName.trim().length > 0 && EMAIL_RE.test(form.email.trim());
    const step2Valid =
        form.address_barangay.trim().length > 0 &&
        form.address_municipality.trim().length > 0 &&
        form.address_province.trim().length > 0 &&
        form.previous_school.trim().length > 0 &&
        form.last_school_year.trim().length > 0 &&
        form.last_grade_level.trim().length > 0;

    function applyCommonAddress(address: CommonAddress) {
        setForm((current) => ({
            ...current,
            address_zone_street: address.address_zone_street || '',
            address_barangay: address.address_barangay || '',
            address_municipality: address.address_municipality || '',
            address_province: address.address_province || '',
        }));
    }

    function getAddressFieldValue(address: CommonAddress, field: AddressField) {
        return (address[field] || '').trim().toLowerCase();
    }

    function findCommonAddress(field: AddressField, value: string) {
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

    function handleAddressBlur(field: AddressField, value: string) {
        const suggestion = findCommonAddress(field, value);

        if (suggestion) {
            applyCommonAddress(suggestion);
        }
    }

    function toastError(message: string) {
        window.dispatchEvent(
            new CustomEvent('local-toast', {
                detail: { message, type: 'error' },
            }),
        );
    }

    function addressDatalist(field: AddressField, listId: string) {
        return (
            <datalist id={listId}>
                {commonAddresses
                    .map((address) => address[field])
                    .filter(
                        (value, index, values) =>
                            Boolean(value) && values.indexOf(value) === index,
                    )
                    .map((value) => (
                        <option key={value} value={value as string} />
                    ))}
            </datalist>
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();

        if (!hasOnlyDigits(form.contact_number)) {
            toastError('Contact number can only contain digits.');

            return;
        }

        if (!hasOnlyDigitsAndHyphen(form.last_school_year)) {
            toastError(
                'Last school year can only contain digits and hyphens.',
            );

            return;
        }

        if (!hasOnlyDigits(form.last_grade_level)) {
            toastError('Last grade level can only contain digits.');

            return;
        }

        if (!classSectionUuid) {
            toastError('Select a class section to enroll into.');

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

        const onSuccess = () => {
            resetForm();
            setStep(1);
            window.dispatchEvent(
                new CustomEvent('local-toast', {
                    detail: {
                        message: 'Student created and enrolled',
                        type: 'success',
                    },
                }),
            );
        };
        const onError = (errors: Record<string, string>) => {
            const firstError = Object.values(errors || {})[0];

            if (firstError) {
                toastError(firstError as string);
            }
        };

        // If an avatar file is present, submit as FormData
        if (avatarFile) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                formData.append(`new_student[${key}]`, value as any);
            });
            formData.append('new_student[avatar]', avatarFile);
            formData.append('class_section_uuid', classSectionUuid);

            router.post('/admin/enrollments', formData, {
                onFinish: () => setSubmitting(false),
                onSuccess,
                onError: onError as any,
            });
        } else {
            router.post(
                '/admin/enrollments',
                {
                    new_student: payload,
                    class_section_uuid: classSectionUuid,
                },
                {
                    onFinish: () => setSubmitting(false),
                    onSuccess,
                    onError: onError as any,
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

    const reviewRows: [string, string][] = [
        ['Name', composedName || '—'],
        ['Email', form.email || '—'],
        ['Student ID', form.student_id || '—'],
        ['LRN', form.lrn || '—'],
        ['Birthday', form.birthday || '—'],
        ['Contact', form.contact_number || '—'],
        [
            'Address',
            [
                form.address_zone_street,
                form.address_barangay,
                form.address_municipality,
                form.address_province,
            ]
                .map((value) => value.trim())
                .filter(Boolean)
                .join(', ') || '—',
        ],
        ['Previous school', form.previous_school || '—'],
        [
            'Last school year / level',
            [form.last_school_year, form.last_grade_level && `Grade ${form.last_grade_level}`]
                .filter(Boolean)
                .join(' · ') || '—',
        ],
        ['Previous section', form.previous_section || '—'],
    ];

    return (
        <>
            <Head title="Create & Enroll Student" />
            <PortalPageShell
                title="Create & Enroll Student"
                description="Three short steps: who the student is, where they come from, then section and review."
                showBackLink={false}
            >
                <ol className="mb-4 flex items-center gap-2">
                    {STEPS.map((item, index) => {
                        const reachable =
                            item.n === 1 ||
                            (item.n === 2 && step1Valid) ||
                            (item.n === 3 && step1Valid && step2Valid);
                        const active = step === item.n;
                        const done =
                            (item.n === 1 && step1Valid && step > 1) ||
                            (item.n === 2 && step2Valid && step > 2);

                        return (
                            <li
                                key={item.n}
                                className="flex items-center gap-2"
                            >
                                {index > 0 && (
                                    <span className="mx-1 h-px w-6 bg-sidebar-border sm:w-10" />
                                )}
                                <button
                                    type="button"
                                    disabled={!reachable}
                                    onClick={() => setStep(item.n)}
                                    className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                                        active
                                            ? 'bg-indigo-600 text-white'
                                            : done
                                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300'
                                              : 'bg-muted text-muted-foreground'
                                    } disabled:cursor-not-allowed disabled:opacity-70`}
                                >
                                    <span className="flex size-5 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
                                        {done && !active ? (
                                            <CheckCircle2 className="size-3.5" />
                                        ) : (
                                            item.n
                                        )}
                                    </span>
                                    {item.label}
                                </button>
                            </li>
                        );
                    })}
                </ol>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                >
                    {/* Step 1: identity */}
                    {step === 1 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <UserRound className="size-5 text-muted-foreground" />
                                    Who is the student?
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Account credentials are generated
                                    automatically (temporary password defaults
                                    to the birthdate) and emailed to the
                                    address below.
                                </p>
                            </div>
                            <div className="md:row-span-3">
                                <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                    Profile photo
                                </span>
                                <div
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => {
                                        e.preventDefault();
                                        const file =
                                            e.dataTransfer.files?.[0];
                                        handleAvatarFile(file ?? null);
                                    }}
                                    className="mt-2 flex h-48 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/70 bg-background"
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="preview"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="px-4 text-center">
                                            <div className="text-sm font-medium">
                                                Drop or choose a photo
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                PNG, JPG, JPEG, or WEBP
                                            </div>
                                        </div>
                                    )}
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
                                    className="mt-2 block w-full text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-sm file:font-medium file:text-background hover:file:opacity-90"
                                />
                            </div>
                            <Field label="First name" required>
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
                            </Field>
                            <Field label="Middle name">
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
                            </Field>
                            <Field label="Last name" required>
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
                            </Field>
                            <div className="text-sm text-muted-foreground md:col-span-2">
                                Full name:{' '}
                                <span className="font-medium text-foreground">
                                    {composedName || '—'}
                                </span>
                            </div>
                            <Field label="Email" required>
                                <input
                                    type="email"
                                    placeholder="student@example.com"
                                    value={form.email}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            email: e.target.value,
                                        })
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Birthday">
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
                            </Field>
                            <Field label="Contact number">
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Digits only"
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
                            </Field>
                            <Field
                                label="LRN"
                                error={props.errors['new_student.lrn']}
                            >
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="Digits only"
                                    value={form.lrn}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            lrn: keepDigits(e.target.value),
                                        })
                                    }
                                    className={inputClass}
                                />
                            </Field>
                            <Field label="Student ID (auto)">
                                <input
                                    readOnly
                                    value={form.student_id}
                                    className={`${inputClass} bg-muted/60 shadow-sm`}
                                />
                            </Field>
                            <div />
                        </div>
                    )}

                    {/* Step 2: address & history */}
                    {step === 2 && (
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <MapPin className="size-5 text-muted-foreground" />
                                    Address & school history
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Start typing and matching saved addresses
                                    fill in automatically on blur.
                                </p>
                            </div>
                            <Field label="Zone / Street">
                                <input
                                    value={form.address_zone_street}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address_zone_street: e.target.value,
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
                                {addressDatalist(
                                    'address_zone_street',
                                    'common-address-zone-street',
                                )}
                            </Field>
                            <Field label="Barangay" required>
                                <input
                                    value={form.address_barangay}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address_barangay: e.target.value,
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
                                {addressDatalist(
                                    'address_barangay',
                                    'common-address-barangay',
                                )}
                            </Field>
                            <Field label="Municipality" required>
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
                                {addressDatalist(
                                    'address_municipality',
                                    'common-address-municipality',
                                )}
                            </Field>
                            <Field label="Province" required>
                                <input
                                    value={form.address_province}
                                    onChange={(e) =>
                                        setForm({
                                            ...form,
                                            address_province: e.target.value,
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
                                {addressDatalist(
                                    'address_province',
                                    'common-address-province',
                                )}
                            </Field>
                            <div className="md:col-span-2">
                                <h3 className="flex items-center gap-2 text-sm font-semibold">
                                    <School className="size-4 text-muted-foreground" />
                                    Previous educational attainment
                                </h3>
                            </div>
                            <div className="md:col-span-2">
                                <Field label="Previous school" required>
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
                                </Field>
                            </div>
                            <Field label="Last school year" required>
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9-]*"
                                    placeholder="e.g. 2024-2025"
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
                            </Field>
                            <Field label="Last year level" required>
                                <input
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    placeholder="e.g. 7"
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
                            </Field>
                            <div className="md:col-span-2">
                                <Field label="Previous section">
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
                                </Field>
                            </div>
                        </div>
                    )}

                    {/* Step 3: section & review */}
                    {step === 3 && (
                        <div className="grid gap-4">
                            <div>
                                <h2 className="flex items-center gap-2 text-lg font-semibold">
                                    <CheckCircle2 className="size-5 text-emerald-600" />
                                    Section & review
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Confirm everything, then create the account
                                    and enroll in one click.
                                </p>
                            </div>
                            <Field label="Class section target" required>
                                <select
                                    value={classSectionUuid}
                                    onChange={(e) =>
                                        setClassSectionUuid(e.target.value)
                                    }
                                    className={inputClass}
                                >
                                    <option value="">
                                        -- Select class section --
                                    </option>
                                    {classSections.map((section) => (
                                        <option
                                            key={section.uuid}
                                            value={section.uuid}
                                        >
                                            {section.name}{' '}
                                            {section.grade_level
                                                ? `· ${section.grade_level}`
                                                : ''}{' '}
                                            {section.school_year
                                                ? `· ${section.school_year}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            {selectedClassSection && (
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-4 text-sm dark:bg-sidebar/40">
                                    <span className="font-medium">
                                        {selectedClassSection.name} ·{' '}
                                        {selectedClassSection.grade_level ??
                                            'Grade n/a'}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {' '}
                                        — enrolls into{' '}
                                        {
                                            selectedClassSection.subjects.length
                                        }{' '}
                                        subject(s)
                                    </span>
                                </div>
                            )}
                            <dl className="grid gap-x-6 gap-y-3 rounded-xl border border-sidebar-border/70 p-4 text-sm sm:grid-cols-2">
                                {reviewRows.map(([label, value]) => (
                                    <div key={label}>
                                        <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                            {label}
                                        </dt>
                                        <dd className="mt-0.5 font-medium">
                                            {value}
                                        </dd>
                                    </div>
                                ))}
                            </dl>
                        </div>
                    )}

                    {/* Wizard nav */}
                    <div className="mt-6 flex items-center justify-between gap-2">
                        <div>
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        setStep((step - 1) as WizardStep)
                                    }
                                >
                                    <ArrowLeft className="size-4" />
                                    Back
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {step < 3 && (
                                <Button
                                    type="button"
                                    disabled={
                                        (step === 1 && !step1Valid) ||
                                        (step === 2 && !step2Valid)
                                    }
                                    onClick={() =>
                                        setStep((step + 1) as WizardStep)
                                    }
                                    className="bg-indigo-600 hover:bg-indigo-500"
                                >
                                    Continue
                                    <ArrowRight className="size-4" />
                                </Button>
                            )}
                            {step === 3 && (
                                <Button
                                    type="submit"
                                    disabled={
                                        submitting ||
                                        !classSectionUuid ||
                                        !step1Valid ||
                                        !step2Valid
                                    }
                                    className="min-w-40 bg-indigo-600 hover:bg-indigo-500"
                                >
                                    {submitting
                                        ? 'Creating…'
                                        : 'Create & Enroll'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </PortalPageShell>
        </>
    );
}
