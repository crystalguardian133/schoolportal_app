import type { PageProps } from '@inertiajs/core';
import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowUpDown,
    Briefcase,
    Camera,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Eye,
    EyeOff,
    GraduationCap,
    MoreHorizontal,
    Pencil,
    Search,
    UserPlus,
    Users,
    UserX,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type Teacher = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    is_adviser?: boolean;
    adviser_section?: string | null;
};

type TeacherPage = {
    data: Teacher[];
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
};

type Filters = {
    q?: string | null;
    per_page?: number | string;
    grade_level?: string | null;
    sort?: string | null;
};

type PageData = PageProps & {
    teachers?: TeacherPage;
    roles?: Record<string, string[]>;
    sections?: { uuid: string; name: string; grade_level: string | null }[];
    gradeLevels?: string[];
    filters?: Filters;
};

const AVATAR_COLORS = [
    'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
];

function initials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';

    return (first + last).toUpperCase();
}

function hashColor(name: string): string {
    let hash = 0;

    for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
    }

    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function initialsOrIcon(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 1 && parts[0].length >= 2) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return initials(name);
}

function avatarUrl(pic?: string | null): string | undefined {
    return pic ? `/assets/${pic}` : undefined;
}

function parseName(name: string): { first_name: string; middle_name: string; last_name: string } {
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

function getPageNumbers(current: number, last: number): Array<number | 'ellipsis'> {
    return Array.from({ length: last }, (_, i) => i + 1)
        .filter((p) => p === 1 || p === last || Math.abs(p - current) <= 1)
        .reduce<Array<number | 'ellipsis'>>((acc, p, idx, arr) => {
            if (idx > 0 && p - arr[idx - 1] > 1) {
                acc.push('ellipsis');
            }

            acc.push(p);

            return acc;
        }, []);
}

function sortLabel(sort: string): string {
    const labels: Record<string, string> = {
        name_asc: 'Name (A → Z)',
        name_desc: 'Name (Z → A)',
        email_asc: 'Email (A → Z)',
        email_desc: 'Email (Z → A)',
        section_asc: 'Adviser (A → Z)',
        section_desc: 'Adviser (Z → A)',
        created_at_asc: 'Oldest first',
        created_at_desc: 'Newest first',
    };

    return labels[sort] ?? 'Name (A → Z)';
}

export default function ManageTeachers() {
    const { props } = usePage<PageData>();
    const teachersProp = props.teachers || { data: [], current_page: 1, last_page: 1, total: 0 };
    const teachers: Teacher[] = teachersProp.data || [];
    const rolesMap: Record<string, string[]> = props.roles || {};
    const filters = props.filters || { q: '', per_page: 25, grade_level: '', sort: 'name_asc' };
    const { sections } = props;
    const gradeLevels: string[] = props.gradeLevels || [];

    const [query, setQuery] = useState(filters.q ?? '');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || 25);
    const [gradeLevel, setGradeLevel] = useState(filters.grade_level ?? '');
    const [sort, setSort] = useState(filters.sort ?? 'name_asc');
    const initialRender = useRef(true);

    const [createOpen, setCreateOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: 'TEACHER',
        is_adviser: false,
        adviser_section: '',
    });
    const [editForm, setEditForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_adviser: false,
        adviser_section: '',
    });
    const [editAvatar, setEditAvatar] = useState<File | null>(null);
    const [editPreview, setEditPreview] = useState<string | undefined>(undefined);
    const [createAvatar, setCreateAvatar] = useState<File | null>(null);
    const [createPreview, setCreatePreview] = useState<string | undefined>(undefined);
    const [showPassword, setShowPassword] = useState(false);
    const [showEditPassword, setShowEditPassword] = useState(false);
    const editPreviewUrlRef = useRef<string | null>(null);
    const createPreviewUrlRef = useRef<string | null>(null);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            reload({ q: query, per_page: perPage, grade_level: gradeLevel, sort });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage, gradeLevel, sort]);

    function reload(params: Record<string, string | number | null | undefined>) {
        router.get('/admin/manage-teachers', params, { preserveState: true, replace: true });
    }

    const allSelected = teachers.length > 0 && teachers.every((t) => selected.has(t.uuid));
    const someSelected = teachers.some((t) => selected.has(t.uuid));

    function toggleAll() {
        const next = new Set(selected);

        if (allSelected) {
            teachers.forEach((t) => next.delete(t.uuid));
        } else {
            teachers.forEach((t) => next.add(t.uuid));
        }

        setSelected(next);
    }

    function toggleOne(uuid: string) {
        const next = new Set(selected);

        if (next.has(uuid)) {
            next.delete(uuid);
        } else {
            next.add(uuid);
        }

        setSelected(next);
    }

    function createTeacher() {
        if (!form.last_name || !form.email || !form.password || !form.password_confirmation) {
            showToast('Please fill in all required fields (name, email, password).', 'error');

            return;
        }

        showToast('Creating teacher account...');

        const payload: Record<string, any> = {
            first_name: form.first_name,
            middle_name: form.middle_name,
            last_name: form.last_name,
            email: form.email,
            password: form.password,
            password_confirmation: form.password_confirmation,
            role: form.role || null,
            is_adviser: form.is_adviser ? 1 : 0,
            adviser_section: form.is_adviser ? form.adviser_section || null : null,
        };

        const onSuccess = () => {
            showToast('Teacher account created successfully.', 'success');
            setCreateOpen(false);
            setForm({
                first_name: '',
                middle_name: '',
                last_name: '',
                email: '',
                password: '',
                password_confirmation: '',
                role: 'TEACHER',
                is_adviser: false,
                adviser_section: '',
            });
            setCreateAvatar(null);
            setCreatePreview(undefined);

            if (createPreviewUrlRef.current) {
                URL.revokeObjectURL(createPreviewUrlRef.current);
                createPreviewUrlRef.current = null;
            }

            router.reload({ only: ['manage-teachers'] });
        };
        const onError = (errors: any) => {
            const firstError = Object.values(errors || {})[0] || 'Unable to create teacher.';
            showToast(firstError as string, 'error');
        };

        if (createAvatar) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                formData.append(key, value !== null && value !== undefined ? String(value) : '');
            });
            formData.append('avatar', createAvatar);

            router.post('/admin/create-teacher', formData, { onSuccess, onError });
        } else {
            router.post('/admin/create-teacher', payload, { onSuccess, onError });
        }
    }

    function handleCreateAvatar(file: File | null) {
        if (createPreviewUrlRef.current) {
            URL.revokeObjectURL(createPreviewUrlRef.current);
            createPreviewUrlRef.current = null;
        }

        setCreateAvatar(file);

        if (!file) {
            setCreatePreview(undefined);

            return;
        }

        const url = URL.createObjectURL(file);
        createPreviewUrlRef.current = url;
        setCreatePreview(url);
    }

    function openEdit(teacher: Teacher) {
        const parsed = parseName(teacher.name);
        setEditingTeacher(teacher);
        setEditForm({
            first_name: parsed.first_name,
            middle_name: parsed.middle_name,
            last_name: parsed.last_name,
            email: teacher.email,
            password: '',
            password_confirmation: '',
            role: (rolesMap[teacher.uuid] || [])[0] || 'TEACHER',
            is_adviser: !!teacher.is_adviser,
            adviser_section: teacher.adviser_section || '',
        });
        setEditAvatar(null);
        setEditPreview(avatarUrl(teacher.profile_picture));
        setShowEditPassword(false);
    }

    function closeEdit() {
        setEditingTeacher(null);
        setEditPreview(undefined);

        if (editPreviewUrlRef.current) {
            URL.revokeObjectURL(editPreviewUrlRef.current);
            editPreviewUrlRef.current = null;
        }
    }

    function handleEditAvatar(file: File | null) {
        if (editPreviewUrlRef.current) {
            URL.revokeObjectURL(editPreviewUrlRef.current);
            editPreviewUrlRef.current = null;
        }

        setEditAvatar(file);

        if (!file) {
            setEditPreview(avatarUrl(editingTeacher?.profile_picture));

            return;
        }

        const url = URL.createObjectURL(file);
        editPreviewUrlRef.current = url;
        setEditPreview(url);
    }

    function updateTeacher() {
        const teacher = editingTeacher;

        if (!teacher) {
return;
}

        if (!editForm.last_name || !editForm.email || !editForm.role) {
            showToast('Name, email, and role are required.', 'error');

            return;
        }

        if (editForm.password && editForm.password !== editForm.password_confirmation) {
            showToast('Passwords do not match.', 'error');

            return;
        }

        const payload: Record<string, any> = {
            first_name: editForm.first_name,
            middle_name: editForm.middle_name,
            last_name: editForm.last_name,
            email: editForm.email,
            role: editForm.role,
            is_adviser: editForm.is_adviser ? 1 : 0,
            adviser_section: editForm.is_adviser ? editForm.adviser_section || null : null,
        };

        if (editForm.password) {
            payload.password = editForm.password;
            payload.password_confirmation = editForm.password_confirmation;
        }

        const onError = (errors?: any) => {
            if (!errors) {
return;
}

            const firstError = Object.values(errors || {})[0];
            showToast((firstError as string) || 'Failed to update teacher.', 'error');
        };
        const onSuccess = () => {
            showToast('Teacher updated successfully.', 'success');
            closeEdit();
            router.reload({ only: ['manage-teachers'] });
        };

        if (editAvatar) {
            const formData = new FormData();
            Object.entries(payload).forEach(([key, value]) => {
                formData.append(key, value !== null && value !== undefined ? String(value) : '');
            });
            formData.append('avatar', editAvatar);
            formData.append('_method', 'PATCH');

            router.post(`/admin/manage-teachers/${teacher.uuid}`, formData, {
                onError,
                onSuccess,
            });
        } else {
            router.patch(`/admin/manage-teachers/${teacher.uuid}`, payload, {
                onError,
                onSuccess,
            });
        }
    }

    const selectedCount = selected.size;

    return (
        <>
            <Head title="Manage Teachers" />
            <PortalPageShell
                title="Manage Teachers"
                description="View and edit teacher accounts."
                showHeader={false}
            >
                <div className="container mx-auto max-w-7xl space-y-4">
                    {/* Title header */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight">Manage Teachers</h1>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                View and edit teacher accounts.
                            </p>
                        </div>
                        <Button onClick={() => setCreateOpen(true)} className="shrink-0">
                            <UserPlus className="size-4" />
                            Create Teacher
                        </Button>
                    </div>

                    {/* Analytics */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                        <StatCard
                            icon={<Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />}
                            label={gradeLevel ? `${gradeLevel} Teachers` : 'Total Teachers'}
                            value={teachersProp.total}
                            iconTone="bg-sky-100 dark:bg-sky-900/30"
                        />
                        <StatCard
                            icon={<Briefcase className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            label="Class Advisers"
                            value={teachers.filter((t) => t.is_adviser).length}
                            iconTone="bg-emerald-100 dark:bg-emerald-900/30"
                        />
                        <StatCard
                            icon={<Camera className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
                            label="With Profile Photo"
                            value={teachers.filter((t) => t.profile_picture).length}
                            iconTone="bg-violet-100 dark:bg-violet-900/30"
                        />
                        <StatCard
                            icon={<GraduationCap className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                            label="On This Page"
                            value={teachers.length}
                            iconTone="bg-amber-100 dark:bg-amber-900/30"
                        />
                    </div>

                    {/* Toolbar */}
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative lg:max-w-sm lg:flex-1">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search by name or email..."
                                    className="pl-9"
                                />
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                {selectedCount > 0 && (
                                    <Badge variant="secondary" className="gap-1 px-3 py-1">
                                        <CheckCircle2 className="size-3.5" />
                                        {selectedCount} selected
                                    </Badge>
                                )}

                                <Select
                                    value={gradeLevel || '__all__'}
                                    onValueChange={(v) => setGradeLevel(v === '__all__' ? '' : v)}
                                >
                                    <SelectTrigger className="w-[150px]" size="sm">
                                        <GraduationCap className="size-4" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__all__">All year levels</SelectItem>
                                        {gradeLevels.map((level) => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <Select value={sort} onValueChange={(v) => setSort(v)}>
                                    <SelectTrigger className="w-[190px]" size="sm">
                                        <SelectValue placeholder="Sort" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name_asc">Name (A → Z)</SelectItem>
                                        <SelectItem value="name_desc">Name (Z → A)</SelectItem>
                                        <SelectItem value="email_asc">Email (A → Z)</SelectItem>
                                        <SelectItem value="email_desc">Email (Z → A)</SelectItem>
                                        <SelectItem value="section_asc">Adviser (A → Z)</SelectItem>
                                        <SelectItem value="section_desc">Adviser (Z → A)</SelectItem>
                                        <SelectItem value="created_at_asc">Oldest first</SelectItem>
                                        <SelectItem value="created_at_desc">Newest first</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select
                                    value={String(perPage)}
                                    onValueChange={(v) => setPerPage(Number(v))}
                                >
                                    <SelectTrigger className="w-[130px]" size="sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10 / page</SelectItem>
                                        <SelectItem value="25">25 / page</SelectItem>
                                        <SelectItem value="50">50 / page</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                            <div className="text-sm text-muted-foreground">
                                {query || gradeLevel
                                    ? `${teachersProp.total} result${teachersProp.total === 1 ? '' : 's'}`
                                    : `Showing ${teachers.length} of ${teachersProp.total} teachers`}
                            </div>
                            {query || gradeLevel ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setQuery('');
                                        setGradeLevel('');
                                        setSort('name_asc');
                                    }}
                                >
                                    Clear filters
                                </Button>
                            ) : (
                                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <ArrowUpDown className="size-3.5" />
                                    Sorted by {sortLabel(sort)}
                                </span>
                            )}
                        </div>
                        <div className="table-scroll-container table-scroll-manage rounded-xl border border-sidebar-border/70">
                            <table className="min-w-full text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground dark:bg-sidebar/40">
                                    <tr>
                                        <th className="w-12 px-4 py-3">
                                            <Checkbox
                                                checked={someSelected && !allSelected ? 'indeterminate' : allSelected}
                                                aria-label="Select all"
                                                onCheckedChange={toggleAll}
                                            />
                                        </th>
                                        <th className="px-4 py-3 font-medium">Name</th>
                                        <th className="px-4 py-3 font-medium">Adviser</th>
                                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {teachers.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="h-32 text-center text-muted-foreground">
                                                No teachers found.
                                            </td>
                                        </tr>
                                    )}
                                    {teachers.map((teacher) => (
                                        <tr
                                            key={teacher.uuid}
                                            className={selected.has(teacher.uuid) ? 'bg-sky-50/60 dark:bg-sky-950/30' : undefined}
                                        >
                                            <td className="px-4 py-3">
                                                <Checkbox
                                                    checked={selected.has(teacher.uuid)}
                                                    onCheckedChange={() => toggleOne(teacher.uuid)}
                                                    aria-label={`Select ${teacher.name}`}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="size-9">
                                                        {teacher.profile_picture ? (
                                                            <AvatarImage src={avatarUrl(teacher.profile_picture)} alt={teacher.name} />
                                                        ) : null}
                                                        <AvatarFallback className={hashColor(teacher.name)}>
                                                            {initialsOrIcon(teacher.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <p className="truncate font-medium text-foreground">
                                                            {teacher.name}
                                                        </p>
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {teacher.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {teacher.is_adviser ? (
                                                    <Badge
                                                        variant="secondary"
                                                        className="gap-1 text-emerald-600 dark:text-emerald-400"
                                                    >
                                                        <Briefcase className="size-3" />
                                                        {teacher.adviser_section || 'Adviser'}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" aria-label="More actions">
                                                            <MoreHorizontal className="size-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onSelect={() => openEdit(teacher)}>
                                                                <Pencil className="size-4" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                variant="destructive"
                                                                onSelect={() => showToast('Teacher removed.', 'error')}
                                                            >
                                                                <UserX className="size-4" />
                                                                Remove
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <nav className="mt-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
                        <p className="text-sm text-muted-foreground">
                            Showing <span className="font-medium text-foreground">{teachers.length}</span> of{' '}
                            <span className="font-medium text-foreground">{teachersProp.total}</span> teachers
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={teachersProp.current_page <= 1}
                                onClick={() => reload({ q: query, per_page: perPage, grade_level: gradeLevel, sort, page: teachersProp.current_page - 1 })}
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="size-4" />
                            </Button>
                            {getPageNumbers(teachersProp.current_page, teachersProp.last_page).map((p, i) =>
                                p === 'ellipsis' ? (
                                    <span key={`e-${i}`} className="px-1.5 text-sm text-muted-foreground">
                                        …
                                    </span>
                                ) : (
                                    <Button
                                        key={p}
                                        variant={p === teachersProp.current_page ? 'default' : 'outline'}
                                        size="icon"
                                        onClick={() => reload({ q: query, per_page: perPage, grade_level: gradeLevel, sort, page: p })}
                                        aria-label={`Page ${p}`}
                                    >
                                        {p}
                                    </Button>
                                ),
                            )}
                            <Button
                                variant="outline"
                                size="icon"
                                disabled={teachersProp.current_page >= teachersProp.last_page}
                                onClick={() => reload({ q: query, per_page: perPage, grade_level: gradeLevel, sort, page: teachersProp.current_page + 1 })}
                                aria-label="Next page"
                            >
                                <ChevronRight className="size-4" />
                            </Button>
                        </div>
                    </nav>
                </div>

                {/* Create Teacher Modal */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Create Teacher</DialogTitle>
                            <DialogDescription>
                                Fill in the details to create a new teacher account.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                createTeacher();
                            }}
                            className="space-y-4"
                        >
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="size-16">
                                        {createPreview ? (
                                            <AvatarImage src={createPreview} alt="Teacher avatar" />
                                        ) : (
                                            <AvatarFallback className="bg-muted text-muted-foreground">
                                                <UserPlus className="size-6" />
                                            </AvatarFallback>
                                        )}
                                    </Avatar>
                                    <label className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-primary">
                                        <Camera className="size-3.5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleCreateAvatar(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Click the camera icon to set a profile photo (optional).
                                </p>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label>Full Name</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        placeholder="First"
                                        value={form.first_name}
                                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Middle"
                                        value={form.middle_name}
                                        onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Last"
                                        value={form.last_name}
                                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    placeholder="teacher@school.edu"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                />
                            </div>

                            {/* Adviser */}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="is-adviser"
                                    checked={form.is_adviser}
                                    onCheckedChange={(checked) =>
                                        setForm({
                                            ...form,
                                            is_adviser: checked === true,
                                            adviser_section: checked === true ? form.adviser_section : '',
                                        })
                                    }
                                />
                                <Label htmlFor="is-adviser" className="text-sm font-normal">
                                    Class Adviser
                                </Label>
                            </div>
                            {form.is_adviser ? (
                                <div className="space-y-1.5">
                                    <Label>Adviser Section</Label>
                                    <Select
                                        value={form.adviser_section || undefined}
                                        onValueChange={(v) => setForm({ ...form, adviser_section: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections?.map((s) => (
                                                <SelectItem key={s.uuid} value={s.name}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            {/* Password */}
                            <div className="rounded-lg border p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Password
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="relative">
                                        <Input
                                            className="pr-10"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="New password"
                                            value={form.password}
                                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                            onClick={() => setShowPassword((s) => !s)}
                                        >
                                            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={form.password_confirmation}
                                        onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit">
                                    <UserPlus className="size-4" />
                                    Create Teacher
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Edit Teacher Modal */}
                <Dialog open={!!editingTeacher} onOpenChange={(open) => !open && closeEdit()}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle>Edit Teacher</DialogTitle>
                            <DialogDescription>
                                Update the details for this teacher account.
                            </DialogDescription>
                        </DialogHeader>
                        <form
                            onSubmit={(e) => {
                                e.preventDefault();
                                updateTeacher();
                            }}
                            className="space-y-4"
                        >
                            {/* Avatar */}
                            <div className="flex items-center gap-4">
                                <div className="relative">
                                    <Avatar className="size-16">
                                        {editPreview ? (
                                            <AvatarImage src={editPreview} alt={editForm.last_name || 'Teacher'} />
                                        ) : null}
                                        <AvatarFallback className={hashColor(editForm.last_name || '?')}>
                                            {initialsOrIcon(`${editForm.first_name} ${editForm.last_name}`)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <label className="absolute -bottom-1 -right-1 flex size-7 cursor-pointer items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:text-primary">
                                        <Camera className="size-3.5" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleEditAvatar(e.target.files?.[0] || null)}
                                        />
                                    </label>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Click the camera icon to update the profile photo.
                                </p>
                            </div>

                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label>Full Name</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        placeholder="First"
                                        value={editForm.first_name}
                                        onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Middle"
                                        value={editForm.middle_name}
                                        onChange={(e) => setEditForm({ ...editForm, middle_name: e.target.value })}
                                    />
                                    <Input
                                        placeholder="Last"
                                        value={editForm.last_name}
                                        onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label>Email</Label>
                                <Input
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                />
                            </div>

                            {/* Adviser */}
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="edit-is-adviser"
                                    checked={editForm.is_adviser}
                                    onCheckedChange={(checked) =>
                                        setEditForm({
                                            ...editForm,
                                            is_adviser: checked === true,
                                            adviser_section: checked === true ? editForm.adviser_section : '',
                                        })
                                    }
                                />
                                <Label htmlFor="edit-is-adviser" className="text-sm font-normal">
                                    Class Adviser
                                </Label>
                            </div>
                            {editForm.is_adviser ? (
                                <div className="space-y-1.5">
                                    <Label>Adviser Section</Label>
                                    <Select
                                        value={editForm.adviser_section || undefined}
                                        onValueChange={(v) => setEditForm({ ...editForm, adviser_section: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select section" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sections?.map((s) => (
                                                <SelectItem key={s.uuid} value={s.name}>
                                                    {s.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ) : null}

                            {/* Password */}
                            <div className="rounded-lg border p-3">
                                <p className="mb-2 text-xs font-medium text-muted-foreground">
                                    Reset Password (optional)
                                </p>
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    <div className="relative">
                                        <Input
                                            className="pr-10"
                                            type={showEditPassword ? 'text' : 'password'}
                                            placeholder="New password"
                                            value={editForm.password}
                                            onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                            onClick={() => setShowEditPassword((s) => !s)}
                                        >
                                            {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <Input
                                        type="password"
                                        placeholder="Confirm password"
                                        value={editForm.password_confirmation}
                                        onChange={(e) => setEditForm({ ...editForm, password_confirmation: e.target.value })}
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline" type="button" onClick={closeEdit}>
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit">
                                    <Pencil className="size-4" />
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </PortalPageShell>
        </>
    );
}

function StatCard({
    icon,
    label,
    value,
    iconTone,
}: {
    icon: ReactNode;
    label: string;
    value: number | string;
    iconTone: string;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${iconTone}`}>{icon}</div>
                <div className="min-w-0">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="truncate text-sm text-muted-foreground">
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}
