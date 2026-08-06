import { usePwa } from '@/contexts/pwa-context';
import { useIsMobile } from '@/hooks/use-mobile';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import PwaMobileLayout from '@/layouts/pwa/pwa-mobile-layout';
import type { BreadcrumbItem } from '@/types';

export default function AppLayout({
    breadcrumbs = [],
    children,
}: {
    breadcrumbs?: BreadcrumbItem[];
    children: React.ReactNode;
}) {
    const { isStandalone } = usePwa();
    const isMobile = useIsMobile();

    if (isStandalone && isMobile) {
        return <PwaMobileLayout>{children}</PwaMobileLayout>;
    }

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs}>
            {children}
        </AppLayoutTemplate>
    );
}
