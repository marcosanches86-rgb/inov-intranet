<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — API Route Definitions
//
//  Format:
//    $router->METHOD('/path/{param}', [ControllerClass::class, 'method'], [middlewares]);
//
//  Middleware shorthand:
//    AuthMiddleware::class             → sessão autenticada obrigatória
//    RoleMiddleware::role('admin')     → role admin ou superior
//    CsrfMiddleware::class             → valida token CSRF (POST/PUT/PATCH/DELETE)
// ================================================================

// ── Health check (sem autenticação) ──────────────────────────────
$router->get('/api/health',  [SystemController::class, 'health']);
$router->get('/api/version', [SystemController::class, 'version']);

// ── AUTH ──────────────────────────────────────────────────────────────────────
$router->post('/api/auth/register',        [AuthController::class, 'register']);
$router->post('/api/auth/login',           [AuthController::class, 'login']);
$router->post('/api/auth/logout',          [AuthController::class, 'logout'],         [AuthMiddleware::class, CsrfMiddleware::class]);
$router->get( '/api/auth/me',              [AuthController::class, 'me'],             [AuthMiddleware::class]);
$router->post('/api/auth/forgot-password', [AuthController::class, 'forgotPassword']);
$router->post('/api/auth/reset-password',  [AuthController::class, 'resetPassword']);
$router->put( '/api/auth/change-password', [AuthController::class, 'changePassword'], [AuthMiddleware::class, CsrfMiddleware::class]);

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
// Nota: estas rotas DEVEM estar antes de /api/dashboard/{param} genérico
$router->get('/api/dashboard',       [DashboardController::class, 'index'], [AuthMiddleware::class]);
$router->get('/api/dashboard/stats', [DashboardController::class, 'stats'], [AuthMiddleware::class, RoleMiddleware::role('admin')]);
$router->get('/api/dashboard/feed',  [DashboardController::class, 'feed'],  [AuthMiddleware::class]);

// ── USERS ─────────────────────────────────────────────────────────────────────
$router->get(   '/api/users',              [UserController::class, 'index'],        [AuthMiddleware::class, RoleMiddleware::role('admin')]);
$router->post(  '/api/users',              [UserController::class, 'store'],        [AuthMiddleware::class, RoleMiddleware::role('admin'),      CsrfMiddleware::class]);
$router->get(   '/api/users/{id}',         [UserController::class, 'show'],         [AuthMiddleware::class, RoleMiddleware::role('admin')]);
$router->put(   '/api/users/{id}',         [UserController::class, 'update'],       [AuthMiddleware::class, RoleMiddleware::role('admin'),      CsrfMiddleware::class]);
$router->patch( '/api/users/{id}/status',  [UserController::class, 'updateStatus'], [AuthMiddleware::class, RoleMiddleware::role('admin'),      CsrfMiddleware::class]);
$router->patch( '/api/users/{id}/role',    [UserController::class, 'updateRole'],   [AuthMiddleware::class, RoleMiddleware::role('super_admin'), CsrfMiddleware::class]);
$router->delete('/api/users/{id}',         [UserController::class, 'destroy'],      [AuthMiddleware::class, RoleMiddleware::role('super_admin'), CsrfMiddleware::class]);

// ── COMPANIES ─────────────────────────────────────────────────────────────────
$router->get(   '/api/companies',      [CompanyController::class, 'index'],   [AuthMiddleware::class]);
$router->get(   '/api/companies/{id}', [CompanyController::class, 'show'],    [AuthMiddleware::class]);
$router->post(  '/api/companies',      [CompanyController::class, 'store'],   [AuthMiddleware::class, RoleMiddleware::role('admin'), CsrfMiddleware::class]);
$router->put(   '/api/companies/{id}', [CompanyController::class, 'update'],  [AuthMiddleware::class, RoleMiddleware::role('admin'), CsrfMiddleware::class]);
$router->delete('/api/companies/{id}', [CompanyController::class, 'destroy'], [AuthMiddleware::class, RoleMiddleware::role('super_admin'), CsrfMiddleware::class]);

