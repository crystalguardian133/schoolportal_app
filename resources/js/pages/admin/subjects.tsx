import { Head, router, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    BookOpen,
    BookPlus,
    BookMarked,
    ChevronLeft,
    ChevronRight,
    Eye,
    Layers,
    Pencil,
    Plus,
    Search,
    Tags,
    Trash2,
    UserPlus,
    X,
    ShieldAlert,
} from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import ReassignAssignmentModal from '@/components/admin/reassign-assignment-modal';
import MultiSearchableSelect from '@/components/multi-searchable-select';
import { PageLoader } from '@/components/page-loader';
import { PortalPageShell } from '@/components/portal-page-shell';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from '@/components/ui/select';

type SubjectRow = {
    uuid: string;
    name: string;
    code?: string | null;
    category?: string | null;
    track?: string | null;
    strand?: string | null;
    level?: string | null;
    description?: string | null;
    major_subject_id?: string | null;
    major_subject?: { uuid: string; name: string; code?: string | null } | null;
    teachers: Teacher[];
};

type Major = {
    uuid: string;
    name: string;
    code?: string | null;
    subjects_count?: number;
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

type Stats = {
    total: number;
    core: number;
    applied: number;
    specialized: number;
    no_category: number;
    majors: number;
    major_subjects: number;
};

type Paginated<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    from: number;
    to: number;
};

const CATEGORY_OPTIONS = ['Core', 'Applied', 'Specialized'];
const TRACK_OPTIONS = [
    'Academic',
    'Technical-Vocational-Livelihood',
    'Sports',
    'Arts and Design',
];
const STRAND_OPTIONS = [
    'STEM',
    'ABM',
    'HUMSS',
    'GAS',
    'Home Economics',
    'Agri-Fishery Arts',
    'Industrial Arts',
    'ICT',
];

function categoryTone(category?: string | null): string {
    switch (category) {
        case 'Core':
            return 'border-transparent bg-sky-50 text-sky-700 dark:bg-sky-950/70 dark:text-sky-300';
        case 'Applied':
            return 'border-transparent bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300';
        case 'Specialized':
            return 'border-transparent bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300';
        default:
            return 'border-sidebar-border/70 bg-muted text-muted-foreground';
    }
}

function subjectInitials(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z ]/g, '').trim();
    const words = cleaned.split(/\s+/).filter(Boolean);

    if (words.length === 0) {
        return '?';
    }

    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase();
    }

    return (words[0][0] + words[1][0]).toUpperCase();
}

function pageNumbers(current: number, last: number): (number | '...')[] {
    if (last <= 7) {
        return Array.from({ length: last }, (_, i) => i + 1);
    }

    const candidates = [1, last, current, current - 1, current + 1];
    const sorted = [...new Set(candidates)]
        .filter((p) => p >= 1 && p <= last)
        .sort((a, b) => a - b);
    const out: (number | '...')[] = [];
    let prev = 0;

    for (const p of sorted) {
        if (p - prev > 1) {
            out.push('...');
        }

        out.push(p);
        prev = p;
    }

    return out;
}

