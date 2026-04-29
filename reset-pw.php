<?php
/**
 * INOV — Reset de Password Temporário
 * APAGAR após uso.
 */

// Chave de segurança — sem ela a página não funciona
define('RESET_KEY', 'INOV-reset-2026');

$key     = $_GET['key']  ?? '';
$done    = false;
$error   = '';

if ($key !== RESET_KEY) {
    http_response_code(403);
    die('Acesso negado.');
}

// Processar formulário
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email']    ?? '');
    $pass     = $_POST['password']      ?? '';
    $confirm  = $_POST['confirm']       ?? '';

    if (!$email || !$pass || !$confirm) {
        $error = 'Todos os campos são obrigatórios.';
    } elseif (strlen($pass) < 8) {
        $error = 'A senha deve ter pelo menos 8 caracteres.';
    } elseif ($pass !== $confirm) {
        $error = 'As senhas não coincidem.';
    } else {
        // Carregar configuração da BD
        $envFile = __DIR__ . '/backend/.env';
        if (!file_exists($envFile)) {
            $error = 'Ficheiro .env não encontrado.';
        } else {
            $env = parse_ini_file($envFile);
            try {
                $pdo = new PDO(
                    'mysql:host=' . ($env['DB_HOST'] ?? 'localhost') . ';dbname=' . ($env['DB_NAME'] ?? '') . ';charset=utf8mb4',
                    $env['DB_USER'] ?? '',
                    $env['DB_PASS'] ?? '',
                    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
                );

                // Verificar se o email existe
                $stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email AND is_active = 1");
                $stmt->execute([':email' => $email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    $error = 'Email não encontrado ou conta inactiva.';
                } else {
                    $hash = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 12]);
                    $upd  = $pdo->prepare("UPDATE users SET password = :pw, updated_at = NOW() WHERE id = :id");
                    $upd->execute([':pw' => $hash, ':id' => $user['id']]);
                    $done = true;
                }
            } catch (PDOException $e) {
                $error = 'Erro de base de dados: ' . $e->getMessage();
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Redefinir Password — INOV</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; background: #0f172a; display: flex;
         align-items: center; justify-content: center; min-height: 100vh; }
  .card { background: #1e293b; border: 1px solid #334155; border-radius: 12px;
          padding: 40px; width: 100%; max-width: 420px; }
  .logo { font-size: 1.5rem; font-weight: 800; color: #f1f5f9; margin-bottom: 8px; }
  .sub  { font-size: .85rem; color: #94a3b8; margin-bottom: 28px; }
  label { display: block; font-size: .8rem; color: #94a3b8; margin-bottom: 6px; }
  input { width: 100%; padding: 10px 14px; background: #0f172a; border: 1px solid #334155;
          border-radius: 8px; color: #f1f5f9; font-size: .9rem; margin-bottom: 16px; outline: none; }
  input:focus { border-color: #6366f1; }
  button { width: 100%; padding: 12px; background: #6366f1; border: none; border-radius: 8px;
           color: #fff; font-size: .9rem; font-weight: 600; cursor: pointer; }
  button:hover { background: #4f46e5; }
  .error   { background: #450a0a; border: 1px solid #dc2626; color: #fca5a5;
             padding: 10px 14px; border-radius: 8px; font-size: .82rem; margin-bottom: 16px; }
  .success { text-align: center; }
  .success h2 { color: #4ade80; font-size: 1.2rem; margin-bottom: 12px; }
  .success p  { color: #94a3b8; font-size: .85rem; margin-bottom: 20px; }
  .success a  { color: #6366f1; font-weight: 600; text-decoration: none; }
</style>
</head>
<body>
<div class="card">
  <?php if ($done): ?>
    <div class="success">
      <h2>✅ Senha actualizada!</h2>
      <p>A tua password foi alterada com sucesso.<br>Podes fazer login agora.</p>
      <a href="https://intranet.inov.ao">→ Ir para a Intranet</a>
    </div>
  <?php else: ?>
    <div class="logo">INOV</div>
    <div class="sub">Redefinir password de administrador</div>
    <?php if ($error): ?>
      <div class="error"><?= htmlspecialchars($error) ?></div>
    <?php endif; ?>
    <form method="POST" action="?key=<?= htmlspecialchars(RESET_KEY) ?>">
      <label>Email</label>
      <input type="email" name="email" value="<?= htmlspecialchars($_POST['email'] ?? '') ?>"
             placeholder="marco.sanches@factoryideas.ao" required autofocus>
      <label>Nova password</label>
      <input type="password" name="password" placeholder="Mínimo 8 caracteres" required>
      <label>Confirmar password</label>
      <input type="password" name="confirm" placeholder="Repetir password" required>
      <button type="submit">Redefinir Password</button>
    </form>
  <?php endif; ?>
</div>
</body>
</html>
