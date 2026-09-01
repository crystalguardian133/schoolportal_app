import { Head, router, usePage } from '@inertiajs/react';
import {
    Building2,
    BookMarked,
    Layers,
    Plus,
    Pencil,
    Trash2,
    UserPlus,
    Users,
    X,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import SearchableSelect from '@/components/searchable-select';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
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

type Props = {
    departments: Department[];
    allMajors: Major[];
    allUsers: Teacher[];
};

const DEPARTMENT_TYPE_OPTIONS: {
    value: DepartmentType;
    label: string;
    hint: string;
}[] = [
    {
        value: 'general',
        label: 'General (Junior High)',
        hint: 'Grades 7–10. Majors are not strand-specific.',
    },
    {
        value: 'shs_unified',
        label: 'SHS Unified',
        hint: 'Grades 11–12. One department that covers all strands.',
    },
    {
        value: 'shs_strand',
        label: 'SHS Strand',
        hint: 'Grades 11–12. One department per strand (strand is required).',
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

function emptyDepartmentForm() {
    return {
        name: '',
        description: '',
        type: 'general' as DepartmentType,
        head_uuid: '',
        majors: [] as MajorAssignment[],
    };
}

function emptyMajors(): MajorAssignment[] {
    return [];
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

function departmentTypeLabel(type: DepartmentType): string {
    const option = DEPARTMENT_TYPE_OPTIONS.find((o) => o.value === type);

    return option?.label || 'General (Junior High)';
}

function majorLabel(a: DepartmentMajor): string {
    return a.strand ? `${a.name} (${a.strand})` : a.name;
}

export default function AdminDepartments({
    departments,
    allMajors,
    allUsers,
}: Props) {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState(emptyDepartmentForm);
    const [editForm, setEditForm] = useState(emptyDepartmentForm);
    const [editTarget, setEditTarget] = useState<Department | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
    const [assignTarget, setAssignTarget] = useState<Department | null>(null);
    const [selectedTeacherUuid, setSelectedTeacherUuid] = useState('');
    const [assignableTeachers, setAssignableTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    useEffect(() => {
        if (!assignTarget) {
            return;
        }

        fetch(`/admin/departments/${assignTarget.uuid}/subject-teachers`)
            .then((r) => r.json())
            .then((data) => {
                setAssignableTeachers(data.teachers || []);
                setLoadingTeachers(false);
            })
            .catch(() => setLoadingTeachers(false));
    }, [assignTarget]);

    function handleCreate() {
        const majors = createForm.majors.filter((m) => m.major_subject_uuid);

        router.post('/admin/departments', { ...createForm, majors }, {
            onSuccess: () => {
                setShowCreate(false);
                setCreateForm(emptyDepartmentForm());
            },
        });
    }

    function handleEdit() {
        if (!editTarget) {
return;
}

        const majors = editForm.majors.filter((m) => m.major_subject_uuid);

        router.patch(`/admin/departments/${editTarget.uuid}`, { ...editForm, majors }, {
            onSuccess: () => setEditTarget(null),
        });
    }

    function handleDelete() {
        if (!deleteTarget) {
return;
}

        router.delete(`/admin/departments/${deleteTarget.uuid}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function handleAssignTeacher() {
        if (!assignTarget || !selectedTeacherUuid) {
return;
}

        router.post(`/admin/departments/${assignTarget.uuid}/assign-teacher`, {
            user_uuid: selectedTeacherUuid,
        }, {
            onSuccess: () => {
                setSelectedTeacherUuid('');
                setAssignableTeachers([]);
            },
        });
    }

    function handleRemoveTeacher(deptUuid: string, userUuid: string) {
        router.post(`/admin/departments/${deptUuid}/remove-teacher`, {
            user_uuid: userUuid,
        });
    }

    return (
        <>
            <Head title="Departments" />
            <PortalPageShell
                title="Departments"
                description="Manage departments, their majors by strand, and assign teachers."
            >
                {flash?.success && (
                    <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        {flash.error}
                    </div>
                )}

                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm text-muted-foreground">
                        {departments.length} department{departments.length !== 1 ? 's' : ''}
                    </p>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700"
                    >
                        <Plus className="size-4" /> Create Department
                    </button>
                </div>

                {departments.length === 0 ? (
                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-12 text-center shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                        <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                        <h3 className="mt-4 text-lg font-medium text-foreground">No departments yet</h3>
                        <p className="mt-2 text-sm text-muted-foreground">Create a department to get started.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {departments.map((dept) => (
                            <div
                                key={dept.uuid}
                                className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3">
                                            <Building2 className="size-5 text-sky-600" />
                                            <h3 className="text-lg font-semibold">{dept.name}</h3>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                                    dept.type === 'shs_strand'
                                                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                        : dept.type === 'shs_unified'
                                                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                }`}
                                            >
                                                <Layers className="size-3" />
                                                {departmentTypeLabel(dept.type)}
                                            </span>
                                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                                {dept.teacher_count} teacher{dept.teacher_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {dept.description && (
                                            <p className="mt-1 ml-8 text-sm text-muted-foreground">{dept.description}</p>
                                        )}
                                        <div className="mt-1 ml-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            {dept.majors.length > 0 ? (
                                                dept.majors.map((m) => (
                                                    <span key={m.uuid} className="inline-flex items-center gap-1">
                                                        <BookMarked className="size-3" />
                                                        {majorLabel(m)}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-muted-foreground/70">No majors linked</span>
                                            )}
                                            {dept.head && (
                                                <span className="font-medium">Head: {dept.head.name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => {
                                                setAssignTarget(dept);
                                                setSelectedTeacherUuid('');
                                                setAssignableTeachers([]);
                                                setLoadingTeachers(true);
                                            }}
                                            className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                                            title="Manage Teachers"
                                        >
                                            <UserPlus className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setEditTarget(dept);
                                                setEditForm({
                                                    name: dept.name,
                                                    description: dept.description || '',
                                                    type: dept.type || 'general',
                                                    head_uuid: dept.head?.uuid || '',
                                                    majors: dept.majors.length > 0
                                                        ? dept.majors.map((m) => ({
                                                            major_subject_uuid: m.uuid,
                                                            strand: m.strand ?? '',
                                                        }))
                                                        : emptyMajors(),
                                                });
                                            }}
                                            className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                                            title="Edit"
                                        >
                                            <Pencil className="size-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(dept)}
                                            className="rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                                            title="Delete"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                </div>

                                {dept.teachers.length > 0 && (
                                    <div className="mt-4 ml-8">
                                        <div className="flex flex-wrap gap-2">
                                            {dept.teachers.map((t) => (
                                                <span
                                                    key={t.uuid}
                                                    className="inline-flex items-center gap-1.5 rounded-full border border-sidebar-border/70 bg-sidebar/50 px-3 py-1 text-xs font-medium"
                                                >
                                                    <Users className="size-3" />
                                                    {t.name}
                                                    <button
                                                        onClick={() => handleRemoveTeacher(dept.uuid, t.uuid)}
                                                        className="ml-0.5 rounded-full p-0.5 hover:bg-red-100 hover:text-red-600"
                                                        title="Remove"
                                                    >
                                                        <X className="size-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Department Dialog */}
                <Dialog open={showCreate} onOpenChange={setShowCreate}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogTitle>Create Department</DialogTitle>
                        <DialogDescription>Add a new department and link the majors it handles.</DialogDescription>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    value={createForm.name}
                                    onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                                    placeholder="e.g. Mathematics Department"
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={createForm.description}
                                    onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                                    placeholder="Optional description"
                                />
                            </div>
                            <div>
                                <Label>Department type</Label>
                                <select
                                    value={createForm.type}
                                    onChange={(e) => {
                                        const type = e.target.value as DepartmentType;
                                        setCreateForm({
                                            ...createForm,
                                            type,
                                            majors: normalizeRowsForType(
                                                createForm.majors,
                                                type,
                                            ),
                                        });
                                    }}
                                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-sidebar"
                                >
                                    {DEPARTMENT_TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {DEPARTMENT_TYPE_OPTIONS.find(
                                        (o) => o.value === createForm.type,
                                    )?.hint}
                                </p>
                            </div>
                            <MajorPicker
                                rows={createForm.majors}
                                allMajors={allMajors}
                                type={createForm.type}
                                onChange={(rows) => setCreateForm({ ...createForm, majors: rows })}
                            />
                            <div>
                                <Label>Department Head</Label>
                                <SearchableSelect
                                    value={createForm.head_uuid}
                                    onChange={(val) => setCreateForm({ ...createForm, head_uuid: val })}
                                    placeholder="Select a user (optional)"
                                    options={allUsers.map((u) => ({ value: u.uuid, label: u.name }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-muted">Cancel</DialogClose>
                            <button
                                onClick={handleCreate}
                                disabled={!createForm.name}
                                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                                Create
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Edit Department Dialog */}
                <Dialog open={!!editTarget} onOpenChange={(open) => !open && setEditTarget(null)}>
                    <DialogContent className="max-h-[85vh] overflow-y-auto">
                        <DialogTitle>Edit Department</DialogTitle>
                        <div className="space-y-4 py-2">
                            <div>
                                <Label>Name *</Label>
                                <Input
                                    value={editForm.name}
                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Description</Label>
                                <Input
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Department type</Label>
                                <select
                                    value={editForm.type}
                                    onChange={(e) => {
                                        const type = e.target.value as DepartmentType;
                                        setEditForm({
                                            ...editForm,
                                            type,
                                            majors: normalizeRowsForType(
                                                editForm.majors,
                                                type,
                                            ),
                                        });
                                    }}
                                    className="w-full rounded-lg border border-input bg-white px-3 py-2 text-sm dark:bg-sidebar"
                                >
                                    {DEPARTMENT_TYPE_OPTIONS.map((o) => (
                                        <option key={o.value} value={o.value}>
                                            {o.label}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {DEPARTMENT_TYPE_OPTIONS.find(
                                        (o) => o.value === editForm.type,
                                    )?.hint}
                                </p>
                            </div>
                            <MajorPicker
                                rows={editForm.majors}
                                allMajors={allMajors}
                                type={editForm.type}
                                onChange={(rows) => setEditForm({ ...editForm, majors: rows })}
                            />
                            <div>
                                <Label>Department Head</Label>
                                <SearchableSelect
                                    value={editForm.head_uuid}
                                    onChange={(val) => setEditForm({ ...editForm, head_uuid: val })}
                                    placeholder="Select a user (optional)"
                                    options={allUsers.map((u) => ({ value: u.uuid, label: u.name }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-muted">Cancel</DialogClose>
                            <button
                                onClick={handleEdit}
                                disabled={!editForm.name}
                                className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                                Save
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                    <DialogContent>
                        <DialogTitle>Delete Department</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all major links, teacher assignments and the department head role.
                        </DialogDescription>
                        <DialogFooter>
                            <DialogClose className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-muted">Cancel</DialogClose>
                            <button
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                            >
                                Delete
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Assign Teacher Dialog */}
                <Dialog open={!!assignTarget} onOpenChange={(open) => {
                    if (!open) {
                        setAssignTarget(null);
                        setAssignableTeachers([]);
                    }
                }}>
                    <DialogContent>
                        <DialogTitle>Manage Teachers — {assignTarget?.name}</DialogTitle>
                        <DialogDescription>
                            {assignTarget?.majors?.length
                                ? `Showing teachers assigned to ${assignTarget.majors[0]?.name ?? 'the department major'}.`
                                : 'No major linked — showing all teachers.'}
                        </DialogDescription>
                        <div className="py-4">
                            {loadingTeachers ? (
                                <p className="text-sm text-muted-foreground">Loading teachers...</p>
                            ) : (
                                <SearchableSelect
                                    value={selectedTeacherUuid}
                                    onChange={setSelectedTeacherUuid}
                                    placeholder="Search for a teacher..."
                                    options={assignableTeachers
                                        .filter((t) => !assignTarget?.teachers.some((dt) => dt.uuid === t.uuid))
                                        .map((t) => ({ value: t.uuid, label: t.name }))}
                                />
                            )}
                        </div>
                        <DialogFooter>
                            <DialogClose className="rounded-xl border border-input px-4 py-2 text-sm hover:bg-muted">Done</DialogClose>
                            <button
                                onClick={handleAssignTeacher}
                                disabled={!selectedTeacherUuid}
                                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
                            >
                                <UserPlus className="size-4" /> Assign
                            </button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </PortalPageShell>
        </>
    );
}

function MajorPicker({
    rows,
    allMajors,
    type,
    onChange,
}: {
    rows: MajorAssignment[];
    allMajors: Major[];
    type: DepartmentType;
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
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label>Majors</Label>
                <button
                    type="button"
                    onClick={addRow}
                    className="inline-flex items-center gap-1 rounded-lg border border-input px-2.5 py-1 text-xs font-medium text-sky-600 hover:bg-sky-50 dark:text-sky-400"
                >
                    <Plus className="size-3" /> Add major
                </button>
            </div>

            {rows.length === 0 ? (
                <p className="text-xs text-muted-foreground">{emptyHint}</p>
            ) : (
                rows.map((row, index) => (
                    <div key={index} className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                            <SearchableSelect
                                value={row.major_subject_uuid}
                                onChange={(val) => updateRow(index, {
                                    major_subject_uuid: val,
                                })}
                                placeholder="Select major"
                                options={allMajors.map((m) => ({ value: m.uuid, label: m.name }))}
                            />
                            {type === 'shs_strand' ? (
                                <select
                                    value={row.strand}
                                    onChange={(e) => updateRow(index, { strand: e.target.value })}
                                    className={`rounded-lg border bg-white px-3 py-2 text-sm dark:bg-sidebar ${
                                        row.strand
                                            ? 'border-input'
                                            : 'border-red-400 focus:border-red-500'
                                    }`}
                                >
                                    <option value="">Strand (required)</option>
                                    {STRAND_OPTIONS.map((s) => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            ) : (
                                <span className="hidden sm:block" />
                            )}
                            <button
                                type="button"
                                onClick={() => removeRow(index)}
                                className="self-end rounded-lg p-2 text-muted-foreground hover:bg-red-100 hover:text-red-600"
                                title="Remove major"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        {type === 'shs_strand' && !row.strand && (
                            <p className="mt-1 text-xs text-red-500">
                                A strand is required for this department type.
                            </p>
                        )}
                    </div>
                ))
            )}
        </div>
    );
}
