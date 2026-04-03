<?php
declare(strict_types=1);

// ================================================================
//  AuthController
//
//  Routes:
//    POST  /api/auth/register          → register()
//    POST  /api/auth/login             → login()
//    POST  /api/auth/logout            → logout()
//    GET   /api/auth/me                → me()
//    POST  /api/auth/forgot-password   → forgotPassword()
//    POST  /api/auth/reset-password    → resetPassword()
//    POST  /api/auth/change-password   → changePassword()
// ================================================================

class AuthController
{
    private User          $users;
    private PasswordReset $resets;

    public function __construct()
    {
        $this->users  = new User();
        $this->resets = new PasswordReset();
    }

    // ── POST /api/auth/register ───────────────────────────────────
    public function register(Request $request): void
    {
        $data = $request->only([
            'name', 'email', 'password', 'password_confirmation',
            'company_id', 'department', 'job_title', 'phone',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'name'                  => 'required|string|min:2|max:200',
            'email'                 => 'required|email|max:200',
            'password'              => 'required|min:8|max:100|confirmed',
            'password_confirmation' => 'required',
            'company_id'            => 'nullable|integer',
            'department'            => 'nullable|string|max:200',
            'job_title'             => 'nullable|string|max:200',
            'phone'                 => 'nullable|string|max:50',
        ]);

        if ($v->fails()) {
            Response::validationError($v->getErrors());
        }

        // ── Email uniqueness ──────────────────────────────────────
        if ($this->users->emailExists($data['email'])) {
            Response::conflict('Este email já está registado na plataforma.');
        }

        // ── Validate company_id if provided ───────────────────────
        if (!empty($data['company_id'])) {
            $company = Database::queryOne(
                "SELECT id FROM companies WHERE id = :id AND is_active = 1",
                [':id' => (int) $data['company_id']]
            );
            if (!$company) {
                Response::validationError(['company_id' => 'Empresa inválida ou inactiva.']);
            }
        }

        // ── Create user ───────────────────────────────────────────
        $newId = $this->users->create([
            'name'       => $data['name'],
            'email'      => strtolower(trim($data['email'])),
            'password'   => User::hashPassword($data['password']),
            'role'       => 'colaborador',
            'status'     => 'pending', // Requires admin approval
            'company_id' => !empty($data['company_id']) ? (int)$data['company_id'] : null,
            'department' => $data['department'] ?? null,
            'job_title'  => $data['job_title']  ?? null,
            'phone'      => $data['phone']       ?? null,
            'joined_date'=> date('Y-m-d'),
        ]);

        // ── Activity log ──────────────────────────────────────────
        ActivityLog::write('register', 'user', $newId, $data['name'], [
            'email' => $data['email'],
            'ip'    => $request->ip(),
        ]);

        Response::created(
            ['id' => $newId, 'status' => 'pending'],
            'Registo efectuado. A sua conta aguarda aprovação do administrador.'
        );
    }


