<?php
declare(strict_types=1);

// ================================================================
//  AnnouncementController
//
//  Routes:
//    GET    /api/announcements        → index()    [auth]
//    GET    /api/announcements/{id}   → show()     [auth]
//    POST   /api/announcements        → store()    [editor + CSRF]
//    PUT    /api/announcements/{id}   → update()   [editor + CSRF]
//    DELETE /api/announcements/{id}   → destroy()  [admin  + CSRF]
// ================================================================

class AnnouncementController
{
    private Announcement $model;

    public function __construct()
    {
        $this->model = new Announcement();
    }

    // ── GET /api/announcements ────────────────────────────────────
    public function index(Request $request): void
    {
        $filters     = $request->only([
            'priority', 'visibility', 'company_id', 'is_active', 'search',
        ]);
        $page        = $request->page();
        $perPage     = $request->perPage();
        $isAdmin     = Auth::isEditor();

        // For regular users: get their company to filter visibility
        $userCompanyId = null;
        if (!$isAdmin) {
            $currentUser   = Database::queryOne(
                "SELECT company_id FROM users WHERE id = :id",
                [':id' => Auth::id()]
            );
            $userCompanyId = $currentUser['company_id'] ?? null;
        }

        $result = $this->model->listPaginated(
            $page, $perPage,
            array_filter($filters, fn($v) => $v !== null && $v !== ''),
            $isAdmin,
            $userCompanyId
        );

        Response::paginated(
            $result['items'],
            $result['total'],
            $page,
            $perPage,
            'Comunicados listados com sucesso.'
        );
    }

    // ── GET /api/announcements/{id} ───────────────────────────────
    public function show(Request $request): void
    {
        $id           = $request->paramInt('id');
        $announcement = $this->model->findWithDetails($id);

        if (!$announcement) Response::notFound('Comunicado não encontrado.');

        // Non-admins cannot see inactive or expired announcements
        if (!Auth::isEditor()) {
            $isExpired = $announcement['expires_at']
                && strtotime($announcement['expires_at']) < time();

            if (!$announcement['is_active'] || $isExpired) {
                Response::notFound('Comunicado não encontrado.');
            }

            // Check visibility
            if ($announcement['visibility'] === 'company') {
                $currentUser = Database::queryOne(
                    "SELECT company_id FROM users WHERE id = :id",
                    [':id' => Auth::id()]
                );
                if ((int)($currentUser['company_id'] ?? 0) !== (int)($announcement['company_id'] ?? 0)) {
                    Response::forbidden('Este comunicado é restrito à sua empresa.');
                }
            }
        }

        Response::success($announcement, 'Comunicado obtido com sucesso.');
    }

    // ── POST /api/announcements ───────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only([
            'title', 'body', 'priority', 'visibility',
            'company_id', 'is_pinned', 'is_active', 'expires_at',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'title'      => 'required|string|min:3|max:500',
            'body'       => 'required|string|min:10',
            'priority'   => 'required|in:low,medium,high',
            'visibility' => 'required|in:global,company',
            'company_id' => 'nullable|integer',
            'is_pinned'  => 'nullable|boolean',
            'is_active'  => 'nullable|boolean',
            'expires_at' => 'nullable|date',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // If visibility = company, company_id is required
        if ($data['visibility'] === 'company' && empty($data['company_id'])) {
            Response::validationError([
                'company_id' => 'É obrigatório seleccionar uma empresa para comunicados com visibilidade "company".',
            ]);
        }

        // Validate company if provided
        $companyId = !empty($data['company_id']) ? (int)$data['company_id'] : null;
        if ($companyId) {
            $c = Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId]);
            if (!$c) Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        // Clear company_id for global announcements
        if ($data['visibility'] === 'global') {
            $companyId = null;
        }

        $newId = $this->model->create([
            'title'      => $data['title'],
            'body'       => $data['body'],
            'priority'   => $data['priority'],
            'visibility' => $data['visibility'],
            'company_id' => $companyId,
            'author_id'  => Auth::id(),
            'is_pinned'  => !empty($data['is_pinned'])  ? 1 : 0,
            'is_active'  => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            'expires_at' => !empty($data['expires_at']) ? $data['expires_at'] : null,
        ]);

        $created = $this->model->findWithDetails($newId);

        ActivityLog::write('create_announcement', 'announcement', $newId, $data['title'], [
            'priority'   => $data['priority'],
            'visibility' => $data['visibility'],
        ]);

        Response::created($created, 'Comunicado criado com sucesso.');
    }

    // ── PUT /api/announcements/{id} ───────────────────────────────
    public function update(Request $request): void
    {
        $id           = $request->paramInt('id');
        $announcement = $this->model->find($id);

        if (!$announcement) Response::notFound('Comunicado não encontrado.');

        // Editors can only update own announcements
        if (!Auth::isAdmin() && (int)$announcement['author_id'] !== Auth::id()) {
            Response::forbidden('Só pode editar os seus próprios comunicados.');
        }

        $data = $request->only([
            'title', 'body', 'priority', 'visibility',
            'company_id', 'is_pinned', 'is_active', 'expires_at',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'title'      => 'required|string|min:3|max:500',
            'body'       => 'required|string|min:10',
            'priority'   => 'required|in:low,medium,high',
            'visibility' => 'required|in:global,company',
            'company_id' => 'nullable|integer',
            'is_pinned'  => 'nullable|boolean',
            'is_active'  => 'nullable|boolean',
            'expires_at' => 'nullable|date',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // company_id required for company visibility
        if ($data['visibility'] === 'company' && empty($data['company_id'])) {
            Response::validationError([
                'company_id' => 'Seleccione uma empresa para visibilidade "company".',
            ]);
        }

        $companyId = $data['visibility'] === 'global'
            ? null
            : (!empty($data['company_id']) ? (int)$data['company_id'] : null);

        $this->model->updateAnnouncement($id, [
            'title'      => $data['title'],
            'body'       => $data['body'],
            'priority'   => $data['priority'],
            'visibility' => $data['visibility'],
            'company_id' => $companyId,
            'is_pinned'  => !empty($data['is_pinned'])  ? 1 : 0,
            'is_active'  => isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1,
            'expires_at' => !empty($data['expires_at']) ? $data['expires_at'] : null,
        ]);

        $updated = $this->model->findWithDetails($id);

        ActivityLog::write('update_announcement', 'announcement', $id, $announcement['title'], [
            'priority_changed' => $data['priority'] !== $announcement['priority'],
        ]);

        Response::success($updated, 'Comunicado actualizado com sucesso.');
    }

    // ── DELETE /api/announcements/{id} ────────────────────────────
    public function destroy(Request $request): void
    {
        $id           = $request->paramInt('id');
        $announcement = $this->model->find($id);

        if (!$announcement) Response::notFound('Comunicado não encontrado.');

        $this->model->delete($id);

        ActivityLog::write('delete_announcement', 'announcement', $id, $announcement['title']);

        Response::success(null, "Comunicado \"{$announcement['title']}\" eliminado com sucesso.");
    }
}
