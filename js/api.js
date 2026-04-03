/* =============================================
   INOV INTRANET — API CLIENT
   Camada de comunicação com o backend PHP
   ============================================= */

// URL relativa — funciona em localhost e em produção sem alterações
const API_BASE = '/backend/api';

// Token CSRF em memória (reposto após cada login)
let _csrfToken = localStorage.getItem('inov_csrf') || null;

const api = {

  // ── Core request ──────────────────────────────────────────────
  async request(method, endpoint, data = null, isFormData = false) {
    const headers = {};
    if (_csrfToken) headers['X-CSRF-Token'] = _csrfToken;
    if (!isFormData && data) headers['Content-Type'] = 'application/json';

    const options = { method, credentials: 'include', headers };
    if (data) options.body = isFormData ? data : JSON.stringify(data);

    let res, json;
    try {
      res  = await fetch(`${API_BASE}${endpoint}`, options);
      json = await res.json();
    } catch (err) {
      console.error('[API] Erro de rede:', err);
      return { success: false, message: 'Sem ligação ao servidor.' };
    }

    // Guardar CSRF token sempre que o servidor o enviar
    const token = json?.data?.csrf_token || json?.data?.user?.csrf_token;
    if (token) {
      _csrfToken = token;
      localStorage.setItem('inov_csrf', token);
    }

    return json;
  },

  get:    (ep)    => api.request('GET',    ep),
  post:   (ep, d) => api.request('POST',   ep, d),
  put:    (ep, d) => api.request('PUT',    ep, d),
  delete: (ep)    => api.request('DELETE', ep),

  // ── Auth ──────────────────────────────────────────────────────
  login(email, password) {
    _csrfToken = null;
    localStorage.removeItem('inov_csrf');
    return api.post('/auth/login', { email, password });
  },
  logout() { return api.post('/auth/logout'); },
  me()     { return api.get('/auth/me'); },
  changePwd(currentPassword, newPassword) {
    return api.put('/auth/change-password', { current_password: currentPassword, password: newPassword, password_confirmation: newPassword });
  },
  forgotPwd(email) { return api.post('/auth/forgot-password', { email }); },

  // ── Dashboard ─────────────────────────────────────────────────
  dashboard() { return api.get('/dashboard'); },

  // ── News ──────────────────────────────────────────────────────
  news(params = {})     { return api.get('/news'  + buildQuery(params)); },
  newsItem(id)          { return api.get(`/news/${id}`); },
  createNews(data)      { return api.request('POST',  '/news', data, data instanceof FormData); },
  updateNews(id, data)  { return api.request('POST',  `/news/${id}`, data, data instanceof FormData); },
  deleteNews(id)        { return api.delete(`/news/${id}`); },
  publishNews(id)       { return api.post(`/news/${id}/publish`); },
  featureNews(id)       { return api.post(`/news/${id}/feature`); },

  // ── Announcements ─────────────────────────────────────────────
  announcements(params = {}) { return api.get('/announcements' + buildQuery(params)); },
  announcement(id)           { return api.get(`/announcements/${id}`); },
  createAnnouncement(d)      { return api.post('/announcements', d); },
  updateAnnouncement(id, d)  { return api.put(`/announcements/${id}`, d); },
  deleteAnnouncement(id)     { return api.delete(`/announcements/${id}`); },

  // ── Documents ─────────────────────────────────────────────────
  documents(params = {})    { return api.get('/documents' + buildQuery(params)); },
  document(id)              { return api.get(`/documents/${id}`); },
  uploadDocument(formData)  { return api.request('POST', '/documents', formData, true); },
  updateDocument(id, d)     { return api.put(`/documents/${id}`, d); },
  deleteDocument(id)        { return api.delete(`/documents/${id}`); },
  downloadUrl(id)           { return `${API_BASE}/documents/${id}/download`; },

  // ── Companies ─────────────────────────────────────────────────
  companies(params = {})   { return api.get('/companies' + buildQuery(params)); },
  company(id)              { return api.get(`/companies/${id}`); },
  createCompany(formData)  { return api.request('POST', '/companies', formData, true); },
  updateCompany(id, fd)    { return api.request('POST', `/companies/${id}`, fd, true); },
  deleteCompany(id)        { return api.delete(`/companies/${id}`); },

  // ── Brand Assets ──────────────────────────────────────────────
  brandAssets(grouped = false) { return api.get('/brand-assets' + (grouped ? '?grouped=1' : '')); },
  createBrandAsset(fd)         { return api.request('POST', '/brand-assets', fd, true); },
  updateBrandAsset(id, fd)     { return api.request('POST', `/brand-assets/${id}`, fd, true); },
  deleteBrandAsset(id)         { return api.delete(`/brand-assets/${id}`); },

  // ── Gallery ───────────────────────────────────────────────────
  gallery(params = {})        { return api.get('/gallery' + buildQuery(params)); },
  galleryAlbum(id)            { return api.get(`/gallery/${id}`); },
  createAlbum(fd)             { return api.request('POST', '/gallery', fd, true); },
  updateAlbum(id, fd)         { return api.request('POST', `/gallery/${id}`, fd, true); },
  deleteAlbum(id)             { return api.delete(`/gallery/${id}`); },
  addGalleryItem(albumId, fd) { return api.request('POST', `/gallery/${albumId}/items`, fd, true); },
  removeGalleryItem(albumId, itemId) { return api.delete(`/gallery/${albumId}/items/${itemId}`); },

  // ── Users (admin) ─────────────────────────────────────────────
  users(params = {})     { return api.get('/users' + buildQuery(params)); },
  user(id)               { return api.get(`/users/${id}`); },
  createUser(d)          { return api.post('/users', d); },
  updateUser(id, d)      { return api.put(`/users/${id}`, d); },
  deleteUser(id)         { return api.delete(`/users/${id}`); },
  updateUserRole(id, role)   { return api.put(`/users/${id}/role`, { role }); },
  updateUserStatus(id, status) { return api.put(`/users/${id}/status`, { status }); },

  // ── Activity ──────────────────────────────────────────────────
  activityFeed(params = {}) { return api.get('/dashboard/feed' + buildQuery(params)); },
  adminStats()              { return api.get('/dashboard/stats'); },
};

// ── Query string helper ────────────────────────────────────────
function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => encodeURIComponent(k) + '=' + encodeURIComponent(v))
    .join('&');
  return q ? '?' + q : '';
}

// ── Expose globally ────────────────────────────────────────────
window.api       = api;
window.buildQuery = buildQuery;
