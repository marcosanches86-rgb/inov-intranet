<?php
declare(strict_types=1);

class GalleryItem extends BaseModel
{
    protected string $table      = 'gallery_items';
    protected bool   $timestamps = false;  // gallery_items has no updated_at column

    public function listByAlbum(int $albumId): array
    {
        return Database::query(
            "SELECT * FROM `gallery_items`
              WHERE `album_id` = :id
              ORDER BY `sort_order`, `created_at`",
            [':id' => $albumId]
        );
    }

    public function create(array $data): int
    {
        $allowed = ['album_id','uploaded_by','title','description',
                    'file_path','original_name','file_size','width','height','sort_order'];
        return $this->insert(array_intersect_key($data, array_flip($allowed)));
    }

    public function getNextSortOrder(int $albumId): int
    {
        $row = Database::queryOne(
            "SELECT MAX(`sort_order`) AS m FROM `gallery_items` WHERE `album_id` = :id",
            [':id' => $albumId]
        );
        return ((int)($row['m'] ?? 0)) + 1;
    }

    public function reorder(array $orderedIds): void
    {
        $stmt = $this->db->prepare(
            "UPDATE `gallery_items` SET `sort_order` = :pos WHERE `id` = :id"
        );
        foreach ($orderedIds as $position => $itemId) {
            $stmt->execute([':pos' => $position + 1, ':id' => (int)$itemId]);
        }
    }
}
