import { Link, usePage } from '@inertiajs/react';
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
import { useNavItems } from '@/hooks/use-nav-items';
import { dashboard } from '@/routes';
import type { Auth } from '@/types/auth';

export function AppSidebar() {
    const { auth } = usePage<{ auth: Auth }>().props;
    const isStudent = auth.user?.role === 'student';
    const { navItems, sectionLabel } = useNavItems();

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
