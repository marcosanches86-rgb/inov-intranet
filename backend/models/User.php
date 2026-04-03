<?php
declare(strict_types=1);

// ================================================================
//  User Model
//
//  Handles:
//    - Finding, creating and updating user records
//    - Password hashing and verification
//    - Login attempt tracking (rate limiting)
//    - Field sanitisation (stripping password from output)
// ================================================================

class User extends BaseModel
{
    protected string $table = 'users';

    // ── Queries ───────────────────────────────────────────────────

    /**
     * Find a user by email address (case-insensitive).
     */
    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT u.*, c.name AS company_name, c.short_name AS company_short,
                    c.color AS company_color, c.accent_color AS company_accent
               FROM `users` u
          LEFT JOIN `companies` c ON c.id = u.company_id
              WHERE LOWER(u.email) = LOWER(:email)
              LIMIT 1"
        );
        $stmt->execute([':email' => $email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Find a user by ID, joined with company info.
     */
    public function findWithCompany(int $id): ?array
    {
        $stmt = $this->db->prepare(
            "SELECT u.*, c.name AS company_name, c.short_name AS company_short,
                    c.color AS company_color, c.accent_color AS company_accent
               FROM `users` u
          LEFT JOIN `companies` c ON c.id = u.company_id
              WHERE u.id = :id
              LIMIT 1"
        );
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Paginated list of all users with company name.
     */
    public function listPaginated(
        int    $page    = 1,
        int    $perPage = DEFAULT_PER_PAGE,
        array  $filters = []
    ): array {
        $where  = [];
        $params = [];

        if (!empty($filters['role'])) {
            $where[]         = 'u.`role` = :role';
            $params[':role'] = $filters['role'];
        }

        if (!empty($filters['status'])) {
            $where[]           = 'u.`status` = :status';
            $params[':status'] = $filters['status'];
        }

        if (!empty($filters['company_id'])) {
            $where[]              = 'u.`company_id` = :company_id';
            $params[':company_id'] = (int) $filters['company_id'];
        }

        if (!empty($filters['search'])) {
            $where[]           = '(u.`name` LIKE :s OR u.`email` LIKE :s)';
            $params[':s']      = '%' . $filters['search'] . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT u.id, u.name, u.email, u.avatar, u.role, u.status,
                       u.company_id, u.department, u.job_title, u.phone,
                       u.last_login_at, u.joined_date, u.created_at,
                       c.name AS company_name
                  FROM `users` u
             LEFT JOIN `companies` c ON c.id = u.company_id
                {$whereClause}
               ORDER BY u.`created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    // ── Mutations ─────────────────────────────────────────────────

    /**
     * Create a new user. Returns the new user ID.
     * Password must already be hashed before calling this.
     */
    public function create(array $data): int
    {
        $allowed = [
            'name', 'email', 'password', 'avatar', 'role', 'status',
            'company_id', 'department', 'job_title', 'phone', 'bio',
            'joined_date', 'email_verified_at',
        ];

        $clean = array_intersect_key($data, array_flip($allowed));

        // Generate avatar initials if not provided
        if (empty($clean['avatar']) && !empty($clean['name'])) {
            $clean['avatar'] = $this->makeInitials($clean['name']);
        }

        return $this->insert($clean);
    }

    /**
     * Update last login timestamp and wipe old login attempts on success.
     */
    public function recordLogin(int $id, string $ip): void
    {
        $this->db->prepare(
            "UPDATE `users` SET `last_login_at` = NOW() WHERE `id` = :id"
        )->execute([':id' => $id]);

        // Clean successful user's failed attempts
        $this->clearAttempts($ip);
    }

    /**
     * Update the user's hashed password.
     */
    public function updatePassword(int $id, string $hashedPassword): bool
    {
        $stmt = $this->db->prepare(
            "UPDATE `users` SET `password` = :pwd, `updated_at` = NOW() WHERE `id` = :id"
        );
        $stmt->execute([':pwd' => $hashedPassword, ':id' => $id]);
        return $stmt->rowCount() > 0;
    }

    // ── Password helpers ──────────────────────────────────────────

    public static function hashPassword(string $plain): string
    {
        return password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
    }

    public static function verifyPassword(string $plain, string $hash): bool
    {
        return password_verify($plain, $hash);
    }

    /**
     * Check if a password needs rehashing (if cost changed).
     */
    public function rehashIfNeeded(int $id, string $plain, string $currentHash): void
    {
        if (password_needs_rehash($currentHash, PASSWORD_BCRYPT, ['cost' => 12])) {
            $this->updatePassword($id, self::hashPassword($plain));
        }
    }

    // ── Sanitisation ──────────────────────────────────────────────

    /**
     * Remove sensitive fields from a user array before sending to frontend.
     */
    public static function sanitize(array $user): array
    {
        unset($user['password']);
        return $user;
    }

    /**
     * Public-safe fields (subset for public listing).
     */
    public static function publicFields(array $user): array
    {
        return array_intersect_key($user, array_flip([
            'id', 'name', 'email', 'avatar', 'role', 'status',
            'company_id', 'company_name', 'department', 'job_title',
            'joined_date', 'last_login_at', 'created_at',
        ]));
    }

    // ── Uniqueness checks ─────────────────────────────────────────

    public function emailExists(string $email, ?int $excludeId = null): bool
    {
        $sql    = "SELECT id FROM `users` WHERE LOWER(email) = LOWER(:email)";
        $params = [':email' => $email];
        if ($excludeId !== null) {
            $sql   .= ' AND id != :xid';
            $params[':xid'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (bool) $stmt->fetch();
    }

    // ── Rate limiting (login_attempts table) ──────────────────────

    /**
     * Returns true if the identifier (email or IP) is currently locked out.
     */
    public function isRateLimited(string $email, string $ip): bool
    {
        $since = date('Y-m-d H:i:s', time() - (LOGIN_LOCKOUT_MINS * 60));

        $stmt = $this->db->prepare(
            "SELECT COUNT(*) FROM `login_attempts`
              WHERE `success`      = 0
                AND `attempted_at` >= :since
                AND (`identifier`  = :email OR `ip_address` = :ip)"
        );
        $stmt->execute([':since' => $since, ':email' => $email, ':ip' => $ip]);

        return (int) $stmt->fetchColumn() >= LOGIN_MAX_ATTEMPTS;
    }

    /**
     * Record a login attempt (successful or failed).
     */
    public function recordAttempt(string $email, string $ip, bool $success): void
    {
        $this->db->prepare(
            "INSERT INTO `login_attempts`
               (`identifier`, `ip_address`, `success`, `attempted_at`)
             VALUES
               (:identifier, :ip, :success, NOW())"
        )->execute([
            ':identifier' => $email,
            ':ip'         => $ip,
            ':success'    => $success ? 1 : 0,
        ]);
    }

    /**
     * Remove all failed attempts for an IP (called after successful login).
     */
    public function clearAttempts(string $ip): void
    {
        $this->db->prepare(
            "DELETE FROM `login_attempts` WHERE `ip_address` = :ip"
        )->execute([':ip' => $ip]);
    }

    /**
     * Returns how many minutes remain until lockout expires.
     */
    public function lockoutRemainingMinutes(string $email, string $ip): int
    {
        $since = date('Y-m-d H:i:s', time() - (LOGIN_LOCKOUT_MINS * 60));

        $stmt = $this->db->prepare(
            "SELECT MAX(`attempted_at`) FROM `login_attempts`
              WHERE `success`      = 0
                AND `attempted_at` >= :since
                AND (`identifier`  = :email OR `ip_address` = :ip)"
        );
        $stmt->execute([':since' => $since, ':email' => $email, ':ip' => $ip]);
        $lastAttempt = $stmt->fetchColumn();

        if (!$lastAttempt) return 0;

        $elapsed   = time() - strtotime($lastAttempt);
        $remaining = (LOGIN_LOCKOUT_MINS * 60) - $elapsed;
        return max(1, (int) ceil($remaining / 60));
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function makeInitials(string $name): string
    {
        $words    = preg_split('/\s+/', trim($name));
        $initials = '';
        foreach ($words as $word) {
            $initials .= mb_strtoupper(mb_substr($word, 0, 1));
            if (mb_strlen($initials) >= 2) break;
        }
        return $initials ?: 'U';
    }
}
