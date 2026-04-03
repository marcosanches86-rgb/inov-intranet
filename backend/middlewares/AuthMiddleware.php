<?php
declare(strict_types=1);

// ================================================================
//  AuthMiddleware — Verifies an active authenticated session
//
//  Apply to any route that requires login:
//    $router->get('/api/me', [AuthController::class, 'me'], [AuthMiddleware::class]);
// ================================================================

class AuthMiddleware
{
    public function handle(Request $request, mixed $args = null): void
    {
        Auth::check(); // Exits with 401 if not authenticated or session expired
    }
}
