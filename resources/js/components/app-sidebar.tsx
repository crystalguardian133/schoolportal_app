import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    ClipboardList,
    GraduationCap,
    BookOpenText,
    Users,
    CalendarDays,
    LayoutGrid,
    Shield,
    FileText,
    UserCog,
    Clock3,
    Book,
    CreditCard,
    Pencil,
    UserCheck,
    UserPlus,
    CalendarClock,
    CalendarCheck,
    MessageSquare,
    Bug,
} from 'lucide-react';
import { Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from '@/components/app-logo';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
];

const studentNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
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
        href: dashboard(),
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
        href: dashboard(),
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
        title: 'Enrollment Audits',
        href: '/admin/enrollment-audits',
        icon: FileText,
        permission: 'manage enrollments',
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
        href: dashboard(),
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
        href: dashboard(),
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
        href: dashboard(),
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
        title: 'Enrollment Audits',
        href: '/admin/enrollment-audits',
        icon: FileText,
        permission: 'manage enrollments',
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
        href: dashboard(),
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

export function AppSidebar() {
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

        const noAccessAdminBypass = ['manage assignments', 'manage subjects', 'access developer dashboard'];

        if (permissions.includes('access admin') && !noAccessAdminBypass.includes(permission)) {
return true;
}

        if (auth.user?.is_adviser && ['assign subjects', 'manage schedules'].includes(permission)) {
return true;
}

        return permissions.includes(permission);
    };

    let navItems: NavItem[];
    let sectionLabel: string | null;

    if (isSchoolHead) {
        navItems = schoolHeadNavItems;
        sectionLabel = 'School Administration';
    } else if (isAdmin) {
        navItems = adminNavItems;
        sectionLabel = 'Administrative Tools';
    } else if (isDeptHead) {
        navItems = deptHeadNavItems;
        sectionLabel = 'Department Management';
    } else if (isTeacher) {
        navItems = teacherNavItems;
        sectionLabel = 'Teaching Tools';
    } else if (isStaff) {
        navItems = staffNavItems;
        sectionLabel = 'Staff Portal';
    } else if (isDeveloper) {
        navItems = developerNavItems;
        sectionLabel = 'Developer';
    } else {
        navItems = studentNavItems;
        sectionLabel = isStudent ? null : 'Platform';
    }

    navItems = navItems.filter((item) => hasPermission(item.permission));

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader
                className={
                    isStudent ? 'border-b border-sidebar-border/60 pb-3' : ''
                }
            >
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className={isStudent ? 'pt-3' : ''}>
                <NavMain
                    items={navItems}
                    label={sectionLabel}
                />
            </SidebarContent>

            <SidebarFooter>
                <div className="px-3 pb-3">
                    <div className="mb-2 flex items-center justify-center">
                        <div className="flex items-center gap-3">
                            <Sun className="h-4 w-4 text-muted-foreground" />
                            <AppearanceSwitch />
                            <Moon className="h-4 w-4 text-muted-foreground" />
                        </div>
                    </div>
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

function AppearanceSwitch() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && resolvedAppearance === 'dark';

    return (
        <button
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label="Toggle light/dark"
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
        >
            <span
                className={
                    isDark
                        ? 'absolute left-0.5 h-5 w-5 translate-x-5 transform rounded-full bg-white transition-transform'
                        : 'absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform'
                }
            />
            <span
                className={
                    isDark
                        ? 'block h-6 w-11 rounded-full bg-neutral-800'
                        : 'block h-6 w-11 rounded-full bg-neutral-200'
                }
            />
        </button>
    );
}
