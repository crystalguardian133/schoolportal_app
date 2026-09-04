import { Link, router, usePage } from '@inertiajs/react';
import { Download, LogOut, MoreHorizontal, Settings } from 'lucide-react';
import { useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { NotificationBell } from '@/components/notification-bell';
import { PwaPushBanner } from '@/components/pwa/pwa-push-banner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { UserInfo } from '@/components/user-info';
import { UserMenuContent } from '@/components/user-menu-content';
import { usePwa } from '@/contexts/pwa-context';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { useInitials } from '@/hooks/use-initials';
import { useMobileNavigation } from '@/hooks/use-mobile-navigation';
import { useNavItems } from '@/hooks/use-nav-items';
import { cn } from '@/lib/utils';
import { toUrl } from '@/lib/utils';
import { dashboard, logout } from '@/routes';
import { edit } from '@/routes/profile';
import type { AppLayoutProps } from '@/types';
import type { NavItem } from '@/types';
import type { Auth } from '@/types/auth';

export default function PwaMobileLayout({ children }: AppLayoutProps) {
    const { auth } = usePage<{ auth: Auth }>().props;
    const { navItems } = useNavItems();
    const { isCurrentUrl } = useCurrentUrl();
    const { canInstall, promptInstall } = usePwa();
    const getInitials = useInitials();
    const cleanup = useMobileNavigation();
    const [menuOpen, setMenuOpen] = useState(false);

    const announcementsItem = navItems.find((item) =>
        item.title.toLowerCase().includes('announcement'),
    );

    const tabItems = navItems.slice(0, 4);
    const hasMore = navItems.length > tabItems.length;

    const handleLogout = () => {
        cleanup();
        setMenuOpen(false);
        router.flushAll();
    };

    return (
        <div className="flex min-h-dvh flex-col bg-background">
            <header
                className="sticky top-0 z-40 border-b border-border/70 bg-background/90 backdrop-blur"
                style={{ paddingTop: 'env(safe-area-inset-top)' }}
            >
                <div className="flex h-14 items-center gap-2 px-4">
                    <Link
                        href={dashboard()}
                        prefetch
                        className="flex min-w-0 items-center gap-2"
                    >
                        <AppLogoIcon className="size-8 shrink-0" />
                        <span className="truncate text-sm font-semibold">
                            DNHS School Portal
                        </span>
                    </Link>

                    <div className="ml-auto flex items-center gap-1">
                        <NotificationBell viewAllHref={announcementsItem ? toUrl(announcementsItem.href) : '/student/announcements'} />

                        {auth.user && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="size-9 rounded-full p-0"
                                    >
                                        <Avatar className="size-7 overflow-hidden rounded-full">
                                            <AvatarImage
                                                src={
                                                    auth.user.profile_picture
                                                        ? `/assets/${auth.user.profile_picture}`
                                                        : auth.user.avatar
                                                }
                                                alt={auth.user.name}
                                            />
                                            <AvatarFallback className="rounded-lg bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white">
                                                {getInitials(auth.user.name ?? '')}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-56"
                                    align="end"
                                >
                                    <UserMenuContent user={auth.user} />
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 pb-28">{children}</main>

            <PwaPushBanner />

            <nav
                className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 backdrop-blur"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                <div className="flex h-16">
                    {tabItems.map((item) => (
                        <TabItem
                            key={toUrl(item.href)}
                            item={item}
                            active={isCurrentUrl(item.href)}
                        />
                    ))}

                    {hasMore ? (
                        <button
                            type="button"
                            onClick={() => setMenuOpen(true)}
                            className="flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium text-muted-foreground active:scale-95"
                        >
                            <MoreHorizontal className="size-5" />
                            <span>More</span>
                        </button>
                    ) : null}
                </div>
            </nav>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent
                    side="bottom"
                    className="flex h-[85dvh] flex-col gap-4 overflow-y-auto rounded-t-3xl p-5"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Navigation</SheetTitle>
                    </SheetHeader>

                    {auth.user && (
                        <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                            <UserInfo user={auth.user} showEmail />
                        </div>
                    )}

                    <div className="flex flex-1 flex-col gap-1">
                        {navItems.map((item) => (
                            <Link
                                key={toUrl(item.href)}
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                                    isCurrentUrl(item.href)
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-foreground hover:bg-accent/50',
                                )}
                            >
                                {item.icon && (
                                    <item.icon className="size-4 text-muted-foreground" />
                                )}
                                {item.title}
                            </Link>
                        ))}
                    </div>

                    {canInstall && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={promptInstall}
                        >
                            <Download className="size-4" />
                            Install App
                        </Button>
                    )}

                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" asChild>
                            <Link href={edit()} prefetch>
                                <Settings className="size-4" />
                                Settings
                            </Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link
                                href={logout()}
                                as="button"
                                onClick={handleLogout}
                            >
                                <LogOut className="size-4" />
                                Log out
                            </Link>
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </div>
    );
}

function TabItem({ item, active }: { item: NavItem; active: boolean }) {
    return (
        <Link
            href={item.href}
            className={cn(
                'flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                active
                    ? 'text-foreground'
                    : 'text-muted-foreground active:scale-95',
            )}
        >
            {item.icon && (
                <item.icon
                    className={cn('size-5', active && 'text-primary')}
                />
            )}
            <span className="max-w-full truncate px-1">{item.title}</span>
        </Link>
    );
}
