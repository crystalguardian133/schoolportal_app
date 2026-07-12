import { Head, router, usePage } from '@inertiajs/react';
import { BookPlus, Pencil, Plus, Trash2, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Button } from '@/components/ui/button';
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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type SubjectRow = {
    uuid: string;
    name: string;
    code?: string | null;
    description?: string | null;
    teachers: Teacher[];
};

type Teacher = {
    uuid: string;
    name: string;
    email: string;
    profile_picture?: string | null;
    pivot?: {
        is_substitute?: boolean;
    };
};

export default function AdminSubjects() {
    const props = usePage<any>().props;
    const subjectsProp = props.subjects || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
    };
    const subjects: SubjectRow[] = (subjectsProp.data || []).map((s: any) => ({
        ...s,
        teachers: s.teachers || [],
    }));
    const assignableTeachers: Teacher[] = props.assignableTeachers || [];

    const [form, setForm] = useState({
        name: '',
        code: '',
        description: '',
    });

    const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        code: '',
        description: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
    const [teacherAssignTarget, setTeacherAssignTarget] =
        useState<SubjectRow | null>(null);
    const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
    const [isSubstitute, setIsSubstitute] = useState(false);

    function showToast(message: string, type: 'success' | 'error' = 'success') {
        window.dispatchEvent(
            new CustomEvent('local-toast', { detail: { message, type } }),
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        router.post(
            '/admin/subjects',
            {
                name: form.name,
                code: form.code || null,
                description: form.description || null,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    showToast('Subject created successfully.', 'success');
                    setForm({ name: '', code: '', description: '' });
                    router.reload({ only: ['subjects'] });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to create subject.',
                        'error',
                    );
                },
            },
        );
    }

    function openEdit(subject: SubjectRow) {
        setEditSubject(subject);
        setEditForm({
            name: subject.name,
            code: subject.code ?? '',
            description: subject.description ?? '',
        });
    }

    function removeTeacher(subjectUuid: string, teacherUuid: string) {
        router.delete(`/admin/subjects/teachers/${teacherUuid}/${subjectUuid}`, {
            onSuccess: () => {
                showToast('Teacher removed from subject.', 'success');
                router.reload({ only: ['subjects'] });
            },
            onError: () => {
                showToast('Unable to remove teacher.', 'error');
            },
        });
    }

    function assignTeacher() {
        if (!teacherAssignTarget || !selectedTeacher) return;

        router.post(
            '/admin/subjects/assign-teacher',
            {
                subject_uuid: teacherAssignTarget.uuid,
                teacher_uuid: selectedTeacher,
                is_substitute: isSubstitute,
            },
            {
                onSuccess: () => {
                    showToast(
                        isSubstitute
                            ? 'Substitute teacher assigned successfully.'
                            : 'Teacher assigned successfully.',
                        'success',
                    );
                    router.reload({ only: ['subjects'] });
                    setTeacherAssignTarget(null);
                    setSelectedTeacher(null);
                    setIsSubstitute(false);
                },
                onError: () => {
                    showToast('Unable to assign teacher.', 'error');
                },
            },
        );
    }

    function submitEdit(e: React.FormEvent) {
        e.preventDefault();

        if (!editSubject) {
            return;
        }

        setSubmitting(true);
        router.patch(
            '/admin/subjects',
            {
                subject_uuid: editSubject.uuid,
                name: editForm.name,
                code: editForm.code || null,
                description: editForm.description || null,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    showToast('Subject updated successfully.', 'success');
                    setEditSubject(null);
                    router.reload({ only: ['subjects'] });
                },
                onError: (errors) => {
                    const firstError = Object.values(errors || {})[0];
                    showToast(
                        (firstError as string) || 'Unable to update subject.',
                        'error',
                    );
                },
            },
        );
    }

    function deleteSubject(uuid: string) {
        router.delete('/admin/subjects', {
            data: { subject_uuid: uuid },
            onSuccess: () => {
                showToast('Subject deleted successfully.', 'success');
                router.reload({ only: ['subjects'] });
            },
            onError: (errors) => {
                const firstError = Object.values(errors || {})[0];
                showToast(
                    (firstError as string) || 'Unable to delete subject.',
                    'error',
                );
            },
        });
    }

    return (
        <>
            <Head title="Subjects" />
            <PortalPageShell
                title="Subjects"
                description="Create and manage academic subjects."
            >
                <div className="grid gap-4 md:grid-cols-3">
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm md:col-span-1 dark:border-sidebar-border dark:bg-sidebar"
                    >
                        <div className="mb-3 text-sm font-medium">
                            Create Subject
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Subject name</Label>
                            <Input
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                                placeholder="e.g. Mathematics"
                            />

                            <Label className="mt-3 text-xs">Code</Label>
                            <Input
                                value={form.code}
                                onChange={(e) =>
                                    setForm({ ...form, code: e.target.value })
                                }
                                placeholder="e.g. MATH101"
                            />

                            <Label className="mt-3 text-xs">Description</Label>
                            <textarea
                                value={form.description}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        description: e.target.value,
                                    })
                                }
                                placeholder="Brief description of the subject"
                                rows={3}
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            />

                            <div className="mt-4 text-right">
                                <Button
                                    type="submit"
                                    disabled={submitting || !form.name.trim()}
                                >
                                    <BookPlus className="mr-2 h-4 w-4" />
                                    {submitting
                                        ? 'Creating…'
                                        : 'Create Subject'}
                                </Button>
                            </div>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm md:col-span-2 dark:border-sidebar-border dark:bg-sidebar">
                        <div className="mb-3 text-sm text-muted-foreground">
                            Total subjects: {subjectsProp.total ?? 0}
                        </div>
                        <div className="overflow-auto rounded border border-sidebar-border/70">
                            <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Name
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Code
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Description
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Teachers
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {subjects.map((subject) => (
                                        <tr
                                            key={subject.uuid}
                                            className="hover:bg-sidebar-accent/40"
                                        >
                                            <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                                {subject.name}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {subject.code || '-'}
                                            </td>
                                            <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">
                                                {subject.description || '-'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <div className="flex flex-col gap-1">
                                                    {subject.teachers.length >= 2 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setTeacherAssignTarget(
                                                                    subject,
                                                                )
                                                            }
                                                            className="text-left text-sm font-medium text-sidebar-foreground hover:underline"
                                                        >
                                                            {subject.teachers.length} teachers assigned
                                                        </button>
                                                    ) : subject.teachers.length > 0 ? (
                                                        subject.teachers.map(
                                                            (teacher) => (
                                                                <div
                                                                    key={
                                                                        teacher.uuid
                                                                    }
                                                                    className="flex items-center gap-2 text-xs"
                                                                >
                                                                    {teacher.profile_picture ? (
                                                                        <img
                                                                            src={`/assets/profile_pictures/${teacher.profile_picture.replace('profile_pictures/', '')}`}
                                                                            alt={teacher.name}
                                                                            className="h-5 w-5 rounded-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                                                                            {teacher.name.charAt(0)}
                                                                        </div>
                                                                    )}
                                                                    <span
                                                                        className={
                                                                            teacher.pivot?.is_substitute
                                                                                ? 'text-orange-600'
                                                                                : ''
                                                                        }
                                                                    >
                                                                        {
                                                                            teacher.name
                                                                        }
                                                                        {teacher
                                                                            .pivot
                                                                            ?.is_substitute &&
                                                                            ' (Substitute)'}
                                                                    </span>
                                                                    <button
                                                                        onClick={() =>
                                                                            removeTeacher(
                                                                                subject.uuid,
                                                                                teacher.uuid,
                                                                            )
                                                                        }
                                                                        className="text-red-500 hover:text-red-700"
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            ),
                                                        )
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            No teachers
                                                        </span>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            setTeacherAssignTarget(
                                                                subject,
                                                            )
                                                        }
                                                        className="mt-1 w-fit"
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        Add teacher
                                                    </Button>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        openEdit(subject)
                                                    }
                                                    className="mr-2"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Dialog>
                                                    <DialogTrigger asChild>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-red-600"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    subject,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogTitle>
                                                            Delete subject
                                                        </DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you
                                                            want to delete{' '}
                                                            <strong>
                                                                {
                                                                    deleteTarget?.name
                                                                }
                                                            </strong>
                                                            ? This action cannot
                                                            be undone.
                                                        </DialogDescription>
                                                        <DialogFooter>
                                                            <DialogClose asChild>
                                                                <Button variant="secondary">
                                                                    Cancel
                                                                </Button>
                                                            </DialogClose>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => {
                                                                    if (
                                                                        deleteTarget
                                                                    ) {
                                                                        deleteSubject(
                                                                            deleteTarget.uuid,
                                                                        );
                                                                    }
                                                                    setDeleteTarget(
                                                                        null,
                                                                    );
                                                                }}
                                                            >
                                                                Delete
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </PortalPageShell>

            <Dialog
                open={!!editSubject}
                onOpenChange={(open) => !open && setEditSubject(null)}
            >
                <DialogContent>
                    <DialogTitle>Edit subject</DialogTitle>
                    <form onSubmit={submitEdit} className="mt-2 space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs">Subject name</Label>
                            <Input
                                value={editForm.name}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Code</Label>
                            <Input
                                value={editForm.code}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        code: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-xs">Description</Label>
                            <textarea
                                value={editForm.description}
                                onChange={(e) =>
                                    setEditForm({
                                        ...editForm,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs transition outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                disabled={submitting || !editForm.name.trim()}
                            >
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!teacherAssignTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setTeacherAssignTarget(null);
                        setSelectedTeacher(null);
                        setIsSubstitute(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogTitle>
                        Assign teacher to {teacherAssignTarget?.name}
                    </DialogTitle>
                    <div className="mt-4 space-y-4">
                        <div className="grid gap-2">
                            <Label className="text-xs">
                                Select teacher (users with "staff" role or "assign
                                subject teacher" permission)
                            </Label>
                            <Select
                                value={selectedTeacher ?? ''}
                                onValueChange={(value) =>
                                    setSelectedTeacher(value || null)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a teacher" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">None</SelectItem>
                                    {assignableTeachers.map((teacher) => (
                                        <SelectItem
                                            key={teacher.uuid}
                                            value={teacher.uuid}
                                        >
                                            {teacher.name} ({teacher.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-substitute"
                                checked={isSubstitute}
                                onCheckedChange={(checked) =>
                                    setIsSubstitute(!!checked)
                                }
                            />
                            <Label htmlFor="is-substitute" className="text-xs">
                                Assign as substitute teacher
                            </Label>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary" type="button">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={() => {
                                    assignTeacher();
                                }}
                                disabled={!selectedTeacher}
                            >
                                Assign
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}