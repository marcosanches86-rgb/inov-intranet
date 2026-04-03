<?php
declare(strict_types=1);

// ================================================================
//  Database — PDO Singleton
//  One connection per request lifecycle
// ================================================================

class Database
{
    private static ?PDO $instance = null;

    /**
     * Returns the single PDO instance.
     * Creates it on first call (lazy init).
     */
    public static function getInstance(): PDO
    {
        if (self::$instance === null) {
            self::$instance = self::createConnection();
        }
        return self::$instance;
    }

    private static function createConnection(): PDO
    {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci",
        ];

        try {
            return new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Never expose DB details in production
            error_log('[DATABASE ERROR] ' . $e->getMessage());

            if (APP_DEBUG) {
                Response::serverError('Database connection failed: ' . $e->getMessage());
            }

            Response::serverError('Serviço temporariamente indisponível. Tente novamente.');
        }
    }

    /**
     * Quick helper: prepare + execute + return all rows
     */
    public static function query(string $sql, array $params = []): array
    {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }

    /**
     * Quick helper: prepare + execute + return single row
     */
    public static function queryOne(string $sql, array $params = []): ?array
    {
        $stmt = self::getInstance()->prepare($sql);
        $stmt->execute($params);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /**
     * Quick helper: prepare + execute (INSERT/UPDATE/DELETE)
     * Returns last inserted ID for INSERTs
     */
    public static function execute(string $sql, array $params = []): string
    {
        $pdo  = self::getInstance();
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        return $pdo->lastInsertId();
    }

    // Prevent cloning and direct instantiation
    private function __construct() {}
    private function __clone()     {}
}
