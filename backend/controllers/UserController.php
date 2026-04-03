<?php
declare(strict_types=1);

// ================================================================
//  UserController
//
//  Routes (all require AuthMiddleware):
//    GET    /api/users               → index()        [admin]
//    POST   /api/users               → store()        [admin]
//    GET    /api/users/{id}          → show()         [admin]
//    PUT    /api/users/{id}          → update()       [admin]
//    PATCH  /api/users/{id}/status   → updateStatus() [admin]
//    PATCH  /api/users/{id}/role     → updateRole()   [super_admin]
//    DELETE /api/users/{id}          → destroy()      [super_admin]
// ================================================================

class UserController
{
    private User $model;

    public function __construct()
    {
        $this->model = new User();
    }

    // ── GET /api/users ────────────────────────────────────────────
    public function index(Request $request): void
    {
        $filters = $request->only(['role', 'status', 'company_id', 'search']);
        $page    = $request->page();
        $perPage = $request->perPage();

        // Validate filter values
        if (!empty($filters['role']) && !array_key_exists($filters['role'], ROLES)) {
            Response::validationError(['role' => 'Role inválido.']);
        }

        if (!empty($filters['status']) && !in_array($filters['status'], ['active','inactive','pending'], true)) {
            Response::validationError(['status' => 'Status inválido.']);
        }

        $result = $this->model->listPaginated($page, $perPage, array_filter($filters));

        Response::paginated(
            array_map([User::class, 'sanitize'], $result['items']),
            $result['total'],
            $page,
            $perPage,
            'Utilizadores listados com sucesso.'
        );
    }

    // ── POST /api/users ───────────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only([
            'name', 'email', 'password', 'password_confirmation',
            'role', 'status', 'company_id',
            'department', 'job_title', 'phone', 'bio', 'joined_date',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'name'                  => 'required|string|min:2|max:200',
            'email'                 => 'required|email|max:200',
            'password'              => 'required|min:8|max:100|confirmed',
            'password_confirmation' => 'required',
            'role'                  => 'required|in:colaborador,editor,admin,super_admin',
            'status'                => 'required|in:active,inactive,pending',
            'company_id'            => 'nullable|integer',
            'department'            => 'nullable|string|max:200',
            'job_title'             => 'nullable|string|max:200',
            'phone'                 => 'nullable|string|max:50',
            'joined_date'           => 'nullable|date',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // Only super_admin can create super_admin or admin users
        if (in_array($data['role'], ['admin', 'super_admin'], true) && !Auth::isSuperAdmin()) {
            Response::forbidden('Apenas o super administrador pode criar utilizadores com role admin.');
        }

        // Email uniqueness
        if ($this->model->emailExists($data['email'])) {
            Response::conflict('Este email já está registado na plataforma.');
        }

