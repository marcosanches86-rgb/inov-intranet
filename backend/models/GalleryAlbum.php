<?php
declare(strict_types=1);

class GalleryAlbum extends BaseModel
{
    protected string $table = 'gallery_albums';

    public function listPaginated(int $page, int $perPage, array $filters = []): array
    {
        $where  = ['g.`is_active` = 1'];
        $params = [];

        if (!empty($filters['company_id'])) {
            $where[]               = 'g.`company_id` = :company_id';
            $params[':company_id'] = (int)$filters['company_id'];
        }

        if (!empty($filters['category'])) {
            $where[]             = 'g.`category` = :category';
            $params[':category'] = $filters['category'];
        }

        if (!empty($filters['search'])) {
            $where[]      = 'g.`title` LIKE :s';
            $params[':s'] = '%' . $filters['search'] . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT g.*, c.name AS company_name, c.short_name AS company_short,
                       c.color AS company_color, c.accent_color AS company_accent
                  FROM `gallery_albums` g
             LEFT JOIN `companies` c ON c.id = g.company_id
               {$whereClause}
               ORDER BY g.`sort_order`, g.`created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    public function findWithItems(int $id): ?array
    {
        $album = Database::queryOne(
            "SELECT g.*, c.name AS company_name, c.color AS company_color
               FROM `gallery_albums` g
          LEFT JOIN `companies` c ON c.id = g.company_id
              WHERE g.`id` = :id",
            [':id' => $id]
        );

        if (!$album) return null;

        $album['items'] = Database::query(
            "SELECT * FROM `gallery_items`
              WHERE `album_id` = :id
              ORDER BY `sort_order`, `created_at`",
            [':id' => $id]
        );

        return $album;
    }

    public function create(array $data): int
    {
        $allowed = ['company_id','created_by','title','slug','description','category',
                    'cover_path','cover_color','is_active','sort_order'];
        $clean   = array_intersect_key($data, array_flip($allowed));

        if (empty($clean['slug']) && !empty($clean['title'])) {
            $clean['slug'] = uniqueSlug($clean['title'], 'gallery_albums', 'slug');
        }
        if (empty($clean['cover_color'])) $clean['cover_color'] = '#111827';

        return $this->insert($clean);
    }

    public function updateAlbum(int $id, array $data): bool
    {
        $allowed = ['title','slug','description','category','cover_path','cover_color','is_active','sort_order'];
        $clean   = array_intersect_key($data, array_flip($allowed));

        if (!empty($clean['title']) && empty($clean['slug'])) {
            $clean['slug'] = uniqueSlug($clean['title'], 'gallery_albums', 'slug', $id);
        }

        return $this->update($id, $clean) >= 0;
    }

    public function updateItemCount(int $albumId): void
    {
        $this->db->prepare(
            "UPDATE `gallery_albums`
                SET `item_count` = (SELECT COUNT(*) FROM `gallery_items` WHERE `album_id` = :album_id)
              WHERE `id` = :album_id2"
        )->execute([':album_id' => $albumId, ':album_id2' => $albumId]);
    }

    public function getAllItemPaths(int $albumId): array
    {
        return Database::query(
            "SELECT `file_path` FROM `gallery_items` WHERE `album_id` = :id",
            [':id' => $albumId]
        );
    }
}
