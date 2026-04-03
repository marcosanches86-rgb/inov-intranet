<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — Application Configuration
// ================================================================

// ── Environment ──────────────────────────────────────────────────
define('APP_ENV',     getenv('APP_ENV')     ?: 'production');
define('APP_DEBUG',   APP_ENV === 'development');
define('APP_NAME',    'INOV Intranet');
define('APP_VERSION', '1.0.0');
define('APP_URL',     getenv('APP_URL')     ?: 'https://intranet.inov.ao');

// ── Session ───────────────────────────────────────────────────────
define('SESSION_NAME',     'INOV_SID');
define('SESSION_LIFETIME', 7200); // 2 hours in seconds

// ── Paths ─────────────────────────────────────────────────────────
define('BASE_PATH',         dirname(__DIR__));
define('UPLOAD_BASE_PATH',  BASE_PATH . '/storage/uploads');
define('UPLOAD_BASE_URL',   '/backend/storage/uploads');
define('LOG_PATH',          BASE_PATH . '/logs');

// ── Upload Limits ─────────────────────────────────────────────────
define('UPLOAD_MAX_DOC',   20 * 1024 * 1024); // 20 MB
define('UPLOAD_MAX_IMAGE',  5 * 1024 * 1024); //  5 MB
define('UPLOAD_MAX_LOGO',  10 * 1024 * 1024); // 10 MB

// ── Allowed MIME types ────────────────────────────────────────────
define('ALLOWED_DOC_MIMES', [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
]);
define('ALLOWED_DOC_EXTS',    ['pdf','doc','docx','xls','xlsx','ppt','pptx','zip']);
define('ALLOWED_IMAGE_MIMES', ['image/jpeg','image/png','image/webp']);
define('ALLOWED_IMAGE_EXTS',  ['jpg','jpeg','png','webp']);
define('ALLOWED_LOGO_MIMES',  ['image/svg+xml','image/png','image/jpeg','application/pdf']);
define('ALLOWED_LOGO_EXTS',   ['svg','png','jpg','jpeg','pdf']);

// ── Pagination ────────────────────────────────────────────────────
define('DEFAULT_PER_PAGE', 20);
define('MAX_PER_PAGE',    100);

// ── Rate Limiting (login) ─────────────────────────────────────────
define('LOGIN_MAX_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_MINS', 15);

// ── Password Reset ────────────────────────────────────────────────
define('RESET_TOKEN_EXPIRY', 3600); // 1 hour

// ── Role Hierarchy (higher = more permissions) ────────────────────
define('ROLES', [
    'colaborador' => 10,
    'editor'      => 50,
    'admin'       => 80,
    'super_admin' => 100,
]);

// ── News statuses ────────────────────────────────────────────────
define('NEWS_STATUSES',         ['draft', 'published']);
define('ANNOUNCEMENT_PRIORITIES',['low', 'medium', 'high']);
