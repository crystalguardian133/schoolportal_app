import { Command } from 'cmdk';
import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

export type CommandItem = {
    id: string;
    label: string;
    section?: string;
    action: () => void;
};

type CommandPaletteProps = {
    items: CommandItem[];
    open: boolean;
    onClose: () => void;
    placeholder?: string;
};

export function CommandPalette({ items, open, onClose, placeholder = 'Search...' }: CommandPaletteProps) {
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!open) setSearch('');
    }, [open]);

    useEffect(() => {
        function onKeyDown(e: KeyboardEvent) {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (open) onClose();
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    const grouped = items.reduce(
        (acc, item) => {
            const section = item.section || 'Results';
            if (!acc[section]) acc[section] = [];
            acc[section].push(item);
            return acc;
        },
        {} as Record<string, CommandItem[]>,
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-[20vh]"
            onClick={onClose}
        >
            <Command
                className="mx-4 w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-white shadow-2xl dark:bg-sidebar"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center border-b border-border px-4">
                    <Search className="size-4 text-muted-foreground" />
                    <Command.Input
                        value={search}
                        onValueChange={setSearch}
                        placeholder={placeholder}
                        className="flex-1 bg-transparent px-3 py-3 text-sm outline-none"
                    />
                    <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="size-4" />
                    </button>
                </div>
                <Command.List className="max-h-80 overflow-y-auto p-2">
                    <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                        No results found.
                    </Command.Empty>
                    {Object.entries(grouped).map(([section, sectionItems]) => (
                        <Command.Group key={section} heading={section} className="mb-2">
                            {sectionItems.map((item) => (
                                <Command.Item
                                    key={item.id}
                                    value={item.label}
                                    onSelect={() => {
                                        item.action();
                                        onClose();
                                    }}
                                    className="cursor-pointer rounded-lg px-3 py-2 text-sm transition hover:bg-muted"
                                >
                                    {item.label}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    ))}
                </Command.List>
            </Command>
        </div>
    );
}
