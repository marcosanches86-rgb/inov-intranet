<?php
declare(strict_types=1);

// ================================================================
//  Response — Standardised JSON API Responses
//
//  All methods are static and call exit() after output.
//  Every response follows this envelope:
//
//  SUCCESS:
//  {
//    "success": true,
//    "message": "...",
//    "data":    { ... },
//    "meta":    { "page": 1, "total": 100 }   ← optional
//  }
//
//  ERROR:
//  {
//    "success": false,
//    "message": "...",
//    "code":    422,
//    "errors":  { "field": "message" }         ← optional
//  }
// ================================================================

class Response
{
    // ── Foundation ────────────────────────────────────────────────

    public static function json(mixed $data, int $status = 200): never
    {
        if (!headers_sent()) {
            http_response_code($status);
            header('Content-Type: application/json; charset=UTF-8');
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        exit;
    }

    // ── Success responses ─────────────────────────────────────────

    public static function success(
        mixed  $data    = null,
        string $message = 'Operação realizada com sucesso',
        int    $status  = 200,
        array  $meta    = []
    ): never {
        $payload = [
            'success' => true,
            'message' => $message,
        ];
        if ($data !== null)  $payload['data'] = $data;
        if (!empty($meta))   $payload['meta'] = $meta;

        self::json($payload, $status);
    }

    public static function created(
        mixed  $data    = null,
        string $message = 'Recurso criado com sucesso'
    ): never {
        self::success($data, $message, 201);
    }

    public static function noContent(): never
    {
        http_response_code(204);
        exit;
    }

    /**
     * Paginated list response.
     *
     * @param array $items   The page items
     * @param int   $total   Total records (across all pages)
     * @param int   $page    Current page number
     * @param int   $perPage Items per page
     */
    public static function paginated(
        array  $items,
        int    $total,
        int    $page,
        int    $perPage,
        string $message = 'Listagem obtida com sucesso'
    ): never {
        self::success($items, $message, 200, [
            'page'       => $page,
            'per_page'   => $perPage,
            'total'      => $total,
            'last_page'  => (int) ceil($total / max($perPage, 1)),
            'from'       => $total > 0 ? (($page - 1) * $perPage) + 1 : 0,
            'to'         => min($page * $perPage, $total),
        ]);
    }

    // ── Error responses ───────────────────────────────────────────

    public static function error(
        string $message = 'Erro interno',
        array  $errors  = [],
        int    $status  = 400
    ): never {
        $payload = [
            'success' => false,
            'message' => $message,
            'code'    => $status,
        ];
        if (!empty($errors)) $payload['errors'] = $errors;

        self::json($payload, $status);
    }

    /** 400 — Bad request / business rule violation */
    public static function badRequest(string $message = 'Pedido inválido'): never
    {
        self::error($message, [], 400);
    }

    /** 401 — Not authenticated */
    public static function unauthorized(string $message = 'Não autenticado. Por favor faça login.'): never
    {
        self::error($message, [], 401);
    }

    /** 403 — Authenticated but insufficient role */
    public static function forbidden(string $message = 'Acesso negado. Permissões insuficientes.'): never
    {
        self::error($message, [], 403);
    }

    /** 404 — Resource not found */
    public static function notFound(string $message = 'Recurso não encontrado.'): never
    {
        self::error($message, [], 404);
    }

    /** 405 — Method not allowed */
    public static function methodNotAllowed(): never
    {
        self::error('Método HTTP não permitido.', [], 405);
    }

    /** 409 — Conflict (e.g. duplicate email) */
    public static function conflict(string $message = 'Conflito de dados.'): never
    {
        self::error($message, [], 409);
    }

    /** 422 — Validation failed */
    public static function validationError(
        array  $errors,
        string $message = 'Os dados enviados são inválidos.'
    ): never {
        self::error($message, $errors, 422);
    }

    /** 429 — Rate limit exceeded */
    public static function tooManyRequests(string $message = 'Demasiadas tentativas. Tente mais tarde.'): never
    {
        self::error($message, [], 429);
    }

    /** 500 — Internal server error */
    public static function serverError(string $message = 'Erro interno do servidor.'): never
    {
        // Never expose internal details in production
        if (!APP_DEBUG) {
            $message = 'Ocorreu um erro interno. Por favor contacte o suporte.';
        }
        self::error($message, [], 500);
    }

    /** 503 — Service unavailable */
    public static function serviceUnavailable(string $message = 'Serviço temporariamente indisponível.'): never
    {
        self::error($message, [], 503);
    }
}
