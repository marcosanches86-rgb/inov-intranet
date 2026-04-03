<?php
declare(strict_types=1);

// ================================================================
//  NewsController
//
//  Routes:
//    GET    /api/news                → index()    [auth]
//    GET    /api/news/{id}           → show()     [auth]
//    POST   /api/news                → store()    [editor + CSRF]
//    PUT    /api/news/{id}           → update()   [editor + CSRF]
//    PATCH  /api/news/{id}/publish   → publish()  [editor + CSRF]
//    PATCH  /api/news/{id}/feature   → feature()  [editor + CSRF]
//    DELETE /api/news/{id}           → destroy()  [admin  + CSRF]
// ================================================================

class NewsController
{
    private News $model;

    public function __construct()
    {
        $this->model = new News();
    }

    // ── GET /api/news ─────────────────────────────────────────────
    public function index(Request $request): void
    {
        $filters = $request->only([
            'company_id', 'status', 'featured', 'category', 'search', 'author_id',
        ]);

        $page    = $request->page();
        $perPage = $request->perPage();
        $isAdmin = Auth::isEditor(); // editors and above see drafts

        $result = $this->model->listPaginated($page, $perPage, $filters, $isAdmin);

        Response::paginated(
            $result['items'],
            $result['total'],
            $page,
            $perPage,
            'Notícias listadas com sucesso.'
        );
    }

    // ── GET /api/news/{id} ────────────────────────────────────────
    public function show(Request $request): void
    {
        $id   = $request->paramInt('id');
        $news = $this->model->findWithDetails($id);

        if (!$news) Response::notFound('Notícia não encontrada.');

        // Non-editors can only see published news
        if ($news['status'] !== 'published' && !Auth::isEditor()) {
            Response::notFound('Notícia não encontrada.');
        }

        // Increment view count for published articles (async-safe)
        if ($news['status'] === 'published') {
            $this->model->incrementViews($id);
        }

        Response::success($news, 'Notícia obtida com sucesso.');
    }

    // ── POST /api/news ────────────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only([
            'title', 'summary', 'body', 'company_id',
            'category', 'status', 'is_featured', 'read_time',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'title'      => 'required|string|min:5|max:600',
            'summary'    => 'nullable|string|max:1000',
            'body'       => 'nullable|string',
            'company_id' => 'required|integer',
            'category'   => 'nullable|string|max:100',
            'status'     => 'nullable|in:draft,published',
            'is_featured'=> 'nullable|boolean',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // Validate company
        $companyId = (int)$data['company_id'];
        $company   = Database::queryOne(
            "SELECT id FROM companies WHERE id = :id",
            [':id' => $companyId]
        );
        if (!$company) Response::validationError(['company_id' => 'Empresa inválida.']);

