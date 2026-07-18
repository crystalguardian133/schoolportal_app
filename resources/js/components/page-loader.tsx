import { ReactNode } from 'react';
import { usePageLoading } from '@/hooks/use-page-loading';
import { TableSkeleton, FormPlusTableSkeleton, DashboardSkeleton, CardsSkeleton, ListSkeleton } from '@/components/skeletons';

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
