import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

export function formatDate(date: string | Date | null | undefined, fmt = 'MMM d, yyyy'): string {
    if (!date) {
return '—';
}

    const d = typeof date === 'string' ? parseISO(date) : date;

    return isValid(d) ? format(d, fmt) : '—';
}

export function formatDateTime(date: string | Date | null | undefined): string {
    return formatDate(date, 'MMM d, yyyy h:mm a');
}

export function formatTime(date: string | Date | null | undefined): string {
    return formatDate(date, 'h:mm a');
}

export function formatRelative(date: string | Date | null | undefined): string {
    if (!date) {
return '';
}

    const d = typeof date === 'string' ? parseISO(date) : date;

    return isValid(d) ? formatDistanceToNow(d, { addSuffix: true }) : '';
}

export function formatShortDate(date: string | Date | null | undefined): string {
    return formatDate(date, 'MM/dd/yyyy');
}
