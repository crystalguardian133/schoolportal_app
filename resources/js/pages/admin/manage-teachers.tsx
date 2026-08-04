import type { PageProps } from '@inertiajs/core';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { PortalPageShell } from '@/components/portal-page-shell';

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
};

type PageData = PageProps & {
    teachers?: TeacherPage;
    roles?: Record<string, string[]>;
    filters?: Filters;
};

export default function ManageTeachers() {
    const { props } = usePage<PageData>();
    const teachersProp = props.teachers || { data: [], current_page: 1, last_page: 1, total: 0 };
    const teachers: Teacher[] = teachersProp.data || [];
    const rolesMap: Record<string, string[]> = props.roles || {};
    const filters = props.filters || { q: '', per_page: 25 };

    const [query, setQuery] = useState(filters.q ?? '');
    const [perPage, setPerPage] = useState(Number(filters.per_page) || 25);
    const initialRender = useRef(true);

    useEffect(() => {
        if (initialRender.current) {
            initialRender.current = false;

            return;
        }

        const timer = window.setTimeout(() => {
            reload({ q: query, per_page: perPage });
        }, 250);

        return () => window.clearTimeout(timer);
    }, [query, perPage]);

    function reload(params: Record<string, string | number | null | undefined>) {
        router.get('/admin/manage-teachers', params, { preserveState: true, replace: true });
    }

    return (
        <>
            <Head title="Manage Teachers" />
            <PortalPageShell title="Manage Teachers" description="View and edit teacher accounts.">
                <div className="rounded-2xl border border-sidebar-border/70 bg-white p-5 shadow-sm dark:border-sidebar-border dark:bg-sidebar">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="text-sm text-muted-foreground">
                            {query
                                ? `${teachersProp.total} result${teachersProp.total === 1 ? '' : 's'} for "${query}"`
                                : `Total teachers: ${teachersProp.total}`}
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by name or email..."
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
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Email</th>
                                    <th className="px-4 py-3 font-medium">Role</th>
                                    <th className="px-4 py-3 font-medium">Adviser</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70 bg-white dark:bg-sidebar">
                                {teachers.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                                            No teachers found.
                                        </td>
                                    </tr>
                                )}
                                {teachers.map((teacher) => (
                                    <tr key={teacher.uuid} className="hover:bg-sidebar-accent/40">
                                        <td className="px-4 py-3 font-medium text-sidebar-foreground">
                                            {teacher.name}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{teacher.email}</td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {(rolesMap[teacher.uuid] || []).join(', ') || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {teacher.is_adviser
                                                ? `Yes${teacher.adviser_section ? ` · ${teacher.adviser_section}` : ''}`
                                                : 'No'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/admin/manage-teachers/${teacher.uuid}/edit`}
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
                            disabled={teachersProp.current_page <= 1}
                            onClick={() => reload({ q: query, per_page: perPage, page: teachersProp.current_page - 1 })}
                            className="rounded border px-3 py-1 text-sm disabled:opacity-50"
                        >
                            Prev
                        </button>
                        <div className="text-sm text-muted-foreground">
                            Page {teachersProp.current_page} of {teachersProp.last_page}
                        </div>
                        <button
                            disabled={teachersProp.current_page >= teachersProp.last_page}
                            onClick={() => reload({ q: query, per_page: perPage, page: teachersProp.current_page + 1 })}
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
