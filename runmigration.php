<?php
// Script de execução única — remover após usar
if (($_GET['key'] ?? '') !== 'INOV2026migrate') { http_response_code(403); exit('Forbidden'); }

$sqlFile = __DIR__ . '/backend/database/migrations/001_performance_indexes.sql';
if (!file_exists($sqlFile)) { exit('Migration file not found'); }

// Localizar .env
$envPaths = [
    __DIR__ . '/backend/.env',
    dirname(__DIR__) . '/intranet/backend/.env',
];
$env = null;
foreach ($envPaths as $p) { if (file_exists($p)) { $env = $p; break; } }
if (!$env) { exit('No .env found'); }

foreach (file($env) as $line) {
    $line = trim($line);
    if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
        [$k, $v] = explode('=', $line, 2);
        $_ENV[trim($k)] = trim($v);
    }
}

try {
    $pdo = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . ($_ENV['DB_NAME'] ?? '') . ';charset=utf8mb4',
        $_ENV['DB_USER'] ?? '', $_ENV['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) { exit('DB connection failed: ' . $e->getMessage()); }

$sql = file_get_contents($sqlFile);
// Separar statements individuais (ignorar comentários e linhas vazias)
$statements = array_filter(
    array_map('trim', preg_split('/;\s*\n/', $sql)),
    fn($s) => $s && !str_starts_with(ltrim($s), '--')
);

$results = [];
foreach ($statements as $stmt) {
    if (!trim($stmt)) continue;
    try {
        $pdo->exec($stmt);
        $results[] = '✅ OK: ' . substr(preg_replace('/\s+/', ' ', $stmt), 0, 80);
    } catch (Exception $e) {
        // "Duplicate key name" é esperado se o índice já existir
        if (str_contains($e->getMessage(), 'Duplicate key name')) {
            $results[] = '⚠️  Já existe: ' . substr(preg_replace('/\s+/', ' ', $stmt), 0, 60);
        } else {
            $results[] = '❌ ERRO: ' . $e->getMessage() . ' — ' . substr($stmt, 0, 60);
        }
    }
}

echo "<pre>Migration 001 — Resultado:\n\n" . implode("\n", $results) . "\n\nConcluído.</pre>";
