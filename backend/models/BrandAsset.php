<?php
declare(strict_types=1);

class BrandAsset extends BaseModel
{
    protected string $table = 'brand_assets';

    public function listPaginated(int $page, int $perPage, array $filters = []): array
    {
        $where  = ['b.`is_active` = 1'];
        $params = [];

        if (!empty($filters['company_id'])) {
            $where[]              = 'b.`company_id` = :company_id';
            $params[':company_id'] = (int)$filters['company_id'];
        }

        if (!empty($filters['asset_type'])) {
            $where[]               = 'b.`asset_type` = :asset_type';
            $params[':asset_type'] = $filters['asset_type'];
        }

        if (!empty($filters['search'])) {
            $where[]      = 'b.`name` LIKE :s';
            $params[':s'] = '%' . $filters['search'] . '%';
        }

        $whereClause = 'WHERE ' . implode(' AND ', $where);

        $sql = "SELECT b.*, c.name AS company_name, c.short_name AS company_short,
                       c.color AS company_color, c.accent_color AS company_accent
                  FROM `brand_assets` b
             LEFT JOIN `companies` c ON c.id = b.company_id
               {$whereClause}
               ORDER BY b.`company_id`, b.`sort_order`, b.`created_at` DESC";

        return $this->paginate($sql, $params, $page, $perPage);
    }

    public function listGroupedByCompany(): array
    {
        $rows = Database::query(
            "SELECT b.*, c.name AS company_name, c.short_name AS company_short,
                    c.color AS company_color, c.accent_color AS company_accent
               FROM `brand_assets` b
          LEFT JOIN `companies` c ON c.id = b.company_id
              WHERE b.`is_active` = 1
              ORDER BY c.`sort_order`, b.`sort_order`, b.`created_at`"
        );

        $grouped = [];
        foreach ($rows as $row) {
            $key = $row['company_id'];
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'company_id'     => $row['company_id'],
                    'company_name'   => $row['company_name'],
                    'company_short'  => $row['company_short'],
                    'company_color'  => $row['company_color'],
                    'company_accent' => $row['company_accent'],
                    'assets'         => [],
                ];
            }
            $grouped[$key]['assets'][] = $row;
        }

        return array_values($grouped);
    }

    public function create(array $data): int
    {
        $allowed = [
            'company_id','uploaded_by','name','asset_type','format',
            'version','file_path','original_name','file_size',
            'color','color_bg','initials','is_active','sort_order',
        ];
        return $this->insert(array_intersect_key($data, array_flip($allowed)));
    }

    public function updateAsset(int $id, array $data): bool
    {
        $allowed = ['name','asset_type','format','version','color','color_bg','initials','is_active','sort_order'];
        return $this->update($id, array_intersect_key($data, array_flip($allowed))) >= 0;
    }
}
