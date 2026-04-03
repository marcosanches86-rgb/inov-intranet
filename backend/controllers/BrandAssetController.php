<?php
declare(strict_types=1);

// ================================================================
//  BrandAssetController
//
//  Routes:
//    GET    /api/brand-assets       → index()    [auth]
//    GET    /api/brand-assets/{id}  → show()     [auth]
//    POST   /api/brand-assets       → store()    [editor]
//    PUT    /api/brand-assets/{id}  → update()   [editor + CSRF]
//    DELETE /api/brand-assets/{id}  → destroy()  [admin  + CSRF]
// ================================================================

class BrandAssetController
{
    private BrandAsset $model;

    public function __construct()
    {
        $this->model = new BrandAsset();
    }

    // ── GET /api/brand-assets ─────────────────────────────────────
    public function index(Request $request): void
    {
        // ?grouped=1 returns assets grouped by company (for the brand library UI)
        if ($request->get('grouped') == '1') {
            $grouped = $this->model->listGroupedByCompany();
            Response::success($grouped, 'Activos de marca agrupados por empresa.');
        }

        $filters = $request->only(['company_id','asset_type','search']);
        $page    = $request->page();
        $perPage = $request->perPage();

        $result = $this->model->listPaginated(
            $page, $perPage,
            array_filter($filters, fn($v) => $v !== null && $v !== '')
        );

        Response::paginated(
            $result['items'], $result['total'], $page, $perPage,
            'Activos de marca listados com sucesso.'
        );
    }

    // ── GET /api/brand-assets/{id} ────────────────────────────────
    public function show(Request $request): void
    {
        $id    = $request->paramInt('id');
        $asset = $this->model->find($id);

        if (!$asset || !$asset['is_active']) Response::notFound('Activo de marca não encontrado.');

        Response::success($asset, 'Activo de marca obtido com sucesso.');
    }

    // ── POST /api/brand-assets ────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only(['name','company_id','asset_type','format','version',
                                'color','color_bg','initials','sort_order']);

        $v = new Validator();
        $v->validate($data, [
            'name'       => 'required|string|min:3|max:300',
            'company_id' => 'required|integer',
            'asset_type' => 'nullable|string|max:100',
            'format'     => 'nullable|string|max:100',
            'version'    => 'nullable|string|max:20',
            'color'      => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'color_bg'   => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'initials'   => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min_val:0',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        $companyId = (int)$data['company_id'];
        if (!Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId])) {
            Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        // File upload — required
        if (!$request->hasFile('file')) {
            Response::error('É obrigatório enviar o ficheiro do logo/activo.', ['file' => 'Ficheiro obrigatório.'], 422);
        }

        $uploaded = moveUpload($request->file('file'), 'logo');
        if ($uploaded === false) {
            Response::error('Erro no upload: ' . getUploadError(), [], 422);
        }

        $newId = $this->model->create([
            'company_id'    => $companyId,
            'uploaded_by'   => Auth::id(),
            'name'          => $data['name'],
            'asset_type'    => $data['asset_type']  ?? null,
            'format'        => $data['format']       ?? $uploaded['ext'],
            'version'       => $data['version']      ?? 'v1.0',
            'file_path'     => $uploaded['path'],
            'original_name' => $uploaded['original_name'],
            'file_size'     => $uploaded['size'],
            'color'         => $data['color']        ?? null,
            'color_bg'      => $data['color_bg']     ?? null,
            'initials'      => $data['initials']     ?? null,
            'sort_order'    => !empty($data['sort_order']) ? (int)$data['sort_order'] : 0,
            'is_active'     => 1,
        ]);

        $created = $this->model->find($newId);

        ActivityLog::write('create_brand_asset', 'brand_asset', $newId, $data['name'], [
            'company_id' => $companyId,
        ]);

        Response::created($created, 'Activo de marca carregado com sucesso.');
    }

    // ── PUT /api/brand-assets/{id} ────────────────────────────────
    public function update(Request $request): void
    {
        $id    = $request->paramInt('id');
        $asset = $this->model->find($id);

        if (!$asset || !$asset['is_active']) Response::notFound('Activo de marca não encontrado.');

        $data = $request->only(['name','asset_type','format','version',
                                'color','color_bg','initials','sort_order']);

        $v = new Validator();
        $v->validate($data, [
            'name'       => 'required|string|min:3|max:300',
            'asset_type' => 'nullable|string|max:100',
            'format'     => 'nullable|string|max:100',
            'version'    => 'nullable|string|max:20',
            'color'      => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'color_bg'   => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'initials'   => 'nullable|string|max:10',
            'sort_order' => 'nullable|integer|min_val:0',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        // Optional file replacement
        if ($request->hasFile('file')) {
            $uploaded = moveUpload($request->file('file'), 'logo');
            if ($uploaded === false) {
                Response::error('Erro no upload: ' . getUploadError(), [], 422);
            }
            deleteUploadFile($asset['file_path']);
            $this->model->update($id, [
                'file_path'     => $uploaded['path'],
                'original_name' => $uploaded['original_name'],
                'file_size'     => $uploaded['size'],
            ]);
        }

        $this->model->updateAsset($id, [
            'name'       => $data['name'],
            'asset_type' => $data['asset_type'] ?? $asset['asset_type'],
            'format'     => $data['format']     ?? $asset['format'],
            'version'    => $data['version']    ?? $asset['version'],
            'color'      => $data['color']      ?? $asset['color'],
            'color_bg'   => $data['color_bg']   ?? $asset['color_bg'],
            'initials'   => $data['initials']   ?? $asset['initials'],
            'sort_order' => isset($data['sort_order']) ? (int)$data['sort_order'] : $asset['sort_order'],
        ]);

        ActivityLog::write('update_brand_asset', 'brand_asset', $id, $asset['name']);

        Response::success($this->model->find($id), 'Activo de marca actualizado com sucesso.');
    }

    // ── DELETE /api/brand-assets/{id} ─────────────────────────────
    public function destroy(Request $request): void
    {
        $id    = $request->paramInt('id');
        $asset = $this->model->find($id);

        if (!$asset) Response::notFound('Activo de marca não encontrado.');

        if (!empty($asset['file_path'])) deleteUploadFile($asset['file_path']);

        $this->model->delete($id);

        ActivityLog::write('delete_brand_asset', 'brand_asset', $id, $asset['name']);

        Response::success(null, "Activo \"{$asset['name']}\" eliminado com sucesso.");
    }
}
