<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — Database Configuration
// ================================================================

// Load .env file if present (shared hosting has no OS env vars)
$_envFile = __DIR__ . '/../.env';
if (file_exists($_envFile)) {
    foreach (file($_envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $_line) {
        $_line = trim($_line);
        if ($_line === '' || $_line[0] === '#') continue;
        if (str_contains($_line, '=')) {
            [$_k, $_v] = explode('=', $_line, 2);
            $_k = trim($_k); $_v = trim($_v);
            if (!getenv($_k)) putenv("$_k=$_v");
        }
    }
    unset($_envFile, $_line, $_k, $_v);
} else { unset($_envFile); }

define('DB_HOST',    getenv('DB_HOST')    ?: '127.0.0.1');
define('DB_PORT',    getenv('DB_PORT')    ?: '3306');
define('DB_NAME',    getenv('DB_NAME')    ?: 'inov_intranet');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');
