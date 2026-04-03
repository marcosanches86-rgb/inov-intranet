<?php
declare(strict_types=1);

// ================================================================
//  CsrfMiddleware — CSRF Token Validation
//
//  Apply to state-changing routes (POST/PUT/PATCH/DELETE):
//    $router->post('/api/users', [...], [AuthMiddleware::class, CsrfMiddleware::class]);
//
//  The CSRF token is:
//    - Generated on login (stored in $_SESSION['csrf_token'])
//    - Returned in the login response as "csrf_token"
//    - Expected in every mutating request as:
//        Header: X-CSRF-Token: <token>
//        OR body field: _csrf_token
//
//  NOTE: CSRF is only relevant for same-origin browser sessions.
//  If you later switch to JWT/Bearer tokens, this middleware can
//  be skipped for those routes.
// ================================================================

class CsrfMiddleware
{
    public function handle(Request $request, mixed $args = null): void
    {
        $token = $request->getCsrfToken();

        if (empty($token) || !Auth::validateCsrf($token)) {
            Response::error(
                'Token CSRF inválido ou expirado. Recarregue a página e tente novamente.',
                [],
                403
            );
        }
    }
}
