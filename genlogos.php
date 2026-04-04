<?php
/**
 * INOV — One-time logo generator
 * Access via: https://inov.ao/intranet-sync/genlogos.php?key=INOV2026setup
 * Writes branded SVG placeholders to intranet/backend/storage/uploads/logos/
 * DELETE this file after running!
 */
if (($_GET['key'] ?? '') !== 'INOV2026setup') { http_response_code(403); die('Forbidden'); }
header('Content-Type: application/json');

$here    = __DIR__;                            // /home/.../public_html/intranet-sync
$pubHtml = dirname($here);                     // /home/.../public_html

// Try to find the intranet directory
$candidates = [
    $pubHtml . '/intranet/backend/storage/uploads',
    $here    . '/backend/storage/uploads',      // fallback: write here
    $pubHtml . '/intranet.inov.ao/backend/storage/uploads',
];

$base = null;
foreach ($candidates as $c) {
    if (is_dir(dirname(dirname($c)))) { $base = $c; break; }  // backend dir must exist
}
if (!$base) { $base = $here . '/backend/storage/uploads'; }

$info = ['here'=>$here,'pubHtml'=>$pubHtml,'chosen'=>$base];
$created = []; $errors = [];

foreach (['logos','covers','documents','gallery'] as $sub) {
    $d = "$base/$sub";
    if (!is_dir($d) && !mkdir($d, 0755, true)) { $errors[] = "mkdir fail: $d"; }
}

$logosDir = "$base/logos";

$assets = [
    ['placeholder-01.svg','INOV','#C9A24C','#0C1A35','INOV Holding'],
    ['placeholder-02.svg','INOV','#FFFFFF','#0C1A35','INOV Holding'],
    ['placeholder-03.svg','IN',  '#C9A24C','#F5F7FB','INOV Favicon'],
    ['placeholder-05.svg','FI',  '#F5C800','#0A0A0A','Factory Ideas'],
    ['placeholder-06.svg','FI',  '#FFFFFF','#0A0A0A','Factory Ideas'],
    ['placeholder-07.svg','FI',  '#0A0A0A','#F5F7FB','Factory Ideas'],
    ['placeholder-08.svg','AM',  '#E94560','#1A1A2E','Adventure Media'],
    ['placeholder-09.svg','AL',  '#34D399','#064E3B','Anda-lá'],
    ['placeholder-10.svg','M24', '#FB923C','#7C2D12','Meteoro24'],
    ['placeholder-11.svg','ZP',  '#EAB308','#1C1917','Ziv Petroleum'],
    ['placeholder-12.svg','HS',  '#60A5FA','#1E3A5F','Hexa Seguros'],
];

foreach ($assets as [$f,$i,$tc,$bc,$l]) {
    $fs = strlen($i)<=2?52:(strlen($i)===3?38:28);
    $svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 200 200\" width=\"200\" height=\"200\"><rect width=\"200\" height=\"200\" rx=\"20\" fill=\"$bc\"/><text x=\"100\" y=\"110\" font-family=\"Arial,Helvetica,sans-serif\" font-size=\"$fs\" font-weight=\"800\" fill=\"$tc\" text-anchor=\"middle\" dominant-baseline=\"middle\" letter-spacing=\"2\">$i</text><text x=\"100\" y=\"170\" font-family=\"Arial,Helvetica,sans-serif\" font-size=\"11\" fill=\"$tc\" text-anchor=\"middle\" opacity=\"0.6\">$l</text></svg>";
    $p = "$logosDir/$f";
    file_put_contents($p,$svg) !== false ? ($created[]=$p) : ($errors[]="fail:$p");
}

$pdf = "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Root 1 0 R/Size 4>>\nstartxref\n190\n%%EOF";
$pp = "$logosDir/placeholder-04.pdf";
file_put_contents($pp,$pdf) !== false ? ($created[]=$pp) : ($errors[]="fail:$pp");

echo json_encode(['status'=>count($errors)?'partial':'ok','info'=>$info,'created'=>count($created),'errors'=>$errors],JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
