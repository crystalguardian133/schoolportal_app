import { Search, X } from 'lucide-react';
import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react';
import { LUCIDE_ICON_NAMES } from '@/lib/lucide-icons';
import { cn } from '@/lib/utils';

const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<{ className?: string }>>>();

function getLazyIcon(name: string) {
    if (!iconCache.has(name)) {
        iconCache.set(
            name,
            lazy(() =>
                import('lucide-react').then((mod) => ({
                    default: (mod as Record<string, unknown>)[name] as React.ComponentType<{ className?: string }>,
                })),
            ),
        );
    }

    return iconCache.get(name)!;
}

type IconPickerProps = {
    value: string;
    onChange: (name: string) => void;
    className?: string;
};

export default function IconPicker({ value, onChange, className }: IconPickerProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const filtered = useMemo(() => {
        if (!query) {
return LUCIDE_ICON_NAMES;
}

        const q = query.toLowerCase().replace(/[\s_]/g, '');

        return LUCIDE_ICON_NAMES.filter((name) =>
            name.toLowerCase().replace(/[\s_]/g, '').includes(q),
        );
    }, [query]);

    const SelectedIcon = value ? getLazyIcon(value) : null;

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={cn('relative', className)} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => {
                    setOpen(!open);
                    setTimeout(() => inputRef.current?.focus(), 50);
                }}
                className="flex w-full items-center gap-2 rounded-xl border border-sidebar-border/70 bg-sidebar/40 px-3 py-2 text-sm text-foreground transition hover:bg-sidebar/60 dark:border-sidebar-border/70 dark:bg-sidebar/80 dark:hover:bg-sidebar-accent/50"
            >
                {SelectedIcon ? (
                    <Suspense fallback={<span className="size-4 shrink-0 rounded bg-muted" />}>
                        <SelectedIcon className="size-4 shrink-0" />
                    </Suspense>
                ) : (
                    <span className="size-4 shrink-0 rounded bg-muted" />
                )}
                <span className="truncate">{value || 'Pick an icon...'}</span>
                {value && (
                    <X
                        className="ml-auto size-3.5 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange('');
                        }}
                    />
                )}
            </button>

            {open && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border border-sidebar-border/70 bg-white shadow-xl dark:bg-sidebar">
                    <div className="border-b border-sidebar-border/70 p-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search icons..."
                                className="w-full rounded-lg border border-sidebar-border/70 bg-sidebar/40 py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 dark:bg-sidebar/80"
                            />
                        </div>
                    </div>
                    <div className="grid max-h-64 grid-cols-8 gap-0.5 overflow-y-auto p-2">
                        <Suspense
                            fallback={Array.from({ length: 64 }).map((_, i) => (
                                <div key={i} className="flex size-8 items-center justify-center">
                                    <div className="size-4 animate-pulse rounded bg-muted" />
                                </div>
                            ))}
                        >
                            {filtered.map((name) => {
                                const Icon = getLazyIcon(name);

                                return (
                                    <button
                                        key={name}
                                        type="button"
                                        title={name}
                                        onClick={() => {
                                            onChange(name);
                                            setOpen(false);
                                            setQuery('');
                                        }}
                                        className={cn(
                                            'flex size-8 items-center justify-center rounded-lg transition hover:bg-sidebar-accent/60',
                                            value === name && 'bg-primary/10 text-primary ring-1 ring-primary/30',
                                        )}
                                    >
                                        <Icon className="size-4" />
                                    </button>
                                );
                            })}
                        </Suspense>
                        {filtered.length === 0 && (
                            <div className="col-span-8 py-6 text-center text-xs text-muted-foreground">
                                No icons found.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
