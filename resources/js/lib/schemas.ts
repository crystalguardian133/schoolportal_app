import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
    remember: z.boolean().optional(),
});

export const createTeacherSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.string().min(1, 'Role is required'),
});

export const createStudentSchema = z.object({
    first_name: z.string().min(1, 'First name is required'),
    middle_name: z.string().optional(),
    last_name: z.string().min(1, 'Last name is required'),
    lrn: z.string().optional(),
    email: z.string().email('Please enter a valid email address').optional().or(z.literal('')),
    grade_level: z.string().min(1, 'Grade level is required'),
    section: z.string().min(1, 'Section is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const createSubjectSchema = z.object({
    name: z.string().min(1, 'Subject name is required'),
    code: z.string().optional(),
    description: z.string().optional(),
    grade_level: z.string().min(1, 'Grade level is required'),
});

export const createSchoolYearSchema = z.object({
    name: z.string().min(1, 'School year name is required'),
    start_date: z.string().min(1, 'Start date is required'),
    end_date: z.string().min(1, 'End date is required'),
    enrollment_start: z.string().optional(),
    enrollment_end: z.string().optional(),
});

export const createAnnouncementSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    body: z.string().min(1, 'Announcement body is required'),
    target: z.enum(['all', 'students', 'teachers', 'staff']),
    is_pinned: z.boolean().optional(),
});

export const createScheduleSchema = z.object({
    class_section_uuid: z.string().min(1, 'Section is required'),
    subject_uuid: z.string().min(1, 'Subject is required'),
    teacher_id: z.string().min(1, 'Teacher is required'),
    room: z.string().optional(),
    entries: z.array(
        z.object({
            day: z.string().min(1, 'Day is required'),
            start_time: z.string().min(1, 'Start time is required'),
            end_time: z.string().min(1, 'End time is required'),
        }),
    ).min(1, 'At least one schedule entry is required'),
});

export const gradeSchema = z.object({
    preliminary: z.string().optional(),
    midterm: z.string().optional(),
    finals: z.string().optional(),
    total: z.string().optional(),
    remarks: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateSubjectInput = z.infer<typeof createSubjectSchema>;
export type CreateSchoolYearInput = z.infer<typeof createSchoolYearSchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;
export type GradeInput = z.infer<typeof gradeSchema>;
