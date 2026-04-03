<?php
declare(strict_types=1);

// ================================================================
//  SystemController — Health check & version endpoints
//  These routes require no authentication.
// ================================================================

class SystemController
{
    public function health(Request $request): void
    {
        // Test DB connectivity
        $dbOk = false;
        try {
            Database::getInstance()->query('SELECT 1');
            $dbOk = true;
        } catch (\Throwable) {
            $dbOk = false;
        }

        Response::success([
            'status'    => $dbOk ? 'ok' : 'degraded',
            'database'  => $dbOk ? 'connected' : 'error',
            'timestamp' => date('Y-m-d H:i:s'),
            'env'       => APP_ENV,
        ], $dbOk ? 'Sistema operacional.' : 'Sistema com problemas.');
    }

    public function version(Request $request): void
    {
        Response::success([
            'app'     => APP_NAME,
            'version' => APP_VERSION,
            'php'     => PHP_VERSION,
        ]);
    }
}
