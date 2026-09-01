# DNHS School Portal — Master Build Prompt

## Project Context
This is a school portal for **Dulag National High School (DNHS)** built with:
- **Backend:** Laravel 13, PHP 8.3, MySQL (via Laragon)
- **Frontend:** React 19 + TypeScript, Inertia.js, Tailwind CSS v4
- **Auth:** Laravel Fortify (password + passkeys + 2FA)
- **Location:** `C:\laragon\www\schoolportal_app`

The project is **incomplete**. Fix and build all items below in the exact phase order listed. After completing each phase, confirm before moving to the next.

---

## PHASE 1 — Critical Fixes (Do these first)

### Fix 1.1 — Auto-create student User account on enrollment   <b>[FIXED]</b>
**File:** `app/Http/Controllers/EnrollmentController.php`

When a new student is enrolled (`store` method), automatically:
1. Create a `User` record with:
   - `name` = student full name
   - `email` = generated from LRN: `lrn@dnhs.edu.ph` (e.g., `300000000001@dnhs.edu.ph`)
   - `password` = bcrypt of their LRN (temporary password)
2. Assign the `student` role to the new user
3. Link the `User` to the `Student` record via `user_uuid`
4. Also handle the `promote` method — when a student is promoted to the next grade, do NOT create a new user; just update the existing student record

Make sure this does not break re-enrollment of existing students who already have a user account.
##Applied Fixes
1. When student's being enrolled as a new student, student role auto applies unless when creating a new user, in which it will be treated as a guest account with login credentials
2. If `password` and `confirm_password` is left blank then the `birth_date` is automatically used as a password and it is auto encrypted with bcryp, the defaulted format used is{yyyy-mm-dd}
3. Auto assign upon registry
4. Auto promotion happens when `school_year` ends
---

### Fix 1.2 — Add Q4 to all grade tables and entry forms <b>[Resolved]</b>
**Files to update:**
- `resources/js/pages/student/grades.tsx` — change `['Q1', 'Q2', 'Q3']` to `['Q1', 'Q2', 'Q3', 'Q4']`
- `resources/js/pages/teacher/grades.tsx` — add Q4 column to grade entry table
- `resources/js/pages/teacher/manage-class.tsx` — add Q4 input field
- `app/Http/Controllers/TeacherGradeController.php` — ensure Q4 is accepted and saved in the `update` method
- `app/Http/Controllers/StudentPortalController.php` — ensure Q4 is returned in grade data

The grade model stores grades as a JSON array in `student_subject.grades`. Ensure index 3 (Q4) is read and written correctly. The `total` field should be the average of all 4 quarters.

###Changes:
1. Since the new curriculum introduces 3 "quarters" now or idk how they call it this fix is invalid.
---

### Fix 1.3 — Add Forgot Password / Password Reset flow
**Implementation:**
1. Uncomment `MustVerifyEmail` is NOT needed — just implement password reset
2. Create a `ForgotPasswordController` or use Laravel Fortify's built-in reset
3. Add routes in `routes/web.php` for `/forgot-password` and `/reset-password/{token}`
4. Create frontend pages:
   - `resources/js/pages/auth/forgot-password.tsx` — email input form
   - `resources/js/pages/auth/reset-password.tsx` — new password form
5. Configure mail in `.env` to use `MAIL_MAILER=smtp` with instructions to fill in SMTP details
6. Add a "Forgot Password?" link on the login form (`resources/js/components/login-form.tsx`)

###Fixes:
1. Applied the mailer using the Laravel mailer so that it can send the reset password link if the associated email exists
2. Added a locked-out to accounts who have entered the password too many times and added a simple captcha to prevent spam requests
3. 
---

### Fix 1.4 — Replace broken pre-registration enrollment form
**File:** `public/enrollment-form.html`

Replace the placeholder with a real, printable HTML enrollment form for DNHS containing:
- School name: **Dulag National High School**
- School year field
- Student information section (LRN, full name, birthday, age, gender, address)
- Parent/Guardian information section
- Previous school information section
- Grade level and strand (for SHS)
- Signature lines for: student, parent/guardian, registrar
- DNHS header with school logo placeholder
- Print-friendly CSS (no dark backgrounds, proper margins for A4 paper)
- A print button at the top that hides when printing

---

### Fix 1.5 — Wire push notifications to real events
**Files to create/update:**
- Create `app/Events/AnnouncementPublished.php`
- Create `app/Listeners/SendAnnouncementPushNotification.php`
- Update `app/Http/Controllers/AnnouncementController.php` — fire `AnnouncementPublished` event after store/update
- Create a helper service `app/Services/PushNotificationService.php` that:
  - Fetches all relevant `PushSubscription` records (filtered by scope/role if needed)
  - Sends Web Push notifications using `minishlink/web-push`
