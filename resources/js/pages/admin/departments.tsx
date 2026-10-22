import { Head, router, usePage } from '@inertiajs/react';
import {
    BookMarked,
    Building2,
    Eye,
    GraduationCap,
    Layers,
    Pencil,
    Plus,
    Search,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import SearchableSelect from '@/components/searchable-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Teacher = {
    uuid: string;
    name: string;
};

type Major = {
    uuid: string;
    name: string;
    code?: string | null;
};

type MajorAssignment = {
    major_subject_uuid: string;
    strand: string;
};

type DepartmentMajor = {
    uuid: string;
    name: string;
    strand: string;
};

type Department = {
    uuid: string;
    name: string;
    description: string | null;
    type: DepartmentType;
    majors: DepartmentMajor[];
    head: { uuid: string; name: string } | null;
    teacher_count: number;
    teachers: Teacher[];
};

type DepartmentType = 'general' | 'shs_unified' | 'shs_strand';

type DepartmentForm = {
    name: string;
    description: string;
    type: DepartmentType;
    head_uuid: string;
    majors: MajorAssignment[];
};

type Props = {
    departments: Department[];
    allMajors: Major[];
    allUsers: Teacher[];
};

const DEPARTMENT_TYPE_OPTIONS: {
    value: DepartmentType;
    label: string;
    hint: string;
    tone: string;
}[] = [
    {
        value: 'general',
        label: 'General (Junior High)',
        hint: 'Grades 7–10. Majors are not strand-specific.',
        tone: 'border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
        value: 'shs_unified',
        label: 'SHS Unified',
        hint: 'Grades 11–12. One department that covers all strands.',
        tone: 'border-transparent bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300',
    },
    {
        value: 'shs_strand',
        label: 'SHS Strand',
        hint: 'Grades 11–12. One department per strand (strand is required).',
        tone: 'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300',
    },
];

const STRAND_OPTIONS = [
    'Academic - STEM',
    'Academic - ABM',
    'Academic - HUMSS',
    'Academic - GAS',
    'TVL',
    'Sports',
    'Arts and Design',
];

const SELECT_CLASS =
    'w-full rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar';

function emptyDepartmentForm(): DepartmentForm {
    return {
        name: '',
        description: '',
        type: 'general',
        head_uuid: '',
        majors: [],
    };
}

function normalizeRowsForType(
    rows: MajorAssignment[],
    type: DepartmentType,
): MajorAssignment[] {
    if (type === 'shs_strand') {
        return rows;
    }

    return rows.map((r) => ({ ...r, strand: '' }));
}

function departmentTypeOption(type: DepartmentType) {
    return (
        DEPARTMENT_TYPE_OPTIONS.find((o) => o.value === type) ??
        DEPARTMENT_TYPE_OPTIONS[0]
    );
}

function majorLabel(a: DepartmentMajor): string {
    return a.strand ? `${a.name} (${a.strand})` : a.name;
}

function initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return '?';
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
}

