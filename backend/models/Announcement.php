<?php
declare(strict_types=1);

// ================================================================
//  Announcement Model
// ================================================================

class Announcement extends BaseModel
{
    protected string $table = 'announcements';

    // ── Queries ───────────────────────────────────────────────────

    /**
     * Paginated listing.
     *
     * For non-admins:
     *   - Only active announcements
     *   - Not expired (expires_at IS NULL OR expires_at > NOW())
     *   - Global visibility OR matching the user's company_id
     *
     * For admins:
     *   - Everything, filterable
     */
    public function listPaginated(
        int   $page,
        int   $perPage,
        array $filters   = [],
        bool  $adminView = false,
        ?int  $userCompanyId = null
    ): array {
        $where  = [];
        $params = [];

        if (!$adminView) {
            // Public view: only active, not expired
            $where[] = 'a.`is_active` = 1';
            $where[] = '(a.`expires_at` IS NULL OR a.`expires_at` > NOW())';

            // Visibility: global OR this company
            if ($userCompanyId) {
                $where[]                   = '(a.`visibility` = \'global\' OR a.`company_id` = :uc)';
                $params[':uc']             = $userCompanyId;
            } else {
                $where[] = 'a.`visibility` = \'global\'';
            }
        } else {
            // Admin filters
            if (isset($filters['is_active']) && $filters['is_active'] !== '') {
                $where[]              = 'a.`is_active` = :is_active';
                $params[':is_active'] = (int)(bool)$filters['is_active'];
            }

            if (!empty($filters['company_id'])) {
                $where[]               = 'a.`company_id` = :company_id';
                $params[':company_id'] = (int)$filters['company_id'];
            }

            if (!empty($filters['visibility'])) {
                $where[]                = 'a.`visibility` = :visibility';
                $params[':visibility']  = $filters['visibility'];
            }
        }

        // Shared filters (admin + public)
        if (!empty($filters['priority'])) {
            $where[]             = 'a.`priority` = :priority';
            $params[':priority'] = $filters['priority'];
        }

        if (!empty($filters['search'])) {
            $where[]       = 'a.`title` LIKE :s';
            $params[':s']  = '%' . $filters['search'] . '%';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT a.id, a.company_id, a.author_id, a.title,
                       a.body, a.priority, a.visibility,
                       a.is_pinned, a.is_active, a.expires_at,
                       a.created_at, a.updated_at,
                       c.name  AS company_name,
                       u.name  AS author_name,
                       u.avatar AS author_avatar
                  FROM `announcements` a
             LEFT JOIN `companies` c ON c.id = a.company_id
             LEFT JOIN `users`     u ON u.id = a.author_id
               {$whereClause}
               ORDER BY a.`is_pinned` DESC,
                        FIELD(a.`priority`, 'high', 'medium', 'low'),
                        a.`created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    /**
     * Single announcement with full detail.
     */
    public function findWithDetails(int $id): ?array
    {
        return Database::queryOne(
            "SELECT a.*,
                    c.name   AS company_name,
                    u.name   AS author_name,
                    u.avatar AS author_avatar,
                    u.job_title AS author_job
               FROM `announcements` a
          LEFT JOIN `companies` c ON c.id = a.company_id
          LEFT JOIN `users`     u ON u.id = a.author_id
              WHERE a.`id` = :id",
            [':id' => $id]
        );
    }

    /**
     * Dashboard widget: pinned + recent active announcements.
     */
    public function getActiveForDashboard(int $limit = 5, ?int $companyId = null): array
    {
        $companyFilter = $companyId
            ? "AND (a.`visibility` = 'global' OR a.`company_id` = {$companyId})"
            : "AND a.`visibility` = 'global'";

        return Database::query(
            "SELECT a.id, a.title, a.priority, a.is_pinned, a.created_at,
                    c.name AS company_name
               FROM `announcements` a
          LEFT JOIN `companies` c ON c.id = a.company_id
              WHERE a.`is_active` = 1
                AND (a.`expires_at` IS NULL OR a.`expires_at` > NOW())
                {$companyFilter}
              ORDER BY a.`is_pinned` DESC,
                       FIELD(a.`priority`, 'high', 'medium', 'low'),
                       a.`created_at` DESC
              LIMIT :lim",
            [':lim' => $limit]
        );
    }

    /**
     * Count unread/active announcements for notification badge.
     */
    public function countActive(?int $companyId = null): int
    {
        $companyFilter = $companyId
            ? "AND (visibility = 'global' OR company_id = {$companyId})"
            : "AND visibility = 'global'";

        return (int) Database::queryOne(
            "SELECT COUNT(*) AS c
               FROM `announcements`
              WHERE `is_active` = 1
                AND (`expires_at` IS NULL OR `expires_at` > NOW())
                {$companyFilter}"
        )['c'];
    }

    // ── Mutations ─────────────────────────────────────────────────

    public function create(array $data): int
    {
        $clean = $this->prepareData($data);
        return $this->insert($clean);
    }

    public function updateAnnouncement(int $id, array $data): bool
    {
        $clean = $this->prepareData($data);
        return $this->update($id, $clean) >= 0;
    }

    /**
     * Toggle pinned flag. Returns new value.
     */
    public function togglePinned(int $id): int
    {
        $this->db->prepare(
            "UPDATE `announcements`
                SET `is_pinned`  = 1 - `is_pinned`,
                    `updated_at` = NOW()
              WHERE `id` = :id"
        )->execute([':id' => $id]);

        return (int) Database::queryOne(
            "SELECT `is_pinned` FROM `announcements` WHERE `id` = :id",
            [':id' => $id]
        )['is_pinned'];
    }

    // ── Private helpers ───────────────────────────────────────────

    private function prepareData(array $data): array
    {
        $allowed = [
            'company_id', 'author_id', 'title', 'body',
            'priority', 'visibility', 'is_pinned', 'is_active', 'expires_at',
        ];

        $clean = array_intersect_key($data, array_flip($allowed));

        // Normalise booleans
        if (isset($clean['is_pinned']))  $clean['is_pinned']  = (int)(bool)$clean['is_pinned'];
        if (isset($clean['is_active']))  $clean['is_active']  = (int)(bool)$clean['is_active'];

        // Empty string expires_at → NULL
        if (isset($clean['expires_at']) && trim((string)$clean['expires_at']) === '') {
            $clean['expires_at'] = null;
        }

        // company_id: NULL for global
        if (isset($clean['company_id']) && empty($clean['company_id'])) {
            $clean['company_id'] = null;
        }

        return $clean;
    }
}