// ── NEWS ──────────────────────────────────────────────────────────────────────
$router->get(   '/api/news',               [NewsController::class, 'index'],   [AuthMiddleware::class]);
$router->get(   '/api/news/{id}',          [NewsController::class, 'show'],    [AuthMiddleware::class]);
$router->post(  '/api/news',               [NewsController::class, 'store'],   [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->put(   '/api/news/{id}',          [NewsController::class, 'update'],  [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->patch( '/api/news/{id}/publish',  [NewsController::class, 'publish'], [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->patch( '/api/news/{id}/feature',  [NewsController::class, 'feature'], [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/news/{id}',          [NewsController::class, 'destroy'], [AuthMiddleware::class, RoleMiddleware::role('admin'),  CsrfMiddleware::class]);

// ── ANNOUNCEMENTS ─────────────────────────────────────────────────────────────
$router->get(   '/api/announcements',      [AnnouncementController::class, 'index'],   [AuthMiddleware::class]);
$router->get(   '/api/announcements/{id}', [AnnouncementController::class, 'show'],    [AuthMiddleware::class]);
$router->post(  '/api/announcements',      [AnnouncementController::class, 'store'],   [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->put(   '/api/announcements/{id}', [AnnouncementController::class, 'update'],  [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/announcements/{id}', [AnnouncementController::class, 'destroy'], [AuthMiddleware::class, RoleMiddleware::role('admin'),  CsrfMiddleware::class]);

// ── DOCUMENTS ─────────────────────────────────────────────────────────────────
$router->get(   '/api/documents',               [DocumentController::class, 'index'],    [AuthMiddleware::class]);
$router->get(   '/api/documents/{id}',          [DocumentController::class, 'show'],     [AuthMiddleware::class]);
$router->post(  '/api/documents',               [DocumentController::class, 'store'],    [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->put(   '/api/documents/{id}',          [DocumentController::class, 'update'],   [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/documents/{id}',          [DocumentController::class, 'destroy'],  [AuthMiddleware::class, RoleMiddleware::role('admin'),  CsrfMiddleware::class]);
$router->get(   '/api/documents/{id}/download', [DocumentController::class, 'download'], [AuthMiddleware::class]);

// ── BRAND ASSETS ──────────────────────────────────────────────────────────────
$router->get(   '/api/brand-assets',      [BrandAssetController::class, 'index'],   [AuthMiddleware::class]);
$router->get(   '/api/brand-assets/{id}', [BrandAssetController::class, 'show'],    [AuthMiddleware::class]);
$router->post(  '/api/brand-assets',      [BrandAssetController::class, 'store'],   [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->put(   '/api/brand-assets/{id}', [BrandAssetController::class, 'update'],  [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/brand-assets/{id}', [BrandAssetController::class, 'destroy'], [AuthMiddleware::class, RoleMiddleware::role('admin'),  CsrfMiddleware::class]);

// ── GALLERY ───────────────────────────────────────────────────────────────────
$router->get(   '/api/gallery',                      [GalleryController::class, 'index'],      [AuthMiddleware::class]);
$router->get(   '/api/gallery/{id}',                 [GalleryController::class, 'show'],       [AuthMiddleware::class]);
$router->post(  '/api/gallery',                      [GalleryController::class, 'store'],      [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->put(   '/api/gallery/{id}',                 [GalleryController::class, 'update'],     [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/gallery/{id}',                 [GalleryController::class, 'destroy'],    [AuthMiddleware::class, RoleMiddleware::role('admin'),  CsrfMiddleware::class]);
$router->post(  '/api/gallery/{id}/items',           [GalleryController::class, 'addItem'],    [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
$router->delete('/api/gallery/{id}/items/{itemId}',  [GalleryController::class, 'removeItem'], [AuthMiddleware::class, RoleMiddleware::role('editor'), CsrfMiddleware::class]);
// aliases com plural (compatibilidade com frontend)
$router->get(   '/api/galleries',      [GalleryController::class, 'index'], [AuthMiddleware::class]);
$router->get(   '/api/galleries/{id}', [GalleryController::class, 'show'],  [AuthMiddleware::class]);
