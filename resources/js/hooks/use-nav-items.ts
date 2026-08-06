import { usePage } from '@inertiajs/react';
import {
    Bell,
    Book,
    BookOpenText,
    Bug,
    CalendarCheck,
    CalendarClock,
    CalendarDays,
    ClipboardList,
    Clock3,
    CreditCard,
    GraduationCap,
    LayoutGrid,
    MessageSquare,
    Music,
    Pencil,
    Shield,
    UserCog,
    UserCheck,
    UserPlus,
    Users,
} from 'lucide-react';
import { toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

const platformNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Announcements',
        href: '/student/announcements',
        icon: Bell,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
];

const studentNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Pre-registration',
        href: '/student/pre-registration',
        icon: ClipboardList,
    },
    {
        title: 'Grades',
        href: '/student/grades',
        icon: GraduationCap,
    },
    {
        title: 'Subjects Enrolled',
        href: '/student/subjects-enrolled',
        icon: BookOpenText,
    },
    {
        title: 'Announcements',
        href: '/student/announcements',
        icon: Bell,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
];

const staffNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Classes',
        href: '/teacher/classes',
        icon: Users,
    },
    {
        title: 'Edit Grades',
        href: '/teacher/grades',
        icon: Pencil,
    },
    {
        title: 'Schedule',
        href: '/teacher/schedule',
        icon: CalendarDays,
    },
    {
        title: 'Announcements',
        href: '/teacher/announcements',
        icon: Bell,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
];

const adminNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Enroll Students',
        href: '/admin/enrollments',
        icon: ClipboardList,
        permission: 'manage enrollments',
    },
    {
        title: 'Create Student',
        href: '/admin/create-student',
        icon: Users,
        permission: 'manage enrollments',
    },
    {
        title: 'Class Sections',
        href: '/admin/sections',
        icon: Users,
        permission: 'manage sections',
    },
    {
        title: 'Subjects',
        href: '/admin/subjects',
        icon: Book,
        permission: 'manage subjects',
    },
    {
        title: 'Assignments',
        href: '/admin/assignments',
        icon: Shield,
        permission: 'manage assignments',
    },
    {
        title: 'Assign Subjects',
        href: '/adviser/assign-subjects',
        icon: UserCheck,
        permission: 'assign subjects',
    },
    {
        title: 'Manage Schedules',
        href: '/admin/schedules',
        icon: CalendarDays,
        permission: 'manage schedules',
    },
    {
        title: 'School Year',
        href: '/admin/school-years',
        icon: CalendarClock,
        permission: 'access admin',
    },
    {
        title: 'System Logs',
        href: '/admin/system-logs',
        icon: Clock3,
        permission: 'view logs',
    },
    {
        title: 'Announcements',
        href: '/admin/announcements',
        icon: Bell,
        permission: 'manage announcements',
    },
    {
        title: 'Manage Users',
        href: '/admin/users',
        icon: UserCog,
        permission: 'manage users',
    },
    {
        title: 'Create Teacher',
        href: '/admin/create-teacher',
        icon: UserPlus,
        permission: 'create teacher',
    },
    {
        title: 'Manage Students',
        href: '/admin/manage-students',
        icon: GraduationCap,
        permission: 'manage enrollments',
    },
    {
        title: 'Manage Teachers',
        href: '/admin/manage-teachers',
        icon: BookOpenText,
        permission: 'manage users',
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles',
        icon: Shield,
        permission: 'manage roles',
    },
    {
        title: 'ID Cards',
        href: '/admin/id-cards',
        icon: CreditCard,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
    {
        title: 'Developer Reports',
        href: '/developer/reports',
        icon: Bug,
        permission: 'access developer dashboard',
    },
];

const teacherNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'My Classes',
        href: '/teacher/classes',
        icon: Users,
    },
    {
        title: 'Edit Grades',
        href: '/teacher/grades',
        icon: Pencil,
    },
    {
        title: 'Schedule',
        href: '/teacher/schedule',
        icon: CalendarDays,
    },
    {
        title: 'Assign Subjects',
        href: '/adviser/assign-subjects',
        icon: UserCheck,
        permission: 'assign subjects',
    },
    {
        title: 'Manage Schedules',
        href: '/admin/schedules',
        icon: CalendarDays,
        permission: 'manage schedules',
    },
    {
        title: 'Attendance',
        href: '/teacher/attendance',
        icon: CalendarCheck,
    },
    {
        title: 'Announcements',
        href: '/teacher/announcements',
        icon: Bell,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
];

const deptHeadNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Subjects',
        href: '/admin/subjects',
        icon: Book,
        permission: 'manage subjects',
    },
    {
        title: 'Class Sections',
        href: '/admin/sections',
        icon: Users,
        permission: 'manage sections',
    },
    {
        title: 'Assign Subjects',
        href: '/adviser/assign-subjects',
        icon: UserCheck,
        permission: 'assign subjects',
    },
    {
        title: 'Manage Schedules',
        href: '/admin/schedules',
        icon: CalendarDays,
        permission: 'manage schedules',
    },
    {
        title: 'Edit Grades',
        href: '/teacher/grades',
        icon: Pencil,
    },
    {
        title: 'Announcements',
        href: '/admin/announcements',
        icon: Bell,
        permission: 'manage announcements',
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
];

const schoolHeadNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Enroll Students',
        href: '/admin/enrollments',
        icon: ClipboardList,
        permission: 'manage enrollments',
    },
    {
        title: 'Class Sections',
        href: '/admin/sections',
        icon: Users,
        permission: 'manage sections',
    },
    {
        title: 'Subjects',
        href: '/admin/subjects',
        icon: Book,
        permission: 'manage subjects',
    },
    {
        title: 'Assignments',
        href: '/admin/assignments',
        icon: Shield,
        permission: 'manage assignments',
    },
    {
        title: 'Manage Schedules',
        href: '/admin/schedules',
        icon: CalendarDays,
        permission: 'manage schedules',
    },
    {
        title: 'School Year',
        href: '/admin/school-years',
        icon: CalendarClock,
    },
    {
        title: 'Manage Users',
        href: '/admin/users',
        icon: UserCog,
        permission: 'manage users',
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles',
        icon: Shield,
        permission: 'manage roles',
    },
    {
        title: 'System Logs',
        href: '/admin/system-logs',
        icon: Clock3,
        permission: 'view logs',
    },
    {
        title: 'Announcements',
        href: '/admin/announcements',
        icon: Bell,
        permission: 'manage announcements',
    },
    {
        title: 'ID Cards',
        href: '/admin/id-cards',
        icon: CreditCard,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
    {
        title: 'Developer Reports',
        href: '/developer/reports',
        icon: Bug,
        permission: 'access developer dashboard',
    },
];

const developerNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
        icon: LayoutGrid,
    },
    {
        title: 'Reports & Feedback',
        href: '/feedback',
        icon: MessageSquare,
    },
    {
        title: 'Developer Reports',
        href: '/developer/reports',
        icon: Bug,
    },
];

const musicPlayerNavItem: NavItem[] = [
    {
        title: 'Music Player',
        href: '/developer/music',
        icon: Music,
        permission: 'access music player',
    },
];

export function useNavItems(): { navItems: NavItem[]; sectionLabel: string | null } {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isStudent = auth.user?.role === 'student';
    const permissions = auth.permissions || [];

    const isTeacher = permissions.includes('access teacher dashboard');
    const isStaff = auth.user?.role === 'staff' || permissions.includes('access staff dashboard');
    const isDeptHead = permissions.includes('access department head dashboard');
    const isSchoolHead = permissions.includes('access school head dashboard');
    const isAdmin = permissions.includes('access admin dashboard');
    const isDeveloper = permissions.includes('access developer dashboard');

    const hasPermission = (permission?: string) => {
        if (!permission) {
            return true;
        }

        if (auth.user?.is_adviser && ['assign subjects', 'manage schedules'].includes(permission)) {
            return true;
        }

        return permissions.includes(permission);
    };

    const hasAnyItemPermission = (items: NavItem[]) =>
        items.some((item) => item.permission && hasPermission(item.permission));

    const portals: { items: NavItem[]; enabled: boolean }[] = [
        { items: developerNavItems, enabled: isDeveloper || hasAnyItemPermission(developerNavItems) },
        { items: schoolHeadNavItems, enabled: isSchoolHead || hasAnyItemPermission(schoolHeadNavItems) },
        { items: adminNavItems, enabled: isAdmin || hasAnyItemPermission(adminNavItems) },
        { items: deptHeadNavItems, enabled: isDeptHead || hasAnyItemPermission(deptHeadNavItems) },
        { items: teacherNavItems, enabled: isTeacher || hasAnyItemPermission(teacherNavItems) },
        { items: staffNavItems, enabled: isStaff || hasAnyItemPermission(staffNavItems) },
    ];

    const sectionLabel = isStudent
        ? null
        : isDeveloper
          ? 'Developer'
          : isSchoolHead
            ? 'School Administration'
            : isAdmin
              ? 'Administrative Tools'
              : isDeptHead
                ? 'Department Management'
                : isTeacher
                  ? 'Teaching Tools'
                  : isStaff
                    ? 'Staff Portal'
                    : 'Platform';

    const portalFlags = [isDeveloper, isSchoolHead, isAdmin, isDeptHead, isTeacher, isStaff];
    const hasPrimaryPortal = portalFlags.some(Boolean);

    const allNavArrays: NavItem[][] = [];

    if (!isStudent && !hasPrimaryPortal) {
        allNavArrays.push(platformNavItems);
    }

    const enabledPortals = portals
        .map((portal, index) => ({ portal, flag: portalFlags[index] }))
        .filter(({ portal }) => portal.enabled)
        .sort((a, b) => Number(b.flag) - Number(a.flag));

    for (const { portal, flag } of enabledPortals) {
        if (flag) {
            allNavArrays.push(portal.items);
        } else {
            const gated = portal.items.filter((item) => item.permission && hasPermission(item.permission));

            if (gated.length > 0) {
                allNavArrays.push(gated);
            }
        }
    }

    if (isStudent) {
        allNavArrays.push(studentNavItems);
    }

    if (hasPermission('access music player')) {
        allNavArrays.push(musicPlayerNavItem);
    }

    const seen = new Set<string>();
    let navItems: NavItem[] = [];

    for (const arr of allNavArrays) {
        for (const item of arr) {
            const hrefKey = toUrl(item.href);

            if (!seen.has(hrefKey)) {
                seen.add(hrefKey);
                navItems.push(item);
            }
        }
    }

    navItems = navItems.filter((item) => hasPermission(item.permission));

    if (navItems.length === 0 && !isStudent) {
        navItems = platformNavItems;
    }

    return { navItems, sectionLabel };
}
