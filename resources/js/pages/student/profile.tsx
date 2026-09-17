import { Head, useForm } from '@inertiajs/react';
import { Camera, Calendar, Hash, MapPin, Pencil, Phone, School, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { update } from '@/routes/student/profile';

type StudentData = {
    uuid: string;
    name: string;
    first_name: string | null;
    middle_name: string | null;
    last_name: string | null;
    email: string | null;
    lrn: string | null;
    student_id: string | null;
    grade_level: string | null;
    section: string | null;
    school_year: string | null;
    birthday: string | null;
    age: number | null;
    contact_number: string | null;
    address: string | null;
    address_zone_street: string | null;
    address_barangay: string | null;
    address_municipality: string | null;
    address_province: string | null;
    previous_school: string | null;
    last_school_year: string | null;
    last_grade_level: string | null;
    previous_section: string | null;
    profile_picture: string | null;
};

type Props = {
    student: StudentData;
};

type SimpleForm = {
    data: Record<string, any>;
    setData: (key: string, value: any) => void;
    errors: Record<string, string | undefined>;
    processing: boolean;
};

type EditableFieldProps = {
    label: string;
    icon?: React.ReactNode;
    editing: boolean;
    value: string | number | null;
    name: string;
    form: SimpleForm;
    placeholder?: string;
    type?: string;
    required?: boolean;
    inputClassName?: string;
};

function EditableField({
    label,
    icon,
    editing,
    value,
    name,
    form,
    placeholder = '—',
    type = 'text',
    required = false,
    inputClassName = '',
}: EditableFieldProps) {
    const displayValue = value == null || value === '' ? '—' : String(value);

    return (
        <div>
            <label className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {icon}
                {label}
            </label>
            {editing ? (
                <>
                    <Input
                        id={name}
                        name={name}
                        type={type}
                        value={form.data[name] ?? ''}
                        onChange={(e) => form.setData(name, e.target.value)}
                        placeholder={placeholder}
                        required={required}
                        autoComplete="off"
                        className={`mt-1 ${inputClassName}`}
                    />
                    <InputError message={form.errors[name]} />
                </>
            ) : (
                <p
                    className="mt-1 font-medium truncate"
                    title={displayValue !== '—' ? displayValue : undefined}
                >
                    {displayValue}
                </p>
            )}
        </div>
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

function keepDigits(value: string): string {
    return value.replace(/\D/g, '');
}

export default function StudentProfile({ student }: Props) {
    const [editing, setEditing] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const avatarPreviewUrlRef = useRef<string | null>(null);
    const form = useForm({
        first_name: student.first_name || '',
        middle_name: student.middle_name || '',
        last_name: student.last_name || '',
        email: student.email || '',
        lrn: student.lrn || '',
        student_id: student.student_id || '',
        birthday: student.birthday || '',
        contact_number: student.contact_number || '',
        address_zone_street: student.address_zone_street || '',
        address_barangay: student.address_barangay || '',
        address_municipality: student.address_municipality || '',
        address_province: student.address_province || '',
        previous_school: student.previous_school || '',
        last_school_year: student.last_school_year || '',
        last_grade_level: student.last_grade_level || '',
        previous_section: student.previous_section || '',
        avatar: null as File | null,
    });

    useEffect(() => {
        return () => {
            if (avatarPreviewUrlRef.current) {
                URL.revokeObjectURL(avatarPreviewUrlRef.current);
            }
        };
    }, []);

    function handleAvatarChange(file: File | null) {
        if (avatarPreviewUrlRef.current) {
            URL.revokeObjectURL(avatarPreviewUrlRef.current);
            avatarPreviewUrlRef.current = null;
        }

        form.setData('avatar', file);

        if (!file) {
            setAvatarPreview(null);

            return;
        }

        const url = URL.createObjectURL(file);
        avatarPreviewUrlRef.current = url;
        setAvatarPreview(url);
        setEditing(true);
    }

    useEffect(() => {
        if (!editing) {
            return;
        }

        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                form.reset();
                setEditing(false);
            }
        }

        window.addEventListener('keydown', handleKey);

        return () => window.removeEventListener('keydown', handleKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editing]);

    function handleCancel() {
        form.reset();
        setAvatarPreview(null);
        setEditing(false);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        const firstName = (form.data.first_name || '').trim();
        const middleName = (form.data.middle_name || '').trim();
        const lastName = (form.data.last_name || '').trim();

        form.setData('first_name', firstName);
        form.setData('middle_name', middleName);
        form.setData('last_name', lastName);
        form.setData('lrn', keepDigits(form.data.lrn || ''));

        form.patch(update().url, {
            preserveScroll: true,
            onSuccess: () => {
                if (avatarPreviewUrlRef.current) {
                    URL.revokeObjectURL(avatarPreviewUrlRef.current);
                    avatarPreviewUrlRef.current = null;
                }

                setAvatarPreview(null);
                setEditing(false);
            },
        });
    }

    const avatarUrl = student.profile_picture
        ? `/assets/${student.profile_picture}`
        : null;

    const avatarSrc = avatarPreview ?? avatarUrl;

    const fullName =
        student.name ||
        composeName(
            form.data.first_name,
            form.data.middle_name,
            form.data.last_name,
        );

    return (
        <>
            <Head title="My Profile" />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto p-3 sm:gap-6 sm:p-4">
                <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative h-16 w-16 shrink-0">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-violet-600 ring-2 ring-violet-100 dark:bg-violet-900/30 dark:text-violet-400 dark:ring-violet-900/60">
                                {avatarSrc ? (
                                    <img
                                        src={avatarSrc}
                                        alt="Profile picture"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-7 w-7" />
                                )}
                            </div>

                            <label
                                htmlFor="student-avatar"
                                className="absolute -bottom-1 -right-1 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-sm transition hover:opacity-90"
                            >
                                <Camera className="h-3.5 w-3.5" />
                                <span className="sr-only">Change photo</span>
                            </label>
                        </div>

                        <div className="min-w-0">
                            <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">
                                {fullName}
                            </h1>
                            <p className="mt-0.5 truncate text-sm text-muted-foreground">
                                {student.lrn
                                    ? `LRN: ${student.lrn}`
                                    : 'No LRN assigned'}
                            </p>
                        </div>
                    </div>

                    {editing ? (
                        <div className="flex shrink-0 gap-2">
                            <Button
                                type="submit"
                                form="student-profile-form"
                                disabled={form.processing}
                                className="bg-violet-600 hover:bg-violet-700 text-white"
                            >
                                Save changes
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleCancel}
                                disabled={form.processing}
                            >
                                <X className="mr-1.5 h-4 w-4" />
                                Cancel
                            </Button>
                        </div>
                    ) : (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditing(true)}
                            className="shrink-0 border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30"
                        >
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit Profile
                        </Button>
                    )}
                </header>

                <div className="grid gap-6 lg:grid-cols-3">
                    <aside className="lg:col-span-1">
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Enrollment
                            </h2>

                            <dl className="mt-4 divide-y divide-sidebar-border/70">
                                <div className="flex items-center justify-between gap-3 py-3 first:pt-0">
                                    <dt className="text-sm text-muted-foreground">
                                        Student ID
                                    </dt>
                                    <dd className="text-sm font-medium">
                                        {student.student_id || '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3 py-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Grade Level
                                    </dt>
                                    <dd className="text-sm font-medium">
                                        {student.grade_level || '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3 py-3">
                                    <dt className="text-sm text-muted-foreground">
                                        Section
                                    </dt>
                                    <dd className="text-sm font-medium">
                                        {student.section || '—'}
                                    </dd>
                                </div>
                                <div className="flex items-center justify-between gap-3 py-3 last:pb-0">
                                    <dt className="text-sm text-muted-foreground">
                                        School Year
                                    </dt>
                                    <dd className="text-sm font-medium">
                                        {student.school_year || '—'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </aside>

                    <form
                        id="student-profile-form"
                        onSubmit={handleSubmit}
                        className="space-y-6 lg:col-span-2"
                    >
                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="flex items-center gap-2">
                                <User className="size-5 text-violet-600" />
                                <h2 className="text-base font-semibold">
                                    Personal Information
                                </h2>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <EditableField
                                    label="First Name"
                                    icon={<User className="size-3.5" />}
                                    editing={editing}
                                    value={student.first_name}
                                    name="first_name"
                                    form={form}
                                    required={editing}
                                />
                                <EditableField
                                    label="Middle Name"
                                    icon={<User className="size-3.5" />}
                                    editing={editing}
                                    value={student.middle_name}
                                    name="middle_name"
                                    form={form}
                                />
                                <EditableField
                                    label="Last Name"
                                    icon={<User className="size-3.5" />}
                                    editing={editing}
                                    value={student.last_name}
                                    name="last_name"
                                    form={form}
                                    required={editing}
                                />
                                <EditableField
                                    label="Email Address"
                                    icon={<User className="size-3.5" />}
                                    editing={editing}
                                    value={student.email}
                                    name="email"
                                    form={form}
                                    type="email"
                                    required={editing}
                                />

                                <EditableField
                                    label="LRN"
                                    icon={<Hash className="size-3.5" />}
                                    editing={editing}
                                    value={student.lrn}
                                    name="lrn"
                                    form={form}
                                    placeholder="12-digit LRN"
                                />
                                <EditableField
                                    label="Student ID"
                                    icon={<Hash className="size-3.5" />}
                                    editing={editing}
                                    value={student.student_id}
                                    name="student_id"
                                    form={form}
                                />

                                <EditableField
                                    label="Date of Birth"
                                    icon={<Calendar className="size-3.5" />}
                                    editing={editing}
                                    value={student.birthday ? `${student.birthday}${student.age ? ` (${student.age} yrs)` : ''}` : null}
                                    name="birthday"
                                    form={form}
                                    type="date"
                                />
                                <EditableField
                                    label="Contact Number"
                                    icon={<Phone className="size-3.5" />}
                                    editing={editing}
                                    value={student.contact_number}
                                    name="contact_number"
                                    form={form}
                                    placeholder="Digits only"
                                />

                                <EditableField
                                    label="Zone / Street"
                                    icon={<MapPin className="size-3.5" />}
                                    editing={editing}
                                    value={student.address_zone_street}
                                    name="address_zone_street"
                                    form={form}
                                />
                                <EditableField
                                    label="Barangay"
                                    icon={<MapPin className="size-3.5" />}
                                    editing={editing}
                                    value={student.address_barangay}
                                    name="address_barangay"
                                    form={form}
                                />
                                <EditableField
                                    label="Municipality"
                                    icon={<MapPin className="size-3.5" />}
                                    editing={editing}
                                    value={student.address_municipality}
                                    name="address_municipality"
                                    form={form}
                                />
                                <EditableField
                                    label="Province"
                                    icon={<MapPin className="size-3.5" />}
                                    editing={editing}
                                    value={student.address_province}
                                    name="address_province"
                                    form={form}
                                />
                            </div>
                        </div>

                        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-6 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                            <div className="flex items-center gap-2">
                                <School className="size-5 text-emerald-600" />
                                <h2 className="text-base font-semibold">
                                    Educational Background
                                </h2>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <EditableField
                                        label="Previous School"
                                        icon={<School className="size-3.5" />}
                                        editing={editing}
                                        value={student.previous_school}
                                        name="previous_school"
                                        form={form}
                                    />
                                </div>
                                <EditableField
                                    label="Last Grade Level Completed"
                                    icon={<School className="size-3.5" />}
                                    editing={editing}
                                    value={student.last_grade_level}
                                    name="last_grade_level"
                                    form={form}
                                />
                                <EditableField
                                    label="Last School Year"
                                    icon={<Calendar className="size-3.5" />}
                                    editing={editing}
                                    value={student.last_school_year}
                                    name="last_school_year"
                                    form={form}
                                />
                                <EditableField
                                    label="Previous Section"
                                    icon={<School className="size-3.5" />}
                                    editing={editing}
                                    value={student.previous_section}
                                    name="previous_section"
                                    form={form}
                                />
                            </div>
                        </div>

                    <Input
                        id="student-avatar"
                        name="avatar"
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                            handleAvatarChange(e.target.files?.[0] ?? null)
                        }
                        className="sr-only"
                    />
                    </form>
                </div>
            </div>
        </>
    );
}