    // ── POST /api/auth/login ──────────────────────────────────────
    public function login(Request $request): void
    {
        $data = $request->only(['email', 'password']);
        $ip   = $request->ip();

        // ── Basic validation ──────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'email'    => 'required|email',
            'password' => 'required',
        ]);

        if ($v->fails()) {
            Response::validationError($v->getErrors());
        }

        $email = strtolower(trim($data['email']));

        // ── Rate limit check ──────────────────────────────────────
        if ($this->users->isRateLimited($email, $ip)) {
            $mins = $this->users->lockoutRemainingMinutes($email, $ip);

            ActivityLog::write('login_blocked', 'user', null, $email, [
                'reason' => 'rate_limit',
                'ip'     => $ip,
            ]);

            Response::tooManyRequests(
                "Demasiadas tentativas de login. Tente novamente em {$mins} minuto(s)."
            );
        }

        // ── Find user ─────────────────────────────────────────────
        $user = $this->users->findByEmail($email);

        // ── Verify password ───────────────────────────────────────
        if (!$user || !User::verifyPassword($data['password'], $user['password'])) {
            $this->users->recordAttempt($email, $ip, false);

            ActivityLog::write('login_failed', 'user', null, $email, [
                'reason' => $user ? 'wrong_password' : 'user_not_found',
                'ip'     => $ip,
            ]);

            // Generic error — do not reveal whether email exists
            Response::error('Email ou password incorrectos.', [], 401);
        }

        // ── Check account status ──────────────────────────────────
        if ($user['status'] !== 'active') {
            $msg = match ($user['status']) {
                'pending'  => 'A sua conta ainda não foi aprovada pelo administrador.',
                'inactive' => 'A sua conta foi desactivada. Contacte o administrador.',
                default    => 'Acesso não autorizado.',
            };

            $this->users->recordAttempt($email, $ip, false);

            ActivityLog::write('login_denied', 'user', $user['id'], $user['name'], [
                'reason' => 'status_' . $user['status'],
                'ip'     => $ip,
            ]);

            Response::error($msg, [], 403);
        }

        // ── Successful login ──────────────────────────────────────
        $this->users->recordAttempt($email, $ip, true);
        $this->users->recordLogin($user['id'], $ip);

        // Rehash if bcrypt cost changed
        $this->users->rehashIfNeeded($user['id'], $data['password'], $user['password']);

        // Start authenticated session
        Auth::login($user['id'], $user['role'], $user['name'], $user['avatar'] ?? 'U');

        ActivityLog::write('login_success', 'user', $user['id'], $user['name'], [
            'ip' => $ip,
        ]);

        // Clean up expired password resets (housekeeping)
        $this->resets->cleanExpired();

        $safe = User::sanitize($user);

        Response::success(
            [
                'user'       => $safe,
                'csrf_token' => Auth::getCsrfToken(),
            ],
            'Login efectuado com sucesso.'
        );
    }


    // ── POST /api/auth/logout ─────────────────────────────────────
    public function logout(Request $request): void
    {
        $userId = Auth::id();
        $name   = Auth::name();

        ActivityLog::write('logout', 'user', $userId, $name);

        Auth::logout();

        Response::success(null, 'Sessão terminada com sucesso.');
    }


    // ── GET /api/auth/me ──────────────────────────────────────────
    public function me(Request $request): void
    {
        $user = $this->users->findWithCompany(Auth::id());

        if (!$user) {
            Auth::logout();
            Response::unauthorized('Utilizador não encontrado. Por favor faça login novamente.');
        }

        // Block if account was deactivated mid-session
        if ($user['status'] !== 'active') {
            Auth::logout();
            Response::forbidden('A sua conta foi desactivada.');
        }

        Response::success(
            array_merge(
                User::sanitize($user),
                ['csrf_token' => Auth::getCsrfToken()]
            ),
            'Utilizador autenticado.'
        );
    }


    // ── POST /api/auth/forgot-password ────────────────────────────
    public function forgotPassword(Request $request): void
    {
        $data = $request->only(['email']);

        $v = new Validator();
        $v->validate($data, ['email' => 'required|email|max:200']);
        if ($v->fails()) Response::validationError($v->getErrors());

        $email = strtolower(trim($data['email']));
        $user  = $this->users->findByEmail($email);

        // Always return success — never reveal if email is registered (security)
        $genericMsg = 'Se este email estiver registado, receberá instruções de recuperação.';

        if (!$user || $user['status'] !== 'active') {
            Response::success(null, $genericMsg);
        }

        // Generate reset token
        $rawToken = $this->resets->createForEmail($email);

        // In production: send email with token
        // TODO: implement email sending (PHPMailer / SMTP)
        // Example reset URL: https://intranet.inov.ao/reset-password?token={$rawToken}&email={$email}

        ActivityLog::write('forgot_password', 'user', $user['id'], $user['name'], [
            'ip' => $request->ip(),
        ]);

        // In development mode: return token directly for testing
        $responseData = APP_DEBUG
            ? ['reset_token' => $rawToken, 'email' => $email]
            : null;

        Response::success($responseData, $genericMsg);
    }


    // ── POST /api/auth/reset-password ─────────────────────────────
    public function resetPassword(Request $request): void
    {
        $data = $request->only([
            'email', 'token', 'password', 'password_confirmation',
        ]);

        $v = new Validator();
        $v->validate($data, [
            'email'                 => 'required|email',
            'token'                 => 'required|string|min:64|max:64',
            'password'              => 'required|min:8|max:100|confirmed',
            'password_confirmation' => 'required',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        $email = strtolower(trim($data['email']));

        // ── Find valid token ──────────────────────────────────────
        $reset = $this->resets->findValid($data['token'], $email);

        if (!$reset) {
            Response::error(
                'Token inválido ou expirado. Solicite um novo link de recuperação.',
                [],
                400
            );
        }

        // ── Find user ─────────────────────────────────────────────
        $user = $this->users->findByEmail($email);

        if (!$user) {
            Response::notFound('Utilizador não encontrado.');
        }

        // ── Update password ───────────────────────────────────────
        $this->users->updatePassword($user['id'], User::hashPassword($data['password']));

        // ── Invalidate token ──────────────────────────────────────
        $this->resets->markUsed($reset['id']);

        ActivityLog::write('password_reset', 'user', $user['id'], $user['name'], [
            'ip' => $request->ip(),
        ]);

        Response::success(null, 'Password alterada com sucesso. Por favor faça login.');
    }


    // ── POST /api/auth/change-password ────────────────────────────
    // Requires: AuthMiddleware + CsrfMiddleware
    public function changePassword(Request $request): void
    {
        $data = $request->only([
            'current_password', 'password', 'password_confirmation',
        ]);

        $v = new Validator();
        $v->validate($data, [
            'current_password'      => 'required',
            'password'              => 'required|min:8|max:100|confirmed',
            'password_confirmation' => 'required',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // ── Load current user ─────────────────────────────────────
        $user = $this->users->find(Auth::id());

        if (!$user) {
            Response::notFound('Utilizador não encontrado.');
        }

        // ── Verify current password ───────────────────────────────
        if (!User::verifyPassword($data['current_password'], $user['password'])) {
            Response::error(
                'A password actual está incorrecta.',
                ['current_password' => 'Password actual incorrecta.'],
                422
            );
        }

        // ── Prevent re-use of same password ───────────────────────
        if (User::verifyPassword($data['password'], $user['password'])) {
            Response::error(
                'A nova password deve ser diferente da actual.',
                ['password' => 'Escolha uma password diferente da actual.'],
                422
            );
        }

        // ── Update ────────────────────────────────────────────────
        $this->users->updatePassword($user['id'], User::hashPassword($data['password']));

        ActivityLog::write('password_changed', 'user', $user['id'], $user['name'], [
            'ip' => $request->ip(),
        ]);

        // Regenerate session token after password change
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));

        Response::success(
            ['csrf_token' => Auth::getCsrfToken()],
            'Password alterada com sucesso.'
        );
    }
}
