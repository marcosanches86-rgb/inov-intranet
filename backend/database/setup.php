<?php
declare(strict_types=1);

// ================================================================
//  INOV INTRANET — First-Time Setup Script
//
//  Run once after importing schema.sql and seed.sql:
//    php database/setup.php
//
//  This script:
//    1. Connects to the database using config values
//    2. Creates all platform users with bcrypt-hashed passwords
//    3. Creates sample activity log entries
//    4. Reports what was created
//
//  Safe to re-run: uses INSERT IGNORE to skip existing records.
// ================================================================

// Load config (run from project root)
$configDir = dirname(__DIR__) . '/config';
require_once $configDir . '/app.php';
require_once $configDir . '/database.php';

// ── DB Connection ──────────────────────────────────────────────
try {
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=utf8mb4',
        DB_HOST, DB_PORT, DB_NAME
    );
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    echo "\n✅ Ligação à base de dados estabelecida.\n";
} catch (PDOException $e) {
    die("\n❌ Erro de ligação: " . $e->getMessage() . "\n\n");
}

// ── Users to create ────────────────────────────────────────────
//
//  Credentials summary (CHANGE PASSWORDS IN PRODUCTION):
//
//  super_admin:
//    marco.sanches@factoryideas.ao  /  Inov@2026!
//
//  admin:
//    arnaldo.miapia@inov.ao         /  Inov@2026!
//    helder.maiato@hexa.ao          /  Inov@2026!
//    nilson.filipe@factoryideas.ao  /  Inov@2026!
//    joel.pascoal@andala.ao         /  Inov@2026!
//    hansa.sardinha@adventure.ao    /  Inov@2026!
//
//  editor:
//    editor@inov.ao                 /  Editor@2026!
//
//  colaborador:
//    colaborador@inov.ao            /  Colab@2026!
// ─────────────────────────────────────────────────────────────────
$users = [
    [
        'id'          => 1,
        'name'        => 'Marco Sanches',
        'email'       => 'marco.sanches@factoryideas.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'super_admin',
        'status'      => 'active',
        'company_id'  => 2,   // Factory Ideas
        'department'  => 'Direcção',
        'job_title'   => 'Director Executivo',
        'avatar'      => 'MS',
        'joined_date' => '2024-01-15',
    ],
    [
        'id'          => 2,
        'name'        => 'Arnaldo Miapia',
        'email'       => 'arnaldo.miapia@inov.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'admin',
        'status'      => 'active',
        'company_id'  => 1,   // INOV Holding
        'department'  => 'Presidência',
        'job_title'   => 'Presidente do Conselho de Administração',
        'avatar'      => 'AM',
        'joined_date' => '2024-01-15',
    ],
    [
        'id'          => 3,
        'name'        => 'Helder Maiato',
        'email'       => 'helder.maiato@hexa.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'admin',
        'status'      => 'active',
        'company_id'  => 7,   // Hexa Seguros
        'department'  => 'Direcção',
        'job_title'   => 'Director Executivo',
        'avatar'      => 'HM',
        'joined_date' => '2024-03-01',
    ],
    [
        'id'          => 4,
        'name'        => 'Nilson Filipe',
        'email'       => 'nilson.filipe@factoryideas.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'admin',
        'status'      => 'active',
        'company_id'  => 2,   // Factory Ideas
        'department'  => 'Direcção Operacional',
        'job_title'   => 'Director Operacional',
        'avatar'      => 'NF',
        'joined_date' => '2024-03-01',
    ],
    [
        'id'          => 5,
        'name'        => 'Joel Pascoal',
        'email'       => 'joel.pascoal@andala.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'admin',
        'status'      => 'active',
        'company_id'  => 4,   // Anda-lá
        'department'  => 'Direcção',
        'job_title'   => 'Director Executivo',
        'avatar'      => 'JP',
        'joined_date' => '2024-04-01',
    ],
    [
        'id'          => 6,
        'name'        => 'Hansa Sardinha',
        'email'       => 'hansa.sardinha@adventure.ao',
        'password'    => 'Inov@2026!',
        'role'        => 'admin',
        'status'      => 'active',
        'company_id'  => 3,   // Adventure Media
        'department'  => 'Direcção',
        'job_title'   => 'Directora Executiva',
        'avatar'      => 'HS',
        'joined_date' => '2024-04-01',
    ],
    [
        'id'          => 7,
        'name'        => 'Editor de Teste',
        'email'       => 'editor@inov.ao',
        'password'    => 'Editor@2026!',
        'role'        => 'editor',
        'status'      => 'active',
        'company_id'  => 1,   // INOV Holding
        'department'  => 'Comunicação',
        'job_title'   => 'Editor de Conteúdos',
        'avatar'      => 'ET',
        'joined_date' => '2025-01-10',
    ],
    [
        'id'          => 8,
        'name'        => 'Colaborador de Teste',
        'email'       => 'colaborador@inov.ao',
        'password'    => 'Colab@2026!',
        'role'        => 'colaborador',
        'status'      => 'active',
        'company_id'  => 1,   // INOV Holding
        'department'  => 'Recursos Humanos',
        'job_title'   => 'Técnico de RH',
        'avatar'      => 'CT',
        'joined_date' => '2025-03-15',
    ],
];

