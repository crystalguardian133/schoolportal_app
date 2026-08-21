# School Portal App

## About The Project

<!-- ✏️ Tweak this description to match your vision -->

A full-featured **school management portal** built as a modern SPA on top of Laravel and React. It gives every stakeholder in a school — admins, teachers, students, advisers, department heads, and staff — their own dedicated workspace, from enrollment and scheduling down to daily attendance.

### Highlights

- 🎓 **Role-based portals** — separate dashboards and permissions for admin, teacher, student, adviser, department head, school head, staff, and developer
- 📸 **QR attendance** — teachers open an attendance session and scan student QR codes live, with manual entry, bulk recording, and overrides as fallbacks
- 📊 **Grades & academics** — grade encoding per subject/class, grade archives across school years, and printable reports/ID cards via PDF generation
- 🗓️ **Scheduling & enrollment** — class sections, subject–teacher assignments, schedules, promotions, and school-year lifecycle management
- 📢 **Announcements** — role-targeted announcements with image attachments and unread counters
- 🔔 **Real-time & push notifications** — Laravel Reverb WebSockets plus native Web Push subscriptions
- 🛡️ **Security-first accounts** — Fortify authentication with 2FA, passkeys, account locking, self-service unlock links, and audit/system logs
- 💬 **Feedback & support tickets** — threaded issue reporting with developer triage dashboard (and a hidden dev music player 🎵)
- 📱 **Installable PWA** — offline-ready via Workbox service worker caching

## Tech Stack

<div align="center">

![PHP](https://img.shields.io/badge/PHP_8.3-777BB4?style=for-the-badge&logo=php&logoColor=white)
![Laravel 13](https://img.shields.io/badge/Laravel_13-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)
![Inertia.js](https://img.shields.io/badge/Inertia.js-8B5CF6?style=for-the-badge&logo=inertia&logoColor=white)
![React 19](https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS_4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)

![Radix UI](https://img.shields.io/badge/Radix_UI-161618?style=for-the-badge&logo=radixui&logoColor=white)
![TanStack Table](https://img.shields.io/badge/TanStack_Table-FF4154?style=for-the-badge&logo=tanstack&logoColor=white)
![React Hook Form](https://img.shields.io/badge/React_Hook_Form-EC5990?style=for-the-badge&logo=reacthookform&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3E67B1?style=for-the-badge&logo=zod&logoColor=white)
![Pusher](https://img.shields.io/badge/Pusher-300D4F?style=for-the-badge&logo=pusher&logoColor=white)
![PHPUnit](https://img.shields.io/badge/PHPUnit-3776AB?style=for-the-badge&logo=php&logoColor=white)

![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-F7B93E?style=for-the-badge&logo=prettier&logoColor=black)

</div>

### Backend
- **PHP 8.3+** / **Laravel 13**
- **Inertia.js** — SPA bridge between Laravel and React
- **Laravel Fortify** — authentication backend
- **Laravel Reverb** — WebSocket server for real-time events
- **Laravel Echo + Pusher JS** — real-time event broadcasting on the client
- **Laravel Wayfinder** — typed route generation for the frontend
- **web-push (minishlink/web-push)** — Web Push notifications
- **Laravel Pint** — PHP code style fixing
- **PHPUnit** — testing

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** — build tool & dev server
- **Tailwind CSS 4** — styling
- **Radix UI / shadcn-style components** — accessible UI primitives
- **React Hook Form + Zod** — form handling & validation
- **TanStack Table** — data tables
- **Recharts** — charting / data visualization
- **jsPDF + jspdf-autotable** — PDF generation
- **html5-qrcode + qrcode.react** — QR code scanning & generation
- **Sonner** — toast notifications
- **Lucide Icons** — icon library
- **vite-plugin-pwa (Workbox)** — Progressive Web App support & offline caching
- **Babel React Compiler** — automatic memoization
- **ESLint + Prettier** — linting & formatting

### Infrastructure
- **Docker** — containerized deployment (`Dockerfile` + `entrypoint.sh`)
- **Laravel Sail** — local dev environment option
- **pnpm/npm** — package management

## Getting Started

```bash
# Install dependencies
composer install
npm install

# Set up environment
cp .env.example .env
php artisan key:generate
php artisan migrate

# Run dev server, queue worker and Vite together
composer run dev
```

### Production Build

```bash
npm run build        # client build
npm run build:ssr    # SSR build (optional)
```

## Scripts

| Command | Description |
| --- | --- |
| `composer run dev` | Run Laravel server, queue listener, and Vite concurrently |
| `npm run build` | Production frontend build |
| `npm run build:ssr` | Production build with SSR |
| `composer run test` | Lint check + PHPUnit tests |
| `composer run lint` | Fix PHP code style (Pint) |
| `npm run lint` | Fix JS/TS issues (ESLint) |
| `npm run format` | Format frontend code (Prettier) |
| `npm run types:check` | TypeScript type checking |

## License

MIT
