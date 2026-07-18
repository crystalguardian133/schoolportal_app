import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({
    items = [],
    label = 'Platform',
}: {
    items: NavItem[];
    label?: string | null;
}) {
    const { isCurrentUrl } = useCurrentUrl();
    const currentHash =
        typeof window !== 'undefined' ? window.location.hash : '';

    return (
        <SidebarGroup className="px-2 py-0">
            {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
            <SidebarMenu>
                {items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                            asChild
                            isActive={
                                typeof item.href === 'string' &&
                                item.href.startsWith('#')
                                    ? currentHash === item.href ||
                                      (item.href === '#dashboard' &&
                                          !currentHash)
                                    : isCurrentUrl(item.href)
                            }
                            tooltip={item.title}
                            className="sidebar-glint transition-all duration-300 ease-out hover:bg-white/10 hover:backdrop-blur-md hover:shadow-[0_2px_12px_rgba(255,255,255,0.08)] hover:border hover:border-white/10 active:scale-[0.98]"
                        >
                            {typeof item.href === 'string' &&
                            item.href.startsWith('#') ? (
                                <a
                                    href={item.href}
                                    aria-current={
                                        currentHash === item.href ||
                                        (item.href === '#dashboard' &&
                                            !currentHash)
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </a>
                            ) : (
                                <Link
                                    href={item.href}
                                    prefetch
                                    aria-current={
                                        isCurrentUrl(item.href)
                                            ? 'page'
                                            : undefined
                                    }
                                >
                                    {item.icon && <item.icon />}
                                    <span>{item.title}</span>
                                </Link>
                            )}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}
