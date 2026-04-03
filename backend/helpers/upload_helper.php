<?php
declare(strict_types=1);

// ================================================================
//  Upload Helper — Secure file upload pipeline
//
//  Pipeline:
//    1. Check $_FILES error code
//    2. Validate file size
//    3. Validate extension (whitelist)
//    4. Validate real MIME type (mime_content_type)
//    5. Check for double-extension attacks
//    6. Generate cryptographically random filename
//    7. Move to /storage/uploads/{type}/
//    8. Return metadata
// ================================================================

/**
 * Validate a $_FILES entry without moving it.
 *
 * @param array  $file  One entry from $_FILES
 * @param string $type  'image' | 'document' | 'logo' | 'cover'
 * @return array ['valid'=>bool, 'error'=>string|null, 'ext'=>string, 'mime'=>string]
 */
function validateUpload(array $file, string $type = 'image'): array
{
    // ── 1. PHP upload error ───────────────────────────────────────
    if (!isset($file['tmp_name']) || empty($file['tmp_name'])) {
        return ['valid' => false, 'error' => 'Nenhum ficheiro recebido.'];
    }

    $phpErrors = [
        UPLOAD_ERR_INI_SIZE   => 'O ficheiro excede o limite php.ini (upload_max_filesize).',
        UPLOAD_ERR_FORM_SIZE  => 'O ficheiro excede o limite do formulário.',
        UPLOAD_ERR_PARTIAL    => 'O upload foi interrompido.',
        UPLOAD_ERR_NO_FILE    => 'Nenhum ficheiro seleccionado.',
        UPLOAD_ERR_NO_TMP_DIR => 'Pasta temporária em falta no servidor.',
        UPLOAD_ERR_CANT_WRITE => 'Erro ao escrever o ficheiro no disco.',
        UPLOAD_ERR_EXTENSION  => 'Upload bloqueado por extensão PHP.',
    ];

    if ($file['error'] !== UPLOAD_ERR_OK) {
        $msg = $phpErrors[$file['error']] ?? 'Erro de upload desconhecido.';
        return ['valid' => false, 'error' => $msg];
    }

    // ── 2. File size ──────────────────────────────────────────────
    $maxSize = match ($type) {
        'document' => UPLOAD_MAX_DOC,
        'logo'     => UPLOAD_MAX_LOGO,
        default    => UPLOAD_MAX_IMAGE,
    };

    if ((int) $file['size'] > $maxSize) {
        $mb = number_format($maxSize / 1048576, 1);
        return ['valid' => false, 'error' => "Ficheiro demasiado grande. Máximo permitido: {$mb} MB."];
    }

    if ((int) $file['size'] === 0) {
        return ['valid' => false, 'error' => 'O ficheiro está vazio.'];
    }

    // ── 3. Extension whitelist ────────────────────────────────────
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

    $allowedExts = match ($type) {
        'document' => ALLOWED_DOC_EXTS,
        'logo'     => ALLOWED_LOGO_EXTS,
        default    => ALLOWED_IMAGE_EXTS,
    };

    if (!in_array($ext, $allowedExts, true)) {
        return ['valid' => false, 'error' => "Extensão .{$ext} não é permitida para este tipo de upload."];
    }

    // ── 4. Real MIME type (not just extension) ────────────────────
    $mime = mime_content_type($file['tmp_name']);

    $allowedMimes = match ($type) {
        'document' => ALLOWED_DOC_MIMES,
        'logo'     => ALLOWED_LOGO_MIMES,
        default    => ALLOWED_IMAGE_MIMES,
    };

    if (!in_array($mime, $allowedMimes, true)) {
        return ['valid' => false, 'error' => "Tipo de conteúdo do ficheiro não é permitido: {$mime}."];
    }

    // ── 5. Double-extension / code injection attack ───────────────
    $basename = basename($file['name']);
    if (preg_match('/\.(php[0-9]?|phtml|phar|asp|aspx|cgi|pl|py|sh|rb|exe|bat|cmd|js|jar|htaccess)\b/i', $basename)) {
        return ['valid' => false, 'error' => 'Ficheiro potencialmente perigoso rejeitado.'];
    }

    return ['valid' => true, 'ext' => $ext, 'mime' => $mime, 'error' => null];
}

/**
 * Validate and move an uploaded file to the correct storage directory.
 *
 * @param array  $file  $_FILES entry
 * @param string $type  'image' | 'document' | 'logo' | 'cover'
 * @return array|false  File metadata on success, false on failure with $uploadError set
 */
function moveUpload(array $file, string $type = 'image'): array|false
{
    $validation = validateUpload($file, $type);

    if (!$validation['valid']) {
        // Store error in a global so callers can retrieve it
        global $uploadError;
        $uploadError = $validation['error'];
        return false;
    }

    $subdir = match ($type) {
        'document' => 'documents',
        'logo'     => 'logos',
        'cover'    => 'covers',
        default    => 'gallery',
    };

    $uploadDir = UPLOAD_BASE_PATH . '/' . $subdir;

    // Create directory if it doesn't exist
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0755, true)) {
        global $uploadError;
        $uploadError = 'Não foi possível criar o directório de upload.';
        return false;
    }

    // ── Generate cryptographically safe filename ──────────────────
    $ext      = $validation['ext'];
    $hash     = bin2hex(random_bytes(12)); // 24 hex chars
    $ts       = time();
    $filename = "{$hash}_{$ts}.{$ext}";
    $fullPath = $uploadDir . '/' . $filename;

    if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
        global $uploadError;
        $uploadError = 'Falha ao mover o ficheiro para o servidor.';
        return false;
    }

    // Set safe permissions
    chmod($fullPath, 0644);

    $relativePath = $subdir . '/' . $filename;

    return [
        'filename'      => $filename,
        'original_name' => basename($file['name']),
        'path'          => $relativePath,
        'url'           => UPLOAD_BASE_URL . '/' . $relativePath,
        'size'          => (int) $file['size'],
        'size_human'    => formatFileSize((int) $file['size']),
        'mime'          => $validation['mime'],
        'ext'           => $ext,
        'type'          => $type,
    ];
}

/**
 * Safely delete an uploaded file.
 * Prevents path traversal by checking the resolved path
 * is still inside UPLOAD_BASE_PATH.
 */
function deleteUploadFile(string $relativePath): bool
{
    if (empty($relativePath)) {
        return false;
    }

    // Sanitise — no directory traversal allowed
    $fullPath = realpath(UPLOAD_BASE_PATH . '/' . $relativePath);
    $baseReal = realpath(UPLOAD_BASE_PATH);

    if ($fullPath === false || $baseReal === false) {
        return false;
    }

    if (!str_starts_with($fullPath, $baseReal . DIRECTORY_SEPARATOR)) {
        error_log('[UPLOAD] Path traversal attempt blocked: ' . $relativePath);
        return false;
    }

    if (is_file($fullPath)) {
        return unlink($fullPath);
    }

    return false;
}

/**
 * Format bytes into human-readable size.
 */
function formatFileSize(int $bytes): string
{
    if ($bytes >= 1073741824) return round($bytes / 1073741824, 2) . ' GB';
    if ($bytes >= 1048576)    return round($bytes / 1048576,    1) . ' MB';
    if ($bytes >= 1024)       return round($bytes / 1024,       1) . ' KB';
    return $bytes . ' B';
}

/**
 * Get the last upload error (set by moveUpload on failure).
 */
function getUploadError(): string
{
    global $uploadError;
    return $uploadError ?? 'Erro desconhecido no upload.';
}
