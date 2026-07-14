import { ChevronDown, X } from 'lucide-react';
import { useState, useRef, useEffect, useMemo } from 'react';

type Option = {
    value: string;
    label: string;
    sublabel?: string;
    disabled?: boolean;
};

type Props = {
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
};

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    className = '',
}: Props) {
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    const selected = options.find((o) => o.value === value);

    const filtered = useMemo(() => {
        if (!query.trim()) {
return options;
}

        const q = query.toLowerCase();

        return options.filter(
            (o) =>
                o.label.toLowerCase().includes(q) ||
                (o.sublabel && o.sublabel.toLowerCase().includes(q)),
        );
    }, [options, query]);

    useEffect(() => {
        setHighlightIndex(0);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                listRef.current &&
                !listRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setOpen(false);
                setQuery('');
            }
        }
        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    function selectOption(opt: Option) {
        if (opt.disabled) {
return;
}

        onChange(opt.value);
        setOpen(false);
        setQuery('');
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (!open) {
            if (e.key === 'Enter' || e.key === 'ArrowDown') {
                e.preventDefault();
                setOpen(true);
            }

            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightIndex((i) => Math.max(i - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();

            if (filtered[highlightIndex]) {
                selectOption(filtered[highlightIndex]);
            }
        } else if (e.key === 'Escape') {
            setOpen(false);
            setQuery('');
        }
    }

    return (
        <div className={`relative ${className}`}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => {
                    setOpen(!open);

                    if (!open) {
                        setTimeout(() => inputRef.current?.focus(), 0);
                    }
                }}
                className="flex w-full items-center justify-between rounded-2xl border border-input bg-background px-3 py-3 text-sm transition outline-none focus:border-ring focus:ring-4 focus:ring-ring/15"
            >
                <span className={selected ? 'text-foreground' : 'text-muted-foreground'}>
                    {selected ? (
                        <span>
                            {selected.label}
                            {selected.sublabel && (
                                <span className="ml-1 text-muted-foreground">
                                    — {selected.sublabel}
                                </span>
                            )}
                        </span>
                    ) : (
                        placeholder
                    )}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {/* Dropdown */}
            {open && (
                <div
                    ref={listRef}
                    className="absolute z-50 mt-1 w-full overflow-hidden rounded-2xl border border-border bg-background shadow-lg"
                >
                    {/* Search input */}
                    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type to search..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery('')}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Options list */}
                    <div className="max-h-60 overflow-y-auto p-1">
                        {filtered.length === 0 ? (
                            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                                No matches found.
                            </div>
                        ) : (
                            filtered.map((opt, i) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    disabled={opt.disabled}
                                    onClick={() => selectOption(opt)}
                                    onMouseEnter={() => setHighlightIndex(i)}
                                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                                        opt.value === value
                                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200'
                                            : i === highlightIndex
                                              ? 'bg-muted'
                                              : ''
                                    } ${opt.disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-muted'}`}
                                >
                                    <span className="flex-1 truncate">
                                        {opt.label}
                                        {opt.sublabel && (
                                            <span className="ml-1 text-muted-foreground">
                                                — {opt.sublabel}
                                            </span>
                                        )}
                                    </span>
                                    {opt.value === value && (
                                        <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                            ✓
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
