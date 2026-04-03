<?php
declare(strict_types=1);

// ================================================================
//  ActivityLog Model
//
//  Records all critical platform events for audit purposes.
//  Always writes even if the user is not authenticated (e.g. login failures).
//
//  Actions (not exhaustive):
//    login_success, login_failed, logout
//    register, password_changed, password_reset
//    create_news, update_news, delete_news, publish_news
//    create_announcement, update_announcement, delete_announcement
//    create_document, delete_document, download_document
//    create_brand_asset, delete_brand_asset
//    create_gallery, delete_gallery, upload_gallery_item
//    create_user, update_user, delete_user, change_user_role, change_user_status
//    create_company, update_company
//    system_setup
// ================================================================

class ActivityLog extends BaseModel
{
    protected string $table = 'activity_logs';
    protected string $pk    = 'id';

    /**
     * Write an activity log entry.
     * Fire-and-forget — errors are silently swallowed so they never
     * break the main request flow.
     */
    public function log(
        ?int    $userId,
        string  $action,
        ?string $entityType = null,
        ?int    $entityId   = null,
        ?string $entityName = null,
        array   $details    = [],
        string  $ip         = '',
        string  $userAgent  = ''
    ): void {
        try {
            $stmt = $this->db->prepare(
                "INSERT INTO `activity_logs`
                   (`user_id`, `user_name`, `action`, `entity_type`, `entity_id`,
                    `entity_name`, `details`, `ip_address`, `user_agent`, `created_at`)
                 VALUES
                   (:user_id, :user_name, :action, :entity_type, :entity_id,
                    :entity_name, :details, :ip, :ua, NOW())"
            );

            $stmt->execute([
                ':user_id'     => $userId,
                ':user_name'   => Auth::name() ?? 'Sistema',
                ':action'      => $action,
                ':entity_type' => $entityType,
                ':entity_id'   => $entityId,
                ':entity_name' => $entityName,
                ':details'     => empty($details) ? null : json_encode($details, JSON_UNESCAPED_UNICODE),
                ':ip'          => $ip ?: '0.0.0.0',
                ':ua'          => mb_substr($userAgent, 0, 600),
            ]);
        } catch (\Throwable $e) {
            // Never break the main flow — just log to PHP error log
            error_log('[ActivityLog] Write failed: ' . $e->getMessage());
        }
    }

    /**
     * Convenience static wrapper — no need to instantiate in controllers.
     */
    public static function write(
        string  $action,
        ?string $entityType = null,
        ?int    $entityId   = null,
        ?string $entityName = null,
        array   $details    = []
    ): void {
        (new static())->log(
            Auth::id(),
            $action,
            $entityType,
            $entityId,
            $entityName,
            $details,
            $_SERVER['REMOTE_ADDR']    ?? '',
            $_SERVER['HTTP_USER_AGENT'] ?? ''
        );
    }

    /**
     * Paginated log listing for admin dashboard.
     */
    public function getPaginated(
        int    $page    = 1,
        int    $perPage = 50,
        array  $filters = []
    ): array {
        $where  = [];
        $params = [];

        if (!empty($filters['action'])) {
            $where[]          = '`action` LIKE :action';
            $params[':action'] = '%' . $filters['action'] . '%';
        }

        if (!empty($filters['user_id'])) {
            $where[]            = '`user_id` = :user_id';
            $params[':user_id'] = (int) $filters['user_id'];
        }

        if (!empty($filters['entity_type'])) {
            $where[]               = '`entity_type` = :entity_type';
            $params[':entity_type'] = $filters['entity_type'];
        }

        if (!empty($filters['date_from'])) {
            $where[]              = '`created_at` >= :date_from';
            $params[':date_from'] = $filters['date_from'] . ' 00:00:00';
        }

        if (!empty($filters['date_to'])) {
            $where[]            = '`created_at` <= :date_to';
            $params[':date_to'] = $filters['date_to'] . ' 23:59:59';
        }

        $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

        $sql = "SELECT * FROM `activity_logs` {$whereClause} ORDER BY `created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    /**
     * Most recent N entries — used for dashboard feed.
     */
    public function getRecent(int $limit = 10): array
    {
        return Database::query(
            "SELECT al.*, u.avatar
               FROM `activity_logs` al
          LEFT JOIN `users` u ON u.id = al.user_id
              ORDER BY al.`created_at` DESC
              LIMIT :lim",
            [':lim' => $limit]
        );
    }
}