export default function AdminSubjects() {
    const props = usePage<any>().props;
    const subjectsProp: Paginated<SubjectRow> = props.subjects || {
        data: [],
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 25,
        from: 0,
        to: 0,
    };
    const subjects: SubjectRow[] = (subjectsProp.data || []).map((s: any) => ({
        ...s,
        teachers: s.teachers || [],
    }));
    const assignableTeachers: Teacher[] = props.assignableTeachers || [];
    const allSubjects: SubjectRow[] = (props.allSubjects || []).map((s: any) => ({
        ...s,
        teachers: s.teachers || [],
    }));
    const stats: Stats = props.stats || {
        total: 0,
        core: 0,
        applied: 0,
        specialized: 0,
        no_category: 0,
        majors: 0,
        major_subjects: 0,
    };
    const [majors, setMajors] = useState<Major[]>(props.majors || []);
    const filters = props.filters || { q: null, per_page: 25, major_id: null };
    const currentPage = subjectsProp.current_page || 1;
    const lastPage = subjectsProp.last_page || 1;
    const totalSubjects = subjectsProp.total || 0;

    const [form, setForm] = useState({
        name: '',
        code: '',
        level: 'jhs',
        category: '',
        track: '',
        strand: '',
        description: '',
        major_subject_id: '',
    });

    const [editSubject, setEditSubject] = useState<SubjectRow | null>(null);
    const [editForm, setEditForm] = useState({
        name: '',
        code: '',
        level: 'jhs',
        category: '',
        track: '',
        strand: '',
        description: '',
        major_subject_id: '',
    });

    const [submitting, setSubmitting] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<SubjectRow | null>(null);
    const [teacherAssignTarget, setTeacherAssignTarget] =
        useState<SubjectRow | null>(null);
    const [selectedTeacherUuids, setSelectedTeacherUuids] = useState<string[]>([]);
    const [isSubstitute, setIsSubstitute] = useState(false);
    const [teacherListTarget, setTeacherListTarget] =
        useState<SubjectRow | null>(null);
    const [viewTarget, setViewTarget] = useState<SubjectRow | null>(null);
    const [reassignState, setReassignState] = useState<{
        open: boolean;
        teacher: { uuid: string; name: string; email?: string } | null;
        sourceSubject: SubjectRow | null;
    }>({
        open: false,
        teacher: null,
        sourceSubject: null,
    });

    const [search, setSearch] = useState(filters.q || '');
    const [perPage, setPerPage] = useState(String(filters.per_page || 25));
    const [majorFilter, setMajorFilter] = useState(filters.major_id || '');
    const [majorDialogOpen, setMajorDialogOpen] = useState(false);
    const [majorForm, setMajorForm] = useState({ name: '', code: '' });
    const [majorSubmitting, setMajorSubmitting] = useState(false);
    const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [tableLoading, setTableLoading] = useState(false);

    useEffect(() => {
        const removeStart = router.on('start', (event) => {
            if (event.detail.visit.only?.includes('subjects')) {
                setTableLoading(true);
            }
        });
        const removeFinish = router.on('finish', () => setTableLoading(false));

        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    function filterParams(): Record<string, string | number | undefined> {
        return {
            q: search || undefined,
            per_page: perPage,
            major_id: majorFilter || undefined,
        };
    }

    function reload(params: Record<string, string | number | undefined>) {
        router.get(
            '/admin/subjects',
            params,
            {
                preserveState: true,
                replace: true,
                preserveScroll: true,
                showProgress: false,
                only: ['subjects', 'filters'],
            },
        );
    }

    function goToPage(page: number) {
        if (page < 1 || page > lastPage) {
            return;
        }

        reload({
            page,
            ...filterParams(),
        });
    }

    function handleSearch(value: string) {
        setSearch(value);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            reload({
                ...filterParams(),
                q: value || undefined,
                page: 1,
            });
        }, 300);
    }

    function handlePerPage(value: string) {
        setPerPage(value);
        reload({
            ...filterParams(),
            per_page: value,
            page: 1,
        });
    }

    function handleMajorFilter(value: string) {
        setMajorFilter(value);
        reload({
            ...filterParams(),
            major_id: value || undefined,
            page: 1,
        });
    }

    function clearFilters() {
        setSearch('');
        setMajorFilter('');
        reload({
            q: undefined,
            per_page: perPage,
            major_id: undefined,
            page: 1,
        });
    }

    async function addMajor() {
        if (!majorForm.name.trim()) {
            return;
        }

        setMajorSubmitting(true);

        try {
            const res = await fetch('/admin/subject-majors', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document
                            .querySelector('meta[name="csrf-token"]')
                            ?.getAttribute('content') || '',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    name: majorForm.name,
                    code: majorForm.code || null,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const firstMessage =
                    Object.values(data.errors || {})[0] ||
                    data.message ||
                    'Unable to create major.';
                showToast(firstMessage as string, 'error');

                return;
            }

            setMajors((prev) => [...prev, data]);
            setForm((prev) => ({
                ...prev,
                major_subject_id: data.uuid,
            }));
            setEditForm((prev) => ({
                ...prev,
                major_subject_id: data.uuid,
            }));
            setMajorDialogOpen(false);
            setMajorForm({ name: '', code: '' });
            showToast('Major added successfully.', 'success');
        } catch {
            showToast('Unable to create major.', 'error');
        } finally {
            setMajorSubmitting(false);
        }
    }

    function showToast(
        message: string,
        type: 'success' | 'error' = 'success',
    ) {
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
                level: form.level,
                category: form.category || null,
                track: form.track || null,
                strand: form.strand || null,
                description: form.description || null,
                major_subject_id: form.major_subject_id || null,
            },
            {
                onFinish: () => setSubmitting(false),
                onSuccess: () => {
                    showToast('Subject created successfully.', 'success');
                    setForm({
                        name: '',
                        code: '',
                        level: 'jhs',
                        category: '',
                        track: '',
                        strand: '',
                        description: '',
                        major_subject_id: '',
                    });
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
            category: subject.category ?? '',
            track: subject.track ?? '',
            strand: subject.strand ?? '',
            description: subject.description ?? '',
            level: subject.level ?? 'jhs',
            major_subject_id: subject.major_subject_id ?? '',
        });
    }

    function assignTeacher() {
        if (!teacherAssignTarget || selectedTeacherUuids.length === 0) {
            return;
        }

        router.post(
            '/admin/subjects/assign-teacher',
            {
                subject_uuid: teacherAssignTarget.uuid,
                teacher_uuids: selectedTeacherUuids,
                is_substitute: isSubstitute,
            },
            {
                onSuccess: () => {
                    showToast(
                        isSubstitute
                            ? 'Substitute teacher(s) assigned successfully.'
                            : 'Teacher(s) assigned successfully.',
                        'success',
                    );
                    router.reload({ only: ['subjects'] });
                    setTeacherAssignTarget(null);
                    setSelectedTeacherUuids([]);
                    setIsSubstitute(false);
                },
                onError: () => {
                    showToast('Unable to assign teacher.', 'error');
                },
            },
        );
    }

    function removeTeacher(subjectUuid: string, teacherUuid: string) {
        router.delete(
            `/admin/subjects/teachers/${teacherUuid}/${subjectUuid}`,
            {
                onSuccess: () => {
                    showToast('Teacher removed from subject.', 'success');
                    router.reload({ only: ['subjects'] });
                },
                onError: () => {
                    showToast('Unable to remove teacher.', 'error');
                },
            },
        );
    }

    function openReassign(
        teacher: { uuid: string; name: string; email?: string },
    ) {
        const subject = teacherListTarget;

        setTeacherListTarget(null);

        if (!subject) {
            return;
        }

        setReassignState({
            open: true,
            teacher,
            sourceSubject: subject,
        });
    }

    function handleReassigned() {
        setReassignState({
            open: false,
            teacher: null,
            sourceSubject: null,
        });
        setTeacherListTarget(null);
        router.reload({ only: ['subjects'] });
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
                level: editForm.level,
                category: editForm.category || null,
                track: editForm.track || null,
                strand: editForm.strand || null,
                description: editForm.description || null,
                major_subject_id: editForm.major_subject_id || null,
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
                description="Create academic subjects and organize them by curriculum category, track, and strand."
            >
                <PageLoader skeleton="table">
                    {/* Stat cards */}
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                        <StatCard
                            icon={
                                <BookOpen className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                            }
                            label="Total Subjects"
                            value={stats.total}
                            iconTone="bg-sky-100 dark:bg-sky-900/30"
                        />
                        <StatCard
                            icon={
                                <BookMarked className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            }
                            label="Core"
                            value={stats.core}
                            iconTone="bg-indigo-100 dark:bg-indigo-900/30"
                        />
                        <StatCard
                            icon={
                                <Layers className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                            }
                            label="Applied"
                            value={stats.applied}
                            iconTone="bg-violet-100 dark:bg-violet-900/30"
                        />
                        <StatCard
                            icon={
                                <Tags className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            }
                            label="Specialized"
                            value={stats.specialized}
                            iconTone="bg-amber-100 dark:bg-amber-900/30"
                        />
                        <StatCard
                            icon={
                                <BookMarked className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            }
                            label="Majors"
                            value={stats.majors}
                            iconTone="bg-emerald-100 dark:bg-emerald-900/30"
                        />
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        {/* Table panel */}
                        <div className="flex flex-col rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm lg:col-span-2 dark:border-sidebar-border dark:bg-sidebar">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div className="text-sm text-muted-foreground">
                                    {search
                                        ? `${totalSubjects} result${totalSubjects === 1 ? '' : 's'} for "${search}"`
                                        : `Showing ${subjectsProp.from || 0}–${subjectsProp.to || 0} of ${totalSubjects} subjects`}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            type="text"
                                            value={search}
                                            onChange={(e) =>
                                                handleSearch(e.target.value)
                                            }
                                            placeholder="Search subjects..."
                                            className="rounded-xl border border-border bg-white py-2 pr-4 pl-9 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                        />
                                    </div>
                                    <select
                                        value={majorFilter}
                                        onChange={(e) =>
                                            handleMajorFilter(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                        title="Filter by major"
                                    >
                                        <option value="">All majors</option>
                                        {majors.map((m) => (
                                            <option key={m.uuid} value={m.uuid}>
                                                {m.name}
                                            </option>
                                        ))}
                                    </select>
                                    <select
                                        value={perPage}
                                        onChange={(e) =>
                                            handlePerPage(e.target.value)
                                        }
                                        className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                                    >
                                        <option value="10">10 / page</option>
                                        <option value="25">25 / page</option>
                                        <option value="50">50 / page</option>
                                        <option value="100">100 / page</option>
                                    </select>
                                    {(search ||
                                        majorFilter) && (
                                        <button
                                            type="button"
                                            onClick={clearFilters}
                                            className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
                                        >
                                            <X className="size-3.5" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="table-scroll-container relative min-h-0 flex-1 overflow-auto rounded-xl border border-sidebar-border/70">
                                {tableLoading && (
                                    <div className="absolute inset-0 z-10 rounded-xl bg-white/70 backdrop-blur-sm dark:bg-sidebar/70">
                                        <table className="h-full min-w-full divide-y divide-sidebar-border/70 text-sm">
                                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                                <tr>
                                                    <th className="px-4 py-3 font-medium">Subject</th>
                                                    <th className="px-4 py-3 font-medium">Curriculum</th>
                                                    <th className="px-4 py-3 font-medium">Teachers</th>
                                                    <th className="px-4 py-3 font-medium">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                                {Array.from({
                                                    length: Number(perPage) || 10,
                                                }).map((_, i) => (
                                                    <tr key={i} className="skeleton-glint">
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-9 w-9 rounded-lg bg-muted" />
                                                                <div className="space-y-1.5">
                                                                    <div className="h-3.5 w-32 rounded bg-muted" />
                                                                    <div className="h-3 w-20 rounded bg-muted" />
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3"><div className="h-4 w-24 rounded bg-muted" /></td>
                                                        <td className="px-4 py-3"><div className="h-4 w-20 rounded bg-muted" /></td>
                                                        <td className="px-4 py-3"><div className="h-6 w-28 rounded bg-muted" /></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                <table className="h-full min-w-full divide-y divide-sidebar-border/70 text-sm">
                                    <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">Subject</th>
                                            <th className="px-4 py-3 font-medium">Curriculum</th>
                                            <th className="px-4 py-3 font-medium">Teachers</th>
                                            <th className="px-4 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                        {subjects.length === 0 && !tableLoading && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-4 py-14 text-center"
                                                >
                                                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-sidebar">
                                                        <BookOpen className="size-6 text-muted-foreground/60" />
                                                    </div>
                                                    <p className="mt-4 text-sm font-medium text-sidebar-foreground">
                                                        No subjects found
                                                    </p>
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {search
                                                            ? 'Try a different search, or clear the filter to see all subjects.'
                                                            : 'Create a subject to get started.'}
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                        {subjects.map((subject) => (
                                            <tr
                                                key={subject.uuid}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-9 rounded-lg">
                                                            <AvatarFallback className="rounded-lg bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900/30 dark:text-sky-300">
                                                                {subjectInitials(
                                                                    subject.name,
                                                                )}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="min-w-0">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="truncate font-medium text-sidebar-foreground">
                                                                        {subject.name}
                                                                    </span>
                                                                    {subject.code && (
                                                                        <span className="rounded-md border border-sidebar-border/70 bg-sidebar/60 px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
                                                                            {subject.code}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <CurriculumTags
                                                        subject={subject}
                                                        onShowMore={() =>
                                                            setViewTarget(subject)
                                                        }
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <div className="flex items-center gap-3">
                                                        {subject.teachers.length > 0 ? (
                                                            <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setTeacherListTarget(
                                                                            subject,
                                                                        )
                                                                    }
                                                                    className="flex -space-x-2"
                                                                    title="View all teachers"
                                                                >
                                                                    {subject.teachers
                                                                        .slice(0, 3)
                                                                        .map(
                                                                            (teacher) => (
                                                                                <div
                                                                                    key={teacher.uuid}
                                                                                    className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-muted text-[10px] font-semibold text-sidebar-foreground dark:border-sidebar"
                                                                                >
                                                                                    {teacher.name
                                                                                        .charAt(0)
                                                                                        .toUpperCase()}
                                                                                </div>
                                                                            ),
                                                                        )}
                                                                </button>
                                                            ) : (
                                                                <span className="text-xs text-muted-foreground">
                                                                    No teachers
                                                                </span>
                                                            )}
                                                            {subject.teachers.length > 0 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setTeacherListTarget(
                                                                            subject,
                                                                        )
                                                                    }
                                                                    className="text-xs font-medium text-sky-600 hover:underline dark:text-sky-400"
                                                                >
                                                                    {subject.teachers.length >= 3
                                                                        ? `${subject.teachers.length - 3}+ more`
                                                                        : `${subject.teachers.length} teacher${subject.teachers.length === 1 ? '' : 's'}`}
                                                                </button>
                                                            )}
                                                        </div>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9"
                                                            onClick={() =>
                                                                setViewTarget(subject)
                                                            }
                                                            title="View subject details"
                                                            aria-label="View subject details"
                                                        >
                                                            <Eye className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9"
                                                            onClick={() =>
                                                                setTeacherAssignTarget(
                                                                    subject,
                                                                )
                                                            }
                                                            title="Add teacher"
                                                            aria-label="Add teacher"
                                                        >
                                                            <UserPlus className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9"
                                                            onClick={() =>
                                                                openEdit(subject)
                                                            }
                                                            title="Edit subject"
                                                            aria-label="Edit subject"
                                                        >
                                                            <Pencil className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            className="size-9 text-red-600"
                                                            onClick={() =>
                                                                setDeleteTarget(
                                                                    subject,
                                                                )
                                                            }
                                                            aria-label="Delete subject"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {lastPage > 1 && (
                                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                                    <p className="text-sm text-muted-foreground">
                                        Page {currentPage} of {lastPage} (
                                        {totalSubjects} total)
                                    </p>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() =>
                                                goToPage(currentPage - 1)
                                            }
                                            disabled={currentPage <= 1}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            <ChevronLeft className="size-4" />
                                            Prev
                                        </button>
                                        {pageNumbers(
                                            currentPage,
                                            lastPage,
                                        ).map((page, index) =>
                                            page === '...' ? (
                                                <span
                                                    key={`gap-${index}`}
                                                    className="px-2 text-sm text-muted-foreground"
                                                >
                                                    …
                                                </span>
                                            ) : (
                                                <button
                                                    key={page}
                                                    onClick={() =>
                                                        goToPage(page)
                                                    }
                                                    className={`size-8 rounded-lg border text-sm font-medium transition ${
                                                        page === currentPage
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-border text-muted-foreground hover:bg-muted'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            ),
                                        )}
                                        <button
                                            onClick={() =>
                                                goToPage(currentPage + 1)
                                            }
                                            disabled={currentPage >= lastPage}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                                        >
                                            Next
                                            <ChevronRight className="size-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Create panel */}
                        <form
                            onSubmit={submit}
                            className="h-fit rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar"
                        >
                            <div className="mb-4 flex items-center gap-2">
                                <div className="rounded-lg bg-sky-100 p-2 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400">
                                    <BookPlus className="size-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold">
                                        Create Subject
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Add a new academic subject
                                    </div>
                                </div>
                            </div>
                            <div className="grid gap-4">
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Subject name *</Label>
                                    <Input
                                        value={form.name}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                name: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. Mathematics"
                                    />
                                </div>
                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Code</Label>
                                    <Input
                                        value={form.code}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                code: e.target.value,
                                            })
                                        }
                                        placeholder="e.g. MATH101"
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                        <Label className="text-xs">Major</Label>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={form.major_subject_id || undefined}
                                                onValueChange={(v) =>
                                                    setForm({
                                                        ...form,
                                                        major_subject_id:
                                                            v === '__none__'
                                                                ? ''
                                                                : v,
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select major" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__none__">
                                                        None
                                                    </SelectItem>
                                                    {majors.map((m) => (
                                                        <SelectItem
                                                            key={m.uuid}
                                                            value={m.uuid}
                                                        >
                                                            {m.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="icon"
                                                className="size-9 shrink-0"
                                                onClick={() =>
                                                    setMajorDialogOpen(true)
                                                }
                                                title="Add new major"
                                                aria-label="Add new major"
                                            >
                                                <Plus className="size-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="grid gap-1.5">
                                        <Label className="text-xs">Curriculum</Label>
                                    <CurriculumFields
                                        value={form}
                                        onChange={setForm}
                                    />
                                </div>

                                <div className="grid gap-1.5">
                                    <Label className="text-xs">Description</Label>
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
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={submitting || !form.name.trim()}
                                >
                                    <BookPlus className="mr-2 h-4 w-4" />
                                    {submitting
                                        ? 'Creating…'
                                        : 'Create Subject'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </PageLoader>
            </PortalPageShell>

            {/* Edit dialog */}
            <Dialog
                open={!!editSubject}
                onOpenChange={(open) => !open && setEditSubject(null)}
            >
                <DialogContent>
                    <DialogTitle>Edit subject</DialogTitle>
                    <form
                        onSubmit={submitEdit}
                        className="mt-2 space-y-4"
                    >
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Subject name *</Label>
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
                        <div className="grid gap-1.5">
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
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Major</Label>
                            <div className="flex items-center gap-2">
                                <Select
                                    value={editForm.major_subject_id || undefined}
                                    onValueChange={(v) =>
                                        setEditForm({
                                            ...editForm,
                                            major_subject_id:
                                                v === '__none__' ? '' : v,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select major" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="__none__">
                                            None
                                        </SelectItem>
                                        {majors.map((m) => (
                                            <SelectItem
                                                key={m.uuid}
                                                value={m.uuid}
                                            >
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    className="size-9 shrink-0"
                                    onClick={() => setMajorDialogOpen(true)}
                                    title="Add new major"
                                    aria-label="Add new major"
                                >
                                    <Plus className="size-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Curriculum</Label>
                            <CurriculumFields
                                value={editForm}
                                onChange={setEditForm}
                            />
                        </div>
                        <div className="grid gap-1.5">
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

            {/* Delete dialog */}
            <Dialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete subject</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete{' '}
                        <strong>{deleteTarget?.name}</strong>? This action cannot
                        be undone.
                    </DialogDescription>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleteTarget) {
                                    deleteSubject(deleteTarget.uuid);
                                }

                                setDeleteTarget(null);
                            }}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add major dialog */}
            <Dialog
                open={majorDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setMajorDialogOpen(false);
                        setMajorForm({ name: '', code: '' });
                    }
                }}
            >
                <DialogContent>
                    <DialogTitle>Add major</DialogTitle>
                    <DialogDescription>
                        A major groups related subjects that belong to the same
                        subject family.
                    </DialogDescription>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            addMajor();
                        }}
                        className="mt-2 space-y-4"
                    >
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Major name *</Label>
                            <Input
                                value={majorForm.name}
                                onChange={(e) =>
                                    setMajorForm({
                                        ...majorForm,
                                        name: e.target.value,
                                    })
                                }
                                placeholder="e.g. Mathematics"
                            />
                        </div>
                        <div className="grid gap-1.5">
                            <Label className="text-xs">Code</Label>
                            <Input
                                value={majorForm.code}
                                onChange={(e) =>
                                    setMajorForm({
                                        ...majorForm,
                                        code: e.target.value,
                                    })
                                }
                                placeholder="e.g. MAJ-MATH"
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
                                disabled={majorSubmitting || !majorForm.name.trim()}
                            >
                                {majorSubmitting ? 'Adding…' : 'Add major'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Assign teacher dialog */}
            <Dialog
                open={!!teacherAssignTarget}
                onOpenChange={(open) => {
                    if (!open) {
                        setTeacherAssignTarget(null);
                        setSelectedTeacherUuids([]);
                        setIsSubstitute(false);
                    }
                }}
            >
                <DialogContent>
                    <DialogTitle>
                        Assign teacher to {teacherAssignTarget?.name}
                    </DialogTitle>
                    <div className="mt-4 space-y-4">
                        <div className="grid gap-1.5">
                            <Label className="text-xs">
                                Select teacher(s) (users with "staff" role or
                                "assign subject teacher" permission)
                            </Label>
                            <MultiSearchableSelect
                                value={selectedTeacherUuids}
                                onChange={setSelectedTeacherUuids}
                                placeholder="Select teachers to assign"
                                options={assignableTeachers.map((teacher) => ({
                                    value: teacher.uuid,
                                    label: teacher.name,
                                    sublabel: teacher.email,
                                }))}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="is-substitute"
                                checked={isSubstitute}
                                onCheckedChange={(checked) =>
                                    setIsSubstitute(!!checked)
                                }
                            />
                            <Label
                                htmlFor="is-substitute"
                                className="text-xs"
                            >
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
                                disabled={selectedTeacherUuids.length === 0}
                            >
                                Assign
                                {selectedTeacherUuids.length > 0
                                    ? ` ${selectedTeacherUuids.length}`
                                    : ''}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Subject detail dialog */}
            <Dialog
                open={!!viewTarget}
                onOpenChange={(open) => !open && setViewTarget(null)}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-4xl">
                    <DialogTitle>Subject details</DialogTitle>
                    <DialogDescription>
                        Full information for {viewTarget?.name}.
                    </DialogDescription>
                    <div className="mt-2 grid gap-6 lg:grid-cols-[1fr_360px]">
                        <div className="min-w-0 space-y-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="text-lg font-semibold text-sidebar-foreground">
                                    {viewTarget?.name}
                                </span>
                                {viewTarget?.code && (
                                    <span className="rounded-md border border-sidebar-border/70 bg-sidebar/60 px-2 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                                        {viewTarget.code}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-1.5">
                                {viewTarget && (
                                    <CurriculumTags subject={viewTarget} />
                                )}
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Major
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium">
                                        {viewTarget?.major_subject?.name || '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Level
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium">
                                        {viewTarget?.level
                                            ? viewTarget.level.toUpperCase()
                                            : '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Category
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium">
                                        {viewTarget?.category || '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Track
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium">
                                        {viewTarget?.track || '—'}
                                    </div>
                                </div>
                                <div className="rounded-xl border border-sidebar-border/70 bg-sidebar/30 p-3">
                                    <div className="text-xs font-medium text-muted-foreground">
                                        Strand
                                    </div>
                                    <div className="mt-0.5 text-sm font-medium">
                                        {viewTarget?.strand || '—'}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-xs text-muted-foreground">
                                    Description
                                </Label>
                                <p className="mt-1 whitespace-pre-line text-sm text-sidebar-foreground">
                                    {viewTarget?.description ||
                                        'No description.'}
                                </p>
                            </div>
                        </div>

                        <div className="min-w-0">
                            <Label className="text-xs text-muted-foreground">
                                Teachers (
                                {viewTarget?.teachers.length ?? 0})
                            </Label>
                            {viewTarget && viewTarget.teachers.length > 0 ? (
                                <div className="mt-2 flex max-h-[55vh] flex-col divide-y divide-sidebar-border/70 overflow-y-auto rounded-xl border border-sidebar-border/70">
                                    {viewTarget.teachers.map((teacher) => (
                                        <div
                                            key={teacher.uuid}
                                            className="flex items-center gap-3 p-3"
                                        >
                                            <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-sidebar-foreground">
                                                {teacher.name
                                                    .charAt(0)
                                                    .toUpperCase()}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate font-medium text-sidebar-foreground">
                                                    {teacher.name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {teacher.email}
                                                </div>
                                            </div>
                                            {teacher.pivot?.is_substitute ? (
                                                <Badge className="border-transparent bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300">
                                                    <ShieldAlert className="mr-1 size-3" />
                                                    Substitute
                                                </Badge>
                                            ) : (
                                                <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                                    Regular
                                                </Badge>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    No teachers assigned to this subject.
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Close</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Teacher list dialog */}
            <Dialog
                open={!!teacherListTarget}
                onOpenChange={(open) => !open && setTeacherListTarget(null)}
            >
                <DialogContent className="max-h-[85vh] overflow-hidden">
                    <DialogTitle>
                        Teachers — {teacherListTarget?.name}
                    </DialogTitle>
                    <DialogDescription>
                        {teacherListTarget?.teachers.length ?? 0}{' '}
                        teacher
                        {(teacherListTarget?.teachers.length ?? 0) === 1
                            ? ''
                            : 's'}{' '}
                        assigned to this subject
                    </DialogDescription>
                    <div className="mt-2 max-h-[55vh] overflow-auto rounded-xl border border-sidebar-border/70">
                        {teacherListTarget?.teachers.length ? (
                            <table className="h-full min-w-full divide-y divide-sidebar-border/70 text-sm">
                                <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">
                                            Teacher
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Type
                                        </th>
                                        <th className="px-4 py-3 font-medium">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                    {teacherListTarget.teachers.map(
                                        (teacher) => (
                                            <tr
                                                key={teacher.uuid}
                                                className="hover:bg-sidebar-accent/40"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex size-8 items-center justify-center rounded-full bg-muted text-[11px] font-semibold text-sidebar-foreground">
                                                            {teacher.name
                                                                .charAt(0)
                                                                .toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-medium text-sidebar-foreground">
                                                                {teacher.name}
                                                            </div>
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {teacher.email}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {teacher.pivot?.is_substitute ? (
                                                        <Badge className="border-transparent bg-orange-50 text-orange-700 dark:bg-orange-950/70 dark:text-orange-300">
                                                            <ShieldAlert className="mr-1 size-3" />
                                                            Substitute
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="border-transparent bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300">
                                                            Regular
                                                        </Badge>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-sky-600 dark:text-sky-400"
                                                            onClick={() =>
                                                                openReassign(
                                                                    teacher,
                                                                )
                                                            }
                                                            disabled={
                                                                allSubjects.length <=
                                                                1
                                                            }
                                                            aria-label={`Reassign ${teacher.name}`}
                                                            title="Reassign teacher"
                                                        >
                                                            <ArrowRightLeft className="size-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="size-8 text-red-600"
                                                            onClick={() =>
                                                                removeTeacher(
                                                                    teacherListTarget.uuid,
                                                                    teacher.uuid,
                                                                )
                                                            }
                                                            aria-label={`Remove ${teacher.name}`}
                                                            title="Remove teacher"
                                                        >
                                                            <X className="size-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        ) : (
                            <div className="px-4 py-10 text-center">
                                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-sidebar">
                                    <UserPlus className="size-5 text-muted-foreground/60" />
                                </div>
                                <p className="mt-3 text-sm text-muted-foreground">
                                    No teachers assigned to this subject yet.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    if (teacherListTarget) {
                                        setTeacherAssignTarget(
                                            teacherListTarget,
                                        );
                                    }

                                    setTeacherListTarget(null);
                                }}
                            >
                                <UserPlus className="mr-2 size-3.5" />
                                Add teacher
                            </Button>
                        </DialogClose>
                        <DialogClose asChild>
                            <Button>Done</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <ReassignAssignmentModal
                open={reassignState.open}
                onOpenChange={(open: boolean) =>
                    setReassignState((current) => ({ ...current, open }))
                }
                teacher={reassignState.teacher}
                sourceSubject={reassignState.sourceSubject}
                subjects={allSubjects}
                onReassigned={handleReassigned}
            />
        </>
    );
}

function CurriculumTags({
    subject,
    onShowMore,
}: {
    subject: SubjectRow;
    onShowMore?: () => void;
}) {
    const stackRef = useRef<HTMLDivElement | null>(null);

    const tags: { label: string; className: string }[] = [];

    if (subject.level === 'jhs') {
        tags.push({
            label: 'JHS',
            className:
                'border-transparent bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
        });
    } else if (subject.level === 'shs') {
        tags.push({
            label: 'SHS',
            className:
                'border-transparent bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950/70 dark:text-fuchsia-300',
        });
    }

    if (subject.category) {
        tags.push({
            label: subject.category,
            className: `border-transparent ${categoryTone(subject.category)}`,
        });
    }

    if (subject.track) {
        tags.push({
            label: subject.track,
            className:
                'border-transparent bg-violet-50 text-violet-700 dark:bg-violet-950/70 dark:text-violet-300',
        });
    }

    if (subject.strand) {
        tags.push({
            label: subject.strand,
            className:
                'border-transparent bg-teal-50 text-teal-700 dark:bg-teal-950/70 dark:text-teal-300',
        });
    }

    const MAX_TAGS = 4;
    const visible = tags.slice(0, MAX_TAGS);
    const hiddenCount = tags.length - visible.length;

    const isLong = (label: string) => label.length > 5;

    // Short tags pack 2-per-row; long tags (>5 chars) get their own full row.
    // Split them first so short tags always pair together regardless of where
    // long tags fall in the natural order.
    const shorts = visible.filter((t) => !isLong(t.label));
    const longs = visible.filter((t) => isLong(t.label));

    const rows: { label: string; className: string }[][] = [];

    for (let i = 0; i < shorts.length; i += 2) {
        rows.push(shorts.slice(i, i + 2));
    }

    for (const long of longs) {
        rows.push([long]);
    }

    const needsScroll = rows.length >= 3;

    useEffect(() => {
        if (needsScroll && stackRef.current) {
            stackRef.current.scrollTop = stackRef.current.scrollHeight;
        }
    }, [needsScroll, visible]);

    if (tags.length === 0) {
        return <span className="text-xs text-muted-foreground">—</span>;
    }

    const moreButton =
        hiddenCount > 0 ? (
            <button
                type="button"
                onClick={onShowMore}
                className="shrink-0 rounded-md border border-transparent bg-sidebar/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-sidebar-foreground"
                title="View all curriculum tags"
            >
                +{hiddenCount} more
            </button>
        ) : null;

    return (
        <div
            ref={stackRef}
            className={`flex min-w-0 flex-col gap-1.5 ${needsScroll ? 'max-h-[3.75rem] overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}
        >
            {rows.map((rowTags, ri) => (
                <div key={ri} className="flex min-w-0 items-center gap-1.5">
                    {rowTags.map((tag, i) => (
                        <Badge
                            key={`${tag.label}-${i}`}
                            className={`justify-start shrink-0 ${tag.className}`}
                        >
                            {tag.label}
                        </Badge>
                    ))}
                </div>
            ))}
            {moreButton}
        </div>
    );
}

type CurriculumForm = {
    level: string;
    category: string;
    track: string;
    strand: string;
};

type CurriculumFieldsProps<T> = {
    value: T;
    onChange: (value: T) => void;
};

function CurriculumFields<T extends CurriculumForm>({
    value,
    onChange,
}: CurriculumFieldsProps<T>) {
    function update(patch: Partial<CurriculumForm>) {
        if (patch.level === 'jhs') {
            patch.track = '';
            patch.strand = '';
        }

        onChange({ ...value, ...patch });
    }

    const isShs = value.level === 'shs';

    return (
        <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-lg border border-sidebar-border/70 bg-sidebar/60 p-1">
                <button
                    type="button"
                    onClick={() => update({ level: 'jhs' })}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        !isShs
                            ? 'bg-white text-amber-700 shadow-sm dark:bg-sidebar dark:text-amber-300'
                            : 'text-muted-foreground hover:text-sidebar-foreground'
                    }`}
                >
                    Junior High (JHS)
                </button>
                <button
                    type="button"
                    onClick={() => update({ level: 'shs' })}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                        isShs
                            ? 'bg-white text-fuchsia-700 shadow-sm dark:bg-sidebar dark:text-fuchsia-300'
                            : 'text-muted-foreground hover:text-sidebar-foreground'
                    }`}
                >
                    Senior High (SHS)
                </button>
            </div>
            <Select
                value={value.category || undefined}
                onValueChange={(v) => update({ category: v })}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Category (Core / Applied / Specialized)" />
                </SelectTrigger>
                <SelectContent>
                    {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                            {c}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            {isShs && (
                <Select
                    value={value.track || undefined}
                    onValueChange={(v) => update({ track: v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="SHS track (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {TRACK_OPTIONS.map((t) => (
                            <SelectItem key={t} value={t}>
                                {t}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {isShs && (
                <Select
                    value={value.strand || undefined}
                    onValueChange={(v) => update({ strand: v })}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Strand (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        {STRAND_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}

function StatCard({
    icon,
    label,
    value,
    iconTone,
}: {
    icon: React.ReactNode;
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
