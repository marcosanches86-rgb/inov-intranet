<?php
declare(strict_types=1);

// ================================================================
//  DashboardController
//
//  Routes:
//    GET /api/dashboard         → index()       [auth]
//    GET /api/dashboard/stats   → stats()       [admin]
//    GET /api/dashboard/feed    → feed()        [auth]
// ================================================================

class DashboardController
{
    // ── GET /api/dashboard ────────────────────────────────────────
    // General dashboard data — visible to all authenticated users.
    // Returns: active announcements, recent news, recent documents,
    //          gallery highlights and basic counts.
    public function index(Request $request): void
    {
        $isAdmin   = Auth::isAdmin();
        $userId    = Auth::id();
        $companyId = Auth::user()['company_id'] ?? null;

        // ── Announcements (active, not expired, visible) ──────────
        $announcementSql = "
            SELECT a.*,
                   c.name  AS company_name,
                   c.color AS company_color
              FROM `announcements` a
         LEFT JOIN `companies` c ON c.id = a.company_id
             WHERE a.`is_active` = 1
               AND (a.`expires_at` IS NULL OR a.`expires_at` > NOW())
               AND (
                     a.`visibility` = 'global'
                     OR (a.`visibility` = 'company' AND a.`company_id` = :cid)
                   )
          ORDER BY a.`is_pinned` DESC,
                   FIELD(a.`priority`, 'high', 'medium', 'low'),
                   a.`created_at` DESC
             LIMIT 10";

        $announcements = Database::query($announcementSql, [':cid' => $companyId]);

        // ── Recent news (published, latest 6) ─────────────────────
        $newsSql = "
            SELECT n.id, n.title, n.slug, n.summary, n.cover_path,
                   n.published_at, n.read_time, n.views, n.is_featured,
                   c.name  AS company_name,
                   c.color AS company_color
              FROM `news` n
         LEFT JOIN `companies` c ON c.id = n.company_id
             WHERE n.`status` = 'published'
          ORDER BY n.`is_featured` DESC, n.`published_at` DESC
             LIMIT 6";

        $recentNews = Database::query($newsSql);

        // ── Recent documents (public only for non-admins, latest 5) ─
        $docConfidential = $isAdmin ? '' : "AND d.`is_confidential` = 0";
        $docSql = "
            SELECT d.id, d.title, d.category, d.file_type,
                   d.file_size_human, d.created_at,
                   c.name AS company_name
              FROM `documents` d
         LEFT JOIN `companies` c ON c.id = d.company_id
             WHERE d.`is_active` = 1
                   {$docConfidential}
          ORDER BY d.`created_at` DESC
             LIMIT 5";

        $recentDocs = Database::query($docSql);

        // ── Gallery highlights (active albums, latest 4) ───────────
        $gallerySql = "
            SELECT g.id, g.title, g.slug, g.cover_path, g.cover_color,
                   g.item_count, g.category,
                   c.name AS company_name
              FROM `gallery_albums` g
         LEFT JOIN `companies` c ON c.id = g.company_id
             WHERE g.`is_active` = 1
          ORDER BY g.`sort_order`, g.`created_at` DESC
             LIMIT 4";

        $galleryHighlights = Database::query($gallerySql);

        // ── Quick counts ──────────────────────────────────────────
        $counts = [
            'announcements_active' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `announcements`
                  WHERE `is_active` = 1
                    AND (`expires_at` IS NULL OR `expires_at` > NOW())"
            )['n'] ?? 0),
            'news_published' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `news` WHERE `status` = 'published'"
            )['n'] ?? 0),
            'documents_total' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `documents` WHERE `is_active` = 1"
                . ($isAdmin ? '' : " AND `is_confidential` = 0")
            )['n'] ?? 0),
            'gallery_albums' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `gallery_albums` WHERE `is_active` = 1"
            )['n'] ?? 0),
        ];

        Response::success([
            'announcements'     => $announcements,
            'recent_news'       => $recentNews,
            'recent_documents'  => $recentDocs,
            'gallery_highlights'=> $galleryHighlights,
            'counts'            => $counts,
        ], 'Dashboard carregado com sucesso.');
    }

    // ── GET /api/dashboard/stats ──────────────────────────────────
    // Admin-only stats panel: totals, trends, top content, user breakdown.
    public function stats(Request $request): void
    {
        // ── Entity totals ─────────────────────────────────────────
        $totals = [
            'users'         => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `users`")['n'] ?? 0),
            'users_active'  => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `users` WHERE `status` = 'active'")['n'] ?? 0),
            'companies'     => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `companies`")['n'] ?? 0),
            'news_total'    => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `news`")['n'] ?? 0),
            'news_published'=> (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `news` WHERE `status` = 'published'")['n'] ?? 0),
            'news_draft'    => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `news` WHERE `status` = 'draft'")['n'] ?? 0),
            'announcements' => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `announcements`")['n'] ?? 0),
            'documents'     => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `documents` WHERE `is_active` = 1")['n'] ?? 0),
            'documents_confidential' => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `documents` WHERE `is_active` = 1 AND `is_confidential` = 1")['n'] ?? 0),
            'brand_assets'  => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `brand_assets` WHERE `is_active` = 1")['n'] ?? 0),
            'gallery_albums'=> (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `gallery_albums` WHERE `is_active` = 1")['n'] ?? 0),
            'gallery_items' => (int)(Database::queryOne("SELECT COUNT(*) AS n FROM `gallery_items`")['n'] ?? 0),
        ];

        // ── Content created in the last 30 days ───────────────────
        $trends = [
            'new_users_30d' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `users` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )['n'] ?? 0),
            'new_news_30d' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `news` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )['n'] ?? 0),
            'new_documents_30d' => (int)(Database::queryOne(
                "SELECT COUNT(*) AS n FROM `documents` WHERE `created_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )['n'] ?? 0),
            'downloads_30d' => (int)(Database::queryOne(
                "SELECT SUM(`download_count`) AS n FROM `documents`
                  WHERE `updated_at` >= DATE_SUB(NOW(), INTERVAL 30 DAY)"
            )['n'] ?? 0),
        ];

        // ── Top 5 most-viewed news ────────────────────────────────
        $topNews = Database::query(
            "SELECT n.id, n.title, n.slug, n.views, n.published_at,
                    c.name AS company_name
               FROM `news` n
          LEFT JOIN `companies` c ON c.id = n.company_id
              WHERE n.`status` = 'published'
           ORDER BY n.`views` DESC
              LIMIT 5"
        );

        // ── Top 5 most-downloaded documents ───────────────────────
        $topDocs = Database::query(
            "SELECT d.id, d.title, d.file_type, d.download_count,
                    c.name AS company_name
               FROM `documents` d
          LEFT JOIN `companies` c ON c.id = d.company_id
              WHERE d.`is_active` = 1
           ORDER BY d.`download_count` DESC
              LIMIT 5"
        );

        // ── Users by role ─────────────────────────────────────────
        $usersByRole = Database::query(
            "SELECT `role`, COUNT(*) AS total
               FROM `users`
              WHERE `status` = 'active'
           GROUP BY `role`
           ORDER BY FIELD(`role`, 'super_admin', 'admin', 'editor', 'colaborador')"
        );

        // ── Users by company ──────────────────────────────────────
        $usersByCompany = Database::query(
            "SELECT c.name AS company_name, c.color AS company_color,
                    COUNT(u.id) AS total
               FROM `companies` c
          LEFT JOIN `users` u ON u.company_id = c.id AND u.status = 'active'
           GROUP BY c.id
           ORDER BY total DESC
              LIMIT 10"
        );

        // ── News by company ───────────────────────────────────────
        $newsByCompany = Database::query(
            "SELECT c.name AS company_name, c.color AS company_color,
                    COUNT(n.id) AS total
               FROM `companies` c
          LEFT JOIN `news` n ON n.company_id = c.id AND n.status = 'published'
           GROUP BY c.id
           ORDER BY total DESC"
        );

        // ── Recent activity (last 20 actions) ────────────────────
        $recentActivity = Database::query(
            "SELECT al.id, al.action, al.entity_type, al.entity_name,
                    al.created_at,
                    u.name AS user_name, u.avatar AS user_avatar
               FROM `activity_logs` al
          LEFT JOIN `users` u ON u.id = al.user_id
           ORDER BY al.`created_at` DESC
              LIMIT 20"
        );

        Response::success([
            'totals'          => $totals,
            'trends'          => $trends,
            'top_news'        => $topNews,
            'top_documents'   => $topDocs,
            'users_by_role'   => $usersByRole,
            'users_by_company'=> $usersByCompany,
            'news_by_company' => $newsByCompany,
            'recent_activity' => $recentActivity,
        ], 'Estatísticas carregadas com sucesso.');
    }

    // ── GET /api/dashboard/feed ───────────────────────────────────
    // Activity feed — paged, visible to all authenticated users.
    // Admins see all actions; others see only non-sensitive ones.
    public function feed(Request $request): void
    {
        $isAdmin = Auth::isAdmin();
        $page    = $request->page();
        $perPage = min($request->perPage(), 50); // cap at 50

        // Non-admins exclude destructive or sensitive actions
        $excludeClause = '';
        if (!$isAdmin) {
            $excludeClause = "AND al.`action` NOT IN (
                'delete_user','update_role','delete_document','delete_brand_asset',
                'delete_gallery_album','delete_news'
            )";
        }

        $countSql = "SELECT COUNT(*) AS n FROM `activity_logs` al {$excludeClause}";
        // Note: $excludeClause may reference al.action — needs FROM alias
        $countSql = "SELECT COUNT(*) AS n FROM `activity_logs` al WHERE 1=1 {$excludeClause}";
        $total    = (int)(Database::queryOne($countSql)['n'] ?? 0);

        $offset = ($page - 1) * $perPage;

        $feedSql = "
            SELECT al.id, al.action, al.entity_type, al.entity_name,
                   al.created_at,
                   u.name   AS user_name,
                   u.avatar AS user_avatar,
                   u.role   AS user_role
              FROM `activity_logs` al
         LEFT JOIN `users` u ON u.id = al.user_id
             WHERE 1=1 {$excludeClause}
          ORDER BY al.`created_at` DESC
             LIMIT :limit OFFSET :offset";

        // Use raw PDO here because paginate() doesn't support dynamic LIMIT/OFFSET binding with literals
        $db   = Database::getInstance();
        $stmt = $db->prepare($feedSql);
        $stmt->bindValue(':limit',  $perPage, \PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  \PDO::PARAM_INT);
        $stmt->execute();
        $items = $stmt->fetchAll(\PDO::FETCH_ASSOC);

        Response::paginated($items, $total, $page, $perPage, 'Feed de actividade carregado com sucesso.');
    }
}
