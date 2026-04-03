<?php
declare(strict_types=1);

// ================================================================
//  BaseModel — Generic PDO CRUD foundation
//  All models extend this class.
//  Implemented in full during Phase 5.
// ================================================================

abstract class BaseModel
{
    protected PDO    $db;
    protected string $table      = '';
    protected string $pk         = 'id';
    protected bool   $timestamps = true;  // set to false in models without updated_at

    public function __construct()
    {
        $this->db = Database::getInstance();
    }

    /** Find a single record by primary key */
    public function find(int $id): ?array
    {
        $sql  = "SELECT * FROM `{$this->table}` WHERE `{$this->pk}` = :id LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Find a single record by any column */
    public function findBy(string $column, mixed $value): ?array
    {
        $sql  = "SELECT * FROM `{$this->table}` WHERE `{$column}` = :v LIMIT 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':v' => $value]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    /** Return all records (use sparingly) */
    public function all(string $orderBy = 'created_at', string $dir = 'DESC'): array
    {
        $dir  = strtoupper($dir) === 'ASC' ? 'ASC' : 'DESC';
        $stmt = $this->db->prepare("SELECT * FROM `{$this->table}` ORDER BY `{$orderBy}` {$dir}");
        $stmt->execute();
        return $stmt->fetchAll();
    }

    /** Count all records */
    public function count(array $where = []): int
    {
        [$conditions, $params] = $this->buildWhere($where);
        $sql  = "SELECT COUNT(*) FROM `{$this->table}`" . ($conditions ? " WHERE {$conditions}" : '');
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return (int) $stmt->fetchColumn();
    }

    /** Insert a new record. Returns the new ID. */
    public function insert(array $data): int
    {
        $data = $this->timestamps($data, true);
        $cols = implode(', ', array_map(fn($c) => "`{$c}`", array_keys($data)));
        $phs  = implode(', ', array_map(fn($c) => ":{$c}", array_keys($data)));
        $sql  = "INSERT INTO `{$this->table}` ({$cols}) VALUES ({$phs})";
        $stmt = $this->db->prepare($sql);
        $stmt->execute($data);
        return (int) $this->db->lastInsertId();
    }

    /** Update a record by primary key. Returns affected rows. */
    public function update(int $id, array $data): int
    {
        $data = $this->timestamps($data, false);
        $sets = implode(', ', array_map(fn($c) => "`{$c}` = :{$c}", array_keys($data)));
        $sql  = "UPDATE `{$this->table}` SET {$sets} WHERE `{$this->pk}` = :__pk";
        $params = array_merge($data, [':__pk' => $id]);

        // Fix: named params can't start with :
        $fixed = [];
        foreach ($params as $k => $v) {
            $fixed[ltrim($k, ':')] = $v;
        }
        $fixed['__pk'] = $id;

        $stmt = $this->db->prepare(
            "UPDATE `{$this->table}` SET {$sets} WHERE `{$this->pk}` = :__pk"
        );

        $bindable = [];
        foreach ($data as $k => $v) {
            $bindable[":{$k}"] = $v;
        }
        $bindable[':__pk'] = $id;

        $stmt->execute($bindable);
        return $stmt->rowCount();
    }

    /** Delete a record by primary key. Returns affected rows. */
    public function delete(int $id): int
    {
        $stmt = $this->db->prepare(
            "DELETE FROM `{$this->table}` WHERE `{$this->pk}` = :id"
        );
        $stmt->execute([':id' => $id]);
        return $stmt->rowCount();
    }

    /** Check if a record exists */
    public function exists(int $id): bool
    {
        return $this->find($id) !== null;
    }

    /** Check uniqueness of a value in a column (for validation) */
    public function isUnique(string $column, mixed $value, ?int $excludeId = null): bool
    {
        $sql    = "SELECT id FROM `{$this->table}` WHERE `{$column}` = :v";
        $params = [':v' => $value];
        if ($excludeId !== null) {
            $sql   .= ' AND id != :xid';
            $params[':xid'] = $excludeId;
        }
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch() === false;
    }

    // ── Helpers ───────────────────────────────────────────────────

    private function timestamps(array $data, bool $withCreated): array
    {
        if ($this->timestamps) {
            $data['updated_at'] = date('Y-m-d H:i:s');
        }
        if ($withCreated && !isset($data['created_at'])) {
            $data['created_at'] = date('Y-m-d H:i:s');
        }
        return $data;
    }

    private function buildWhere(array $where): array
    {
        if (empty($where)) return ['', []];
        $parts  = [];
        $params = [];
        foreach ($where as $col => $val) {
            $key          = ':w_' . $col;
            $parts[]      = "`{$col}` = {$key}";
            $params[$key] = $val;
        }
        return [implode(' AND ', $parts), $params];
    }

    /** Paginated query helper */
    protected function paginate(string $sql, array $params, int $page, int $perPage): array
    {
        $offset    = ($page - 1) * $perPage;
        $totalSql  = preg_replace('/SELECT.*?FROM/si', 'SELECT COUNT(*) FROM', $sql, 1);
        $totalSql  = preg_replace('/ORDER BY.*/si', '', $totalSql);

        $countStmt = $this->db->prepare($totalSql);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $pageSql  = $sql . " LIMIT :limit OFFSET :offset";
        $stmt     = $this->db->prepare($pageSql);
        foreach ($params as $k => $v) {
            $stmt->bindValue($k, $v);
        }
        $stmt->bindValue(':limit',  $perPage, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset,  PDO::PARAM_INT);
        $stmt->execute();

        return [
            'items' => $stmt->fetchAll(),
            'total' => $total,
        ];
    }
}
