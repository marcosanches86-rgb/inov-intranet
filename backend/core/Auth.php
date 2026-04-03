<?php
declare(strict_types=1);

// ================================================================
//  Auth — Session Management & Security
//
//  Handles:
//   - Secure PHP session initialisation
//   - Login state (write / read / destroy)
//   - CSRF token generation & validation
//   - Role-based access checks
// ================================================================

class Auth
{
    // ── Session bootstrap ────────────────────────────────────────

    /**
     * Start session with hardened security settings.
     * Must be called before any output — called in index.php.
     */
    public static function startSecureSession(): void
    {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }

        // Security flags
        ini_set('session.cookie_httponly',  '1');
        ini_set('session.cookie_samesite',  'Strict');
        ini_set('session.use_strict_mode',  '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.gc_maxlifetime',   (string) SESSION_LIFETIME);

        // Secure flag only on HTTPS
        if (
            (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
            (isset($_SERVER['SERVER_PORT']) && (int)$_SERVER['SERVER_PORT'] === 443)
        ) {
            ini_set('session.cookie_secure', '1');
        }

        session_name(SESSION_NAME);
        session_start();

        // Periodic session ID regeneration (every 15 min) — prevents fixation
        $now = time();
        if (!isset($_SESSION['_regen_at'])) {
            $_SESSION['_regen_at'] = $now;
        } elseif ($now - $_SESSION['_regen_at'] > 900) {
            session_regenerate_id(true);
            $_SESSION['_regen_at'] = $now;
        }

        // Ensure CSRF token exists
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = self::generateToken();
        }
    }

    // ── Login / Logout ────────────────────────────────────────────

    /**
     * Stores user context in session after successful authentication.
     * Regenerates session ID to prevent session fixation.
     */
    public static function login(int $userId, string $role, string $name, string $avatar): void
    {
        session_regenerate_id(true);

        $_SESSION['user_id']     = $userId;
        $_SESSION['user_role']   = $role;
        $_SESSION['user_name']   = $name;
        $_SESSION['user_avatar'] = $avatar;
        $_SESSION['logged_at']   = time();
        $_SESSION['_regen_at']   = time();
        $_SESSION['csrf_token']  = self::generateToken();
    }

    /**
     * Destroys the current session completely.
     */
    public static function logout(): void
    {
        $_SESSION = [];

        // Remove the session cookie
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(
                session_name(),
                '',
                time() - 86400,
                $params['path'],
                $params['domain'],
                $params['secure'],
                $params['httponly']
            );
        }

        session_destroy();
    }

    // ── State checks ──────────────────────────────────────────────

    public static function isAuthenticated(): bool
    {
        return !empty($_SESSION['user_id']);
    }

    /**
     * Checks authentication and session age.
     * Calls Response::unauthorized() and exits if not valid.
     */
    public static function check(): void
    {
        if (!self::isAuthenticated()) {
            Response::unauthorized();
        }

        // Check session has not exceeded lifetime
        if (isset($_SESSION['logged_at'])) {
            if (time() - (int)$_SESSION['logged_at'] > SESSION_LIFETIME) {
                self::logout();
                Response::unauthorized('Sessão expirada. Por favor faça login novamente.');
            }
        }
    }

    // ── Getters ───────────────────────────────────────────────────

    public static function id(): ?int
    {
        return isset($_SESSION['user_id'])
            ? (int) $_SESSION['user_id']
            : null;
    }

    public static function role(): ?string
    {
        return $_SESSION['user_role'] ?? null;
    }

    public static function name(): ?string
    {
        return $_SESSION['user_name'] ?? null;
    }

    // ── Role checks ───────────────────────────────────────────────

    /**
     * Returns true if the logged-in user has at least $minRole level.
     */
    public static function hasRole(string $minRole): bool
    {
        $current = self::role();
        if ($current === null) {
            return false;
        }

        $roles   = ROLES;
        $current = $roles[$current]  ?? 0;
        $min     = $roles[$minRole]  ?? 999;

        return $current >= $min;
    }

    /**
     * Shorthand role checks
     */
    public static function isAdmin():      bool { return self::hasRole('admin'); }
    public static function isSuperAdmin(): bool { return self::hasRole('super_admin'); }
    public static function isEditor():     bool { return self::hasRole('editor'); }

    // ── CSRF ──────────────────────────────────────────────────────

    public static function getCsrfToken(): string
    {
        if (empty($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = self::generateToken();
        }
        return $_SESSION['csrf_token'];
    }

    /**
     * Constant-time comparison to prevent timing attacks.
     */
    public static function validateCsrf(string $token): bool
    {
        $stored = $_SESSION['csrf_token'] ?? '';
        if (empty($stored) || empty($token)) {
            return false;
        }
        return hash_equals($stored, $token);
    }

    // ── Helpers ───────────────────────────────────────────────────

    private static function generateToken(): string
    {
        return bin2hex(random_bytes(32));
    }

    /**
     * Generate a secure random token for password resets etc.
     */
    public static function generateResetToken(): string
    {
        return bin2hex(random_bytes(32));
    }
}
