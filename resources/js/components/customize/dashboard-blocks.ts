/**
 * Stable dashboard block ids shared by the dashboard renderer and the
 * WidgetToggles settings UI. Unknown ids always render (see resolveWidgets),
 * so adding a block here + in dashboard.tsx is enough for new features.
 */
export type WidgetBlock = { id: string; label: string };

export const ROLE_BLOCKS: WidgetBlock[] = [
    { id: 'stats', label: 'Statistics cards' },
    { id: 'tools', label: 'Quick actions' },
    { id: 'school-year', label: 'Active school year' },
    { id: 'report-types', label: 'Report types' },
    { id: 'report-status', label: 'Report status' },
    { id: 'charts', label: 'Charts' },
    { id: 'announcements', label: 'Recent announcements' },
    { id: 'reports', label: 'Recent reports' },
];

export const STUDENT_BLOCKS: WidgetBlock[] = [
    { id: 'identity', label: 'Profile chips' },
    { id: 'metrics', label: 'Metric cards' },
    { id: 'links', label: 'Quick links' },
];

export const WIDGET_GROUPS: { key: string; label: string; blocks: WidgetBlock[] }[] = [
    { key: 'school-head', label: 'School head section', blocks: ROLE_BLOCKS },
    { key: 'admin', label: 'Admin section', blocks: ROLE_BLOCKS },
    { key: 'department-head', label: 'Department head section', blocks: ROLE_BLOCKS },
    { key: 'teacher', label: 'Teacher section', blocks: ROLE_BLOCKS },
    { key: 'staff', label: 'Staff section', blocks: ROLE_BLOCKS },
    { key: 'developer', label: 'Developer section', blocks: ROLE_BLOCKS },
    { key: 'student', label: 'Student section', blocks: STUDENT_BLOCKS },
];
