<?php
/**
 * INOV — One-time database patch
 * Access via: https://inov.ao/intranet-sync/patchdb.php?key=INOV2026setup
 * Applies logo_path to existing companies and creates documents/ directory.
 * DELETE this file after running!
 */
if (($_GET['key'] ?? '') !== 'INOV2026setup') { http_response_code(403); die('Forbidden'); }
header('Content-Type: application/json');

$here    = __DIR__;
$pubHtml = dirname($here);

// ── Find .env and load DB credentials ──────────────────────────────────────
$candidates = [
    $pubHtml . '/intranet/backend/.env',
    $here    . '/backend/.env',
    $pubHtml . '/intranet.inov.ao/backend/.env',
];

$env = null;
foreach ($candidates as $c) {
    if (file_exists($c)) { $env = $c; break; }
}

$dbHost = 'localhost'; $dbPort = '3306'; $dbName = $dbUser = $dbPass = '';
if ($env) {
    foreach (file($env, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (str_starts_with($line, '#')) continue;
        [$k, $v] = array_pad(explode('=', $line, 2), 2, '');
        $k = trim($k); $v = trim($v, " \t\n\r\"'");
        match ($k) {
            'DB_HOST' => $dbHost = $v,
            'DB_PORT' => $dbPort = $v,
            'DB_NAME' => $dbName = $v,
            'DB_USER' => $dbUser = $v,
            'DB_PASS' => $dbPass = $v,
            default   => null,
        };
    }
}

$results = ['env' => $env ?? 'NOT FOUND', 'updates' => [], 'dirs' => [], 'errors' => []];

// ── DB connection ──────────────────────────────────────────────────────────
try {
    $pdo = new PDO(
        "mysql:host={$dbHost};port={$dbPort};dbname={$dbName};charset=utf8mb4",
        $dbUser, $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    echo json_encode(['error' => 'DB connection failed: ' . $e->getMessage()], JSON_PRETTY_PRINT);
    exit;
}

// ── Patch company logo_path ────────────────────────────────────────────────
$logos = [
    1 => 'logos/placeholder-01.svg',  // INOV Holding
    2 => 'logos/placeholder-05.svg',  // Factory Ideas
    3 => 'logos/placeholder-08.svg',  // Adventure Media
    4 => 'logos/placeholder-09.svg',  // Anda-lá
    5 => 'logos/placeholder-10.svg',  // Meteoro24
    6 => 'logos/placeholder-11.svg',  // Ziv Petroleum
    7 => 'logos/placeholder-12.svg',  // Hexa Seguros
];

$stmt = $pdo->prepare('UPDATE `companies` SET `logo_path` = :path WHERE `id` = :id AND (`logo_path` IS NULL OR `logo_path` = "")');
foreach ($logos as $id => $path) {
    $stmt->execute([':path' => $path, ':id' => $id]);
    $results['updates'][] = "company {$id}: {$path} (" . ($stmt->rowCount() ? 'updated' : 'already set') . ")";
}

// ── Create documents/ directory + minimal PDF placeholders ─────────────────
$uploadsBase = null;
$uploadsCandidates = [
    $pubHtml . '/intranet/backend/storage/uploads',
    $here    . '/backend/storage/uploads',
    $pubHtml . '/intranet.inov.ao/backend/storage/uploads',
];
foreach ($uploadsCandidates as $c) {
    if (is_dir(dirname(dirname($c)))) { $uploadsBase = $c; break; }
}
if (!$uploadsBase) $uploadsBase = $here . '/backend/storage/uploads';

$docsDir = $uploadsBase . '/documents';
if (!is_dir($docsDir) && !mkdir($docsDir, 0755, true)) {
    $results['errors'][] = "mkdir failed: {$docsDir}";
} else {
    $results['dirs'][] = "documents/ dir: " . (is_dir($docsDir) ? 'exists' : 'created');
}

// Minimal valid PDF stub for each document placeholder
$pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n190\n%%EOF";
$docxStub = pack('H*','504B0304140000000000000000000000000000000000000000'); // minimal zip stub

for ($i = 1; $i <= 16; $i++) {
    $n = str_pad($i, 3, '0', STR_PAD_LEFT);
    // determine extension from seed
    $ext = in_array($i, [11]) ? 'docx' : (in_array($i, [12, 16]) ? 'xlsx' : 'pdf');
    $file = "{$docsDir}/placeholder-{$n}.{$ext}";
    if (!file_exists($file)) {
        $content = ($ext === 'pdf') ? $pdf : $docxStub;
        file_put_contents($file, $content) !== false
            ? ($results['dirs'][] = "created: placeholder-{$n}.{$ext}")
            : ($results['errors'][] = "failed: placeholder-{$n}.{$ext}");
    }
}

$results['uploads_base'] = $uploadsBase;
echo json_encode(array_merge(['status' => count($results['errors']) ? 'partial' : 'ok'], $results), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
