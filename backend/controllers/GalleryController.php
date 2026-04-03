<?php
declare(strict_types=1);

// ================================================================
//  GalleryController
//
//  Routes:
//    GET    /api/gallery                         → index()        [auth]
//    GET    /api/gallery/{id}                    → show()         [auth]
//    POST   /api/gallery                         → store()        [editor]
//    PUT    /api/gallery/{id}                    → update()       [editor + CSRF]
//    DELETE /api/gallery/{id}                    → destroy()      [admin  + CSRF]
//    POST   /api/gallery/{id}/items              → addItem()      [editor + CSRF]
//    DELETE /api/gallery/{id}/items/{itemId}     → removeItem()   [editor + CSRF]
//    PUT    /api/gallery/{id}/reorder            → reorder()      [editor + CSRF]
// ================================================================

class GalleryController
{
    private GalleryAlbum $albumModel;
    private GalleryItem  $itemModel;

    public function __construct()
    {
        $this->albumModel = new GalleryAlbum();
        $this->itemModel  = new GalleryItem();
    }

    // ── GET /api/gallery ──────────────────────────────────────────
    public function index(Request $request): void
    {
        $filters = $request->only(['company_id', 'category', 'search']);
        $page    = $request->page();
        $perPage = $request->perPage();

        $result = $this->albumModel->listPaginated(
            $page, $perPage,
            array_filter($filters, fn($v) => $v !== null && $v !== '')
        );

        Response::paginated(
            $result['items'], $result['total'], $page, $perPage,
            'Álbuns listados com sucesso.'
        );
    }

    // ── GET /api/gallery/{id} ─────────────────────────────────────
    public function show(Request $request): void
    {
        $id    = $request->paramInt('id');
        $album = $this->albumModel->findWithItems($id);

        if (!$album || !$album['is_active']) {
            Response::notFound('Álbum não encontrado.');
        }

        Response::success($album, 'Álbum obtido com sucesso.');
    }

    // ── POST /api/gallery ─────────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only(['title', 'description', 'category', 'company_id', 'cover_color', 'sort_order']);

