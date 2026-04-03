<?php
declare(strict_types=1);

// ================================================================
//  DocumentController
//
//  Routes:
//    GET    /api/documents               → index()    [auth]
//    GET    /api/documents/{id}          → show()     [auth]
//    POST   /api/documents               → store()    [editor]
//    PUT    /api/documents/{id}          → update()   [editor + CSRF]
//    DELETE /api/documents/{id}          → destroy()  [admin  + CSRF]
//    GET    /api/documents/{id}/download → download() [auth]
// ================================================================

class DocumentController
{
    private Document $model;

    public function __construct()
    {
        $this->model = new Document();
    }

    // ── GET /api/documents ────────────────────────────────────────
    public function index(Request $request): void
    {
        $filters  = $request->only(['company_id','category','file_type','search','is_confidential']);
        $page     = $request->page();
        $perPage  = $request->perPage();
        $isAdmin  = Auth::isAdmin();

        $result = $this->model->listPaginated($page, $perPage, array_filter($filters, fn($v) => $v !== null && $v !== ''), $isAdmin);

        Response::paginated(
            $result['items'], $result['total'], $page, $perPage,
            'Documentos listados com sucesso.'
        );
    }

    // ── GET /api/documents/{id} ───────────────────────────────────
    public function show(Request $request): void
    {
        $id  = $request->paramInt('id');
        $doc = $this->model->findWithDetails($id);

        if (!$doc || !$doc['is_active']) Response::notFound('Documento não encontrado.');

        if ($doc['is_confidential'] && !Auth::isAdmin()) {
            Response::forbidden('Não tem permissão para aceder a este documento confidencial.');
        }

        Response::success($doc, 'Documento obtido com sucesso.');
    }

    // ── POST /api/documents ───────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only(['title','description','category','company_id','is_confidential']);

        $v = new Validator();
        $v->validate($data, [
            'title'      => 'required|string|min:3|max:500',
            'company_id' => 'required|integer',
            'category'   => 'nullable|string|max:100',
            'description'=> 'nullable|string|max:2000',
            'is_confidential' => 'nullable|boolean',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        // Only admins can upload confidential documents
        $isConfidential = !empty($data['is_confidential']) && Auth::isAdmin();

        // Company validation
        $companyId = (int)$data['company_id'];
        if (!Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId])) {
            Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        // File upload — required for new document
        if (!$request->hasFile('file')) {
            Response::error('É obrigatório enviar um ficheiro.', ['file' => 'Ficheiro obrigatório.'], 422);
        }

        $uploaded = moveUpload($request->file('file'), 'document');
        if ($uploaded === false) {
            Response::error('Erro no upload: ' . getUploadError(), [], 422);
        }

        $newId = $this->model->create([
            'company_id'      => $companyId,
            'uploaded_by'     => Auth::id(),
            'title'           => $data['title'],
            'description'     => $data['description']   ?? null,
            'category'        => $data['category']       ?? null,
            'file_path'       => $uploaded['path'],
            'original_name'   => $uploaded['original_name'],
            'file_type'       => $uploaded['ext'],
            'file_size'       => $uploaded['size'],
            'file_size_human' => $uploaded['size_human'],
            'is_confidential' => $isConfidential ? 1 : 0,
            'is_active'       => 1,
        ]);

        $created = $this->model->findWithDetails($newId);

        ActivityLog::write('create_document', 'document', $newId, $data['title'], [
            'file_type'       => $uploaded['ext'],
            'is_confidential' => $isConfidential,
        ]);

        Response::created($created, 'Documento carregado com sucesso.');
    }

    // ── PUT /api/documents/{id} ───────────────────────────────────
    public function update(Request $request): void
    {
        $id  = $request->paramInt('id');
        $doc = $this->model->find($id);

        if (!$doc || !$doc['is_active']) Response::notFound('Documento não encontrado.');

        // Editors only update own uploads; admins update any
        if (!Auth::isAdmin() && (int)$doc['uploaded_by'] !== Auth::id()) {
            Response::forbidden('Só pode editar os seus próprios documentos.');
        }

        $data = $request->only(['title','description','category','is_confidential']);

        $v = new Validator();
        $v->validate($data, [
            'title'           => 'required|string|min:3|max:500',
            'description'     => 'nullable|string|max:2000',
            'category'        => 'nullable|string|max:100',
            'is_confidential' => 'nullable|boolean',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        // Only admins can mark as confidential
        $isConf = Auth::isAdmin() ? (!empty($data['is_confidential']) ? 1 : 0) : $doc['is_confidential'];

        $this->model->updateDoc($id, [
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'category'        => $data['category']    ?? null,
            'is_confidential' => $isConf,
        ]);

        $updated = $this->model->findWithDetails($id);

        ActivityLog::write('update_document', 'document', $id, $doc['title']);

        Response::success($updated, 'Documento actualizado com sucesso.');
    }

    // ── DELETE /api/documents/{id} ────────────────────────────────
    public function destroy(Request $request): void
    {
        $id  = $request->paramInt('id');
        $doc = $this->model->find($id);

        if (!$doc) Response::notFound('Documento não encontrado.');

        // Delete physical file
        if (!empty($doc['file_path'])) {
            deleteUploadFile($doc['file_path']);
        }

        $this->model->delete($id);

        ActivityLog::write('delete_document', 'document', $id, $doc['title'], [
            'file_type'       => $doc['file_type'],
            'is_confidential' => (bool)$doc['is_confidential'],
        ]);

        Response::success(null, "Documento \"{$doc['title']}\" eliminado com sucesso.");
    }

    // ── GET /api/documents/{id}/download ──────────────────────────
    public function download(Request $request): void
    {
        $id  = $request->paramInt('id');
        $doc = $this->model->findWithDetails($id);

        if (!$doc || !$doc['is_active']) Response::notFound('Documento não encontrado.');

        // Confidential documents only for admins
        if ($doc['is_confidential'] && !Auth::isAdmin()) {
            Response::forbidden('Não tem permissão para descarregar este documento confidencial.');
        }

        $fullPath = realpath(UPLOAD_BASE_PATH . '/' . $doc['file_path']);
        $baseReal = realpath(UPLOAD_BASE_PATH);

        // Path traversal guard
        if (!$fullPath || !$baseReal || !str_starts_with($fullPath, $baseReal)) {
            Response::notFound('Ficheiro não encontrado no servidor.');
        }

        if (!file_exists($fullPath)) {
            Response::notFound('Ficheiro não encontrado no servidor.');
        }

        // Increment download counter
        $this->model->incrementDownload($id);

        ActivityLog::write('download_document', 'document', $id, $doc['title']);

        // Serve file
        $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
        $fileName = $doc['original_name'] ?: basename($fullPath);

        header('Content-Type: ' . $mimeType);
        header('Content-Disposition: attachment; filename="' . addslashes($fileName) . '"');
        header('Content-Length: ' . filesize($fullPath));
        header('Cache-Control: private, no-cache');
        header('X-Content-Type-Options: nosniff');

        // Remove JSON content-type set by index.php
        header_remove('Content-Type');
        header('Content-Type: ' . $mimeType);

        readfile($fullPath);
        exit;
    }
}
