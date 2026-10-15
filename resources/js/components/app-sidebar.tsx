import { Link, usePage } from '@inertiajs/react';
import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';
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
    useSidebar,
} from '@/components/ui/sidebar';
import { useAppearance } from '@/hooks/use-appearance';
import { useNavItems } from '@/hooks/use-nav-items';
import { dashboard } from '@/routes';
import type { Auth } from '@/types/auth';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isStudent = auth.user?.role === 'student';
    const { navItems, sectionLabel } = useNavItems();
    const { state } = useSidebar();
    const collapsed = state === 'collapsed';

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
                <div
                    className={
                        collapsed
                            ? 'flex flex-col items-center px-0 pb-3'
                            : 'px-3 pb-3'
                    }
                >
                    <div className="mb-2 flex items-center justify-center">
                        <AppearanceSwitch />
                    </div>
                    <NavUser />
                </div>
            </SidebarFooter>
        </Sidebar>
    );
}

function AppearanceSwitch() {
    const { resolvedAppearance, updateAppearance } = useAppearance();
    const { state: sidebarState } = useSidebar();
    // False on server/first paint (avoids hydration mismatch), true after.
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );

    const isDark = mounted && resolvedAppearance === 'dark';
    // Compact switch fits the folded (icon-only) sidebar; the icon always
    // rides on the knob so nothing is lost when labels collapse away.
    const collapsed = sidebarState === 'collapsed';

    return (
        <button
            type="button"
            onClick={() => updateAppearance(isDark ? 'light' : 'dark')}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={isDark}
            title={isDark ? 'Dark mode' : 'Light mode'}
            className={`relative inline-flex shrink-0 items-center overflow-hidden rounded-full border shadow-inner transition-all duration-300 focus:outline-none ${
                collapsed ? 'h-6 w-11' : 'h-7 w-[68px]'
            } ${
                isDark
                    ? 'border-slate-700 bg-slate-800'
                    : 'border-amber-200 bg-amber-100'
            }`}
        >
            {/* stars, visible only in dark mode */}
            <span
                aria-hidden="true"
                className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
                    isDark ? 'opacity-100' : 'opacity-0'
                }`}
            >
                <span className="absolute top-1 left-2 size-0.5 rounded-full bg-slate-300" />
                <span className="absolute bottom-1.5 left-4 size-[3px] rounded-full bg-slate-400" />
                <span
                    className={`absolute top-1.5 right-2 size-0.5 rounded-full bg-slate-300 ${collapsed ? 'hidden' : ''}`}
                />
            </span>
            {/* knob with the sun/moon riding on it */}
            <span
                aria-hidden="true"
                className={`absolute flex items-center justify-center rounded-full shadow transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    collapsed ? 'top-0.5 left-0.5 size-5' : 'top-0.5 left-0.5 size-6'
                } ${isDark ? 'bg-slate-950' : 'bg-white'                } ${
                    isDark
                        ? collapsed
                            ? 'translate-x-5'
                            : 'translate-x-10'
                        : 'translate-x-0'
                }`}
            >
                <Sun
                    className={`absolute transition-all duration-500 ${
                        collapsed ? 'size-3' : 'size-3.5'
                    } text-amber-500 ${
                        isDark
                            ? 'rotate-90 scale-50 opacity-0'
                            : 'rotate-0 scale-100 opacity-100'
                    }`}
                />
                <Moon
                    className={`absolute transition-all duration-500 ${
                        collapsed ? 'size-3' : 'size-3.5'
                    } text-amber-200 ${
                        isDark
                            ? 'rotate-0 scale-100 opacity-100'
                            : '-rotate-90 scale-50 opacity-0'
                    }`}
                />
            </span>
        </button>
    );
}