        $v = new Validator();
        $v->validate($data, [
            'title'       => 'required|string|min:3|max:300',
            'company_id'  => 'required|integer',
            'description' => 'nullable|string|max:2000',
            'category'    => 'nullable|string|max:100',
            'cover_color' => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'sort_order'  => 'nullable|integer|min_val:0',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        $companyId = (int)$data['company_id'];
        if (!Database::queryOne("SELECT id FROM companies WHERE id = :id", [':id' => $companyId])) {
            Response::validationError(['company_id' => 'Empresa inválida.']);
        }

        // Optional cover image
        $coverPath = null;
        if ($request->hasFile('cover')) {
            $uploaded = moveUpload($request->file('cover'), 'gallery');
            if ($uploaded === false) {
                Response::error('Erro no upload da capa: ' . getUploadError(), [], 422);
            }
            $coverPath = $uploaded['path'];
        }

        $newId = $this->albumModel->create([
            'company_id'  => $companyId,
            'created_by'  => Auth::id(),
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'category'    => $data['category']    ?? null,
            'cover_path'  => $coverPath,
            'cover_color' => $data['cover_color'] ?? '#111827',
            'is_active'   => 1,
            'sort_order'  => !empty($data['sort_order']) ? (int)$data['sort_order'] : 0,
        ]);

        $created = $this->albumModel->findWithItems($newId);

        ActivityLog::write('create_gallery_album', 'gallery_album', $newId, $data['title'], [
            'company_id' => $companyId,
        ]);

        Response::created($created, 'Álbum criado com sucesso.');
    }

    // ── PUT /api/gallery/{id} ─────────────────────────────────────
    public function update(Request $request): void
    {
        $id    = $request->paramInt('id');
        $album = $this->albumModel->find($id);

        if (!$album || !$album['is_active']) {
            Response::notFound('Álbum não encontrado.');
        }

        $data = $request->only(['title', 'description', 'category', 'cover_color', 'sort_order', 'remove_cover']);

        $v = new Validator();
        $v->validate($data, [
            'title'        => 'required|string|min:3|max:300',
            'description'  => 'nullable|string|max:2000',
            'category'     => 'nullable|string|max:100',
            'cover_color'  => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'sort_order'   => 'nullable|integer|min_val:0',
        ]);
        if ($v->fails()) Response::validationError($v->getErrors());

        $updateData = [
            'title'       => $data['title'],
            'description' => $data['description'] ?? null,
            'category'    => $data['category']    ?? $album['category'],
            'cover_color' => $data['cover_color'] ?? $album['cover_color'],
            'sort_order'  => isset($data['sort_order']) ? (int)$data['sort_order'] : $album['sort_order'],
        ];

        // Handle cover image replacement
        if ($request->hasFile('cover')) {
            $uploaded = moveUpload($request->file('cover'), 'gallery');
            if ($uploaded === false) {
                Response::error('Erro no upload da capa: ' . getUploadError(), [], 422);
            }
            if (!empty($album['cover_path'])) {
                deleteUploadFile($album['cover_path']);
            }
            $updateData['cover_path'] = $uploaded['path'];
        } elseif (!empty($data['remove_cover'])) {
            // Explicitly remove cover without replacement
            if (!empty($album['cover_path'])) {
                deleteUploadFile($album['cover_path']);
            }
            $updateData['cover_path'] = null;
        }

        $this->albumModel->updateAlbum($id, $updateData);

        ActivityLog::write('update_gallery_album', 'gallery_album', $id, $album['title']);

        Response::success($this->albumModel->findWithItems($id), 'Álbum actualizado com sucesso.');
    }

    // ── DELETE /api/gallery/{id} ──────────────────────────────────
    public function destroy(Request $request): void
    {
        $id    = $request->paramInt('id');
        $album = $this->albumModel->find($id);

        if (!$album) Response::notFound('Álbum não encontrado.');

        // Delete all item files
        $itemPaths = $this->albumModel->getAllItemPaths($id);
        foreach ($itemPaths as $row) {
            if (!empty($row['file_path'])) {
                deleteUploadFile($row['file_path']);
            }
        }

        // Delete cover image
        if (!empty($album['cover_path'])) {
            deleteUploadFile($album['cover_path']);
        }

        // Cascade-delete items then album (or rely on FK ON DELETE CASCADE)
        Database::execute(
            "DELETE FROM `gallery_items` WHERE `album_id` = :id",
            [':id' => $id]
        );
        $this->albumModel->delete($id);

        ActivityLog::write('delete_gallery_album', 'gallery_album', $id, $album['title']);

        Response::success(null, "Álbum \"{$album['title']}\" eliminado com sucesso.");
    }

    // ── POST /api/gallery/{id}/items ──────────────────────────────
    public function addItem(Request $request): void
    {
        $albumId = $request->paramInt('id');
        $album   = $this->albumModel->find($albumId);

        if (!$album || !$album['is_active']) {
            Response::notFound('Álbum não encontrado.');
        }

        // File is required
        if (!$request->hasFile('file')) {
            Response::error('É obrigatório enviar o ficheiro de imagem.', ['file' => 'Ficheiro obrigatório.'], 422);
        }

        $uploaded = moveUpload($request->file('file'), 'gallery');
        if ($uploaded === false) {
            Response::error('Erro no upload: ' . getUploadError(), [], 422);
        }

        $data = $request->only(['title', 'description', 'sort_order']);

        // Extract image dimensions if it's an image
        $width  = null;
        $height = null;
        $fullPath = realpath(UPLOAD_BASE_PATH . '/' . $uploaded['path']);
        if ($fullPath && function_exists('getimagesize')) {
            $imgInfo = @getimagesize($fullPath);
            if ($imgInfo) {
                $width  = $imgInfo[0];
                $height = $imgInfo[1];
            }
        }

        $sortOrder = !empty($data['sort_order'])
            ? (int)$data['sort_order']
            : $this->itemModel->getNextSortOrder($albumId);

        $newId = $this->itemModel->create([
            'album_id'      => $albumId,
            'uploaded_by'   => Auth::id(),
            'title'         => $data['title']       ?? null,
            'description'   => $data['description'] ?? null,
            'file_path'     => $uploaded['path'],
            'original_name' => $uploaded['original_name'],
            'file_size'     => $uploaded['size'],
            'width'         => $width,
            'height'        => $height,
            'sort_order'    => $sortOrder,
        ]);

        // Update item count on the album
        $this->albumModel->updateItemCount($albumId);

        $item = $this->itemModel->find($newId);

        ActivityLog::write('add_gallery_item', 'gallery_album', $albumId, $album['title'], [
            'item_id'   => $newId,
            'file_name' => $uploaded['original_name'],
        ]);

        Response::created($item, 'Imagem adicionada ao álbum com sucesso.');
    }

    // ── DELETE /api/gallery/{id}/items/{itemId} ───────────────────
    public function removeItem(Request $request): void
    {
        $albumId = $request->paramInt('id');
        $itemId  = $request->paramInt('itemId');

        $album = $this->albumModel->find($albumId);
        if (!$album) Response::notFound('Álbum não encontrado.');

        $item = $this->itemModel->find($itemId);
        if (!$item || (int)$item['album_id'] !== $albumId) {
            Response::notFound('Imagem não encontrada neste álbum.');
        }

        // Delete physical file
        if (!empty($item['file_path'])) {
            deleteUploadFile($item['file_path']);
        }

        $this->itemModel->delete($itemId);

        // Update item count on the album
        $this->albumModel->updateItemCount($albumId);

        ActivityLog::write('remove_gallery_item', 'gallery_album', $albumId, $album['title'], [
            'item_id' => $itemId,
        ]);

        Response::success(null, 'Imagem removida do álbum com sucesso.');
    }

    // ── PUT /api/gallery/{id}/reorder ─────────────────────────────
    public function reorder(Request $request): void
    {
        $albumId = $request->paramInt('id');
        $album   = $this->albumModel->find($albumId);

        if (!$album || !$album['is_active']) {
            Response::notFound('Álbum não encontrado.');
        }

        // Expects body: { "items": [3, 1, 5, 2, 4] }  — array of item IDs in new order
        $body = $request->body();
        $ids  = $body['items'] ?? null;

        if (!is_array($ids) || empty($ids)) {
            Response::validationError(['items' => 'Envie um array de IDs ordenados.']);
        }

        // Sanitise — integers only, all belonging to this album
        $ids = array_map('intval', $ids);
        $ids = array_filter($ids, fn($v) => $v > 0);

        if (empty($ids)) {
            Response::validationError(['items' => 'IDs inválidos.']);
        }

        $this->itemModel->reorder(array_values($ids));

        Response::success(
            $this->albumModel->findWithItems($albumId),
            'Ordem das imagens actualizada com sucesso.'
        );
    }
}