        // Validate company
        $companyId = !empty($data['company_id']) ? (int)$data['company_id'] : null;
        if ($companyId) {
            $c = Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId]);
            if (!$c) Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        $newId = $this->model->create([
            'name'        => $data['name'],
            'email'       => strtolower(trim($data['email'])),
            'password'    => User::hashPassword($data['password']),
            'role'        => $data['role'],
            'status'      => $data['status'],
            'company_id'  => $companyId,
            'department'  => $data['department']  ?? null,
            'job_title'   => $data['job_title']   ?? null,
            'phone'       => $data['phone']        ?? null,
            'bio'         => $data['bio']          ?? null,
            'joined_date' => $data['joined_date']  ?? date('Y-m-d'),
            'email_verified_at' => $data['status'] === 'active' ? date('Y-m-d H:i:s') : null,
        ]);

        $newUser = $this->model->findWithCompany($newId);

        ActivityLog::write('create_user', 'user', $newId, $data['name'], [
            'role'       => $data['role'],
            'created_by' => Auth::id(),
        ]);

        Response::created(
            User::sanitize($newUser),
            'Utilizador criado com sucesso.'
        );
    }

    // ── GET /api/users/{id} ───────────────────────────────────────
    public function show(Request $request): void
    {
        $id   = $request->paramInt('id');
        $user = $this->model->findWithCompany($id);

        if (!$user) Response::notFound('Utilizador não encontrado.');

        Response::success(User::sanitize($user));
    }

    // ── PUT /api/users/{id} ───────────────────────────────────────
    public function update(Request $request): void
    {
        $id   = $request->paramInt('id');
        $user = $this->model->find($id);

        if (!$user) Response::notFound('Utilizador não encontrado.');

        $data = $request->only([
            'name', 'email', 'company_id',
            'department', 'job_title', 'phone', 'bio', 'joined_date',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'name'        => 'required|string|min:2|max:200',
            'email'       => 'required|email|max:200',
            'company_id'  => 'nullable|integer',
            'department'  => 'nullable|string|max:200',
            'job_title'   => 'nullable|string|max:200',
            'phone'       => 'nullable|string|max:50',
            'bio'         => 'nullable|string|max:2000',
            'joined_date' => 'nullable|date',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // Email uniqueness (exclude current user)
        if ($this->model->emailExists($data['email'], $id)) {
            Response::conflict('Este email já está em uso por outro utilizador.');
        }

        // Validate company
        $companyId = !empty($data['company_id']) ? (int)$data['company_id'] : null;
        if ($companyId) {
            $c = Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId]);
            if (!$c) Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        $this->model->update($id, [
            'name'        => $data['name'],
            'email'       => strtolower(trim($data['email'])),
            'company_id'  => $companyId,
            'department'  => $data['department']  ?? null,
            'job_title'   => $data['job_title']   ?? null,
            'phone'       => $data['phone']        ?? null,
            'bio'         => $data['bio']          ?? null,
            'joined_date' => $data['joined_date']  ?? null,
        ]);

        $updated = $this->model->findWithCompany($id);

        ActivityLog::write('update_user', 'user', $id, $user['name'], [
            'changes' => array_diff_key($data, ['password' => null]),
        ]);

        Response::success(User::sanitize($updated), 'Utilizador actualizado com sucesso.');
    }

    // ── PATCH /api/users/{id}/status ─────────────────────────────
    public function updateStatus(Request $request): void
    {
        $id     = $request->paramInt('id');
        $status = $request->post('status');

        if ($id === Auth::id()) {
            Response::forbidden('Não pode alterar o seu próprio estado.');
        }

        if (!in_array($status, ['active', 'inactive', 'pending'], true)) {
            Response::validationError(['status' => 'Estado inválido. Use: active, inactive, pending.']);
        }

        $user = $this->model->find($id);
        if (!$user) Response::notFound('Utilizador não encontrado.');

        $this->model->update($id, ['status' => $status]);

        ActivityLog::write('change_user_status', 'user', $id, $user['name'], [
            'from'   => $user['status'],
            'to'     => $status,
            'by'     => Auth::id(),
        ]);

        Response::success(
            ['id' => $id, 'status' => $status],
            "Estado actualizado para '{$status}' com sucesso."
        );
    }

    // ── PATCH /api/users/{id}/role ────────────────────────────────
    // Requires super_admin
    public function updateRole(Request $request): void
    {
        $id   = $request->paramInt('id');
        $role = $request->post('role');

        if ($id === Auth::id()) {
            Response::forbidden('Não pode alterar o seu próprio role.');
        }

        if (!array_key_exists($role, ROLES)) {
            Response::validationError(['role' => 'Role inválido. Use: colaborador, editor, admin, super_admin.']);
        }

        $user = $this->model->find($id);
        if (!$user) Response::notFound('Utilizador não encontrado.');

        // Protect the last super_admin
        if ($user['role'] === 'super_admin') {
            $superCount = (int) Database::queryOne(
                "SELECT COUNT(*) AS c FROM users WHERE role = 'super_admin' AND status = 'active'"
            )['c'];

            if ($superCount <= 1 && $role !== 'super_admin') {
                Response::forbidden(
                    'Não pode rebaixar o único super administrador activo da plataforma.'
                );
            }
        }

        $this->model->update($id, ['role' => $role]);

        ActivityLog::write('change_user_role', 'user', $id, $user['name'], [
            'from' => $user['role'],
            'to'   => $role,
            'by'   => Auth::id(),
        ]);

        Response::success(
            ['id' => $id, 'role' => $role],
            "Role actualizado para '{$role}' com sucesso."
        );
    }

    // ── DELETE /api/users/{id} ────────────────────────────────────
    // Requires super_admin
    public function destroy(Request $request): void
    {
        $id = $request->paramInt('id');

        if ($id === Auth::id()) {
            Response::forbidden('Não pode eliminar a sua própria conta.');
        }

        $user = $this->model->find($id);
        if (!$user) Response::notFound('Utilizador não encontrado.');

        // Protect last super_admin
        if ($user['role'] === 'super_admin') {
            $superCount = (int) Database::queryOne(
                "SELECT COUNT(*) AS c FROM users WHERE role = 'super_admin'"
            )['c'];

            if ($superCount <= 1) {
                Response::forbidden('Não pode eliminar o único super administrador da plataforma.');
            }
        }

        $this->model->delete($id);

        ActivityLog::write('delete_user', 'user', $id, $user['name'], [
            'email' => $user['email'],
            'role'  => $user['role'],
            'by'    => Auth::id(),
        ]);

        Response::success(null, "Utilizador '{$user['name']}' eliminado com sucesso.");
    }
}
