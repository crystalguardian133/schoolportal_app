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
