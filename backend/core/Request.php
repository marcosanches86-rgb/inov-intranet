<?php
declare(strict_types=1);

// ================================================================
//  Request — HTTP Request Abstraction
//
//  Encapsulates all input sources:
//   - Query string  ($_GET)
//   - Form POST     ($_POST)
//   - JSON body     (php://input)
//   - File uploads  ($_FILES)
//   - HTTP headers  ($_SERVER)
//   - URL params    (set by Router)
// ================================================================

class Request
{
    private array  $params  = [];
    private ?array $body    = null;

    // ── Method & Path ─────────────────────────────────────────────

    public function getMethod(): string
    {
        // Support method override for clients that don't support PUT/PATCH/DELETE
        $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? null;
        if ($override && in_array(strtoupper($override), ['PUT','PATCH','DELETE'], true)) {
            return strtoupper($override);
        }
        return strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
    }

    public function getPath(): string
    {
        $uri  = $_SERVER['REQUEST_URI'] ?? '/';
        $path = (string) parse_url($uri, PHP_URL_PATH);
        // Normalise: remove trailing slash except for root
        return $path !== '/' ? rtrim($path, '/') : '/';
    }

    // ── Query string ──────────────────────────────────────────────

    public function get(string $key, mixed $default = null): mixed
    {
        return $_GET[$key] ?? $default;
    }

    public function getInt(string $key, int $default = 0): int
    {
        return isset($_GET[$key]) ? (int) $_GET[$key] : $default;
    }

    // ── Body (JSON or form-data) ──────────────────────────────────

    /**
     * Reads a value from:
     *  1. Parsed JSON body
     *  2. $_POST (multipart/form-data or application/x-www-form-urlencoded)
     */
    public function post(string $key, mixed $default = null): mixed
    {
        return $this->getBody()[$key] ?? $_POST[$key] ?? $default;
    }

    /**
     * Returns all input (GET + POST + JSON body merged).
     * JSON body takes precedence over POST.
     */
    public function all(): array
    {
        return array_merge($_GET, $_POST, $this->getBody());
    }

    /**
     * Returns only the specified keys from all input.
     */
    public function only(array $keys): array
    {
        $all    = $this->all();
        $result = [];
        foreach ($keys as $key) {
            if (array_key_exists($key, $all)) {
                $result[$key] = $all[$key];
            }
        }
        return $result;
    }

    /**
     * Parses the raw request body.
     * Supports application/json and form data.
     */
    public function getBody(): array
    {
        if ($this->body !== null) {
            return $this->body;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

        if (str_contains($contentType, 'application/json')) {
            $raw         = file_get_contents('php://input');
            $decoded     = json_decode($raw ?: '', true);
            $this->body  = is_array($decoded) ? $decoded : [];
        } else {
            $this->body = [];
        }

        return $this->body;
    }

    // ── Files ─────────────────────────────────────────────────────

    public function file(string $key): ?array
    {
        return isset($_FILES[$key]) && $_FILES[$key]['error'] !== UPLOAD_ERR_NO_FILE
            ? $_FILES[$key]
            : null;
    }

    public function hasFile(string $key): bool
    {
        return isset($_FILES[$key]) && $_FILES[$key]['error'] === UPLOAD_ERR_OK;
    }

    // ── Headers ───────────────────────────────────────────────────

    public function getHeader(string $name): ?string
    {
        // Normalise: X-CSRF-Token → HTTP_X_CSRF_TOKEN
        $key = 'HTTP_' . strtoupper(str_replace('-', '_', $name));
        return $_SERVER[$key] ?? null;
    }

    public function bearerToken(): ?string
    {
        $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        if (str_starts_with($auth, 'Bearer ')) {
            return substr($auth, 7);
        }
        return null;
    }

    // ── CSRF ──────────────────────────────────────────────────────

    public function getCsrfToken(): ?string
    {
        // Accept from custom header OR body field
        return $this->getHeader('X-CSRF-Token')
            ?? $this->post('_csrf_token')
            ?? null;
    }

    // ── IP ────────────────────────────────────────────────────────

    public function ip(): string
    {
        $candidates = [
            'HTTP_CF_CONNECTING_IP',   // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];
        foreach ($candidates as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = trim(explode(',', $_SERVER[$key])[0]);
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        return '0.0.0.0';
    }

    // ── URL params (set by Router) ────────────────────────────────

    public function param(string $key, mixed $default = null): mixed
    {
        return $this->params[$key] ?? $default;
    }

    public function paramInt(string $key, int $default = 0): int
    {
        return isset($this->params[$key]) ? (int) $this->params[$key] : $default;
    }

    public function setParams(array $params): void
    {
        $this->params = $params;
    }

    // ── Pagination helpers ────────────────────────────────────────

    public function page(): int
    {
        return max(1, (int)($this->get('page') ?? 1));
    }

    public function perPage(): int
    {
        $pp = (int)($this->get('per_page') ?? DEFAULT_PER_PAGE);
        return min($pp > 0 ? $pp : DEFAULT_PER_PAGE, MAX_PER_PAGE);
    }

    public function offset(): int
    {
        return ($this->page() - 1) * $this->perPage();
    }

    // ── Content type checks ───────────────────────────────────────

    public function isJson(): bool
    {
        return str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'application/json');
    }

    public function isMultipart(): bool
    {
        return str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data');
    }
}