export default function AdminDepartments({
    departments,
    allMajors,
    allUsers,
}: Props) {
    const page = usePage();
    const flash = page.props.flash as
        | { success?: string; error?: string }
        | undefined;
    const errors = (page.props.errors ?? {}) as Record<string, string>;

    const [createOpen, setCreateOpen] = useState(false);
    const [createForm, setCreateForm] = useState(emptyDepartmentForm);
    const [creating, setCreating] = useState(false);

    const [editTarget, setEditTarget] = useState<Department | null>(null);
    const [editForm, setEditForm] = useState(emptyDepartmentForm);
    const [saving, setSaving] = useState(false);

    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
    const [deleting, setDeleting] = useState(false);

    const [viewTargetUuid, setViewTargetUuid] = useState<string | null>(null);

    const [assignTargetUuid, setAssignTargetUuid] = useState<string | null>(
        null,
    );
    const [selectedTeacherUuid, setSelectedTeacherUuid] = useState('');
    const [assignableTeachers, setAssignableTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);
    const [assigning, setAssigning] = useState(false);

    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<'' | DepartmentType>('');

    // Derive the open dialogs from the latest props so they stay in sync
    // after an Inertia reload.
    const viewTarget =
        departments.find((d) => d.uuid === viewTargetUuid) ?? null;
    const assignTarget =
        departments.find((d) => d.uuid === assignTargetUuid) ?? null;

    useEffect(() => {
        if (!assignTarget) {
            return;
        }

        fetch(`/admin/departments/${assignTarget.uuid}/subject-teachers`)
            .then((r) => r.json())
            .then((data) => setAssignableTeachers(data.teachers || []))
            .catch(() => setAssignableTeachers([]))
            .finally(() => setLoadingTeachers(false));
    }, [assignTarget]);

    const stats = useMemo(() => {
        const general = departments.filter((d) => d.type === 'general').length;
        const unified = departments.filter(
            (d) => d.type === 'shs_unified',
        ).length;
        const strand = departments.filter(
            (d) => d.type === 'shs_strand',
        ).length;
        const teachers = departments.reduce(
            (sum, d) => sum + d.teacher_count,
            0,
        );
        const majors = new Set(
            departments.flatMap((d) => d.majors.map((m) => m.uuid)),
        ).size;

        return {
            total: departments.length,
            general,
            unified,
            strand,
            teachers,
            majors,
        };
    }, [departments]);

    const filteredDepartments = useMemo(() => {
        const q = search.trim().toLowerCase();

        return departments.filter((dept) => {
            if (typeFilter && dept.type !== typeFilter) {
                return false;
            }

            if (!q) {
                return true;
            }

            return (
                dept.name.toLowerCase().includes(q) ||
                (dept.description ?? '').toLowerCase().includes(q) ||
                (dept.head?.name ?? '').toLowerCase().includes(q) ||
                dept.majors.some((m) => m.name.toLowerCase().includes(q))
            );
        });
    }, [departments, search, typeFilter]);

    function handleCreate() {
        const majors = createForm.majors.filter(
            (m) => m.major_subject_uuid,
        );

        setCreating(true);

        router.post(
            '/admin/departments',
            { ...createForm, majors },
            {
                onSuccess: () => {
                    setCreateOpen(false);
                    setCreateForm(emptyDepartmentForm());
                },
                onFinish: () => setCreating(false),
            },
        );
    }

    function handleEdit() {
        if (!editTarget) {
            return;
        }

        const majors = editForm.majors.filter((m) => m.major_subject_uuid);

        setSaving(true);

        router.patch(
            `/admin/departments/${editTarget.uuid}`,
            { ...editForm, majors },
            {
                onSuccess: () => setEditTarget(null),
                onFinish: () => setSaving(false),
            },
        );
    }

    function handleDelete() {
        if (!deleteTarget) {
            return;
        }

        setDeleting(true);

        router.delete(`/admin/departments/${deleteTarget.uuid}`, {
            onSuccess: () => setDeleteTarget(null),
            onFinish: () => setDeleting(false),
        });
    }

    function handleAssignTeacher() {
        if (!assignTarget || !selectedTeacherUuid) {
            return;
        }

        setAssigning(true);

        router.post(
            `/admin/departments/${assignTarget.uuid}/assign-teacher`,
            { user_uuid: selectedTeacherUuid },
            {
                onSuccess: () => {
                    setSelectedTeacherUuid('');
                    setAssignableTeachers([]);
                },
                onFinish: () => setAssigning(false),
            },
        );
    }

    function handleRemoveTeacher(deptUuid: string, userUuid: string) {
        router.post(`/admin/departments/${deptUuid}/remove-teacher`, {
            user_uuid: userUuid,
        });
    }

    function openEdit(dept: Department) {
        setEditTarget(dept);
        setEditForm({
            name: dept.name,
            description: dept.description || '',
            type: dept.type || 'general',
            head_uuid: dept.head?.uuid || '',
            majors: dept.majors.map((m) => ({
                major_subject_uuid: m.uuid,
                strand: m.strand ?? '',
            })),
        });
    }

    function openAssign(dept: Department) {
        setSelectedTeacherUuid('');
        setAssignableTeachers([]);
        setLoadingTeachers(true);
        setAssignTargetUuid(dept.uuid);
    }

    const assignOptions = assignableTeachers
        .filter(
            (t) => !assignTarget?.teachers.some((dt) => dt.uuid === t.uuid),
        )
        .map((t) => ({ value: t.uuid, label: t.name }));

    return (
        <>
            <Head title="Departments" />
            <PortalPageShell
                title="Departments"
                description="Organize academic departments, link their majors, and assign teachers."
            >
                {flash?.success && (
                    <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <GraduationCap className="mt-0.5 size-4 shrink-0" />
                        <span>{flash.success}</span>
                    </div>
                )}
                {flash?.error && (
                    <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
                        <X className="mt-0.5 size-4 shrink-0" />
                        <span>{flash.error}</span>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <StatCard
                        icon={<Building2 className="size-5 text-sky-600 dark:text-sky-400" />}
                        label="Departments"
                        value={stats.total}
                        tone="bg-sky-100 dark:bg-sky-900/30"
                    />
                    <StatCard
                        icon={<Layers className="size-5 text-emerald-600 dark:text-emerald-400" />}
                        label="General"
                        value={stats.general}
                        tone="bg-emerald-100 dark:bg-emerald-900/30"
                    />
                    <StatCard
                        icon={<Layers className="size-5 text-violet-600 dark:text-violet-400" />}
                        label="SHS Unified"
                        value={stats.unified}
                        tone="bg-violet-100 dark:bg-violet-900/30"
                    />
                    <StatCard
                        icon={<Layers className="size-5 text-amber-600 dark:text-amber-400" />}
                        label="SHS Strand"
                        value={stats.strand}
                        tone="bg-amber-100 dark:bg-amber-900/30"
                    />
                    <StatCard
                        icon={<Users className="size-5 text-blue-600 dark:text-blue-400" />}
                        label="Teachers"
                        value={stats.teachers}
                        tone="bg-blue-100 dark:bg-blue-900/30"
                    />
                    <StatCard
                        icon={<BookMarked className="size-5 text-indigo-600 dark:text-indigo-400" />}
                        label="Majors"
                        value={stats.majors}
                        tone="bg-indigo-100 dark:bg-indigo-900/30"
                    />
                </div>

                <div className="flex flex-col gap-4 rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-foreground">
                                All departments
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                {filteredDepartments.length} of{' '}
                                {departments.length} shown
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search departments..."
                                    className="w-full rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 sm:w-64 dark:bg-sidebar"
                                />
                            </div>
                            <select
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(
                                        e.target.value as '' | DepartmentType,
                                    )
                                }
                                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                title="Filter by type"
                            >
                                <option value="">All types</option>
                                {DEPARTMENT_TYPE_OPTIONS.map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label}
                                    </option>
                                ))}
                            </select>
                            <Button onClick={() => setCreateOpen(true)}>
                                <Plus className="size-4" />
                                Create Department
                            </Button>
                        </div>
                    </div>
                </div>

                {filteredDepartments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sidebar">
                            <Building2 className="size-6 text-muted-foreground/60" />
                        </div>
                        <h3 className="mt-4 text-base font-medium text-foreground">
                            {departments.length === 0
                                ? 'No departments yet'
                                : 'No matching departments'}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {departments.length === 0
                                ? 'Create your first department to get started.'
                                : 'Try a different search term or filter.'}
                        </p>
                        {departments.length === 0 && (
                            <Button
                                className="mt-5"
                                onClick={() => setCreateOpen(true)}
                            >
                                <Plus className="size-4" />
                                Create Department
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {filteredDepartments.map((dept) => {
                            const option = departmentTypeOption(dept.type);

                            return (
                                <div
                                    key={dept.uuid}
                                    className="flex flex-col rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm transition hover:border-sky-300 hover:shadow-md dark:border-sidebar-border dark:bg-sidebar dark:hover:border-sky-800"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex min-w-0 items-start gap-3">
                                            <div className="rounded-xl bg-sky-100 p-2.5 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                                <Building2 className="size-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="truncate font-semibold text-foreground">
                                                    {dept.name}
                                                </h3>
                                                <Badge
                                                    className={`mt-1 ${option.tone}`}
                                                >
                                                    <Layers className="size-3" />
                                                    {option.label}
                                                </Badge>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-0.5">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground"
                                                onClick={() => setViewTargetUuid(dept.uuid)}
                                                title="View details"
                                            >
                                                <Eye className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground"
                                                onClick={() => openAssign(dept)}
                                                title="Manage teachers"
                                            >
                                                <UserPlus className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground"
                                                onClick={() => openEdit(dept)}
                                                title="Edit"
                                            >
                                                <Pencil className="size-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="size-8 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                                                onClick={() =>
                                                    setDeleteTarget(dept)
                                                }
                                                title="Delete"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                                        {dept.description || 'No description provided.'}
                                    </p>

                                    <div className="mt-3 space-y-2 text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Users className="size-3.5 shrink-0" />
                                            <span className="truncate">
                                                Head:{' '}
                                                <span className="font-medium text-foreground">
                                                    {dept.head?.name ?? 'Not assigned'}
                                                </span>
                                            </span>
                                        </div>

                                        {dept.majors.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5">
                                                {dept.majors.slice(0, 3).map((m) => (
                                                    <span
                                                        key={m.uuid}
                                                        className="inline-flex items-center gap-1 rounded-full border border-sidebar-border/70 bg-sidebar/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground dark:border-sidebar-border dark:bg-sidebar"
                                                    >
                                                        <BookMarked className="size-3" />
                                                        {m.strand
                                                            ? `${m.name} · ${m.strand}`
                                                            : m.name}
                                                    </span>
                                                ))}
                                                {dept.majors.length > 3 && (
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                        +{dept.majors.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground/70">
                                                No majors linked
                                            </p>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-sidebar-border/70 pt-4 dark:border-sidebar-border">
                                        {dept.teachers.length > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2">
                                                    {dept.teachers
                                                        .slice(0, 4)
                                                        .map((t) => (
                                                            <span
                                                                key={t.uuid}
                                                                title={t.name}
                                                                className="inline-flex size-7 items-center justify-center rounded-full border-2 border-white bg-sky-100 text-[10px] font-semibold text-sky-700 dark:border-sidebar dark:bg-sky-900/50 dark:text-sky-300"
                                                            >
                                                                {initials(t.name)}
                                                            </span>
                                                        ))}
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {dept.teacher_count} teacher
                                                    {dept.teacher_count !== 1
                                                        ? 's'
                                                        : ''}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-muted-foreground/70">
                                                No teachers assigned
                                            </span>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => openAssign(dept)}
                                            className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                                        >
                                            Manage teachers
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Create Department Dialog */}
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                    <Plus className="size-4" />
                                </span>
                                Create Department
                            </DialogTitle>
                            <DialogDescription>
                                Add a new department and link the majors and
                                teachers it handles.
                            </DialogDescription>
                        </DialogHeader>
                        <DepartmentFormFields
                            form={createForm}
                            setForm={setCreateForm}
                            allMajors={allMajors}
                            allUsers={allUsers}
                            errors={errors}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleCreate}
                                disabled={creating || !createForm.name.trim()}
                            >
                                <Plus className="size-4" />
                                {creating ? 'Creating…' : 'Create Department'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Department Dialog */}
                <Dialog
                    open={!!editTarget}
                    onOpenChange={(open) => !open && setEditTarget(null)}
                >
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="rounded-lg bg-amber-100 p-2 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                                    <Pencil className="size-4" />
                                </span>
                                Edit Department
                            </DialogTitle>
                            <DialogDescription>
                                Update the department details, majors, and
                                head.
                            </DialogDescription>
                        </DialogHeader>
                        <DepartmentFormFields
                            form={editForm}
                            setForm={setEditForm}
                            allMajors={allMajors}
                            allUsers={allUsers}
                            errors={errors}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleEdit}
                                disabled={saving || !editForm.name.trim()}
                            >
                                <Pencil className="size-4" />
                                {saving ? 'Saving…' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => !open && setDeleteTarget(null)}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="rounded-lg bg-red-100 p-2 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                                    <Trash2 className="size-4" />
                                </span>
                                Delete Department
                            </DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete{' '}
                                <strong>{deleteTarget?.name}</strong>? This will
                                also remove all major links, teacher
                                assignments, and the department head role.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                <Trash2 className="size-4" />
                                {deleting ? 'Deleting…' : 'Delete Department'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* View Department Details Dialog */}
                <Dialog
                    open={!!viewTarget}
                    onOpenChange={(open) => !open && setViewTargetUuid(null)}
                >
                    <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                        {viewTarget && (
                            <>
                                <DialogHeader>
                                    <DialogTitle className="flex items-center gap-2">
                                        <span className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                            <Building2 className="size-4" />
                                        </span>
                                        {viewTarget.name}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {viewTarget.description ||
                                            'No description provided.'}
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/40 p-3 dark:border-sidebar-border dark:bg-sidebar/40">
                                        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Type
                                        </p>
                                        <Badge
                                            className={`mt-2 ${departmentTypeOption(viewTarget.type).tone}`}
                                        >
                                            <Layers className="size-3" />
                                            {
                                                departmentTypeOption(
                                                    viewTarget.type,
                                                ).label
                                            }
                                        </Badge>
                                    </div>
                                    <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/40 p-3 dark:border-sidebar-border dark:bg-sidebar/40">
                                        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Department Head
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {viewTarget.head?.name ?? (
                                                <span className="text-muted-foreground">
                                                    Not assigned
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/40 p-3 dark:border-sidebar-border dark:bg-sidebar/40">
                                        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Teachers
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {viewTarget.teacher_count}
                                        </p>
                                    </div>
                                    <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/40 p-3 dark:border-sidebar-border dark:bg-sidebar/40">
                                        <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
                                            Majors
                                        </p>
                                        <p className="mt-2 text-sm font-medium text-foreground">
                                            {viewTarget.majors.length}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <BookMarked className="size-4 text-muted-foreground" />
                                        Linked Majors
                                    </h4>
                                    {viewTarget.majors.length > 0 ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {viewTarget.majors.map((m) => (
                                                <span
                                                    key={m.uuid}
                                                    className="inline-flex items-center gap-1 rounded-full border border-sidebar-border/70 bg-sidebar/50 px-3 py-1 text-xs font-medium dark:border-sidebar-border dark:bg-sidebar"
                                                >
                                                    <BookMarked className="size-3" />
                                                    {majorLabel(m)}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            No majors linked yet.
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                                        <Users className="size-4 text-muted-foreground" />
                                        Assigned Teachers
                                    </h4>
                                    {viewTarget.teachers.length > 0 ? (
                                        <div className="space-y-2">
                                            {viewTarget.teachers.map((t) => (
                                                <div
                                                    key={t.uuid}
                                                    className="flex items-center justify-between gap-3 rounded-xl border border-sidebar-border/70 bg-white p-3 dark:border-sidebar-border dark:bg-sidebar"
                                                >
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                                            {initials(t.name)}
                                                        </span>
                                                        <span className="truncate text-sm text-foreground">
                                                            {t.name}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-8 shrink-0 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                                                        onClick={() =>
                                                            handleRemoveTeacher(
                                                                viewTarget.uuid,
                                                                t.uuid,
                                                            )
                                                        }
                                                        title="Remove teacher"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            No teachers assigned yet.
                                        </p>
                                    )}
                                </div>

                                <DialogFooter>
                                    <DialogClose asChild>
                                        <Button variant="secondary" type="button">
                                            Close
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        onClick={() => {
                                            setViewTargetUuid(null);
                                            openAssign(viewTarget);
                                        }}
                                    >
                                        <UserPlus className="size-4" />
                                        Manage Teachers
                                    </Button>
                                </DialogFooter>
                            </>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Manage Teachers Dialog */}
                <Dialog
                    open={!!assignTarget}
                    onOpenChange={(open) => {
                        if (!open) {
                            setAssignTargetUuid(null);
                            setAssignableTeachers([]);
                            setSelectedTeacherUuid('');
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <span className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                    <Users className="size-4" />
                                </span>
                                Manage Teachers
                            </DialogTitle>
                            <DialogDescription>
                                {assignTarget?.name} ·{' '}
                                {assignTarget?.majors?.length
                                    ? `Showing teachers for ${assignTarget.majors[0]?.name ?? 'the department major'}.`
                                    : 'No major linked — showing all teachers.'}
                            </DialogDescription>
                        </DialogHeader>

                        {assignTarget && assignTarget.teachers.length > 0 && (
                            <div className="space-y-2">
                                {assignTarget.teachers.map((t) => (
                                    <div
                                        key={t.uuid}
                                        className="flex items-center justify-between gap-3 rounded-xl border border-sidebar-border/70 bg-sidebar/40 p-2.5 dark:border-sidebar-border dark:bg-sidebar/40"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                                                {initials(t.name)}
                                            </span>
                                            <span className="truncate text-sm text-foreground">
                                                {t.name}
                                            </span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-7 shrink-0 text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                                            onClick={() =>
                                                handleRemoveTeacher(
                                                    assignTarget.uuid,
                                                    t.uuid,
                                                )
                                            }
                                            title="Remove teacher"
                                        >
                                            <X className="size-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label className="text-xs">
                                Add a teacher
                            </Label>
                            {loadingTeachers ? (
                                <p className="rounded-xl border border-dashed border-sidebar-border/70 px-3 py-2.5 text-sm text-muted-foreground">
                                    Loading teachers…
                                </p>
                            ) : (
                                <SearchableSelect
                                    value={selectedTeacherUuid}
                                    onChange={setSelectedTeacherUuid}
                                    placeholder="Search for a teacher..."
                                    options={assignOptions}
                                />
                            )}
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Done
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleAssignTeacher}
                                disabled={assigning || !selectedTeacherUuid}
                            >
                                <UserPlus className="size-4" />
                                {assigning ? 'Assigning…' : 'Assign Teacher'}
                            </Button>
                        </DialogFooter>
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
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: number | string;
    tone: string;
}) {
    return (
        <div className="rounded-2xl border border-sidebar-border/70 bg-white p-4 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2.5 ${tone}`}>{icon}</div>
                <div className="min-w-0">
                    <div className="text-2xl font-bold">{value}</div>
                    <div className="truncate text-xs text-muted-foreground">
                        {label}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DepartmentFormFields({
    form,
    setForm,
    allMajors,
    allUsers,
    errors,
}: {
    form: DepartmentForm;
    setForm: (form: DepartmentForm) => void;
    allMajors: Major[];
    allUsers: Teacher[];
    errors: Record<string, string>;
}) {
    const typeOption = departmentTypeOption(form.type);

    return (
        <div className="space-y-4 py-1">
            <div className="grid gap-1.5">
                <Label htmlFor="dept-name" className="text-xs">
                    Name *
                </Label>
                <Input
                    id="dept-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Mathematics Department"
                    aria-invalid={!!errors.name}
                />
                {errors.name && (
                    <p className="text-xs text-red-500">{errors.name}</p>
                )}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="dept-description" className="text-xs">
                    Description
                </Label>
                <textarea
                    id="dept-description"
                    value={form.description}
                    onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                    }
                    placeholder="Optional description of the department"
                    rows={3}
                    className="w-full rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-xs transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-sidebar"
                />
                {errors.description && (
                    <p className="text-xs text-red-500">{errors.description}</p>
                )}
            </div>

            <div className="grid gap-1.5">
                <Label htmlFor="dept-type" className="text-xs">
                    Department type
                </Label>
                <select
                    id="dept-type"
                    value={form.type}
                    onChange={(e) => {
                        const type = e.target.value as DepartmentType;
                        setForm({
                            ...form,
                            type,
                            majors: normalizeRowsForType(form.majors, type),
                        });
                    }}
                    className={SELECT_CLASS}
                >
                    {DEPARTMENT_TYPE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                            {o.label}
                        </option>
                    ))}
                </select>
                <p className={`mt-1 rounded-lg px-2.5 py-1.5 text-xs ${typeOption.tone}`}>
                    {typeOption.hint}
                </p>
                {errors.type && (
                    <p className="text-xs text-red-500">{errors.type}</p>
                )}
            </div>

            <MajorPicker
                rows={form.majors}
                allMajors={allMajors}
                type={form.type}
                errors={errors}
                onChange={(rows) => setForm({ ...form, majors: rows })}
            />

            <div className="grid gap-1.5">
                <Label className="text-xs">Department Head</Label>
                <SearchableSelect
                    value={form.head_uuid}
                    onChange={(val) => setForm({ ...form, head_uuid: val })}
                    placeholder="Select a user (optional)"
                    options={allUsers.map((u) => ({
                        value: u.uuid,
                        label: u.name,
                    }))}
                />
                {errors.head_uuid && (
                    <p className="text-xs text-red-500">{errors.head_uuid}</p>
                )}
            </div>
        </div>
    );
}

function MajorPicker({
    rows,
    allMajors,
    type,
    errors,
    onChange,
}: {
    rows: MajorAssignment[];
    allMajors: Major[];
    type: DepartmentType;
    errors: Record<string, string>;
    onChange: (rows: MajorAssignment[]) => void;
}) {
    function addRow() {
        onChange([
            ...rows,
            {
                major_subject_uuid: '',
                strand: '',
            },
        ]);
    }

    function removeRow(index: number) {
        onChange(rows.filter((_, i) => i !== index));
    }

    function updateRow(index: number, patch: Partial<MajorAssignment>) {
        onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
    }

    const emptyHint =
        type === 'general'
            ? 'Link the majors this department handles (grades 7–10).'
            : type === 'shs_strand'
              ? 'Link the majors for grades 11–12 and choose the strand each major belongs to.'
              : 'Link the majors for grades 11–12. This department covers all strands.';

    return (
        <div className="space-y-2.5">
            <div className="flex items-center justify-between">
                <Label className="text-xs">Majors</Label>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                >
                    <Plus className="size-3.5" />
                    Add major
                </Button>
            </div>

            {rows.length === 0 ? (
                <p className="rounded-xl border border-dashed border-sidebar-border/70 bg-sidebar/30 px-3 py-2.5 text-xs text-muted-foreground dark:border-sidebar-border dark:bg-sidebar/30">
                    {emptyHint}
                </p>
            ) : (
                <div className="space-y-2">
                    {rows.map((row, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3 dark:border-sidebar-border dark:bg-sidebar/30"
                        >
                            <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                                <SearchableSelect
                                    value={row.major_subject_uuid}
                                    onChange={(val) =>
                                        updateRow(index, {
                                            major_subject_uuid: val,
                                        })
                                    }
                                    placeholder="Select major"
                                    options={allMajors.map((m) => ({
                                        value: m.uuid,
                                        label: m.name,
                                    }))}
                                />
                                {type === 'shs_strand' ? (
                                    <select
                                        value={row.strand}
                                        onChange={(e) =>
                                            updateRow(index, {
                                                strand: e.target.value,
                                            })
                                        }
                                        className={`rounded-xl border bg-white px-3 py-2 text-sm dark:bg-sidebar ${
                                            row.strand
                                                ? 'border-border'
                                                : 'border-red-400 focus:border-red-500'
                                        }`}
                                    >
                                        <option value="">
                                            Strand (required)
                                        </option>
                                        {STRAND_OPTIONS.map((s) => (
                                            <option key={s} value={s}>
                                                {s}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="hidden sm:block" />
                                )}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 self-start text-muted-foreground hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950/40"
                                    onClick={() => removeRow(index)}
                                    title="Remove major"
                                >
                                    <X className="size-4" />
                                </Button>
                            </div>
                            {type === 'shs_strand' && !row.strand && (
                                <p className="mt-1.5 text-xs text-red-500">
                                    {errors[`majors.${index}.strand`] ??
                                        'A strand is required for this department type.'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
