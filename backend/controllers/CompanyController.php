<?php
declare(strict_types=1);

// ================================================================
//  CompanyController
//
//  Routes:
//    GET  /api/companies       → index()   [auth]
//    GET  /api/companies/{id}  → show()    [auth]
//    POST /api/companies        → store()   [admin + CSRF]
//    PUT  /api/companies/{id}  → update()  [admin + CSRF]
// ================================================================

class CompanyController
{
    private Company $model;

    public function __construct()
    {
        $this->model = new Company();
    }

    // ── GET /api/companies ────────────────────────────────────────
    public function index(Request $request): void
    {
        // Admins see all companies (including inactive) with stats
        // Regular users see only active companies
        if (Auth::isAdmin()) {
            $companies = $this->model->allForAdmin();
        } else {
            $companies = $this->model->allActive();
        }

        Response::success($companies, 'Empresas listadas com sucesso.');
    }

    // ── GET /api/companies/{id} ───────────────────────────────────
    public function show(Request $request): void
    {
        $id = $request->paramInt('id');

        $company = $this->model->findWithStats($id);

        if (!$company) {
            Response::notFound('Empresa não encontrada.');
        }

        // Non-admins cannot see inactive companies
        if (!$company['is_active'] && !Auth::isAdmin()) {
            Response::notFound('Empresa não encontrada.');
        }

        // Add recent news for this company
        $recentNews = Database::query(
            "SELECT id, slug, title, summary, category, cover_path,
                    is_featured, published_at, read_time, views
               FROM `news`
              WHERE company_id = :cid AND status = 'published'
              ORDER BY published_at DESC
              LIMIT 5",
            [':cid' => $id]
        );

        // Add recent documents (non-confidential for non-admins)
        $docWhere = Auth::isAdmin() ? '' : 'AND is_confidential = 0';
        $recentDocs = Database::query(
            "SELECT id, title, description, category, file_type,
                    file_size_human, download_count, created_at
               FROM `documents`
              WHERE company_id = :cid AND is_active = 1 {$docWhere}
              ORDER BY created_at DESC
              LIMIT 5",
            [':cid' => $id]
        );

        $company['recent_news']      = $recentNews;
        $company['recent_documents'] = $recentDocs;

        Response::success($company, 'Empresa obtida com sucesso.');
    }

    // ── POST /api/companies ───────────────────────────────────────
    public function store(Request $request): void
    {
        $data = $request->only([
            'name', 'short_name', 'slug', 'tagline', 'description',
            'sector', 'founded_year', 'location', 'employees',
            'color', 'accent_color', 'cover_gradient',
            'email', 'phone', 'website',
            'services', 'values_list',
            'is_active', 'sort_order',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'name'          => 'required|string|min:2|max:200',
            'short_name'    => 'required|string|min:1|max:50',
            'tagline'       => 'nullable|string|max:350',
            'description'   => 'nullable|string|max:5000',
            'sector'        => 'nullable|string|max:200',
            'founded_year'  => 'nullable|integer|min_val:1900|max_val:2100',
            'location'      => 'nullable|string|max:200',
            'employees'     => 'nullable|string|max:50',
            'color'         => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'accent_color'  => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'email'         => 'nullable|email|max:200',
            'phone'         => 'nullable|string|max:50',
            'website'       => 'nullable|url|max:300',
            'sort_order'    => 'nullable|integer|min_val:0',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // Slug uniqueness
        if (!empty($data['slug'])) {
            if ($this->model->slugExists($data['slug'])) {
                Response::conflict('Este slug já está em uso por outra empresa.');
            }
        }

        // Parse services and values as arrays
        $data['services']    = $this->parseList($data['services']    ?? []);
        $data['values_list'] = $this->parseList($data['values_list'] ?? []);
        $data['is_active']   = isset($data['is_active']) ? (int)(bool)$data['is_active'] : 1;

        $newId   = $this->model->create($data);
        $company = $this->model->findWithStats($newId);

        ActivityLog::write('create_company', 'company', $newId, $data['name']);

        Response::created($company, 'Empresa criada com sucesso.');
    }

    // ── PUT /api/companies/{id} ───────────────────────────────────
    public function update(Request $request): void
    {
        $id      = $request->paramInt('id');
        $company = $this->model->find($id);

        if (!$company) Response::notFound('Empresa não encontrada.');

        $data = $request->only([
            'name', 'short_name', 'slug', 'tagline', 'description',
            'sector', 'founded_year', 'location', 'employees',
            'color', 'accent_color', 'cover_gradient',
            'email', 'phone', 'website',
            'services', 'values_list',
            'is_active', 'sort_order',
        ]);

        // ── Validation ────────────────────────────────────────────
        $v = new Validator();
        $v->validate($data, [
            'name'         => 'required|string|min:2|max:200',
            'short_name'   => 'required|string|min:1|max:50',
            'tagline'      => 'nullable|string|max:350',
            'description'  => 'nullable|string|max:5000',
            'sector'       => 'nullable|string|max:200',
            'founded_year' => 'nullable|integer|min_val:1900|max_val:2100',
            'location'     => 'nullable|string|max:200',
            'employees'    => 'nullable|string|max:50',
            'color'        => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'accent_color' => 'nullable|regex:^#[0-9A-Fa-f]{6}$',
            'email'        => 'nullable|email|max:200',
            'phone'        => 'nullable|string|max:50',
            'website'      => 'nullable|url|max:300',
            'sort_order'   => 'nullable|integer|min_val:0',
        ]);

        if ($v->fails()) Response::validationError($v->getErrors());

        // Slug uniqueness (exclude this company)
        if (!empty($data['slug']) && $data['slug'] !== $company['slug']) {
            if ($this->model->slugExists($data['slug'], $id)) {
                Response::conflict('Este slug já está em uso por outra empresa.');
            }
        }

        // Parse list fields
        if (isset($data['services']))    $data['services']    = $this->parseList($data['services']);
        if (isset($data['values_list'])) $data['values_list'] = $this->parseList($data['values_list']);
        if (isset($data['is_active']))   $data['is_active']   = (int)(bool)$data['is_active'];

        $this->model->updateCompany($id, $data);

        $updated = $this->model->findWithStats($id);

        ActivityLog::write('update_company', 'company', $id, $company['name'], [
            'fields_changed' => array_keys($data),
        ]);

        Response::success($updated, 'Empresa actualizada com sucesso.');
    }

    // ── Helpers ───────────────────────────────────────────────────

    /**
     * Accept services/values either as:
     *   - JSON array: ["item1","item2"]
     *   - Comma-separated string: "item1,item2,item3"
     *   - Already a PHP array: ["item1","item2"]
     */
    private function parseList(mixed $input): array
    {
        if (is_array($input)) {
            return array_values(array_filter(array_map('trim', $input)));
        }

        if (is_string($input)) {
            // Try JSON first
            $decoded = json_decode($input, true);
            if (is_array($decoded)) {
                return array_values(array_filter(array_map('trim', $decoded)));
            }
            // Fallback: comma-separated
            return array_values(array_filter(array_map('trim', explode(',', $input))));
        }

        return [];
    }
}
