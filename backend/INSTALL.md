# INOV Intranet — Backend Installation Guide

> PHP 8.1+ · MySQL 8 / MariaDB 10.6+ · No Composer · Hostinger compatible

---

## Table of Contents

1. [Requirements](#1-requirements)
2. [Local Development Setup](#2-local-development-setup)
3. [Hostinger Shared Hosting Deploy](#3-hostinger-shared-hosting-deploy)
4. [Database Setup](#4-database-setup)
5. [Folder Permissions](#5-folder-permissions)
6. [Environment Variables](#6-environment-variables)
7. [First Run — Create Admin Users](#7-first-run--create-admin-users)
8. [Test Credentials](#8-test-credentials)
9. [API Quick Reference](#9-api-quick-reference)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Requirements

| Component       | Minimum Version | Notes                              |
|-----------------|-----------------|------------------------------------|
| PHP             | 8.1             | 8.2 recommended                   |
| MySQL / MariaDB | 8.0 / 10.6      | utf8mb4 + JSON support required    |
| Extensions      | pdo_mysql, fileinfo, mbstring, json | All enabled by default on Hostinger |
| Web Server      | Apache 2.4+     | mod_rewrite must be enabled        |
| Storage         | 100 MB+         | For uploads (logos, docs, images)  |

---

## 2. Local Development Setup

### 2.1 Clone / copy the project

```
inov-intranet/
├── backend/          ← PHP API (this project)
├── frontend/         ← Vue/React SPA (separate repo)
```

### 2.2 Install a local stack

Recommended: **Laragon** (Windows) or **XAMPP** / **MAMP**.

Place the `backend/` folder inside your web root, e.g.:

```
C:\laragon\www\inov-intranet\backend\
```

The API will be accessible at:
```
http://localhost/inov-intranet/backend/
```

### 2.3 Create the `.env` file (or set Apache env vars)

Copy and edit the sample below, saving it as `backend/.env`
_(Apache reads it via SetEnv in .htaccess — see §6)_:

```ini
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=inov_intranet
DB_USER=root
DB_PASS=
APP_ENV=development
APP_DEBUG=true
```

### 2.4 Verify Apache mod_rewrite

Open `httpd.conf` and ensure:
```apache
LoadModule rewrite_module modules/mod_rewrite.so
AllowOverride All   # inside your <Directory> block
```

---

## 3. Hostinger Shared Hosting Deploy

### 3.1 Upload files

Upload the entire `backend/` directory to your hosting root, e.g.:

```
public_html/
├── intranet/
│   └── backend/
│       ├── index.php
│       ├── .htaccess
│       ├── config/
│       ├── core/
│       └── ...
```

> If you want the API at `https://yourdomain.com/api/`, place the
> backend files inside `public_html/api/` instead.

Use **Hostinger File Manager** or FTP (FileZilla) with:
- Host: `files.yourdomain.com`
- Username / Password: your Hostinger FTP credentials

### 3.2 Set environment variables on Hostinger

In **hPanel → Hosting → Advanced → PHP Configuration**:

```
DB_HOST     = 127.0.0.1
DB_PORT     = 3306
DB_NAME     = inov_intranet
DB_USER     = your_db_user
DB_PASS     = your_db_password
APP_ENV     = production
APP_DEBUG   = false
```

Alternatively, add them at the top of `config/database.php` as hardcoded
constants (acceptable for shared hosting where env vars can be tricky).

### 3.3 Enable PHP 8.1 on Hostinger

hPanel → Hosting → **PHP Configuration** → select **8.1** or **8.2**.

### 3.4 SSL (HTTPS)

hPanel → Hosting → **SSL** → enable free Let's Encrypt certificate.

Once HTTPS is live, `Auth::startSecureSession()` will automatically set
the `Secure` cookie flag.

---

## 4. Database Setup

### 4.1 Create the database

**Hostinger**: hPanel → Databases → MySQL Databases → Create Database.

**Local (Laragon)**:
```sql
CREATE DATABASE inov_intranet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 4.2 Import schema

```bash
mysql -u root -p inov_intranet < backend/database/schema.sql
```

Or use **phpMyAdmin**: select the database → Import tab → choose `schema.sql`.

### 4.3 Import seed data (optional but recommended)

```bash
mysql -u root -p inov_intranet < backend/database/seed.sql
```

Seed includes: 7 companies, 10 news articles, 5 announcements, 16 documents,
12 brand assets, 12 gallery albums.
**No users** — users are created via `setup.php` (see §7).

---

## 5. Folder Permissions

The upload directory must be writable by the web server.

### Linux / Hostinger

```bash
# Create upload sub-directories if they don't exist
mkdir -p backend/storage/uploads/logo
mkdir -p backend/storage/uploads/document
mkdir -p backend/storage/uploads/gallery
mkdir -p backend/storage/uploads/cover
mkdir -p backend/storage/uploads/avatar

# Set permissions
chmod 755 backend/storage/
chmod 755 backend/storage/uploads/
chmod 755 backend/storage/uploads/logo/
chmod 755 backend/storage/uploads/document/
chmod 755 backend/storage/uploads/gallery/
chmod 755 backend/storage/uploads/cover/
chmod 755 backend/storage/uploads/avatar/
```

> Hostinger File Manager: right-click folder → Permissions → 755.

### Verify the `.htaccess` inside `storage/uploads/`

This file should already exist in the project. It blocks PHP execution:

```apache
# backend/storage/uploads/.htaccess
Options -Indexes
<FilesMatch "\.php$">
    Order Allow,Deny
    Deny from all
</FilesMatch>
```

---

## 6. Environment Variables

All configuration lives in `backend/config/app.php` and `backend/config/database.php`.

| Variable         | Default (dev)       | Production value         |
|------------------|---------------------|--------------------------|
| `APP_ENV`        | `development`       | `production`             |
| `APP_DEBUG`      | `true`              | `false`                  |
| `DB_HOST`        | `127.0.0.1`         | Hostinger DB host        |
| `DB_NAME`        | `inov_intranet`     | Your DB name             |
| `DB_USER`        | `root`              | Your DB username         |
| `DB_PASS`        | *(empty)*           | Your DB password         |
| `UPLOAD_BASE_PATH` | `__DIR__.'/../storage/uploads'` | Same, auto-resolved |
| `MAX_UPLOAD_MB`  | `10`                | 10 (adjust as needed)    |
| `SESSION_LIFETIME` | `28800` (8h)     | 28800                    |
| `RATE_LIMIT_ATTEMPTS` | `5`          | 5                        |
| `RATE_LIMIT_WINDOW_MINUTES` | `15`  | 15                       |

---

## 7. First Run — Create Admin Users

After importing `schema.sql`, run `setup.php` **once** to create the admin users.

### Local

Visit in your browser:
```
http://localhost/inov-intranet/backend/database/setup.php
```

### Hostinger

Upload `database/setup.php`, then visit:
```
https://yourdomain.com/intranet/backend/database/setup.php
```

You should see:
```
✅ Users created/verified successfully.
```

> **IMPORTANT:** After setup, either delete `setup.php` or add IP restriction to it.
> It uses `INSERT IGNORE` so re-running is safe, but best practice is to remove it.

```bash
rm backend/database/setup.php
```

---

## 8. Test Credentials

All passwords use bcrypt cost 12. Created by `setup.php`.

| Name                | Email                        | Password        | Role         |
|---------------------|------------------------------|-----------------|--------------|
| Marco Sanches       | marco.sanches@inov.ao        | `Inov@2026!`    | super_admin  |
| Arnaldo Miapia      | arnaldo.miapia@inov.ao       | `Inov@2026!`    | admin        |
| Helder Maiato       | helder.maiato@inov.ao        | `Inov@2026!`    | admin        |
| Nilson Filipe       | nilson.filipe@inov.ao        | `Inov@2026!`    | admin        |
| Joel Pascoal        | joel.pascoal@inov.ao         | `Inov@2026!`    | admin        |
| Hansa Sardinha      | hansa.sardinha@inov.ao       | `Inov@2026!`    | admin        |
| Editor Teste        | editor@inov.ao               | `Editor@123!`   | editor       |
| Colaborador Teste   | colaborador@inov.ao          | `Colab@123!`    | colaborador  |

> Change all passwords after first login in production.

---

## 9. API Quick Reference

Base URL: `https://yourdomain.com/intranet/backend`

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "marco.sanches@inov.ao",
  "password": "Inov@2026!"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": { "id": 1, "name": "Marco Sanches", "role": "super_admin" },
    "csrf_token": "abc123..."
  },
  "message": "Login realizado com sucesso."
}
```

All subsequent state-changing requests must include:
```http
X-CSRF-Token: abc123...
```

---

### Route Summary

| Method | Endpoint                              | Auth     | Description                        |
|--------|---------------------------------------|----------|------------------------------------|
| POST   | `/api/auth/login`                     | —        | Login                              |
| POST   | `/api/auth/logout`                    | auth     | Logout                             |
| GET    | `/api/auth/me`                        | auth     | Current user                       |
| POST   | `/api/auth/forgot-password`           | —        | Request password reset             |
| POST   | `/api/auth/reset-password`            | —        | Reset password with token          |
| PUT    | `/api/auth/change-password`           | auth     | Change own password                |
| GET    | `/api/users`                          | admin    | List users                         |
| POST   | `/api/users`                          | admin    | Create user                        |
| GET    | `/api/users/{id}`                     | admin    | Get user                           |
| PUT    | `/api/users/{id}`                     | admin    | Update user                        |
| DELETE | `/api/users/{id}`                     | admin    | Delete user                        |
| PUT    | `/api/users/{id}/role`                | admin    | Change role                        |
| PUT    | `/api/users/{id}/status`              | admin    | Activate / deactivate              |
| GET    | `/api/companies`                      | auth     | List companies                     |
| POST   | `/api/companies`                      | admin    | Create company                     |
| GET    | `/api/companies/{id}`                 | auth     | Get company + stats                |
| PUT    | `/api/companies/{id}`                 | admin    | Update company                     |
| DELETE | `/api/companies/{id}`                 | admin    | Delete company                     |
| GET    | `/api/news`                           | auth     | List news                          |
| POST   | `/api/news`                           | editor   | Create news                        |
| GET    | `/api/news/{id}`                      | auth     | Get news                           |
| PUT    | `/api/news/{id}`                      | editor   | Update news                        |
| DELETE | `/api/news/{id}`                      | admin    | Delete news                        |
| POST   | `/api/news/{id}/publish`              | editor   | Toggle publish/draft               |
| POST   | `/api/news/{id}/feature`              | editor   | Toggle featured                    |
| GET    | `/api/announcements`                  | auth     | List announcements                 |
| POST   | `/api/announcements`                  | editor   | Create announcement                |
| GET    | `/api/announcements/{id}`             | auth     | Get announcement                   |
| PUT    | `/api/announcements/{id}`             | editor   | Update announcement                |
| DELETE | `/api/announcements/{id}`             | admin    | Delete announcement                |
| GET    | `/api/documents`                      | auth     | List documents                     |
| POST   | `/api/documents`                      | editor   | Upload document                    |
| GET    | `/api/documents/{id}`                 | auth     | Get document                       |
| PUT    | `/api/documents/{id}`                 | editor   | Update document metadata           |
| DELETE | `/api/documents/{id}`                 | admin    | Delete document                    |
| GET    | `/api/documents/{id}/download`        | auth     | Download document file             |
| GET    | `/api/brand-assets`                   | auth     | List brand assets                  |
| POST   | `/api/brand-assets`                   | editor   | Upload brand asset                 |
| GET    | `/api/brand-assets/{id}`              | auth     | Get brand asset                    |
| PUT    | `/api/brand-assets/{id}`              | editor   | Update brand asset                 |
| DELETE | `/api/brand-assets/{id}`              | admin    | Delete brand asset                 |
| GET    | `/api/gallery`                        | auth     | List gallery albums                |
| POST   | `/api/gallery`                        | editor   | Create album                       |
| GET    | `/api/gallery/{id}`                   | auth     | Get album + items                  |
| PUT    | `/api/gallery/{id}`                   | editor   | Update album                       |
| DELETE | `/api/gallery/{id}`                   | admin    | Delete album + all images          |
| POST   | `/api/gallery/{id}/items`             | editor   | Add image to album                 |
| DELETE | `/api/gallery/{id}/items/{itemId}`    | editor   | Remove image from album            |
| PUT    | `/api/gallery/{id}/reorder`           | editor   | Reorder images                     |
| GET    | `/api/dashboard`                      | auth     | Dashboard data                     |
| GET    | `/api/dashboard/stats`                | admin    | Admin statistics                   |
| GET    | `/api/dashboard/feed`                 | auth     | Activity feed                      |
| GET    | `/api/activity-logs`                  | admin    | Full activity log                  |
| GET    | `/api/csrf-token`                     | auth     | Get CSRF token                     |

---

### Example: Upload a document

```http
POST /api/documents
Content-Type: multipart/form-data
X-CSRF-Token: abc123...

title=Relatório Q1 2026
company_id=1
category=financeiro
file=@relatorio-q1-2026.pdf
```

---

### Example: List brand assets grouped by company

```http
GET /api/brand-assets?grouped=1
```

---

### Pagination

All list endpoints support:
```
?page=1&per_page=20
```

Response includes `meta`:
```json
{
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 47,
    "last_page": 3,
    "from": 1,
    "to": 20
  }
}
```

---

### Standard response envelope

**Success (200/201):**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operação realizada com sucesso."
}
```

**Validation error (422):**
```json
{
  "success": false,
  "message": "Dados inválidos.",
  "errors": {
    "title": "O campo title é obrigatório.",
    "email": "Formato de email inválido."
  }
}
```

**Unauthorised (401) / Forbidden (403) / Not Found (404):**
```json
{
  "success": false,
  "message": "Não autenticado."
}
```

---

## 10. Troubleshooting

### "404 Not Found" on all API routes

- Confirm `mod_rewrite` is enabled.
- Check `AllowOverride All` is set for the directory in `httpd.conf` or `apache2.conf`.
- Verify `backend/.htaccess` was uploaded (some FTP clients skip dotfiles).

### "500 Internal Server Error"

- Check PHP error log:
  **Hostinger**: hPanel → Files → Error Log
  **Laragon**: `C:\laragon\logs\`
- Enable debug temporarily: set `APP_DEBUG=true` in config — the API will include `error_detail` in error responses.

### "CSRF token mismatch" on PUT/DELETE

- Call `GET /api/csrf-token` first and include the returned token as `X-CSRF-Token` header.
- Ensure the SPA sends `credentials: 'include'` with every `fetch()` / Axios call so session cookies are transmitted.

### "Upload failed" errors

- Verify `storage/uploads/` and subdirectories exist and have `755` permissions.
- Check `MAX_UPLOAD_MB` in `config/app.php` matches PHP's `upload_max_filesize` and `post_max_size` (`php.ini`).
- On Hostinger: hPanel → PHP Configuration → increase `upload_max_filesize`.

### Session not persisting (logged out on every request)

- Ensure `credentials: 'include'` is set in your frontend HTTP client.
- Ensure the frontend origin is allowed — if using a different domain, update `session_set_cookie_params` `samesite` from `Strict` to `None` and ensure HTTPS is active.

### CORS errors in browser

The `index.php` front controller sets CORS headers. Update the `$allowedOrigins` array in `backend/index.php` to include your frontend domain:

```php
$allowedOrigins = [
    'http://localhost:5173',       // Vite dev server
    'https://intranet.inov.ao',    // Production frontend
];
```

### Database connection error

- Double-check credentials in `config/database.php` or environment variables.
- On Hostinger, the DB host is typically `127.0.0.1` (not `localhost`).
- Run `setup.php` only after `schema.sql` has been imported.

---

*Generated for INOV Intranet Backend — March 2026*
