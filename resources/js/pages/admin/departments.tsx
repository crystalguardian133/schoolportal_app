import { Head, router, usePage } from '@inertiajs/react';
import { Building2, Plus, Pencil, Trash2, UserPlus, Users, X, BookOpen } from 'lucide-react';
import { useState, useEffect } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import SearchableSelect from '@/components/searchable-select';

type Teacher = {
    uuid: string;
    name: string;
};

type Subject = {
    uuid: string;
    name: string;
};

type Department = {
    uuid: string;
    name: string;
    description: string | null;
    subject: { uuid: string; name: string } | null;
    head: { uuid: string; name: string } | null;
    teacher_count: number;
    teachers: Teacher[];
};

type Props = {
    departments: Department[];
    allSubjects: Subject[];
    allUsers: Teacher[];
};

export default function AdminDepartments({ departments, allSubjects, allUsers }: Props) {
    const flash = usePage().props.flash as { success?: string; error?: string } | undefined;

    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState({ name: '', description: '', subject_uuid: '', head_uuid: '' });
    const [editTarget, setEditTarget] = useState<Department | null>(null);
    const [editForm, setEditForm] = useState({ name: '', description: '', subject_uuid: '', head_uuid: '' });
    const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
    const [assignTarget, setAssignTarget] = useState<Department | null>(null);
    const [selectedTeacherUuid, setSelectedTeacherUuid] = useState('');
    const [assignableTeachers, setAssignableTeachers] = useState<Teacher[]>([]);
    const [loadingTeachers, setLoadingTeachers] = useState(false);

    useEffect(() => {
        if (!assignTarget) {
            setAssignableTeachers([]);
            return;
        }

        setLoadingTeachers(true);
        fetch(`/admin/departments/${assignTarget.uuid}/subject-teachers`)
            .then((r) => r.json())
            .then((data) => {
                setAssignableTeachers(data.teachers || []);
                setLoadingTeachers(false);
            })
            .catch(() => setLoadingTeachers(false));
    }, [assignTarget]);

    function handleCreate() {
        router.post('/admin/departments', createForm, {
            onSuccess: () => {
                setShowCreate(false);
                setCreateForm({ name: '', description: '', subject_uuid: '', head_uuid: '' });
            },
        });
    }

    function handleEdit() {
        if (!editTarget) return;
        router.patch(`/admin/departments/${editTarget.uuid}`, editForm, {
            onSuccess: () => setEditTarget(null),
        });
    }

    function handleDelete() {
        if (!deleteTarget) return;
        router.delete(`/admin/departments/${deleteTarget.uuid}`, {
            onSuccess: () => setDeleteTarget(null),
        });
    }

    function handleAssignTeacher() {
        if (!assignTarget || !selectedTeacherUuid) return;
        router.post(`/admin/departments/${assignTarget.uuid}/assign-teacher`, {
            user_uuid: selectedTeacherUuid,
        }, {
            onSuccess: () => setSelectedTeacherUuid(''),
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
                description="Manage departments and assign teachers to each department."
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

                <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{departments.length} department{departments.length !== 1 ? 's' : ''}</p>
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
                                            <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                                {dept.teacher_count} teacher{dept.teacher_count !== 1 ? 's' : ''}
                                            </span>
                                        </div>
                                        {dept.description && (
                                            <p className="mt-1 ml-8 text-sm text-muted-foreground">{dept.description}</p>
                                        )}
                                        <div className="mt-1 ml-8 flex flex-wrap gap-3 text-sm text-muted-foreground">
                                            {dept.subject && (
                                                <span className="inline-flex items-center gap-1">
                                                    <BookOpen className="size-3" /> {dept.subject.name}
                                                </span>
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
                                                    subject_uuid: dept.subject?.uuid || '',
                                                    head_uuid: dept.head?.uuid || '',
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
                    <DialogContent>
                        <DialogTitle>Create Department</DialogTitle>
                        <DialogDescription>Add a new department to organize teachers.</DialogDescription>
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
                                <Label>Subject</Label>
                                <SearchableSelect
                                    value={createForm.subject_uuid}
                                    onChange={(val) => setCreateForm({ ...createForm, subject_uuid: val })}
                                    placeholder="Link a subject (optional)"
                                    options={allSubjects.map((s) => ({ value: s.uuid, label: s.name }))}
                                />
                            </div>
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
                    <DialogContent>
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
                                <Label>Subject</Label>
                                <SearchableSelect
                                    value={editForm.subject_uuid}
                                    onChange={(val) => setEditForm({ ...editForm, subject_uuid: val })}
                                    placeholder="Link a subject (optional)"
                                    options={allSubjects.map((s) => ({ value: s.uuid, label: s.name }))}
                                />
                            </div>
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
                            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This will also remove all teacher assignments and the department head role.
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
                <Dialog open={!!assignTarget} onOpenChange={(open) => !open && setAssignTarget(null)}>
                    <DialogContent>
                        <DialogTitle>Manage Teachers — {assignTarget?.name}</DialogTitle>
                        <DialogDescription>
                            {assignTarget?.subject
                                ? `Showing teachers assigned to ${assignTarget.subject.name}.`
                                : 'No subject linked — showing all teachers.'}
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
