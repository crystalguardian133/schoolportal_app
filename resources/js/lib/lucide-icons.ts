export const LUCIDE_ICON_NAMES = [
    // Roles & People
    'Shield', 'ShieldCheck', 'ShieldAlert', 'ShieldOff', 'Crown',
    'User', 'Users', 'UserCheck', 'UserMinus', 'UserPlus', 'UserRound', 'UsersRound',
    'GraduationCap', 'BookOpen', 'BookMarked', 'Library',
    'Briefcase', 'BriefcaseBusiness', 'BriefcaseMedical',
    'Building', 'Building2', 'Landmark', 'School', 'Hospital',
    'Stethoscope', 'Heart', 'HeartHandshake', 'HandHelping',
    'Baby', 'ContactRound', 'Contact', 'UserCog',

    // Dashboard & Reports
    'LayoutDashboard', 'BarChart3', 'BarChart', 'LineChart', 'PieChart',
    'TrendingUp', 'TrendingDown', 'Target', 'Goal', 'Gauge', 'Activity',

    // Operations
    'ClipboardList', 'ClipboardCheck', 'ClipboardPaste',
    'CheckCircle', 'CheckCircle2', 'CheckSquare',
    'AlertTriangle', 'AlertCircle', 'AlertOctagon',
    'Ban', 'ShieldX', 'ShieldBan',

    // Search & Settings
    'Search', 'SlidersHorizontal', 'Settings', 'Settings2',
    'Cog', 'Wrench',

    // Time & Calendar
    'Calendar', 'CalendarDays', 'CalendarCheck', 'CalendarX',
    'Clock', 'Clock3', 'Timer', 'AlarmClock', 'AlarmClockCheck',
    'History', 'CalendarClock', 'CalendarRange',
    'Sunrise', 'Sunset',

    // Communication
    'Bell', 'BellRing', 'BellOff', 'BellDot',
    'Mail', 'MailCheck', 'MailPlus', 'MailX', 'MailOpen',
    'MessageCircle', 'MessageSquare', 'MessageSquareText',
    'Phone', 'PhoneCall', 'PhoneOff',
    'Megaphone', 'MegaphoneOff', 'Radio',

    // Files & Documents
    'FileText', 'FileCheck', 'FilePlus', 'FileMinus', 'FileX',
    'Folder', 'FolderOpen', 'FolderPlus', 'FolderCheck',
    'FileImage', 'Camera', 'CameraOff',
    'Paperclip', 'FileSignature', 'FileSearch', 'FileLock',
    'Archive', 'Database', 'HardDrive', 'Server',

    // Status
    'CircleCheck', 'CircleX', 'CircleAlert', 'CircleHelp',
    'ToggleLeft', 'ToggleRight',
    'Loader2', 'RefreshCcw', 'RefreshCw',
    'Undo', 'Redo',

    // Security
    'Lock', 'Unlock', 'LockOpen',
    'Key', 'KeyRound',
    'Fingerprint', 'Scan', 'ScanFace',
    'Eye', 'EyeOff',

    // Data
    'Table', 'TableCellsMerge',
    'List', 'ListCheck',
    'Hash', 'AtSign', 'Percent',

    // Money
    'DollarSign', 'CreditCard', 'Wallet',
    'Receipt', 'ReceiptText', 'Banknote',
    'BadgeCheck', 'BadgeDollarSign',

    // Misc
    'Bug', 'BugOff', 'Zap', 'ZapOff',
    'Globe', 'GlobeLock',
    'MapPin', 'MapPinOff', 'Navigation',
    'Compass', 'Route',
    'Star', 'StarOff', 'Flag', 'FlagOff',
    'Bookmark', 'BookmarkPlus',
    'Tag', 'Tags',
    'Layers', 'Package', 'PackageCheck', 'PackageOpen',
    'Truck', 'Train', 'Bus', 'Car',
    'Coffee', 'Utensils', 'Cake',
    'Dumbbell', 'HeartPulse',
    'Flower', 'TreePine', 'TreePalm', 'Leaf',
    'Snowflake', 'Cloud', 'CloudRain',
    'Droplet', 'Droplets', 'Flame',
    'Anchor', 'Gem', 'Trophy', 'Medal', 'Award',
    'PartyPopper', 'Ticket', 'TicketCheck', 'TicketPercent',
    'Puzzle', 'Blocks',
] as const;

export type LucideIconName = (typeof LUCIDE_ICON_NAMES)[number];
