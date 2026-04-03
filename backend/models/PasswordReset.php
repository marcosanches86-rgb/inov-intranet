<?php
declare(strict_types=1);

// ================================================================
//  PasswordReset Model
//
//  Manages one-time tokens for password recovery.
//
//  Security design:
//    - A raw (cryptographically random) token is generated
//    - Only the SHA-256 hash of the token is stored in DB
//    - The raw token is sent to the user (by email / returned in dev)
//    - On reset: raw token is hashed and compared with DB hash
//    - This means a DB breach does not expose usable tokens
// ================================================================

class PasswordReset extends BaseModel
{
    protected string $table = 'password_resets';

    /**
     * Creates a new reset token for the given email.
     * Any previous tokens for the same email are deleted.
     * Returns the RAW token (to be sent to the user).
     */
    public function createForEmail(string $email): string
    {
        // Invalidate any previous tokens for this email
        $this->deleteByEmail($email);

        // Generate a 64-char hex raw token
        $rawToken  = bin2hex(random_bytes(32)); // 64 hex chars
        $hashToken = hash('sha256', $rawToken);
        $expiresAt = date('Y-m-d H:i:s', time() + RESET_TOKEN_EXPIRY);

        $this->db->prepare(
            "INSERT INTO `password_resets` (`email`, `token`, `expires_at`)
             VALUES (:email, :token, :expires_at)"
        )->execute([
            ':email'      => $email,
            ':token'      => $hashToken,
            ':expires_at' => $expiresAt,
        ]);

        return $rawToken;
    }

    /**
     * Finds a valid (non-expired, non-used) token for a given email.
     * Accepts the RAW token from the user and compares its hash.
     * Returns the DB row or null.
     */
    public function findValid(string $rawToken, string $email): ?array
    {
        $hashToken = hash('sha256', $rawToken);

        $stmt = $this->db->prepare(
            "SELECT * FROM `password_resets`
              WHERE `email`      = :email
                AND `token`      = :token
                AND `expires_at` > NOW()
                AND `used_at`    IS NULL
              LIMIT 1"
        );
        $stmt->execute([':email' => $email, ':token' => $hashToken]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Mark a token as used (one-time use guarantee).
     */
    public function markUsed(int $id): void
    {
        $this->db->prepare(
            "UPDATE `password_resets` SET `used_at` = NOW() WHERE `id` = :id"
        )->execute([':id' => $id]);
    }

    /**
     * Delete all tokens for an email (cleanup on new request or successful reset).
     */
    public function deleteByEmail(string $email): void
    {
        $this->db->prepare(
            "DELETE FROM `password_resets` WHERE `email` = :email"
        )->execute([':email' => $email]);
    }

    /**
     * Clean up expired and used tokens (run periodically / on each login).
     */
    public function cleanExpired(): void
    {
        $this->db->exec(
            "DELETE FROM `password_resets`
              WHERE `expires_at` < NOW()
                 OR `used_at` IS NOT NULL"
        );
    }
}
