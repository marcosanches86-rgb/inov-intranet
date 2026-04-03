<?php
declare(strict_types=1);

// ================================================================
//  News Model
// ================================================================

class News extends BaseModel
{
    protected string $table = 'news';

    // ── Queries ───────────────────────────────────────────────────

    /**
     * Paginated listing with full filter support.
     *
     * Filters:
     *   company_id  int
     *   status      draft | published | all  (default: published for non-admins)
     *   featured    1 | 0
     *   category    string
     *   search      fulltext or LIKE
     *   author_id   int
     */
    public function listPaginated(
        int   $page,
        int   $perPage,
        array $filters  = [],
        bool  $adminView = false
    ): array {
        $where  = [];
        $params = [];

        // Non-admin users always see only published news
        $status = $filters['status'] ?? 'published';
        if (!$adminView) {
            $status = 'published';
        }

        if ($status !== 'all') {
            $where[]           = 'n.`status` = :status';
            $params[':status'] = $status;
        }

        if (!empty($filters['company_id'])) {
            $where[]              = 'n.`company_id` = :company_id';
            $params[':company_id'] = (int) $filters['company_id'];
        }

        if (isset($filters['featured']) && $filters['featured'] !== '') {
            $where[]             = 'n.`is_featured` = :featured';
            $params[':featured'] = (int)(bool) $filters['featured'];
        }

        if (!empty($filters['category'])) {
            $where[]              = 'n.`category` = :category';
            $params[':category']  = $filters['category'];
        }

        if (!empty($filters['author_id'])) {
            $where[]               = 'n.`author_id` = :author_id';
            $params[':author_id']  = (int) $filters['author_id'];
        }

        if (!empty($filters['search'])) {
            $where[]         = '(n.`title` LIKE :s OR n.`summary` LIKE :s)';
            $params[':s']    = '%' . $filters['search'] . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT n.id, n.slug, n.company_id, n.author_id, n.category,
                       n.title, n.summary, n.cover_path, n.status, n.is_featured,
                       n.read_time, n.views, n.published_at, n.created_at, n.updated_at,
                       c.name  AS company_name,  c.short_name AS company_short,
                       c.color AS company_color, c.accent_color AS company_accent,
                       u.name  AS author_name,   u.avatar AS author_avatar
                  FROM `news` n
             LEFT JOIN `companies` c ON c.id = n.company_id
             LEFT JOIN `users`     u ON u.id = n.author_id
               {$whereClause}
               ORDER BY
                 CASE WHEN n.`status` = 'published' THEN n.`published_at`
                      ELSE n.`created_at` END DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    /**
     * Single article with full detail (body included).
     */
    public function findWithDetails(int $id): ?array
    {
        return Database::queryOne(
            "SELECT n.*,
                    c.name  AS company_name,  c.short_name AS company_short,
                    c.color AS company_color, c.accent_color AS company_accent,
                    u.name  AS author_name,   u.avatar AS author_avatar,
                    u.job_title AS author_job
               FROM `news` n
          LEFT JOIN `companies` c ON c.id = n.company_id
          LEFT JOIN `users`     u ON u.id = n.author_id
              WHERE n.`id` = :id",
            [':id' => $id]
        );
    }

    /**
     * Find by slug (for SEO-friendly URLs).
     */
    public function findBySlug(string $slug): ?array
    {
        $row = Database::queryOne(
            "SELECT n.*,
                    c.name AS company_name, c.color AS company_color
               FROM `news` n
          LEFT JOIN `companies` c ON c.id = n.company_id
              WHERE n.`slug` = :slug LIMIT 1",
            [':slug' => $slug]
        );
        return $row ?: null;
    }

    /**
     * Get distinct categories (for filter dropdowns).
     */
    public function getCategories(): array
    {
        return Database::query(
            "SELECT DISTINCT `category`
               FROM `news`
              WHERE `category` IS NOT NULL
                AND `status` = 'published'
              ORDER BY `category`"
        );
    }

    // ── Mutations ─────────────────────────────────────────────────

    public function create(array $data): int
    {
        $data = $this->prepareData($data);
        return $this->insert($data);
    }

    public function updateNews(int $id, array $data): bool
    {
        $data = $this->prepareData($data, $id);
        return $this->update($id, $data) >= 0;
    }

    /**
     * Publish a draft article.
     */
    public function publish(int $id): void
    {
        $this->db->prepare(
            "UPDATE `news`
                SET `status`       = 'published',
                    `published_at` = COALESCE(`published_at`, NOW()),
                    `updated_at`   = NOW()
              WHERE `id` = :id"
        )->execute([':id' => $id]);
    }

    /**
     * Revert a published article to draft.
     */
    public function unpublish(int $id): void
    {
        $this->db->prepare(
            "UPDATE `news`
                SET `status`     = 'draft',
                    `updated_at` = NOW()
              WHERE `id` = :id"
        )->execute([':id' => $id]);
    }

    /**
     * Toggle featured flag. Returns new value.
     */
    public function toggleFeatured(int $id): int
    {
        $this->db->prepare(
            "UPDATE `news`
                SET `is_featured` = 1 - `is_featured`,
                    `updated_at`  = NOW()
              WHERE `id` = :id"
        )->execute([':id' => $id]);

        return (int) Database::queryOne(
            "SELECT `is_featured` FROM `news` WHERE `id` = :id",
            [':id' => $id]
        )['is_featured'];
    }

    /**
     * Increment view counter (fire-and-forget).
     */
    public function incrementViews(int $id): void
    {
        try {
            $this->db->prepare(
                "UPDATE `news` SET `views` = `views` + 1 WHERE `id` = :id"
            )->execute([':id' => $id]);
        } catch (\Throwable) {
            // Never fail the main request
        }
    }

    // ── Private helpers ───────────────────────────────────────────

    private function prepareData(array $data, ?int $excludeId = null): array
    {
        $allowed = [
            'slug', 'company_id', 'author_id', 'category',
            'title', 'summary', 'body', 'cover_path',
            'status', 'is_featured', 'read_time', 'published_at',
        ];

        $clean = array_intersect_key($data, array_flip($allowed));

        // Auto-generate slug from title if needed
        if (empty($clean['slug']) && !empty($clean['title'])) {
            $clean['slug'] = uniqueSlug($clean['title'], 'news', 'slug', $excludeId);
        }

        // Auto-estimate read time from body (~200 words/min)
        if (empty($clean['read_time']) && !empty($clean['body'])) {
            $words              = str_word_count(strip_tags($clean['body']));
            $mins               = max(1, (int) round($words / 200));
            $clean['read_time'] = $mins . ' min';
        }

        // If publishing, set published_at if not already set
        if (isset($clean['status']) && $clean['status'] === 'published') {
            if (!isset($clean['published_at'])) {
                $clean['published_at'] = date('Y-m-d H:i:s');
            }
        }

        return $clean;
    }
}
