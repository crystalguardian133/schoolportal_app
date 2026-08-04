import type { ReactNode } from 'react';
import { TableSkeleton, FormPlusTableSkeleton, DashboardSkeleton, CardsSkeleton, ListSkeleton } from '@/components/skeletons';
import { usePageLoading } from '@/hooks/use-page-loading';

type SkeletonType = 'table' | 'form-table' | 'dashboard' | 'cards' | 'list';

export function PageLoader({ skeleton = 'table', children }: { skeleton?: SkeletonType; children: ReactNode }) {
    const loading = usePageLoading();

    if (loading) {
        switch (skeleton) {
            case 'form-table':
                return <FormPlusTableSkeleton />;
            case 'dashboard':
                return <DashboardSkeleton />;
            case 'cards':
                return <CardsSkeleton />;
            case 'list':
                return <ListSkeleton />;
            default:
                return <TableSkeleton />;
        }
    }

    return <>{children}</>;
}
