# Converting DNHS School Portal to a Windows Executable (.exe)

Yes! You can transform this **Laravel 13 + React / Inertia** web project into a standalone Windows Desktop Application (`.exe`) without rewriting your backend code or frontend components.

---

## 🚀 Recommended Methods

### Method 1: NativePHP for Electron (Recommended & Official)
**NativePHP** is an official framework built for Laravel developers to package Laravel apps into native desktop applications using Electron.

- **How it works:** Bundles PHP CLI, a SQLite/MySQL database engine, and Electron into a single desktop installer.
- **Key Features:**
  - Native OS features (desktop notifications, system tray icon, native file dialogs).
  - Uses existing Laravel routes, React components, and Inertia setup directly.
  - Builds `.exe` installers via `npm run build` or `php artisan native:build`.
- **Setup Command:**
  ```bash
  composer require nativephp/electron
  php artisan native:install
  ```

---

### Method 2: Custom Electron Wrapper (Manual Build)
If you want complete custom control over window dimensions, splash screens, and installer packaging:

- **How it works:** Create an Electron main process (`main.js`) that boots a portable PHP background server on app launch and displays your app inside a Chromium browser window.
- **Key Features:**
  - Custom installer creation using **electron-builder** or **NSIS**.
  - Custom branding, app icons, and offline storage handling.

---

### Method 3: PHP-Desktop / Portable Nginx Runtime
Packages Nginx, PHP CLI, and a lightweight browser shell into a standalone folder.

- **How it works:** Launches an embedded web server locally and displays the portal in a browser frame.
- **Best for:** Super low-resource PCs running offline environments.

---

## 🗄️ Database Strategy for Desktop (.exe)

When running as an offline `.exe` file on a user's computer:

1. **SQLite (Recommended for Desktop):**
   - Stores all data in a single file inside `%APPDATA%/DNHS_Portal/database.sqlite`.
   - Zero setup required by the end user (no need to install Laragon/MySQL on target PCs).
2. **Embedded MariaDB/MySQL:**
   - Bundles a portable MariaDB binary that starts silently in the background when the app launches.

---

## 📋 Recommended Development Flow

1. **Build & Test Web App First:** Finalize all Laravel controllers, React UI pages, DB schemas, and permissions in your local environment.
2. **Switch Database to SQLite:** Test locally with SQLite to verify desktop compatibility.
3. **Install NativePHP / Electron Wrapper:** Wrap the finalized web project into a `.exe` installer.
