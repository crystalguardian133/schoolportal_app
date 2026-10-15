import { Head, usePage } from '@inertiajs/react';
import {
    AnnouncementBoard
    
} from '@/components/announcements/announcement-board';
import type {BoardAnnouncement} from '@/components/announcements/announcement-board';
import { PortalPageShell } from '@/components/portal-page-shell';

type ClassSectionRow = {
    uuid: string;
    name: string;
    grade_level?: string | null;
    is_substitute?: boolean | null;
};

export default function TeacherAnnouncements() {
    const { props } = usePage<{
        announcements?: BoardAnnouncement[];
        allowedSections?: ClassSectionRow[];
        allSections?: ClassSectionRow[];
        isFullAdmin?: boolean;
        isAdviser?: boolean;
        adviserSectionUuid?: string | null;
        sort?: string;
    }>();

    const announcements = props.announcements || [];
    const allowedSections = props.allowedSections || [];
    const allSections = props.allSections || [];
    const isFullAdmin = props.isFullAdmin || false;
    const isAdviser = props.isAdviser || false;
    const adviserSectionUuid = props.adviserSectionUuid || null;
    const sort = props.sort || 'latest';

    // Derive what the user can do
    const canClassScope = isAdviser && !!adviserSectionUuid;
    const sectionPool = isFullAdmin ? allSections : allowedSections;
    const allowedScopes: Array<'system' | 'class' | 'section'> = [
        ...(isFullAdmin ? (['system'] as const) : []),
        ...(canClassScope ? (['class'] as const) : []),
        ...(sectionPool.length > 0 ? (['section'] as const) : []),
    ];
    const defaultScope = canClassScope
        ? 'class'
        : isFullAdmin
          ? 'system'
          : 'section';

    return (
        <>
            <Head title="Announcements" />
            <PortalPageShell
                title="Announcements"
                description="Create and view announcements for your assigned sections."
            >
                <AnnouncementBoard
                    announcements={announcements}
                    sort={sort}
                    basePath="/teacher/announcements"
                    manageable
                    scope={{
                        mode: 'scoped',
                        allowedScopes,
                        defaultScope,
                        classSectionUuid: canClassScope
                            ? (adviserSectionUuid ?? '')
                            : '',
                        classSectionName: canClassScope
                            ? (allowedSections.find(
                                  (s) => s.uuid === adviserSectionUuid,
                              )?.name ?? 'Unknown')
                            : '',
                        sectionOptions: sectionPool.map((section) => ({
                            uuid: section.uuid,
                            name: section.name,
                            grade_level: section.grade_level,
                            tag: section.is_substitute ? ' (SUB)' : null,
                        })),
                    }}
                />
            </PortalPageShell>
        </>
    );
}
