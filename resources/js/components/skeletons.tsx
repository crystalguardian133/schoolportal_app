import { cn } from '@/lib/utils';

function Bone({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-xl bg-gradient-to-r from-muted via-muted/60 to-muted',
                className,
            )}
        />
    );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Bone className="h-4 w-32" />
                <div className="flex gap-3">
                    <Bone className="h-9 w-48 rounded-xl" />
                    <Bone className="h-9 w-24 rounded-xl" />
                </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-sidebar-border/70">
                <div className="bg-sidebar/60 px-4 py-3">
                    <div className="flex gap-4">
                        {Array.from({ length: cols }).map((_, i) => (
                            <Bone key={i} className="h-3 flex-1" />
                        ))}
                    </div>
                </div>
                {Array.from({ length: rows }).map((_, row) => (
                    <div
                        key={row}
                        className="flex items-center gap-4 border-t border-sidebar-border/70 px-4 py-3"
                    >
                        {Array.from({ length: cols }).map((_, col) => (
                            <Bone
                                key={col}
                                className={cn(
                                    'h-3',
                                    col === 0 ? 'w-40' : col === cols - 1 ? 'w-20' : 'flex-1',
                                )}
                            />
                        ))}
                    </div>
                ))}
            </div>
            <div className="flex items-center justify-between pt-2">
                <Bone className="h-3 w-40" />
                <div className="flex gap-2">
                    <Bone className="h-9 w-24 rounded-lg" />
                    <Bone className="h-9 w-20 rounded-lg" />
                </div>
            </div>
        </div>
    );
}

export function FormPlusTableSkeleton() {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-3 rounded-2xl border border-sidebar-border/70 p-5">
                <Bone className="h-4 w-24" />
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1.5">
                        <Bone className="h-3 w-16" />
                        <Bone className="h-9 w-full rounded-lg" />
                    </div>
                ))}
                <Bone className="h-9 w-20 rounded-lg ml-auto" />
            </div>
            <div className="md:col-span-2 space-y-3 rounded-2xl border border-sidebar-border/70 p-5">
                <Bone className="h-4 w-32" />
                <TableSkeleton rows={5} cols={5} />
            </div>
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="space-y-6">
            <Bone className="h-32 w-full rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Bone key={i} className="h-28 rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Bone className="h-64 rounded-2xl" />
                <Bone className="h-64 rounded-2xl" />
            </div>
        </div>
    );
}

export function CardsSkeleton({ count = 6 }: { count?: number }) {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: count }).map((_, i) => (
                <Bone key={i} className="h-36 rounded-2xl" />
            ))}
        </div>
    );
}

export function ListSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Bone className="h-4 w-40" />
                <Bone className="h-9 w-32 rounded-xl" />
            </div>
            <Bone className="h-9 w-full rounded-xl" />
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 rounded-xl border border-sidebar-border/70 p-3">
                        <Bone className="size-10 shrink-0 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                            <Bone className="h-3 w-36" />
                            <Bone className="h-2.5 w-48" />
                        </div>
                        <Bone className="h-6 w-16 rounded-full" />
                    </div>
                ))}
            </div>
        </div>
    );
}
