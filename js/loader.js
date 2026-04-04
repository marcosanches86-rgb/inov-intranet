/* =============================================
   INOV INTRANET — DATA LOADER
   Carrega dados reais da API e popula os globals
   que o app.js usa (NEWS, COMUNICADOS, etc.)
   v2.1 — 2026-04-04
   ============================================= */

// ── Normalização de dados da API → formato do frontend ─────────

function normalizeNews(items) {
  return (items || []).map(n => ({
    ...n,
    companyId: n.company_id,
    date:     n.published_at || n.created_at,
    company:  n.company_name  || '',
    featured: !!n.is_featured,
    cover:    n.cover_path    ? `/backend/storage/uploads/${n.cover_path}` : null,
    body:     n.body          || n.summary || '',
    author:   n.author_name   || 'Equipa INOV',
    read_time: n.read_time    || 3,
  }));
}

function normalizeComunicados(items) {
  return (items || []).map(c => ({
    ...c,
    date:       c.created_at,
    company:    c.company_name || 'INOV Holding',
    pinned:     !!c.is_pinned,
    read:       false,   // estado local — nunca vem da API
    visibility: c.visibility || 'global',
  }));
}

function normalizeDocuments(items) {
  return (items || []).map(d => ({
    ...d,
    companyId:     d.company_id,
    date:          d.created_at,
    company:       d.company_name || '',
    fileType:      d.file_type    || 'pdf',
    fileSize:      d.file_size_human || '—',
    downloadCount: d.download_count  || 0,
    confidential:  !!d.is_confidential,
    path:          d.file_path || '',
    tags:          Array.isArray(d.tags) ? d.tags : [],
  }));
}

function normalizeCompanies(items) {
  return (items || []).map(c => ({
    ...c,
    shortName:      c.short_name    || c.name.split(' ')[0],
    accentColor:    c.accent_color  || '#C9A24C',
    coverGradient:  c.cover_gradient || makeCoverGradient(c.color || '#0C1A35'),
    logoPath:       c.logo_path ? `/backend/storage/uploads/${c.logo_path}` : null,
    coverPath:      c.cover_path ? `/backend/storage/uploads/${c.cover_path}` : null,
    founded:        String(c.founded_year || c.founded || '2024'),
    employees:      String(c.employees_count || c.employees || '—'),
    location:       c.location || 'Luanda, Angola',
    services:       parseJsonField(c.services),
    values:         parseJsonField(c.values_list || c.values),
    contacts: {
      email: c.email   || '',
      tel:   c.phone   || '',
      web:   c.website || '',
    },
    docs: c.docs || [],
    news: c.news || [],
  }));
}

function normalizeBrandAssets(items) {
  return (items || []).map(b => ({
    ...b,
    companyId: b.company_id,
    date:     b.created_at,
    company:  b.company_name || '',
    format:   b.format       || b.file_type || '',
    version:  b.version      || '1.0',
    colorBg:  b.color_bg     || b.colorBg   || '#111827',
    url:      b.file_path ? `/backend/storage/uploads/${b.file_path}` : null,
  }));
}

function normalizeGallery(items) {
  return (items || []).map(g => ({
    ...g,
    company:   g.company_name || '',
    companyId: g.company_id,
    project:   g.title        || '',
    color:     g.cover_color  || '#111827',
    cover:     g.cover_path   ? `/backend/storage/uploads/${g.cover_path}` : null,
    photos:    (g.items || []).map(item => ({
      ...item,
      url: item.file_path ? `/backend/storage/uploads/${item.file_path}` : null,
    })),
  }));
}

// ── Helpers ────────────────────────────────────────────────────
function makeCoverGradient(hex) {
  // Gera um gradiente subtil a partir da cor base
  const lighter = lightenHex(hex, 30);
  return `linear-gradient(135deg, ${hex} 0%, ${lighter} 100%)`;
}

