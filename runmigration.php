<?php
// Script de execução única — remover após usar
if (($_GET['key'] ?? '') !== 'INOV2026migrate') { http_response_code(403); exit('Forbidden'); }

// Localizar .env
foreach ([__DIR__ . '/backend/.env', dirname(__DIR__) . '/intranet/backend/.env'] as $p) {
    if (file_exists($p)) {
        foreach (file($p) as $line) {
            $line = trim($line);
            if ($line && !str_starts_with($line, '#') && str_contains($line, '=')) {
                [$k, $v] = explode('=', $line, 2);
                $_ENV[trim($k)] = trim($v);
            }
        }
        break;
    }
}

try {
    $pdo = new PDO(
        'mysql:host=' . ($_ENV['DB_HOST'] ?? 'localhost') . ';dbname=' . ($_ENV['DB_NAME'] ?? '') . ';charset=utf8mb4',
        $_ENV['DB_USER'] ?? '', $_ENV['DB_PASS'] ?? '',
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
} catch (Exception $e) { exit('DB connection failed: ' . $e->getMessage()); }

// Índices a adicionar — definidos directamente (evita parsing de ficheiro SQL)
$indexes = [
    'news'           => ['idx_news_status_featured_date', 'ALTER TABLE `news` ADD KEY `idx_news_status_featured_date` (`status`, `is_featured`, `published_at`)'],
    'ann_expires'    => ['idx_ann_active_expires',        'ALTER TABLE `announcements` ADD KEY `idx_ann_active_expires` (`is_active`, `expires_at`)'],
    'ann_vis'        => ['idx_ann_visibility_company',    'ALTER TABLE `announcements` ADD KEY `idx_ann_visibility_company` (`visibility`, `company_id`)'],
    'att_ident'      => ['idx_attempts_ident_time',       'ALTER TABLE `login_attempts` ADD KEY `idx_attempts_ident_time` (`identifier`, `attempted_at`)'],
    'att_ip'         => ['idx_attempts_ip_time',          'ALTER TABLE `login_attempts` ADD KEY `idx_attempts_ip_time` (`ip_address`, `attempted_at`)'],
    'logs_date_id'   => ['idx_logs_date_id',              'ALTER TABLE `activity_logs` ADD KEY `idx_logs_date_id` (`created_at`, `id`)'],
    'resets_tok'     => ['idx_resets_token_email',        'ALTER TABLE `password_resets` ADD KEY `idx_resets_token_email` (`token`, `email`)'],
    'docs_active'    => ['idx_docs_active_conf',          'ALTER TABLE `documents` ADD KEY `idx_docs_active_conf` (`is_active`, `is_confidential`)'],
    'items_order'    => ['idx_items_album_order',          'ALTER TABLE `gallery_items` ADD KEY `idx_items_album_order` (`album_id`, `sort_order`)'],
];

echo "<pre>Migration 001 — Índices de Performance\n";
echo str_repeat('─', 60) . "\n\n";

foreach ($indexes as $key => [$indexName, $sql]) {
    try {
        $pdo->exec($sql);
        echo "✅ Criado:   {$indexName}\n";
    } catch (Exception $e) {
        if (str_contains($e->getMessage(), 'Duplicate key name')) {
            echo "⚠️  Já existe: {$indexName}\n";
        } else {
            echo "❌ ERRO [{$indexName}]: " . $e->getMessage() . "\n";
        }
    }
}

// Verificar índices actuais nas tabelas afectadas
echo "\n" . str_repeat('─', 60) . "\n";
echo "Verificação — índices em news:\n";
foreach ($pdo->query("SHOW INDEX FROM `news`") as $row) {
    echo "  [{$row['Seq_in_index']}] {$row['Key_name']} → {$row['Column_name']}\n";
}

echo "\nConcluído.\n</pre>";
