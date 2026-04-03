<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — Backend Entry Point (Front Controller)
//
//  All HTTP requests are routed here via .htaccess RewriteRule.
//  Load order:
//    config → core → helpers → models → controllers → middlewares → routes
// ================================================================

// ── Error handling ────────────────────────────────────────────────
ini_set('display_errors', '0');
ini_set('log_errors',     '1');
error_reporting(E_ALL);

// Log to our own file if writable
$logFile = __DIR__ . '/logs/error.log';
if (is_writable(dirname($logFile))) {
    ini_set('error_log', $logFile);
}

// ── Config ────────────────────────────────────────────────────────
require_once __DIR__ . '/config/app.php';
require_once __DIR__ . '/config/database.php';

// ── Core ──────────────────────────────────────────────────────────
require_once __DIR__ . '/core/Response.php';   // Must be first — other classes call it
require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Request.php';
require_once __DIR__ . '/core/Auth.php';
require_once __DIR__ . '/core/Validator.php';
require_once __DIR__ . '/core/Router.php';

// ── Helpers ───────────────────────────────────────────────────────
require_once __DIR__ . '/helpers/auth_helper.php';
require_once __DIR__ . '/helpers/slug_helper.php';
require_once __DIR__ . '/helpers/upload_helper.php';

// ── Models ────────────────────────────────────────────────────────
require_once __DIR__ . '/models/BaseModel.php';
require_once __DIR__ . '/models/ActivityLog.php';
require_once __DIR__ . '/models/User.php';
require_once __DIR__ . '/models/Company.php';
require_once __DIR__ . '/models/News.php';
require_once __DIR__ . '/models/Announcement.php';
require_once __DIR__ . '/models/Document.php';
require_once __DIR__ . '/models/BrandAsset.php';
require_once __DIR__ . '/models/GalleryAlbum.php';
require_once __DIR__ . '/models/GalleryItem.php';
require_once __DIR__ . '/models/PasswordReset.php';

// ── Controllers ───────────────────────────────────────────────────
require_once __DIR__ . '/controllers/SystemController.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/CompanyController.php';
require_once __DIR__ . '/controllers/NewsController.php';
require_once __DIR__ . '/controllers/AnnouncementController.php';
require_once __DIR__ . '/controllers/DocumentController.php';
require_once __DIR__ . '/controllers/BrandAssetController.php';
require_once __DIR__ . '/controllers/GalleryController.php';
require_once __DIR__ . '/controllers/DashboardController.php';

// ── Middlewares ───────────────────────────────────────────────────
require_once __DIR__ . '/middlewares/AuthMiddleware.php';
require_once __DIR__ . '/middlewares/RoleMiddleware.php';
require_once __DIR__ . '/middlewares/CsrfMiddleware.php';

// ── Start secure session ──────────────────────────────────────────
Auth::startSecureSession();

// ── Security headers ──────────────────────────────────────────────
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Type: application/json; charset=UTF-8');

// Remove fingerprinting headers
header_remove('X-Powered-By');
header_remove('Server');

// ── CORS ──────────────────────────────────────────────────────────
// Allow requests from the frontend origin (same domain or configured)
$allowedOrigins = array_filter([
    APP_URL,
    APP_ENV === 'development' ? 'http://localhost' : null,
    APP_ENV === 'development' ? 'http://127.0.0.1' : null,
]);

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';

if (in_array($origin, $allowedOrigins, true)) {
    header("Access-Control-Allow-Origin: {$origin}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
}

// Handle OPTIONS preflight — return early
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── Global exception handler ──────────────────────────────────────
set_exception_handler(function (\Throwable $e) {
    error_log('[EXCEPTION] ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
    if (APP_DEBUG) {
        Response::serverError($e->getMessage() . ' [' . $e->getFile() . ':' . $e->getLine() . ']');
    }
    Response::serverError();
});

// ── Bootstrap & dispatch ──────────────────────────────────────────
$router  = new Router();
$request = new Request();

require_once __DIR__ . '/routes/api.php';

$router->dispatch($request);
