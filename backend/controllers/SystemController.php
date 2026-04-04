<?php
declare(strict_types=1);

// ================================================================
//  SystemController — Health check & version endpoints
//  Estas rotas não requerem autenticação.
// ================================================================

class SystemController
{
    public function health(Request $request): void
    {
        $checks = [];
        $overallOk = true;

        // ── 1. Base de dados ─────────────────────────────────────
        try {
            Database::getInstance()->query('SELECT 1');
            $checks['database'] = ['status' => 'ok', 'message' => 'Ligação estabelecida'];
        } catch (\Throwable $e) {
            $checks['database'] = ['status' => 'error', 'message' => 'Falha na ligação'];
            $overallOk = false;
        }

        // ── 2. Diretório de uploads ──────────────────────────────
        $uploadsPath = defined('UPLOAD_BASE_PATH') ? UPLOAD_BASE_PATH : (__DIR__ . '/../storage/uploads');
        if (is_dir($uploadsPath) && is_writable($uploadsPath)) {
            $checks['storage'] = ['status' => 'ok', 'message' => 'Diretório de uploads acessível'];
        } elseif (is_dir($uploadsPath)) {
            $checks['storage'] = ['status' => 'warning', 'message' => 'Diretório de uploads sem permissão de escrita'];
            $overallOk = false;
        } else {
            $checks['storage'] = ['status' => 'error', 'message' => 'Diretório de uploads não encontrado'];
            $overallOk = false;
        }

        // ── 3. Diretório de logs ─────────────────────────────────
        $logsPath = __DIR__ . '/../logs';
        if (is_dir($logsPath) && is_writable($logsPath)) {
            $checks['logs'] = ['status' => 'ok', 'message' => 'Diretório de logs acessível'];
        } else {
            $checks['logs'] = ['status' => 'warning', 'message' => 'Diretório de logs sem escrita (erros vão para o log do servidor)'];
            // Não crítico — o PHP usa o log do servidor como fallback
        }

        // ── 4. Espaço em disco ───────────────────────────────────
        $diskFreeBytes = @disk_free_space('/');
        $diskTotalBytes = @disk_total_space('/');
        if ($diskFreeBytes !== false && $diskTotalBytes !== false && $diskTotalBytes > 0) {
            $freePercent = round(($diskFreeBytes / $diskTotalBytes) * 100, 1);
            $freeMB      = round($diskFreeBytes / 1048576, 0);
            if ($freePercent < 5) {
                $checks['disk'] = ['status' => 'error',   'free_percent' => $freePercent, 'free_mb' => $freeMB, 'message' => 'Disco quase cheio'];
                $overallOk = false;
            } elseif ($freePercent < 15) {
                $checks['disk'] = ['status' => 'warning', 'free_percent' => $freePercent, 'free_mb' => $freeMB, 'message' => 'Espaço em disco reduzido'];
            } else {
                $checks['disk'] = ['status' => 'ok',      'free_percent' => $freePercent, 'free_mb' => $freeMB, 'message' => 'Espaço em disco suficiente'];
            }
        } else {
            $checks['disk'] = ['status' => 'unknown', 'message' => 'Não foi possível verificar o disco'];
        }

        // ── 5. Versão PHP ────────────────────────────────────────
        $phpVersion  = PHP_VERSION;
        $phpOk       = version_compare($phpVersion, '8.0.0', '>=');
        $checks['php'] = [
            'status'  => $phpOk ? 'ok' : 'warning',
            'version' => $phpVersion,
            'message' => $phpOk ? 'Versão suportada' : 'Versão PHP desatualizada (recomendado >= 8.0)',
        ];

        // ── Resultado global ─────────────────────────────────────
        $hasWarning = collect_warnings($checks);
        $status = $overallOk
            ? ($hasWarning ? 'degraded' : 'ok')
            : 'error';

        Response::success([
            'status'    => $status,
            'timestamp' => date('Y-m-d H:i:s'),
            'env'       => APP_ENV,
            'checks'    => $checks,
        ], match($status) {
            'ok'      => 'Sistema operacional.',
            'degraded'=> 'Sistema operacional com avisos.',
            default   => 'Sistema com problemas críticos.',
        });
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

// ── Helper local ─────────────────────────────────────────────────
function collect_warnings(array $checks): bool
{
    foreach ($checks as $check) {
        if (($check['status'] ?? '') === 'warning') {
            return true;
        }
    }
    return false;
}
