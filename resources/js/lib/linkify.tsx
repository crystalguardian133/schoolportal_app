import type { ReactNode } from 'react';

const URL_PATTERN = /(https?:\/\/[^\s]+)/g;

/**
 * Renders a plain-text string, turning any HTTP(S) URLs into clickable
 * hyperlinks while preserving literal newlines.
 */
export function renderTextWithLinks(text: string): ReactNode[] {
    const parts = text.split(URL_PATTERN);

    return parts.map((part, index) => {
        if (!part) {
            return null;
        }

        if (URL_PATTERN.test(part)) {
            return (
                <a
                    key={index}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all text-amber-700 underline decoration-amber-700/40 underline-offset-2 hover:text-amber-600 dark:text-amber-400 dark:decoration-amber-400/40 dark:hover:text-amber-300"
                >
                    {part}
                </a>
            );
        }

        return <span key={index} className="whitespace-pre-line">{part}</span>;
    });
}