function lightenHex(hex, amount) {
  const h = hex.replace('#', '');
  const r = Math.min(255, parseInt(h.substring(0,2), 16) + amount);
  const g = Math.min(255, parseInt(h.substring(2,4), 16) + amount);
  const b = Math.min(255, parseInt(h.substring(4,6), 16) + amount);
  return '#' + [r,g,b].map(x => x.toString(16).padStart(2,'0')).join('');
}

function parseJsonField(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val.split(',').map(s => s.trim()); }
  }
  return [];
}

// ── Loader principal ───────────────────────────────────────────
async function loadAndBoot() {
  // Limpar dados mock do localStorage (garantir que não sobrepõem dados da API)
  ['inov_gallery','inov_news','inov_comunicados','inov_documents','inov_brands'].forEach(k => localStorage.removeItem(k));

  // Mostrar estado de carregamento
  const loader = document.getElementById('appLoader');
  if (loader) loader.style.display = 'flex';

  try {
    // Verificar sessão no servidor
    const meRes = await api.me();
    if (!meRes.success) {
      clearSession();
      window.location.href = 'index.html';
      return;
    }

    // Actualizar sessão local com dados frescos do servidor
    const serverUser = meRes.data;
    const uiRole = (serverUser.role === 'super_admin' || serverUser.role === 'admin') ? 'admin'
                 : serverUser.role === 'editor' ? 'editor'
                 : 'user';

    const session = {
      id:        serverUser.id,
      name:      serverUser.name,
      email:     serverUser.email,
      role:      uiRole,
      roleRaw:   serverUser.role,
      company:   serverUser.company_name  || '',
      dept:      serverUser.department    || '',
      job:       serverUser.job_title     || '',
      avatar:    serverUser.avatar        || makeInitials(serverUser.name),
      avatarUrl: serverUser.avatar_path   || null,
      company_id:serverUser.company_id,
      loggedAt:  new Date().toISOString(),
    };
    setSession(session);
    window.currentUser = session;

    // Carregar todos os dados em paralelo
    const [dashRes, newsRes, comunRes, docsRes, companiesRes, brandsRes, galleryRes] = await Promise.allSettled([
      api.dashboard(),
      api.news({ per_page: 100 }),
      api.announcements({ per_page: 100 }),
      api.documents({ per_page: 100 }),
      api.companies({ per_page: 100 }),
      api.brandAssets(false),
      api.gallery({ per_page: 100 }),
    ]);

    // Popular globals com dados reais (fallback para mock se falhar)
    if (newsRes.status === 'fulfilled' && newsRes.value?.success) {
      window.NEWS = normalizeNews(newsRes.value.data?.items || newsRes.value.data || []);
    }
    if (comunRes.status === 'fulfilled' && comunRes.value?.success) {
      window.COMUNICADOS = normalizeComunicados(comunRes.value.data?.items || comunRes.value.data || []);
    }
    if (docsRes.status === 'fulfilled' && docsRes.value?.success) {
      window.DOCUMENTS = normalizeDocuments(docsRes.value.data?.items || docsRes.value.data || []);
    }
    if (companiesRes.status === 'fulfilled' && companiesRes.value?.success) {
      window.COMPANIES = normalizeCompanies(companiesRes.value.data?.items || companiesRes.value.data || []);
    }
    if (brandsRes.status === 'fulfilled' && brandsRes.value?.success) {
      const assets = brandsRes.value.data?.items || brandsRes.value.data || [];
      window.BRAND_ASSETS = normalizeBrandAssets(assets);
    }
    if (galleryRes.status === 'fulfilled' && galleryRes.value?.success) {
      window.GALLERY = normalizeGallery(galleryRes.value.data?.items || galleryRes.value.data || []);
    }

    // Arrancar a UI
    if (loader) loader.style.display = 'none';
    bootUI();
    navigate('dashboard');

  } catch (err) {
    console.error('[Loader] Erro ao carregar dados:', err);
    // Fallback: arrancar com dados mock
    if (typeof seedContent === 'function') seedContent();
    if (loader) loader.style.display = 'none';
    bootUI();
    navigate('dashboard');
  }
}

function makeInitials(name) {
  return (name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U';
}