- Register the event/listener in `app/Providers/AppServiceProvider.php`
- Add `PUSH_ENABLED=true`, `VAPID_SUBJECT`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` instructions to `.env.example`

Only send push if `PUSH_ENABLED=true`.

---

### Fix 1.6 — Configure email with instructions
**Files:**
- Update `.env.example` to clearly document SMTP config:
  ```
  MAIL_MAILER=smtp
  MAIL_HOST=smtp.gmail.com
  MAIL_PORT=587
  MAIL_USERNAME=your@gmail.com
  MAIL_PASSWORD=your_app_password
  MAIL_ENCRYPTION=tls
  MAIL_FROM_ADDRESS=noreply@dnhs.edu.ph
  MAIL_FROM_NAME="DNHS School Portal"
  ```
- Create `app/Mail/StudentCredentialsMail.php` — sends new student their login email and temporary password
- Send this mail after Fix 1.1 creates a student user account
- Create a simple, clean mail view at `resources/views/mail/student-credentials.blade.php`

---

## PHASE 2 — High Priority Features

### Feature 2.1 — Student Attendance History Page
**Create:**
- `resources/js/pages/student/attendance.tsx` — shows the student's attendance records grouped by subject, with present/absent/late counts and a table of sessions
- `app/Http/Controllers/StudentPortalController.php` — add `attendance()` method that returns the student's attendance records
- Add route: `GET /student/attendance` → `StudentPortalController@attendance` → name `student.attendance`
- Add link to student sidebar navigation

---

### Feature 2.2 — Attendance Export (PDF/CSV) for Teachers
**Update:**
- `resources/js/pages/teacher/attendance-session.tsx` — add Export PDF and Export CSV buttons
- `app/Http/Controllers/AttendanceController.php` — add `export(Request $request, $id)` method
  - CSV: return a downloadable CSV of all attendance records in the session
  - PDF: use `jsPDF` on the frontend or generate server-side with a simple HTML-to-PDF approach
- Add route: `GET /teacher/attendance/sessions/{id}/export`

---

### Feature 2.3 — Student Report Card PDF Export
**Create:**
- `resources/js/pages/student/grades.tsx` — add a "Download Report Card" button that triggers PDF generation using `jspdf` + `jspdf-autotable`
- The PDF should include:
  - DNHS school header
  - Student name, LRN, grade level, section, school year
  - Table of subjects with Q1, Q2, Q3, Q4, and Final Grade columns
  - General Average row at the bottom
  - Remarks (Passed/Failed based on 75 passing grade)
- Also add a grade sheet export on the teacher grades page (`teacher/grades.tsx`) for the whole class

---

### Feature 2.4 — Adviser Dashboard **[IMPLEMENTED]**
**Create:**
- `resources/js/pages/adviser/dashboard.tsx` — adviser welcome dashboard showing:
  - Their assigned section name and grade level
  - Number of students in their section
  - Subjects assigned to their section
  - Quick links to: Assign Subjects, Announcements, Attendance
- `app/Http/Controllers/DashboardController.php` — add `adviserSection()` private method
- Add `'access adviser dashboard'` permission check to the dashboard order array
- Add route for `GET /adviser/dashboard` if needed
- 
---

### Feature 2.5 — Active School Year Warning Banner **[IMPLEMENTED]**
**Update:**
- `resources/js/pages/admin/dashboard.tsx` (or the main dashboard component) — show a prominent red warning banner at the top when no school year is currently active
- `app/Http/Controllers/DashboardController.php` — pass `hasActiveSchoolYear: bool` to all admin/school-head sections
- The banner should say: "⚠️ No active school year is set. Enrollment and grading may not work correctly. Go to School Years →"

---

### Feature 2.6 — Fix Staff Dashboard Links **[IMPLEMENTED]**
**Update:**
- `resources/js/pages/staff/dashboard.tsx` — replace teacher/student links with appropriate staff actions:
  - View student list (read-only)
  - View announcements
  - View school schedule
  - Submit feedback/report
- Remove links to teacher class management and student subject enrollment pages

---

### Feature 2.7 — Improve QR Attendance Scan Feedback **[UPCOMING]**
**Update:**
- `resources/js/pages/student/attendance-scan.tsx` — improve the post-scan result screen to clearly show:
  - ✅ Present / ⏰ Late / ❌ Already recorded
  - Session name and subject
  - Time of scan
  - Student name confirmation
- Handle and display all error states (session closed, invalid token, etc.) with friendly messages

---

## PHASE 3 — Medium Priority (UX & Polish)

### Feature 3.1 — Student Profile Page **[UPCOMING]**
**Create:**
- `resources/js/pages/student/profile.tsx` — student can view and edit:
  - Profile picture upload
  - Contact number
  - Home address
  - Emergency contact
  - Cannot edit: LRN, name, birthday, grade level (admin-only fields)
- Add route `GET/PATCH /student/profile`
- Add controller method in `StudentPortalController`

---

### Feature 3.2 — Announcement Notification Bell Badge
**Update:**
- `resources/js/components/app-header.tsx` — wire the bell icon to call `GET /announcements/new-count` on mount and show a red badge with the count
- Poll every 60 seconds for updates (or use Laravel Echo if Reverb is configured)
- Reset count when user visits the announcements page

---

### Feature 3.3 — System Logs — Date Filter + Export **[IMPLEMENTED]**
**Update:**
- `resources/js/pages/admin/system-logs.tsx` — add date range picker (start date / end date) filter
- `app/Http/Controllers/AdminSystemLogController.php` — add date range filtering to the `index` query
- Add CSV export button that downloads filtered logs

---

### Feature 3.4 — Batch ID Card Download by Section
**Update:**
- `resources/js/pages/admin/id-cards.tsx` — add section dropdown filter and a "Download All as PDF" button that generates all ID cards for the selected section in a single PDF using jsPDF

---

### Feature 3.5 — Prevent Duplicate LRN on Enrollment
**Update:**
- `app/Http/Controllers/EnrollmentController.php` — in the `store` method, before creating a new student, check if a student with the same LRN already exists
- If found: return a validation error with a message like "A student with LRN {lrn} already exists. Use the re-enrollment flow instead."
- Update the enrollment form on the frontend to show this error clearly

---

### Feature 3.6 — Brand the Welcome Page for DNHS
**Update:**
- `resources/js/pages/welcome.tsx` — update all text, colors, and branding to reference:
  - School name: **Dulag National High School**
  - Location: Dulag, Leyte
  - DepEd division context
  - Relevant features (enrollment, grades, attendance, announcements)
  - Replace any generic Laravel starter kit content

---

## PHASE 4 — Polish & Optimization

### Polish 4.1 — Set APP_NAME
Update `.env`:
```
APP_NAME="DNHS School Portal"
```
And update `resources/views/app.blade.php` title tag if hardcoded.

---

### Polish 4.2 — Replace Favicon and PWA Icons
**Replace:**
- `public/favicon.ico`
- `public/favicon.svg`
- `public/pwa-icons/` — all icon sizes

Generate a proper school-themed icon (DNHS initials or school logo) and replace all assets. Update `public/manifest.webmanifest` with correct app name and theme color.

---

### Polish 4.3 — Fix Vendor PHP 8.3 Warnings
Run:
```bash
composer update thecodingmachine/safe
```
If that doesn't resolve it, suppress in `bootstrap/app.php` or add a patch note.

---

### Polish 4.4 — Add Loading Skeletons to Heavy Pages
**Update:**
- `resources/js/pages/admin/enrollments.tsx`
- `resources/js/pages/admin/system-logs.tsx`
- `resources/js/pages/admin/manage-students.tsx`

Use the existing `resources/js/components/skeletons.tsx` component. Show skeleton while Inertia is loading the page.

---

## Completion Checklist

- [X] Phase 1.1 — Auto-create student user on enrollment
- [X] Phase 1.2 — Q4 added to all grade tables
- [X] Phase 1.3 — Forgot password flow
- [ ] Phase 1.4 — Real enrollment form PDF
- [ ] Phase 1.5 — Push notifications wired
- [ ] Phase 1.6 — Email configured + student credentials mail
- [ ] Phase 2.1 — Student attendance history page
- [ ] Phase 2.2 — Attendance export for teachers
- [ ] Phase 2.3 — Report card PDF export
- [X] Phase 2.4 — Adviser dashboard
- [X] Phase 2.5 — Active school year warning
- [X] Phase 2.6 — Staff dashboard fixed
- [ ] Phase 2.7 — QR scan feedback improved
- [ ] Phase 3.1 — Student profile page
- [ ] Phase 3.2 — Notification bell badge
- [X] Phase 3.3 — System logs filter + export
- [ ] Phase 3.4 — Batch ID card download
- [ ] Phase 3.5 — Duplicate LRN prevention
- [ ] Phase 3.6 — Welcome page DNHS branding
- [X] Phase 4.1 — APP_NAME set
- [X] Phase 4.2 — Favicon and PWA icons branded
- [X] Phase 4.3 — Vendor warnings fixed
- [X] Phase 4.4 — Skeleton loaders on heavy pages
