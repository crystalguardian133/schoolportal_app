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
        title: 'Schedule',
        href: '/teacher/schedule',
        icon: CalendarDays,
    },
    {
        title: 'Announcements',
        href: '/teacher/announcements',
        icon: Bell,
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
    },
        {
            title: 'Create Student',
            href: '/admin/create-student',
            icon: Users,
        },
    {
        title: 'Class Sections',
        href: '/admin/sections',
        icon: Users,
    },
    {
        title: 'Assignments',
        href: '/admin/assignments',
        icon: Shield,
    },
    {
        title: 'Enrollment Audits',
        href: '/admin/enrollment-audits',
        icon: FileText,
    },
    {
        title: 'System Logs',
        href: '/admin/system-logs',
        icon: Clock3,
    },
    {
        title: 'Announcements',
        href: '/admin/announcements',
        icon: Bell,
    },
    {
        title: 'Manage Users',
        href: '/admin/users',
        icon: UserCog,
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles',
        icon: Shield,
    },
];

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isStudent = auth.user?.role === 'student';
    const isStaff = auth.user?.role === 'staff';
    const isAdmin = auth.user?.role === 'admin' || auth.user?.role === 'principal' || auth.user?.role === 'registrar';
    const navItems = isAdmin ? adminNavItems : isStaff ? staffNavItems : studentNavItems;

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader
                className={isStudent ? 'border-b border-sidebar-border/60 pb-3' : ''}
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
                    label={isStudent ? null : isAdmin ? 'Administrative Tools' : 'Platform'}
                />
            </SidebarContent>

            <SidebarFooter>
                <div className="px-3 pb-3">
                    <div className="flex items-center justify-center mb-2">
                        <div className="flex items-center gap-3">
                            <Sun className="w-4 h-4 text-muted-foreground" />
                            <AppearanceSwitch />
                            <Moon className="w-4 h-4 text-muted-foreground" />
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
            <span className={isDark ? 'absolute left-0.5 w-5 h-5 rounded-full bg-white transform translate-x-5 transition-transform' : 'absolute left-0.5 w-5 h-5 rounded-full bg-white transition-transform'} />
            <span className={isDark ? 'block h-6 w-11 rounded-full bg-neutral-800' : 'block h-6 w-11 rounded-full bg-neutral-200'} />
        </button>
    );
}
