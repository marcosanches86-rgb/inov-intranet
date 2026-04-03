<?php
declare(strict_types=1);

// ================================================================
//  Company Model
// ================================================================

class Company extends BaseModel
{
    protected string $table = 'companies';

    // ── Queries ───────────────────────────────────────────────────

    /**
     * All active companies ordered by sort_order.
     */
    public function allActive(): array
    {
        $rows = Database::query(
            "SELECT * FROM `companies` WHERE `is_active` = 1 ORDER BY `sort_order`, `name`"
        );
        return array_map([$this, 'decodeJson'], $rows);
    }

    /**
     * All companies (including inactive) — for admin.
     */
    public function allForAdmin(): array
    {
        $rows = Database::query(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM users    u WHERE u.company_id = c.id AND u.status = 'active') AS users_count,
                    (SELECT COUNT(*) FROM news     n WHERE n.company_id = c.id AND n.status = 'published') AS news_count,
                    (SELECT COUNT(*) FROM documents d WHERE d.company_id = c.id AND d.is_active = 1) AS docs_count
               FROM `companies` c
              ORDER BY c.`sort_order`, c.`name`"
        );
        return array_map([$this, 'decodeJson'], $rows);
    }

    /**
     * Find a company by ID with stats.
     */
    public function findWithStats(int $id): ?array
    {
        $row = Database::queryOne(
            "SELECT c.*,
                    (SELECT COUNT(*) FROM users       u WHERE u.company_id = c.id AND u.status = 'active')    AS users_count,
                    (SELECT COUNT(*) FROM news         n WHERE n.company_id = c.id AND n.status = 'published') AS news_count,
                    (SELECT COUNT(*) FROM documents    d WHERE d.company_id = c.id AND d.is_active = 1)        AS docs_count,
                    (SELECT COUNT(*) FROM brand_assets b WHERE b.company_id = c.id AND b.is_active = 1)       AS brands_count,
                    (SELECT COUNT(*) FROM gallery_albums g WHERE g.company_id = c.id AND g.is_active = 1)     AS albums_count
               FROM `companies` c
              WHERE c.`id` = :id",
            [':id' => $id]
        );
        return $row ? $this->decodeJson($row) : null;
    }

    /**
     * Find a company by slug.
     */
    public function findBySlug(string $slug): ?array
    {
        $row = Database::queryOne(
            "SELECT * FROM `companies` WHERE `slug` = :slug LIMIT 1",
            [':slug' => $slug]
        );
        return $row ? $this->decodeJson($row) : null;
    }

    // ── Mutations ─────────────────────────────────────────────────

    /**
     * Create a new company. Returns new ID.
     */
    public function create(array $data): int
    {
        $data = $this->prepareData($data);
        return $this->insert($data);
    }

    /**
     * Update a company. Returns true on success.
     */
    public function updateCompany(int $id, array $data): bool
    {
        $data = $this->prepareData($data, $id);
        return $this->update($id, $data) >= 0;
    }

    // ── Validation helpers ────────────────────────────────────────

    public function slugExists(string $slug, ?int $excludeId = null): bool
    {
        return !$this->isUnique('slug', $slug, $excludeId);
    }

    // ── Private helpers ───────────────────────────────────────────

    /**
     * Prepare data for insert/update:
     *  - Encode JSON array fields
     *  - Generate slug if needed
     *  - Only keep allowed columns
     */
    private function prepareData(array $data, ?int $excludeId = null): array
    {
        $allowed = [
            'slug', 'name', 'short_name', 'tagline', 'description',
            'sector', 'founded_year', 'location', 'employees',
            'color', 'accent_color', 'cover_gradient',
            'logo_path', 'cover_path',
            'email', 'phone', 'website',
            'services', 'values_list',
            'is_active', 'sort_order',
        ];

        $clean = array_intersect_key($data, array_flip($allowed));

        // Auto-generate slug from name if not provided
        if (empty($clean['slug']) && !empty($clean['name'])) {
            $clean['slug'] = uniqueSlug($clean['name'], 'companies', 'slug', $excludeId);
        }

        // Encode JSON fields if they are arrays
        foreach (['services', 'values_list'] as $field) {
            if (isset($clean[$field]) && is_array($clean[$field])) {
                $clean[$field] = json_encode(
                    array_values(array_filter($clean[$field])),
                    JSON_UNESCAPED_UNICODE
                );
            }
        }

        return $clean;
    }

    /**
     * Decode JSON fields in a company row.
     */
    public function decodeJson(array $company): array
    {
        foreach (['services', 'values_list'] as $field) {
            if (isset($company[$field]) && is_string($company[$field])) {
                $decoded = json_decode($company[$field], true);
                $company[$field] = is_array($decoded) ? $decoded : [];
            }
        }
        return $company;
    }
}
