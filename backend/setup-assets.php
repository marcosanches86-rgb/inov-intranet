<?php
/**
 * INOV Intranet — One-time placeholder asset generator + path discovery
 * Run once: https://intranet.inov.ao/backend/setup-assets.php?key=INOV2026setup
 * DELETE this file after running!
 */

if (($_GET['key'] ?? '') !== 'INOV2026setup') {
    http_response_code(403);
    die(json_encode(['error' => 'Forbidden']));
}

header('Content-Type: application/json');

$created = [];
$errors  = [];
$info    = [];

// ── Path discovery ──────────────────────────────────────────────────────────
$scriptDir  = __DIR__;                         // e.g. /home/u.../public_html/intranet-sync/backend
$rootParts  = explode('/', rtrim($scriptDir, '/'));

// Pop 'backend', leaving the install dir
array_pop($rootParts);
$installDir = implode('/', $rootParts);        // e.g. /home/u.../public_html/intranet-sync
$publicHtml = dirname($installDir);            // e.g. /home/u.../public_html

$info['script_dir']  = $scriptDir;
$info['install_dir'] = $installDir;
$info['public_html'] = $publicHtml;

// Candidate intranet backend paths (try several names Hostinger might use)
$candidates = [
    $installDir . '/backend/storage/uploads',          // this repo itself (intranet-sync)
    $publicHtml . '/intranet/backend/storage/uploads', // original git deploy path
    $publicHtml . '/intranet.inov.ao/backend/storage/uploads',
    $publicHtml . '/public_html/intranet/backend/storage/uploads',
];

$info['candidates'] = $candidates;
$info['candidate_exists'] = [];

$targetBase = null;
foreach ($candidates as $c) {
    $parentOk = is_dir(dirname(dirname($c)));   // storage dir's grandparent = backend
    $info['candidate_exists'][$c] = [
        'grandparent_exists' => $parentOk,
        'storage_exists'     => is_dir(dirname($c)),
        'uploads_exists'     => is_dir($c),
    ];
    if ($parentOk && $targetBase === null) {
        $targetBase = $c;  // use the first viable candidate
    }
}

if ($targetBase === null) {
    // Fallback: use this repo's own storage (will at least tell us the path)
    $targetBase = $installDir . '/backend/storage/uploads';
}

$info['chosen_target'] = $targetBase;

// ── Create directories ──────────────────────────────────────────────────────
foreach (['logos', 'covers', 'documents', 'gallery'] as $sub) {
    $dir = $targetBase . '/' . $sub;
    if (!is_dir($dir)) {
        if (mkdir($dir, 0755, true)) {
            $created[] = "dir: $dir";
        } else {
            $errors[] = "mkdir failed: $dir";
        }
    }
}

$logosDir = $targetBase . '/logos';

// ── Branded SVG logos ───────────────────────────────────────────────────────
$assets = [
    ['placeholder-01.svg', 'INOV', '#C9A24C', '#0C1A35', 'INOV Holding'],
    ['placeholder-02.svg', 'INOV', '#FFFFFF', '#0C1A35', 'INOV Holding'],
    ['placeholder-03.svg', 'IN',   '#C9A24C', '#F5F7FB', 'INOV Favicon'],
    ['placeholder-05.svg', 'FI',   '#F5C800', '#0A0A0A', 'Factory Ideas'],
    ['placeholder-06.svg', 'FI',   '#FFFFFF', '#0A0A0A', 'Factory Ideas'],
    ['placeholder-07.svg', 'FI',   '#0A0A0A', '#F5F7FB', 'Factory Ideas'],
    ['placeholder-08.svg', 'AM',   '#E94560', '#1A1A2E', 'Adventure Media'],
    ['placeholder-09.svg', 'AL',   '#34D399', '#064E3B', 'Anda-lá'],
    ['placeholder-10.svg', 'M24',  '#FB923C', '#7C2D12', 'Meteoro24'],
    ['placeholder-11.svg', 'ZP',   '#EAB308', '#1C1917', 'Ziv Petroleum'],
    ['placeholder-12.svg', 'HS',   '#60A5FA', '#1E3A5F', 'Hexa Seguros'],
];

foreach ($assets as [$fname, $initials, $textColor, $bgColor, $label]) {
    $fontSize = strlen($initials) <= 2 ? 52 : (strlen($initials) === 3 ? 38 : 28);
    $svg = <<<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200">
  <rect width="200" height="200" rx="20" fill="{$bgColor}"/>
  <text x="100" y="110" font-family="Arial,Helvetica,sans-serif" font-size="{$fontSize}" font-weight="800" fill="{$textColor}" text-anchor="middle" dominant-baseline="middle" letter-spacing="2">{$initials}</text>
  <text x="100" y="170" font-family="Arial,Helvetica,sans-serif" font-size="11" fill="{$textColor}" text-anchor="middle" opacity="0.6">{$label}</text>
</svg>
SVG;
    $path = $logosDir . '/' . $fname;
    if (file_put_contents($path, $svg) !== false) {
        $created[] = "svg: $fname → $path";
    } else {
        $errors[] = "write failed: $path";
    }
}

// ── Minimal PDF placeholder ─────────────────────────────────────────────────
$pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n190\n%%EOF";
$pdfPath = $logosDir . '/placeholder-04.pdf';
if (file_put_contents($pdfPath, $pdf) !== false) {
    $created[] = "pdf: placeholder-04.pdf → $pdfPath";
} else {
    $errors[] = "write failed: $pdfPath";
}

echo json_encode([
    'status'  => count($errors) === 0 ? 'ok' : 'partial',
    'info'    => $info,
    'created' => $created,
    'errors'  => $errors,
    'next'    => 'DELETE backend/setup-assets.php after confirming assets work',
], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
