<?php
declare(strict_types=1);

// ================================================================
//  Slug Helper — URL-safe slug generation with uniqueness guarantee
// ================================================================

/**
 * Convert any string to a URL-safe slug.
 * Handles Portuguese accented characters.
 *
 * Example: "INOV Anuncia Expansão!" → "inov-anuncia-expansao"
 */
function generateSlug(string $text): string
{
    // Transliterate accented Portuguese/Latin characters
    $map = [
        'á'=>'a','à'=>'a','â'=>'a','ã'=>'a','ä'=>'a',
        'é'=>'e','è'=>'e','ê'=>'e','ë'=>'e',
        'í'=>'i','ì'=>'i','î'=>'i','ï'=>'i',
        'ó'=>'o','ò'=>'o','ô'=>'o','õ'=>'o','ö'=>'o',
        'ú'=>'u','ù'=>'u','û'=>'u','ü'=>'u',
        'ç'=>'c','ñ'=>'n','ý'=>'y','ÿ'=>'y',
        'Á'=>'a','À'=>'a','Â'=>'a','Ã'=>'a','Ä'=>'a',
        'É'=>'e','È'=>'e','Ê'=>'e','Ë'=>'e',
        'Í'=>'i','Ì'=>'i','Î'=>'i','Ï'=>'i',
        'Ó'=>'o','Ò'=>'o','Ô'=>'o','Õ'=>'o','Ö'=>'o',
        'Ú'=>'u','Ù'=>'u','Û'=>'u','Ü'=>'u',
        'Ç'=>'c','Ñ'=>'n','Ý'=>'y',
        '&'=>'e', '@'=>'a',
    ];

    $text = strtr($text, $map);
    $text = mb_strtolower($text, 'UTF-8');

    // Remove all non-alphanumeric except spaces and hyphens
    $text = preg_replace('/[^a-z0-9\s\-]/', '', $text);

    // Replace spaces and multiple hyphens with a single hyphen
    $text = preg_replace('/[\s\-]+/', '-', $text);

    return trim($text, '-');
}

/**
 * Generate a slug that is guaranteed to be unique in the given table/column.
 * Appends -2, -3, etc. if the base slug already exists.
 *
 * @param string   $text       Source text (e.g. news title)
 * @param string   $table      DB table to check
 * @param string   $column     Slug column name (default: 'slug')
 * @param int|null $excludeId  Exclude this ID (for UPDATE operations)
 */
function uniqueSlug(
    string $text,
    string $table,
    string $column    = 'slug',
    ?int   $excludeId = null
): string {
    $base  = generateSlug($text);
    $slug  = $base;
    $count = 2;
    $db    = Database::getInstance();

    while (true) {
        $sql    = "SELECT id FROM `{$table}` WHERE `{$column}` = :slug";
        $params = [':slug' => $slug];

        if ($excludeId !== null) {
            $sql   .= ' AND id != :xid';
            $params[':xid'] = $excludeId;
        }

        $stmt = $db->prepare($sql);
        $stmt->execute($params);

        if (!$stmt->fetch()) {
            break; // Slug is available
        }

        $slug = $base . '-' . $count++;

        // Safety valve — prevent infinite loop
        if ($count > 999) {
            $slug = $base . '-' . bin2hex(random_bytes(4));
            break;
        }
    }

    return $slug;
}
