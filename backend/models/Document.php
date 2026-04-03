<?php
declare(strict_types=1);

class Document extends BaseModel
{
    protected string $table = 'documents';

    public function listPaginated(int $page, int $perPage, array $filters = [], bool $adminView = false): array
    {
        $where  = ['d.`is_active` = 1'];
        $params = [];

        if (!$adminView) {
            $where[] = 'd.`is_confidential` = 0';
        }

        if (!empty($filters['company_id'])) {
            $where[]              = 'd.`company_id` = :company_id';
            $params[':company_id'] = (int)$filters['company_id'];
        }

        if (!empty($filters['category'])) {
            $where[]             = 'd.`category` = :category';
            $params[':category'] = $filters['category'];
        }

        if (isset($filters['is_confidential']) && $filters['is_confidential'] !== '' && $adminView) {
            $where[]                   = 'd.`is_confidential` = :conf';
            $params[':conf']           = (int)(bool)$filters['is_confidential'];
        }

        if (!empty($filters['file_type'])) {
            $where[]              = 'd.`file_type` = :file_type';
            $params[':file_type'] = $filters['file_type'];
        }

        if (!empty($filters['search'])) {
            $where[]      = '(d.`title` LIKE :s OR d.`description` LIKE :s)';
            $params[':s'] = '%' . $filters['search'] . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT d.*, c.name AS company_name, c.short_name AS company_short,
                       u.name AS uploaded_by_name
                  FROM `documents` d
             LEFT JOIN `companies` c ON c.id = d.company_id
             LEFT JOIN `users`     u ON u.id = d.uploaded_by
               {$whereClause}
               ORDER BY d.`created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    public function findWithDetails(int $id): ?array
    {
        return Database::queryOne(
            "SELECT d.*, c.name AS company_name,
                    u.name AS uploaded_by_name
               FROM `documents` d
          LEFT JOIN `companies` c ON c.id = d.company_id
          LEFT JOIN `users`     u ON u.id = d.uploaded_by
              WHERE d.`id` = :id",
            [':id' => $id]
        );
    }

    public function getCategories(): array
    {
        return Database::query(
            "SELECT DISTINCT `category` FROM `documents`
              WHERE `category` IS NOT NULL AND `is_active` = 1
              ORDER BY `category`"
        );
    }

    public function create(array $data): int
    {
        $allowed = [
            'company_id','uploaded_by','title','description','category',
            'file_path','original_name','file_type','file_size',
            'file_size_human','is_confidential','is_active',
        ];
        return $this->insert(array_intersect_key($data, array_flip($allowed)));
    }

    public function updateDoc(int $id, array $data): bool
    {
        $allowed = ['title','description','category','is_confidential','is_active'];
        return $this->update($id, array_intersect_key($data, array_flip($allowed))) >= 0;
    }

    public function incrementDownload(int $id): void
    {
        try {
            $this->db->prepare(
                "UPDATE `documents` SET `download_count` = `download_count` + 1 WHERE `id` = :id"
            )->execute([':id' => $id]);
        } catch (\Throwable) {}
    }
}
