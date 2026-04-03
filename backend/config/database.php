<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — Database Configuration
//
//  For Hostinger: use the credentials from hPanel → Databases
//  For local dev:  use 127.0.0.1 with XAMPP/Laragon credentials
//
//  NEVER commit real credentials — use environment variables
//  or rename this file and add it to .gitignore
// ================================================================

define('DB_HOST',    getenv('DB_HOST')    ?: '127.0.0.1');
define('DB_PORT',    getenv('DB_PORT')    ?: '3306');
define('DB_NAME',    getenv('DB_NAME')    ?: 'inov_intranet');
define('DB_USER',    getenv('DB_USER')    ?: 'root');
define('DB_PASS',    getenv('DB_PASS')    ?: '');
define('DB_CHARSET', 'utf8mb4');
