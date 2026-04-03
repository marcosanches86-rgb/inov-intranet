<?php
declare(strict_types=1);

// ================================================================
//  RoleMiddleware — Enforces minimum role requirement
//
//  Usage in routes:
//    // Inline with static factory (recommended):
//    $router->post('/api/users', [UserController::class, 'store'], [
//        AuthMiddleware::class,
//        RoleMiddleware::role('admin'),
//    ]);
//
//    // Or direct class (defaults to 'colaborador'):
//    $router->get('/api/news', [NewsController::class, 'index'], [
//        AuthMiddleware::class,
//        RoleMiddleware::class,
//    ]);
// ================================================================

class RoleMiddleware
{
    /**
     * Called by Router with the $minRole argument.
     */
    public function handle(Request $request, string $minRole = 'colaborador'): void
    {
        if (!Auth::hasRole($minRole)) {
            Response::forbidden(
                sprintf(
                    'Acesso negado. É necessário o role "%s" ou superior.',
                    $minRole
                )
            );
        }
    }

    /**
     * Static factory for clean route definitions.
     * Returns [RoleMiddleware::class, 'min_role'] tuple.
     */
    public static function role(string $minRole): array
    {
        return [self::class, $minRole];
    }
}
