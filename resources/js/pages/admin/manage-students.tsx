import type { PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

type Student = {
    uuid: string;
    name: string;
    student_id: string;
    lrn?: string | null;
    section?: string | null;
    grade_level?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    email?: string | null;
};

type StudentPage = {
    data: Student[];
    current_page: number;
    last_page: number;
    total: number;
    per_page?: number;
};

type Filters = {
    q?: string | null;
    per_page?: number | string;
    sort_by?: string;
    sort_direction?: 'asc' | 'desc';
};

type PageData = PageProps & {
    students?: StudentPage;
    filters?: Filters;
};

function formatStudentName(s: Student) {
    const last = (s.last_name || '').trim();
    const first = (s.first_name || '').trim();
    const middle = (s.middle_name || '').trim();

    if (last || first || middle) {
        const mi = middle ? ` ${middle.charAt(0).toUpperCase()}` : '';

        return last ? `${last}, ${first}${mi}`.trim() : `${first}${mi}`.trim();
    }

    return s.name || '-';
}

export default function ManageStudents() {
    const { props } = usePage<PageData>();
    const studentsProp = props.students || { data: [], current_page: 1, last_page: 1, total: 0 };
    const students: Student[] = studentsProp.data || [];
    const filters = props.filters || { q: '', per_page: 25, sort_by: 'name', sort_direction: 'asc' };

    const [query, setQuery] = useState(filters.q ?? '');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || 25);
    const [sortBy, setSortBy] = useState(filters.sort_by ?? 'name');
    const [sortDirection, setSortDirection] = useState(filters.sort_direction ?? 'asc');
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            reload({ q: query, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage, sortBy, sortDirection]);

    function reload(params: Record<string, string | number | null | undefined>) {
        router.get('/admin/manage-students', params, { preserveState: true, replace: true });
    }

    function toggleSort(column: string) {
        if (sortBy === column) {
            setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortDirection(column === 'grade_level' ? 'desc' : 'asc');
        }
    }

    function sortLabel(column: string, label: string) {
        const active = sortBy === column;
        const arrow = active ? (sortDirection === 'asc' ? ' ↑' : ' ↓') : '';

        return `${label}${arrow}`;
    }

    return (
        <>
            <Head title="Manage Students" />
            <PortalPageShell title="Manage Students" description="View and edit student information.">
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {query
                                ? `${studentsProp.total} result${studentsProp.total === 1 ? '' : 's'} for "${query}"`
                                : `Total students: ${studentsProp.total}`}
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search name, ID, LRN, or email..."
                                className="rounded-xl border border-border bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            />
                            <select
                                value={perPage}
                                onChange={(e) => setPerPage(Number(e.target.value))}
                                className="rounded-xl border border-border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar"
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                            </select>
                        </div>
                    </div>

                    <div className="relative overflow-auto rounded border border-sidebar-border/70">
                        <table className="min-w-full divide-y divide-sidebar-border/70 text-sm">
                            <thead className="bg-sidebar/60 text-left text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 font-medium">
                                        <button type="button" onClick={() => toggleSort('name')} className="hover:text-foreground">
                                            {sortLabel('name', 'Student Name')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">Student ID</th>
                                    <th className="px-4 py-3 font-medium">LRN</th>
                                    <th className="px-4 py-3 font-medium">
                                        <button type="button" onClick={() => toggleSort('grade_level')} className="hover:text-foreground">
                                            {sortLabel('grade_level', 'Grade Level')}
                                        </button>
                                    </th>
                                    <th className="px-4 py-3 font-medium">Section</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {students.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                                            No students found.
                                        </td>
                                    </tr>
                                )}
                                {students.map((student) => (
                                    <tr key={student.uuid} className="hover:bg-sidebar-accent/40">
                                        <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                            {formatStudentName(student)}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{student.student_id || '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{student.lrn || '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{student.grade_level || 'N/A'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{student.section || '-'}</td>
                                        <td className="px-4 py-3 text-muted-foreground">{student.email || '-'}</td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/manage-students/${student.uuid}/edit`}
                                                className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                                            >
                                                Edit
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                        <button
                            disabled={studentsProp.current_page <= 1}
                            onClick={() => reload({ q: query, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection, page: studentsProp.current_page - 1 })}
                            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <div className="text-sm text-muted-foreground">
                            Page {studentsProp.current_page} of {studentsProp.last_page}
                        </div>
                        <button
                            disabled={studentsProp.current_page >= studentsProp.last_page}
                            onClick={() => reload({ q: query, per_page: perPage, sort_by: sortBy, sort_direction: sortDirection, page: studentsProp.current_page + 1 })}
                            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </PortalPageShell>
        </>
    );
}
