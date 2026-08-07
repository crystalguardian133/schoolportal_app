import type { InertiaLinkProps } from '@inertiajs/react';
import { clsx } from 'clsx';
import type { ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function toUrl(url: NonNullable<InertiaLinkProps['href']>): string {
    return typeof url === 'string' ? url : url.url;
}

export function getFirstName(name?: string | null): string {
    if (!name) {
        return '';
    }

    const trimmed = name.trim();

    if (!trimmed) {
        return '';
    }

    let firstName = trimmed;

    const commaIndex = trimmed.indexOf(',');

    if (commaIndex >= 0) {
        firstName = trimmed.slice(commaIndex + 1).trim();
    }

    const words = firstName.split(/\s+/).filter(Boolean);

    if (words.length > 1 && words[words.length - 1].length === 1) {
        words.pop();
    }

    return words.join(' ') || firstName;
}