// ── Insert users ───────────────────────────────────────────────
$sql = <<<SQL
INSERT IGNORE INTO `users`
  (`id`, `name`, `email`, `password`, `role`, `status`,
   `company_id`, `department`, `job_title`, `avatar`,
   `joined_date`, `email_verified_at`, `created_at`, `updated_at`)
VALUES
  (:id, :name, :email, :password, :role, :status,
   :company_id, :department, :job_title, :avatar,
   :joined_date, NOW(), NOW(), NOW())
SQL;

$stmt    = $pdo->prepare($sql);
$created = 0;
$skipped = 0;

echo "\n👤 A criar utilizadores...\n";

foreach ($users as $user) {
    $hash = password_hash($user['password'], PASSWORD_BCRYPT, ['cost' => 12]);

    $stmt->execute([
        ':id'          => $user['id'],
        ':name'        => $user['name'],
        ':email'       => $user['email'],
        ':password'    => $hash,
        ':role'        => $user['role'],
        ':status'      => $user['status'],
        ':company_id'  => $user['company_id'],
        ':department'  => $user['department'],
        ':job_title'   => $user['job_title'],
        ':avatar'      => $user['avatar'],
        ':joined_date' => $user['joined_date'],
    ]);

    if ($stmt->rowCount() > 0) {
        printf("   ✅ %-30s %-15s  %s\n", $user['name'], "({$user['role']})", $user['email']);
        $created++;
    } else {
        printf("   ⏭  %-30s já existe — ignorado.\n", $user['name']);
        $skipped++;
    }
}

// ── Initial activity log ───────────────────────────────────────
$logSql = <<<SQL
INSERT IGNORE INTO `activity_logs`
  (`user_id`, `user_name`, `action`, `entity_type`, `entity_name`, `details`, `ip_address`)
VALUES
  (1, 'Marco Sanches', 'system_setup', 'system', 'INOV Intranet Setup',
   '{"version":"1.0.0","setup_date":"%s"}', '127.0.0.1')
SQL;

$pdo->exec(sprintf($logSql, date('Y-m-d H:i:s')));

// ── Report ─────────────────────────────────────────────────────
echo "\n";
echo "─────────────────────────────────────────────────────────\n";
echo "  Setup concluído!\n";
echo "─────────────────────────────────────────────────────────\n";
printf("  Utilizadores criados: %d\n", $created);
printf("  Utilizadores ignorados (já existiam): %d\n", $skipped);
echo "\n";
echo "  CREDENCIAIS DE ACESSO:\n";
echo "  ─────────────────────────────────────────────────────\n";
echo "  super_admin: marco.sanches@factoryideas.ao / Inov@2026!\n";
echo "  admin:       arnaldo.miapia@inov.ao        / Inov@2026!\n";
echo "  editor:      editor@inov.ao                / Editor@2026!\n";
echo "  colaborador: colaborador@inov.ao            / Colab@2026!\n";
echo "  ─────────────────────────────────────────────────────\n";
echo "  ⚠️  Altere estas passwords em produção!\n";
echo "─────────────────────────────────────────────────────────\n\n";