        // ── Cover image upload (optional) ─────────────────────────
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $uploaded = moveUpload($request->file('cover'), 'cover');
            if ($uploaded === false) {
                Response::error('Erro no upload da imagem de capa: ' . getUploadError(), [], 422);
            }
            $coverPath = $uploaded['path'];
        }

        $newId = $this->model->create([
            'title'      => $data['title'],
            'summary'    => $data['summary']   ?? null,
            'body'       => $data['body']       ?? null,
            'company_id' => $companyId,
            'author_id'  => Auth::id(),
            'category'   => $data['category']  ?? null,
            'status'     => $data['status']     ?? 'draft',
            'is_featured'=> !empty($data['is_featured']) ? 1 : 0,
            'cover_path' => $coverPath,
        ]);

        $created = $this->model->findWithDetails($newId);

        ActivityLog::write('create_news', 'news', $newId, $data['title'], [
            'company_id' => $companyId,
            'status'     => $data['status'] ?? 'draft',
        ]);

        Response::created($created, 'Notícia criada com sucesso.');
    }

    // ── PUT /api/news/{id} ────────────────────────────────────────
    public function update(Request $request): void
    {
        $id   = $request->paramInt('id');
        $news = $this->model->find($id);

        if (!$news) Response::notFound('Notícia não encontrada.');

        // Editors can only update own news; admins can update any
        if (!Auth::isAdmin() && (int)$news['author_id'] !== Auth::id()) {
            Response::forbidden('Só pode editar as suas próprias notícias.');
        }

        $data = $request->only([
            'title', 'summary', 'body', 'company_id',
            'category', 'status', 'is_featured', 'read_time',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'title'      => 'required|string|min:5|max:600',
            'summary'    => 'nullable|string|max:1000',
            'body'       => 'nullable|string',
            'company_id' => 'required|integer',
            'category'   => 'nullable|string|max:100',
            'status'     => 'nullable|in:draft,published',
            'is_featured'=> 'nullable|boolean',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // ── Cover image replacement (optional) ────────────────────
        $coverPath = $news['cover_path']; // Keep existing by default
        if ($request->hasFile('cover')) {
            $uploaded = moveUpload($request->file('cover'), 'cover');
            if ($uploaded === false) {
                Response::error('Erro no upload da imagem de capa: ' . getUploadError(), [], 422);
            }
            // Delete old cover
            if ($news['cover_path']) {
                deleteUploadFile($news['cover_path']);
            }
            $coverPath = $uploaded['path'];
        }

        // Allow explicit removal of cover
        if ($request->post('remove_cover') == '1' && $news['cover_path']) {
            deleteUploadFile($news['cover_path']);
            $coverPath = null;
        }

        $this->model->updateNews($id, [
            'title'      => $data['title'],
            'summary'    => $data['summary']   ?? null,
            'body'       => $data['body']       ?? null,
            'company_id' => (int)$data['company_id'],
            'category'   => $data['category']  ?? null,
            'status'     => $data['status']     ?? $news['status'],
            'is_featured'=> !empty($data['is_featured']) ? 1 : 0,
            'cover_path' => $coverPath,
        ]);

        $updated = $this->model->findWithDetails($id);

        ActivityLog::write('update_news', 'news', $id, $news['title'], [
            'fields_changed' => array_keys($data),
        ]);

        Response::success($updated, 'Notícia actualizada com sucesso.');
    }

    // ── PATCH /api/news/{id}/publish ──────────────────────────────
    public function publish(Request $request): void
    {
        $id   = $request->paramInt('id');
        $news = $this->model->find($id);

        if (!$news) Response::notFound('Notícia não encontrada.');

        // Editors can only publish own news
        if (!Auth::isAdmin() && (int)$news['author_id'] !== Auth::id()) {
            Response::forbidden('Não tem permissão para publicar esta notícia.');
        }

        if ($news['status'] === 'published') {
            // Toggle: revert to draft
            $this->model->unpublish($id);
            $action  = 'unpublish_news';
            $message = 'Notícia revertida para rascunho.';
            $newStatus = 'draft';
        } else {
            // Publish
            if (empty($news['title'])) {
                Response::error('Não é possível publicar uma notícia sem título.', [], 422);
            }
            $this->model->publish($id);
            $action  = 'publish_news';
            $message = 'Notícia publicada com sucesso.';
            $newStatus = 'published';
        }

        ActivityLog::write($action, 'news', $id, $news['title']);

        Response::success(
            ['id' => $id, 'status' => $newStatus],
            $message
        );
    }

    // ── PATCH /api/news/{id}/feature ──────────────────────────────
    public function feature(Request $request): void
    {
        $id   = $request->paramInt('id');
        $news = $this->model->find($id);

        if (!$news) Response::notFound('Notícia não encontrada.');

        $newFeatured = $this->model->toggleFeatured($id);

        $label  = $newFeatured ? 'adicionada aos destaques' : 'removida dos destaques';
        $action = $newFeatured ? 'feature_news' : 'unfeature_news';

        ActivityLog::write($action, 'news', $id, $news['title']);

        Response::success(
            ['id' => $id, 'is_featured' => $newFeatured],
            "Notícia {$label}."
        );
    }

    // ── DELETE /api/news/{id} ─────────────────────────────────────
    public function destroy(Request $request): void
    {
        $id   = $request->paramInt('id');
        $news = $this->model->find($id);

        if (!$news) Response::notFound('Notícia não encontrada.');

        // Delete cover image file if exists
        if (!empty($news['cover_path'])) {
            deleteUploadFile($news['cover_path']);
        }

        $this->model->delete($id);

        ActivityLog::write('delete_news', 'news', $id, $news['title'], [
            'company_id' => $news['company_id'],
            'status'     => $news['status'],
        ]);

        Response::success(null, "Notícia \"{$news['title']}\" eliminada com sucesso.");
    }
}
