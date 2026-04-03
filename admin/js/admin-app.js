/* =============================================
   INOV CMS — Admin Application
   Full SPA with 8 management modules
   ============================================= */

let cmsUser = null;
let cmsCurrentModule = 'dashboard';

// =============================================
// BOOT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  cmsUser = requireAuth();
  if (!cmsUser) return;
  if (!['admin','editor'].includes(cmsUser.role)) {
    window.location.href = '../app.html';
    return;
  }
  seedUsers();
  seedContent();
  cmsBootUI();
  cmsNavigate('dashboard');
});

function cmsBootUI() {
  document.getElementById('cmsUserAv').textContent    = cmsUser.avatar || 'A';
  document.getElementById('cmsUserName').textContent  = cmsUser.name;
  document.getElementById('cmsUserRole').textContent  = cmsUser.job || cmsUser.role;
  document.getElementById('cmsHeaderAv').textContent  = cmsUser.avatar || 'A';

  // Nav badges
  updateNavBadges();

  // Mobile sidebar
  document.getElementById('cmsMenuBtn').addEventListener('click', () => {
    document.getElementById('cmsSidebar').classList.toggle('open');
    document.getElementById('cmsOverlay').classList.toggle('open');
  });
  const overlay = document.createElement('div');
  overlay.className = 'cms-overlay'; overlay.id = 'cmsOverlay';
  overlay.addEventListener('click', () => {
    document.getElementById('cmsSidebar').classList.remove('open');
    overlay.classList.remove('open');
  });
  document.body.appendChild(overlay);

  // Logout
  document.getElementById('cmsLogoutBtn').addEventListener('click', () => {
    clearSession(); window.location.href = '../index.html';
  });
}

function updateNavBadges() {
  const n = document.getElementById('badgeNewsCount');
  const c = document.getElementById('badgeComunCount');
  const d = document.getElementById('badgeDocsCount');
  const u = document.getElementById('badgeUsersCount');
  if (n) n.textContent = NEWS.length || '';
  if (c) c.textContent = COMUNICADOS.length || '';
  if (d) d.textContent = DOCUMENTS.length || '';
  const allUsers = getAllUsers();
  const pendingUsers = allUsers.filter(u2 => u2.status === 'pending').length;
  if (u) u.textContent = pendingUsers > 0 ? pendingUsers : '';
}

// =============================================
// ROUTER
// =============================================
function cmsNavigate(module) {
  cmsCurrentModule = module;
  document.querySelectorAll('.cms-nav-item[data-module]').forEach(el => {
    el.classList.toggle('active', el.dataset.module === module);
  });
  const labels = {
    dashboard:'Dashboard', users:'Utilizadores', news:'Notícias',
    comunicados:'Comunicados', docs:'Documentos', brands:'Marcas & Assets',
    gallery:'Galeria', empresas:'Empresas', settings:'Definições'
  };
  document.getElementById('cmsBreadcrumb').textContent = labels[module] || module;
  const main = document.getElementById('cmsMain');
  const renders = {
    dashboard:   renderCMSDashboard,
    users:       renderCMSUsers,
    news:        renderCMSNews,
    comunicados: renderCMSComunicados,
    docs:        renderCMSDocs,
    brands:      renderCMSBrands,
    gallery:     renderCMSGallery,
    empresas:    renderCMSEmpresas,
    settings:    renderCMSSettings,
  };
  if (renders[module]) renders[module](main);
  main.scrollTop = 0;
  document.getElementById('cmsSidebar').classList.remove('open');
  document.getElementById('cmsOverlay')?.classList.remove('open');
}

// =============================================
// TOAST
// =============================================
function cmsToast(msg, type = '') {
  const c = document.getElementById('cmsToast');
  const t = document.createElement('div');
  t.className = `cms-toast ${type}`;
  t.innerHTML = `${type === 'success' ? '✓ ' : type === 'error' ? '✕ ' : ''}${msg}`;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3400);
}

// =============================================
// MODAL
// =============================================
function cmsOpenModal(html) {
  const overlay = document.getElementById('cmsModal');
  overlay.innerHTML = html;
  overlay.classList.add('open');
}
function cmsCloseModal() {
  document.getElementById('cmsModal').classList.remove('open');
  document.getElementById('cmsModal').innerHTML = '';
}

// =============================================
// CONFIRM
// =============================================
function cmsConfirm(title, msg, onConfirm) {
  cmsOpenModal(`
    <div class="cms-confirm">
      <h3>${title}</h3>
      <p>${msg}</p>
      <div class="cms-confirm-actions">
        <button class="cms-btn cms-btn-outline cms-btn-sm" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-danger cms-btn-sm" id="cmsConfirmOk">Confirmar</button>
      </div>
    </div>
  `);
  document.getElementById('cmsConfirmOk').addEventListener('click', () => { cmsCloseModal(); onConfirm(); });
}

// =============================================
// SVG ICONS (local)
// =============================================
const CI = {
  news:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>`,
  users:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  docs:    `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  comun:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>`,
  brand:   `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  gallery: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  company: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  edit:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:   `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  plus:    `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  upload:  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>`,
  x:       `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  star:    `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  starOff: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  eye:     `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  settings:`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
};

function cmsFormatDate(d) {
  return new Date(d).toLocaleDateString('pt-AO', { day:'2-digit', month:'short', year:'numeric' });
}
function getPrioChip(p) {
  const m = { high:'cms-chip-red', medium:'cms-chip-amber', low:'cms-chip-gray' };
  const l = { high:'Alta', medium:'Média', low:'Baixa' };
  return `<span class="cms-chip ${m[p]||'cms-chip-gray'}">${l[p]||p}</span>`;
}
function getRoleChip(r) {
  const m = { admin:'cms-chip-dark', editor:'cms-chip-blue', colaborador:'cms-chip-gray', user:'cms-chip-gray' };
  const l = { admin:'Admin', editor:'Editor', colaborador:'Colaborador', user:'User' };
  return `<span class="cms-chip ${m[r]||'cms-chip-gray'}">${l[r]||r}</span>`;
}
function getStatusChip(s) {
  if (s === 'inactive' || s === 'pending') return `<span class="cms-chip cms-chip-amber">${s === 'pending' ? 'Pendente' : 'Inactivo'}</span>`;
  return `<span class="cms-chip cms-chip-green">Activo</span>`;
}
function getCompanyName(id) { return COMPANIES.find(c => c.id === id)?.name || id; }
function getDocTypeChip(t) {
  return `<span class="doc-type ${t}">${t?.toUpperCase()}</span>`;
}

// =============================================
// 1 — DASHBOARD
// =============================================
function renderCMSDashboard(el) {
  const allUsers = getAllUsers();
  const unreadComun = COMUNICADOS.filter(c => !c.read).length;
  const confDocs = DOCUMENTS.filter(d => d.confidencial).length;

  const recentNews  = [...NEWS].slice(0, 5);
  const recentComun = [...COMUNICADOS].slice(0, 5);

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Bem-vindo, ${cmsUser.name.split(' ')[0]} 👋</div>
        <div class="cms-page-subtitle">${new Date().toLocaleDateString('pt-AO',{weekday:'long',day:'numeric',month:'long',year:'numeric'})} · INOV CMS</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-outline" onclick="cmsNavigate('news')">${CI.news} Notícia</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsNavigate('docs')">${CI.plus} Novo Conteúdo</button>
      </div>
    </div>

    <div class="cms-stats">
      <div class="cms-stat">
        <div class="cms-stat-icon blue">${CI.users}</div>
        <div>
          <div class="cms-stat-num">${allUsers.length}</div>
          <div class="cms-stat-lbl">Utilizadores</div>
          <div class="cms-stat-change flat">${allUsers.filter(u=>u.role==='admin').length} admins</div>
        </div>
      </div>
      <div class="cms-stat">
        <div class="cms-stat-icon amber">${CI.news}</div>
        <div>
          <div class="cms-stat-num">${NEWS.length}</div>
          <div class="cms-stat-lbl">Notícias</div>
          <div class="cms-stat-change up">${NEWS.filter(n=>n.featured).length} em destaque</div>
        </div>
      </div>
      <div class="cms-stat">
        <div class="cms-stat-icon green">${CI.docs}</div>
        <div>
          <div class="cms-stat-num">${DOCUMENTS.length}</div>
          <div class="cms-stat-lbl">Documentos</div>
          <div class="cms-stat-change flat">${confDocs} confidenciais</div>
        </div>
      </div>
      <div class="cms-stat">
        <div class="cms-stat-icon red">${CI.comun}</div>
        <div>
          <div class="cms-stat-num">${COMUNICADOS.length}</div>
          <div class="cms-stat-lbl">Comunicados</div>
          <div class="cms-stat-change flat">${unreadComun} por ler</div>
        </div>
      </div>
      <div class="cms-stat">
        <div class="cms-stat-icon gold">${CI.brand}</div>
        <div>
          <div class="cms-stat-num">${BRAND_ASSETS.length}</div>
          <div class="cms-stat-lbl">Assets de Marca</div>
          <div class="cms-stat-change flat">${COMPANIES.length} empresas</div>
        </div>
      </div>
      <div class="cms-stat">
        <div class="cms-stat-icon purple">${CI.gallery}</div>
        <div>
          <div class="cms-stat-num">${GALLERY.length}</div>
          <div class="cms-stat-lbl">Itens na Galeria</div>
          <div class="cms-stat-change flat">Portfolio visual</div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="cms-card" style="margin-bottom:24px;">
      <div class="cms-card-header">
        <div><div class="cms-card-title">Acções Rápidas</div><div class="cms-card-subtitle">Crie novo conteúdo em segundos</div></div>
      </div>
      <div class="cms-card-body">
        <div class="cms-quick-actions">
          <button class="cms-quick-btn" onclick="cmsOpenAddNews()">
            <div class="qb-icon" style="background:#EFF6FF;color:#3B82F6;">${CI.news}</div>
            Nova Notícia
          </button>
          <button class="cms-quick-btn" onclick="cmsOpenAddComun()">
            <div class="qb-icon" style="background:#FFFBEB;color:#F59E0B;">${CI.comun}</div>
            Comunicado
          </button>
          <button class="cms-quick-btn" onclick="cmsOpenAddDoc()">
            <div class="qb-icon" style="background:#F0FDF4;color:#10B981;">${CI.docs}</div>
            Documento
          </button>
          <button class="cms-quick-btn" onclick="cmsOpenAddBrand()">
            <div class="qb-icon" style="background:rgba(201,162,76,.12);color:#C9A24C;">${CI.brand}</div>
            Asset de Marca
          </button>
          <button class="cms-quick-btn" onclick="cmsOpenAddGallery()">
            <div class="qb-icon" style="background:#F5F3FF;color:#8B5CF6;">${CI.gallery}</div>
            Galeria
          </button>
          <button class="cms-quick-btn" onclick="cmsNavigate('users')">
            <div class="qb-icon" style="background:#F3F4F6;color:#374151;">${CI.users}</div>
            Utilizadores
          </button>
        </div>
      </div>
    </div>

    <div class="cms-grid-2">
      <!-- Recent News -->
      <div class="cms-card">
        <div class="cms-card-header">
          <div><div class="cms-card-title">Últimas Notícias</div></div>
          <button class="cms-btn cms-btn-ghost cms-btn-sm" onclick="cmsNavigate('news')">Ver tudo →</button>
        </div>
        <div class="cms-card-body no-pad">
          ${recentNews.length ? recentNews.map(n => `
            <div style="display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid var(--border-2);">
              <div style="width:36px;height:36px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--blue);flex-shrink:0;">${CI.news}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title}</div>
                <div style="font-size:.72rem;color:var(--txt-3);">${getCompanyName(n.companyId)} · ${cmsFormatDate(n.date)}</div>
              </div>
              ${n.featured ? `<span class="featured-star">${CI.star}</span>` : ''}
            </div>
          `).join('') : `<div class="cms-empty"><div class="cms-empty-icon">📰</div><h3>Sem notícias</h3></div>`}
        </div>
      </div>

      <!-- Recent Comunicados -->
      <div class="cms-card">
        <div class="cms-card-header">
          <div><div class="cms-card-title">Comunicados Recentes</div></div>
          <button class="cms-btn cms-btn-ghost cms-btn-sm" onclick="cmsNavigate('comunicados')">Ver tudo →</button>
        </div>
        <div class="cms-card-body no-pad">
          ${recentComun.length ? recentComun.map(c => `
            <div style="display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid var(--border-2);">
              <div style="width:36px;height:36px;background:var(--bg);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--amber);flex-shrink:0;">${CI.comun}</div>
              <div style="flex:1;min-width:0;">
                <div style="font-size:.82rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.title}</div>
                <div style="font-size:.72rem;color:var(--txt-3);">${cmsFormatDate(c.date)}</div>
              </div>
              ${getPrioChip(c.priority)}
            </div>
          `).join('') : `<div class="cms-empty"><div class="cms-empty-icon">📢</div><h3>Sem comunicados</h3></div>`}
        </div>
      </div>
    </div>

    <!-- Activity Feed -->
    <div class="cms-card">
      <div class="cms-card-header">
        <div><div class="cms-card-title">Actividade Recente</div><div class="cms-card-subtitle">Últimas acções no sistema</div></div>
      </div>
      <div class="cms-card-body">
        ${ACTIVITY.map(a => `
          <div class="cms-activity-item">
            <div class="cms-activity-icon">${a.icon}</div>
            <div class="cms-activity-text"><strong>${a.user}</strong> ${a.action} ${a.target} <span style="color:var(--txt-4);">· ${a.company}</span></div>
            <div class="cms-activity-time">${a.time}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// =============================================
// 2 — USERS
// =============================================
function renderCMSUsers(el, filter = '') {
  let users = getAllUsers();
  if (filter) users = users.filter(u =>
    u.name.toLowerCase().includes(filter) ||
    u.email.toLowerCase().includes(filter) ||
    (u.company||'').toLowerCase().includes(filter)
  );

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Utilizadores</div>
        <div class="cms-page-subtitle">${getAllUsers().length} utilizadores registados</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddUser()">${CI.plus} Novo Utilizador</button>
      </div>
    </div>

    <div class="cms-filters">
      <input class="cms-filter-input" id="userSearch" placeholder="Pesquisar por nome, email…" value="${filter}"
             oninput="renderCMSUsers(document.getElementById('cmsMain'), this.value.trim().toLowerCase())" />
      <select class="cms-filter-select" onchange="renderCMSUsers(document.getElementById('cmsMain'), document.getElementById('userSearch').value.trim().toLowerCase())">
        <option value="">Todos os roles</option>
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="colaborador">Colaborador</option>
      </select>
    </div>

    <div class="cms-card">
      <div class="cms-card-body no-pad">
        ${users.length ? `
          <div class="cms-table-wrap">
            <table class="cms-table">
              <thead>
                <tr>
                  <th>Utilizador</th>
                  <th>Empresa</th>
                  <th>Função</th>
                  <th>Role</th>
                  <th>Estado</th>
                  <th>Membro desde</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                ${users.map(u => `
                  <tr>
                    <td>
                      <div class="cms-user-cell">
                        <div class="cms-user-cell-av" style="background:${cmsAvatarColor(u.name)};color:#fff;">${u.avatar||'U'}</div>
                        <div>
                          <div class="cms-user-cell-name">${u.name}</div>
                          <div class="cms-user-cell-email">${u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>${u.company||'—'}</td>
                    <td style="color:var(--txt-3);font-size:.78rem;">${u.job||u.dept||'—'}</td>
                    <td>${getRoleChip(u.role)}</td>
                    <td>${getStatusChip(u.status)}</td>
                    <td style="color:var(--txt-3);font-size:.78rem;">${u.joined ? cmsFormatDate(u.joined) : '—'}</td>
                    <td class="td-actions">
                      <div style="display:flex;gap:4px;">
                        <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" title="Editar" onclick="cmsOpenEditUser(${u.id})">${CI.edit}</button>
                        ${u.id !== cmsUser.id ? `<button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" title="Eliminar" style="color:var(--red);" onclick="cmsDeleteUser(${u.id})">${CI.trash}</button>` : ''}
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : `<div class="cms-empty"><div class="cms-empty-icon">👥</div><h3>Nenhum utilizador encontrado</h3><p>Tente ajustar os filtros de pesquisa</p></div>`}
      </div>
    </div>
  `;
}

function cmsAvatarColor(name) {
  const colors = ['#3B82F6','#10B981','#F59E0B','#EF4444','#8B5CF6','#EC4899','#14B8A6','#F97316'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
  return colors[hash % colors.length];
}

function cmsOpenAddUser() {
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Novo Utilizador</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Nome <span>*</span></label>
            <input class="cms-input" id="nu_name" placeholder="Nome completo" />
          </div>
          <div>
            <label class="cms-label">Email <span>*</span></label>
            <input class="cms-input" id="nu_email" type="email" placeholder="email@empresa.ao" />
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Password <span>*</span></label>
            <input class="cms-input" id="nu_pass" type="password" placeholder="Mínimo 8 caracteres" />
          </div>
          <div>
            <label class="cms-label">Empresa</label>
            <select class="cms-select" id="nu_company">
              ${COMPANIES.map(c => `<option value="${c.name}">${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Departamento</label>
            <input class="cms-input" id="nu_dept" placeholder="Ex: Direcção, Marketing" />
          </div>
          <div>
            <label class="cms-label">Função</label>
            <input class="cms-input" id="nu_job" placeholder="Ex: Director Executivo" />
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Role</label>
            <select class="cms-select" id="nu_role">
              <option value="user">Colaborador</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label class="cms-label">Estado</label>
            <select class="cms-select" id="nu_status">
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>
      </div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddUser()">Criar Utilizador</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddUser() {
  const name = document.getElementById('nu_name')?.value.trim();
  const email = document.getElementById('nu_email')?.value.trim();
  const pass  = document.getElementById('nu_pass')?.value;
  if (!name || !email || !pass) { cmsToast('Preencha todos os campos obrigatórios', 'error'); return; }
  if (pass.length < 8) { cmsToast('Password deve ter ≥ 8 caracteres', 'error'); return; }
  const users = getAllUsers();
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) { cmsToast('Email já registado', 'error'); return; }
  const newUser = {
    id: Date.now(), name, email: email.toLowerCase(), password: pass,
    role: document.getElementById('nu_role').value,
    status: document.getElementById('nu_status').value,
    company: document.getElementById('nu_company').value,
    dept: document.getElementById('nu_dept').value.trim(),
    job: document.getElementById('nu_job').value.trim(),
    avatar: name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(),
    joined: new Date().toISOString().split('T')[0],
  };
  users.push(newUser);
  saveAllUsers(users);
  cmsCloseModal();
  cmsToast(`${name} adicionado com sucesso`, 'success');
  updateNavBadges();
  renderCMSUsers(document.getElementById('cmsMain'));
}

function cmsOpenEditUser(id) {
  const users = getAllUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Utilizador — ${u.name}</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Nome</label>
            <input class="cms-input" id="eu_name" value="${u.name}" />
          </div>
          <div>
            <label class="cms-label">Email</label>
            <input class="cms-input" id="eu_email" value="${u.email}" />
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Empresa</label>
            <select class="cms-select" id="eu_company">
              ${COMPANIES.map(c => `<option value="${c.name}" ${u.company===c.name?'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="cms-label">Departamento</label>
            <input class="cms-input" id="eu_dept" value="${u.dept||''}" />
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Função</label>
            <input class="cms-input" id="eu_job" value="${u.job||''}" />
          </div>
          <div>
            <label class="cms-label">Role</label>
            <select class="cms-select" id="eu_role">
              <option value="user" ${u.role==='user'?'selected':''}>Colaborador</option>
              <option value="editor" ${u.role==='editor'?'selected':''}>Editor</option>
              <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
            </select>
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Estado</label>
            <select class="cms-select" id="eu_status">
              <option value="active" ${(u.status||'active')==='active'?'selected':''}>Activo</option>
              <option value="inactive" ${u.status==='inactive'?'selected':''}>Inactivo</option>
            </select>
          </div>
          <div>
            <label class="cms-label">Nova password <span style="font-weight:400;color:var(--txt-4);">(opcional)</span></label>
            <input class="cms-input" id="eu_pass" type="password" placeholder="Deixar em branco = manter" />
          </div>
        </div>
      </div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditUser(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditUser(id) {
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx === -1) return;
  const newPass = document.getElementById('eu_pass')?.value;
  users[idx] = {
    ...users[idx],
    name:    document.getElementById('eu_name').value.trim(),
    email:   document.getElementById('eu_email').value.trim().toLowerCase(),
    company: document.getElementById('eu_company').value,
    dept:    document.getElementById('eu_dept').value.trim(),
    job:     document.getElementById('eu_job').value.trim(),
    role:    document.getElementById('eu_role').value,
    status:  document.getElementById('eu_status').value,
    avatar:  document.getElementById('eu_name').value.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(),
    ...(newPass && newPass.length >= 8 ? { password: newPass } : {}),
  };
  saveAllUsers(users);
  cmsCloseModal();
  cmsToast('Utilizador actualizado', 'success');
  renderCMSUsers(document.getElementById('cmsMain'));
}

function cmsDeleteUser(id) {
  const users = getAllUsers();
  const u = users.find(x => x.id === id);
  if (!u) return;
  cmsConfirm('Eliminar utilizador', `Tem a certeza que deseja eliminar <strong>${u.name}</strong>? Esta acção não pode ser desfeita.`, () => {
    saveAllUsers(users.filter(x => x.id !== id));
    cmsToast(`${u.name} eliminado`, 'success');
    renderCMSUsers(document.getElementById('cmsMain'));
  });
}

// =============================================
// 3 — NEWS
// =============================================
function renderCMSNews(el, filter = '') {
  let items = filter ? NEWS.filter(n => n.title.toLowerCase().includes(filter) || getCompanyName(n.companyId).toLowerCase().includes(filter)) : NEWS;

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Notícias</div>
        <div class="cms-page-subtitle">${NEWS.length} artigos publicados · ${NEWS.filter(n=>n.featured).length} em destaque</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddNews()">${CI.plus} Nova Notícia</button>
      </div>
    </div>

    <div class="cms-filters">
      <input class="cms-filter-input" id="newsSearch" placeholder="Pesquisar notícias…" value="${filter}"
             oninput="renderCMSNews(document.getElementById('cmsMain'), this.value.toLowerCase())" />
      <select class="cms-filter-select" onchange="renderCMSNews(document.getElementById('cmsMain'))">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>

    <div class="cms-card">
      <div class="cms-card-body no-pad">
        ${items.length ? `
        <div class="cms-table-wrap">
          <table class="cms-table">
            <thead>
              <tr><th>Título</th><th>Empresa</th><th>Categoria</th><th>Data</th><th>Destaque</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${items.map(n => `
                <tr>
                  <td>
                    <div style="font-size:.83rem;font-weight:600;max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${n.title}</div>
                    <div style="font-size:.72rem;color:var(--txt-3);margin-top:2px;">${n.summary?.substring(0,80)}…</div>
                  </td>
                  <td><span class="cms-chip cms-chip-gray">${getCompanyName(n.companyId)}</span></td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${n.category}</td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${cmsFormatDate(n.date)}</td>
                  <td><button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsToggleFeatured(${n.id})" title="${n.featured?'Remover destaque':'Marcar destaque'}" style="color:${n.featured?'var(--amber)':'var(--txt-4)'};">${n.featured ? CI.star : CI.starOff}</button></td>
                  <td class="td-actions">
                    <div style="display:flex;gap:4px;">
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsOpenEditNews(${n.id})">${CI.edit}</button>
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" style="color:var(--red);" onclick="cmsDeleteNews(${n.id})">${CI.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `<div class="cms-empty"><div class="cms-empty-icon">📰</div><h3>Sem notícias</h3><p>Publique a primeira notícia do grupo</p></div>`}
      </div>
    </div>
  `;
}

function newsFormHTML(n = {}) {
  return `
    <div class="cms-form-row">
      <label class="cms-label">Título <span>*</span></label>
      <input class="cms-input" id="nf_title" placeholder="Título da notícia" value="${n.title||''}" />
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Empresa</label>
        <select class="cms-select" id="nf_company">
          ${COMPANIES.map(c => `<option value="${c.id}" ${n.companyId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="cms-label">Categoria</label>
        <input class="cms-input" id="nf_cat" placeholder="Ex: Estratégia, RH, Produto" value="${n.category||''}" />
      </div>
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Resumo</label>
      <textarea class="cms-textarea" id="nf_summary" rows="2" placeholder="Breve resumo (1-2 frases)">${n.summary||''}</textarea>
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Conteúdo</label>
      <div class="cms-rich-area">
        <div class="cms-rich-toolbar">
          <button class="cms-rich-btn" onclick="cmsRichCmd('bold')" title="Negrito"><b>B</b></button>
          <button class="cms-rich-btn" onclick="cmsRichCmd('italic')" title="Itálico"><i>I</i></button>
          <button class="cms-rich-btn" onclick="cmsRichCmd('underline')" title="Sublinhado"><u>U</u></button>
          <button class="cms-rich-btn" onclick="cmsRichCmd('insertUnorderedList')" title="Lista">•</button>
          <button class="cms-rich-btn" onclick="cmsRichCmd('insertOrderedList')" title="Lista num.">1.</button>
        </div>
        <div class="cms-rich-editor" id="nf_body" contenteditable="true">${n.body||''}</div>
      </div>
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Data</label>
        <input class="cms-input" id="nf_date" type="date" value="${n.date||new Date().toISOString().split('T')[0]}" />
      </div>
      <div>
        <label class="cms-label">Autor</label>
        <input class="cms-input" id="nf_author" value="${n.author||cmsUser.name}" />
      </div>
    </div>
    <div class="cms-toggle-row">
      <div>
        <div class="cms-toggle-label">Destacar na homepage</div>
        <div class="cms-toggle-sub">Aparece nos destaques do dashboard da intranet</div>
      </div>
      <button class="cms-toggle ${n.featured?'on':''}" id="nf_featured" onclick="this.classList.toggle('on')"></button>
    </div>
    <div class="cms-form-row" style="margin-top:12px;">
      <label class="cms-label">Imagem de capa <span style="font-weight:400;color:var(--txt-4);">(nome do ficheiro)</span></label>
      <input class="cms-input" id="nf_image" placeholder="Ex: nome-da-imagem.jpg" value="${n.image||''}" />
      <div class="cms-upload-zone" style="margin-top:8px;" onclick="cmsToast('Upload simulado — integre com backend para ficheiros reais','')">
        ${CI.upload}
        <div style="margin-top:4px;">Clique para simular upload de imagem</div>
        <div style="font-size:.7rem;margin-top:2px;color:var(--txt-4);">JPG, PNG, WebP · Máx. 5MB</div>
      </div>
    </div>
  `;
}

function cmsRichCmd(cmd) { document.execCommand(cmd, false, null); }

function cmsOpenAddNews() {
  cmsOpenModal(`
    <div class="cms-modal wide">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Nova Notícia</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${newsFormHTML()}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddNews()">Publicar Notícia</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddNews() {
  const title = document.getElementById('nf_title')?.value.trim();
  if (!title) { cmsToast('O título é obrigatório', 'error'); return; }
  const newItem = {
    id:        Date.now(),
    companyId: document.getElementById('nf_company').value,
    category:  document.getElementById('nf_cat').value.trim() || 'Geral',
    title,
    summary:   document.getElementById('nf_summary').value.trim(),
    body:      document.getElementById('nf_body').innerHTML,
    author:    document.getElementById('nf_author').value.trim() || cmsUser.name,
    date:      document.getElementById('nf_date').value,
    image:     document.getElementById('nf_image').value.trim() || 'default.jpg',
    featured:  document.getElementById('nf_featured').classList.contains('on'),
    readTime:  '3 min',
  };
  NEWS.unshift(newItem);
  saveNews(NEWS);
  cmsCloseModal();
  cmsToast('Notícia publicada com sucesso!', 'success');
  updateNavBadges();
  renderCMSNews(document.getElementById('cmsMain'));
}

function cmsOpenEditNews(id) {
  const n = NEWS.find(x => x.id === id);
  if (!n) return;
  cmsOpenModal(`
    <div class="cms-modal wide">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Notícia</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${newsFormHTML(n)}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditNews(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditNews(id) {
  const idx = NEWS.findIndex(n => n.id === id);
  if (idx === -1) return;
  const title = document.getElementById('nf_title')?.value.trim();
  if (!title) { cmsToast('O título é obrigatório', 'error'); return; }
  NEWS[idx] = {
    ...NEWS[idx], title,
    companyId: document.getElementById('nf_company').value,
    category:  document.getElementById('nf_cat').value.trim(),
    summary:   document.getElementById('nf_summary').value.trim(),
    body:      document.getElementById('nf_body').innerHTML,
    author:    document.getElementById('nf_author').value.trim(),
    date:      document.getElementById('nf_date').value,
    image:     document.getElementById('nf_image').value.trim(),
    featured:  document.getElementById('nf_featured').classList.contains('on'),
  };
  saveNews(NEWS);
  cmsCloseModal();
  cmsToast('Notícia actualizada', 'success');
  renderCMSNews(document.getElementById('cmsMain'));
}

function cmsToggleFeatured(id) {
  const idx = NEWS.findIndex(n => n.id === id);
  if (idx === -1) return;
  NEWS[idx].featured = !NEWS[idx].featured;
  saveNews(NEWS);
  cmsToast(NEWS[idx].featured ? 'Marcado como destaque ⭐' : 'Destaque removido', '');
  renderCMSNews(document.getElementById('cmsMain'));
}

function cmsDeleteNews(id) {
  const n = NEWS.find(x => x.id === id);
  if (!n) return;
  cmsConfirm('Eliminar notícia', `Eliminar "<strong>${n.title}</strong>"? Esta acção não pode ser desfeita.`, () => {
    saveNews(NEWS.filter(x => x.id !== id));
    cmsToast('Notícia eliminada', 'success');
    updateNavBadges();
    renderCMSNews(document.getElementById('cmsMain'));
  });
}

// =============================================
// 4 — COMUNICADOS
// =============================================
function renderCMSComunicados(el) {
  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Comunicados</div>
        <div class="cms-page-subtitle">${COMUNICADOS.length} comunicados · ${COMUNICADOS.filter(c=>!c.read).length} por ler</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddComun()">${CI.plus} Novo Comunicado</button>
      </div>
    </div>

    <div class="cms-card">
      <div class="cms-card-body no-pad">
        ${COMUNICADOS.length ? `
        <div class="cms-table-wrap">
          <table class="cms-table">
            <thead>
              <tr><th>Título</th><th>Empresa</th><th>Prioridade</th><th>Data</th><th>Lido</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${COMUNICADOS.map(c => `
                <tr>
                  <td>
                    <div style="font-size:.83rem;font-weight:600;">${c.title}</div>
                    <div style="font-size:.72rem;color:var(--txt-3);margin-top:2px;">${c.author||'—'}</div>
                  </td>
                  <td><span class="cms-chip cms-chip-gray">${getCompanyName(c.companyId)}</span></td>
                  <td>${getPrioChip(c.priority)}</td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${cmsFormatDate(c.date)}</td>
                  <td>${c.read ? `<span class="cms-chip cms-chip-green">Lido</span>` : `<span class="cms-chip cms-chip-amber">Pendente</span>`}</td>
                  <td class="td-actions">
                    <div style="display:flex;gap:4px;">
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsOpenEditComun(${c.id})">${CI.edit}</button>
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" style="color:var(--red);" onclick="cmsDeleteComun(${c.id})">${CI.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `<div class="cms-empty"><div class="cms-empty-icon">📢</div><h3>Sem comunicados</h3><p>Crie o primeiro comunicado do grupo</p></div>`}
      </div>
    </div>
  `;
}

function comunFormHTML(c = {}) {
  return `
    <div class="cms-form-row">
      <label class="cms-label">Título <span>*</span></label>
      <input class="cms-input" id="cf_title" placeholder="Título do comunicado" value="${c.title||''}" />
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Empresa</label>
        <select class="cms-select" id="cf_company">
          ${COMPANIES.map(co => `<option value="${co.id}" ${c.companyId===co.id?'selected':''}>${co.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="cms-label">Prioridade</label>
        <select class="cms-select" id="cf_prio">
          <option value="low" ${c.priority==='low'?'selected':''}>Baixa</option>
          <option value="medium" ${(!c.priority||c.priority==='medium')?'selected':''}>Média</option>
          <option value="high" ${c.priority==='high'?'selected':''}>Alta</option>
        </select>
      </div>
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Conteúdo <span>*</span></label>
      <textarea class="cms-textarea" id="cf_body" rows="5" placeholder="Texto do comunicado…">${c.body ? c.body.replace(/<[^>]+>/g,'') : ''}</textarea>
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Data</label>
        <input class="cms-input" id="cf_date" type="date" value="${c.date||new Date().toISOString().split('T')[0]}" />
      </div>
      <div>
        <label class="cms-label">Visibilidade</label>
        <select class="cms-select" id="cf_vis">
          <option value="global">Global (todo o grupo)</option>
          <option value="company">Por empresa</option>
        </select>
      </div>
    </div>
  `;
}

function cmsOpenAddComun() {
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Novo Comunicado</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${comunFormHTML()}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddComun()">Publicar</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddComun() {
  const title = document.getElementById('cf_title')?.value.trim();
  const body  = document.getElementById('cf_body')?.value.trim();
  if (!title || !body) { cmsToast('Título e conteúdo são obrigatórios', 'error'); return; }
  COMUNICADOS.unshift({
    id: Date.now(), title,
    companyId: document.getElementById('cf_company').value,
    priority:  document.getElementById('cf_prio').value,
    body: `<p>${body}</p>`,
    author: cmsUser.name + ' — ' + cmsUser.company,
    date: document.getElementById('cf_date').value,
    read: false,
  });
  saveComunicados(COMUNICADOS);
  cmsCloseModal();
  cmsToast('Comunicado publicado!', 'success');
  updateNavBadges();
  renderCMSComunicados(document.getElementById('cmsMain'));
}

function cmsOpenEditComun(id) {
  const c = COMUNICADOS.find(x => x.id === id);
  if (!c) return;
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Comunicado</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${comunFormHTML(c)}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditComun(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditComun(id) {
  const idx = COMUNICADOS.findIndex(c => c.id === id);
  if (idx === -1) return;
  const title = document.getElementById('cf_title')?.value.trim();
  if (!title) { cmsToast('Título obrigatório', 'error'); return; }
  COMUNICADOS[idx] = {
    ...COMUNICADOS[idx], title,
    companyId: document.getElementById('cf_company').value,
    priority:  document.getElementById('cf_prio').value,
    body: `<p>${document.getElementById('cf_body').value.trim()}</p>`,
    date: document.getElementById('cf_date').value,
  };
  saveComunicados(COMUNICADOS);
  cmsCloseModal();
  cmsToast('Comunicado actualizado', 'success');
  renderCMSComunicados(document.getElementById('cmsMain'));
}

function cmsDeleteComun(id) {
  const c = COMUNICADOS.find(x => x.id === id);
  cmsConfirm('Eliminar comunicado', `Eliminar "<strong>${c?.title}</strong>"?`, () => {
    saveComunicados(COMUNICADOS.filter(x => x.id !== id));
    cmsToast('Comunicado eliminado', 'success');
    updateNavBadges();
    renderCMSComunicados(document.getElementById('cmsMain'));
  });
}

// =============================================
// 5 — DOCUMENTS
// =============================================
function renderCMSDocs(el, tab = 'all') {
  const pubDocs  = DOCUMENTS.filter(d => !d.confidencial);
  const confDocs = DOCUMENTS.filter(d => d.confidencial);
  const show = tab === 'conf' ? confDocs : pubDocs;

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Documentos</div>
        <div class="cms-page-subtitle">${DOCUMENTS.length} documentos · ${confDocs.length} confidenciais</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddDoc()">${CI.plus} Carregar Documento</button>
      </div>
    </div>

    <div class="cms-tabs">
      <button class="cms-tab ${tab==='all'?'active':''}" onclick="renderCMSDocs(document.getElementById('cmsMain'),'all')">
        Públicos (${pubDocs.length})
      </button>
      <button class="cms-tab ${tab==='conf'?'active':''}" onclick="renderCMSDocs(document.getElementById('cmsMain'),'conf')">
        🔒 Confidenciais (${confDocs.length})
      </button>
    </div>

    <div class="cms-card">
      <div class="cms-card-body no-pad">
        ${show.length ? `
        <div class="cms-table-wrap">
          <table class="cms-table">
            <thead>
              <tr><th>Documento</th><th>Empresa</th><th>Categoria</th><th>Tipo</th><th>Tamanho</th><th>Data</th><th>Ações</th></tr>
            </thead>
            <tbody>
              ${show.map(d => `
                <tr>
                  <td>
                    <div style="font-size:.83rem;font-weight:600;">${d.title}</div>
                    <div style="font-size:.72rem;color:var(--txt-3);margin-top:2px;">${d.desc||''}</div>
                  </td>
                  <td><span class="cms-chip cms-chip-gray">${getCompanyName(d.companyId)}</span></td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${d.category}</td>
                  <td>${getDocTypeChip(d.type)}</td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${d.size}</td>
                  <td style="color:var(--txt-3);font-size:.78rem;">${cmsFormatDate(d.date)}</td>
                  <td class="td-actions">
                    <div style="display:flex;gap:4px;">
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsToast('Pré-visualizar: ${d.title}','')" title="Pré-visualizar">${CI.eye}</button>
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsOpenEditDoc(${d.id})">${CI.edit}</button>
                      <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" style="color:var(--red);" onclick="cmsDeleteDoc(${d.id})">${CI.trash}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : `<div class="cms-empty"><div class="cms-empty-icon">📄</div><h3>Sem documentos</h3><p>Carregue o primeiro documento</p></div>`}
      </div>
    </div>
  `;
}

function docFormHTML(d = {}) {
  return `
    <div class="cms-form-row">
      <label class="cms-label">Título do documento <span>*</span></label>
      <input class="cms-input" id="df_title" placeholder="Nome do documento" value="${d.title||''}" />
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Descrição</label>
      <input class="cms-input" id="df_desc" placeholder="Breve descrição do conteúdo" value="${d.desc||''}" />
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Empresa</label>
        <select class="cms-select" id="df_company">
          ${COMPANIES.map(c => `<option value="${c.id}" ${d.companyId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="cms-label">Categoria</label>
        <input class="cms-input" id="df_cat" placeholder="Ex: Governança, RH, Comercial" value="${d.category||''}" />
      </div>
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Tipo de ficheiro</label>
        <select class="cms-select" id="df_type">
          <option value="pdf" ${d.type==='pdf'?'selected':''}>PDF</option>
          <option value="doc" ${d.type==='doc'?'selected':''}>DOC / DOCX</option>
          <option value="xls" ${d.type==='xls'?'selected':''}>XLS / XLSX</option>
          <option value="ppt" ${d.type==='ppt'?'selected':''}>PPT / PPTX</option>
          <option value="zip" ${d.type==='zip'?'selected':''}>ZIP</option>
        </select>
      </div>
      <div>
        <label class="cms-label">Tamanho (ex: 2.4 MB)</label>
        <input class="cms-input" id="df_size" placeholder="Ex: 2.4 MB" value="${d.size||''}" />
      </div>
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Nome do ficheiro</label>
      <input class="cms-input" id="df_file" placeholder="Ex: relatorio-2026.pdf" value="${d.file||''}" />
      <div class="cms-upload-zone" style="margin-top:8px;" onclick="cmsToast('Upload simulado — integre com backend para ficheiros reais','')">
        ${CI.upload}
        <div style="margin-top:4px;">Clique para simular upload de ficheiro</div>
        <div style="font-size:.7rem;margin-top:2px;color:var(--txt-4);">PDF, DOC, XLS, PPT, ZIP</div>
      </div>
    </div>
    <div class="cms-toggle-row">
      <div>
        <div class="cms-toggle-label">🔒 Documento confidencial</div>
        <div class="cms-toggle-sub">Visível apenas para administradores</div>
      </div>
      <button class="cms-toggle ${d.confidencial?'on':''}" id="df_conf" onclick="this.classList.toggle('on')"></button>
    </div>
  `;
}

function cmsOpenAddDoc() {
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Carregar Documento</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${docFormHTML()}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddDoc()">Guardar Documento</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddDoc() {
  const title = document.getElementById('df_title')?.value.trim();
  if (!title) { cmsToast('O título é obrigatório', 'error'); return; }
  const isConf = document.getElementById('df_conf').classList.contains('on');
  DOCUMENTS.push({
    id: Date.now(), title,
    companyId: document.getElementById('df_company').value,
    category:  document.getElementById('df_cat').value.trim() || 'Geral',
    desc:      document.getElementById('df_desc').value.trim(),
    type:      document.getElementById('df_type').value,
    size:      document.getElementById('df_size').value.trim() || '—',
    file:      document.getElementById('df_file').value.trim() || 'documento.pdf',
    date:      new Date().toISOString().split('T')[0],
    downloads: 0,
    ...(isConf ? { confidencial: true } : {}),
  });
  saveDocuments(DOCUMENTS);
  cmsCloseModal();
  cmsToast('Documento adicionado!', 'success');
  updateNavBadges();
  renderCMSDocs(document.getElementById('cmsMain'));
}

function cmsOpenEditDoc(id) {
  const d = DOCUMENTS.find(x => x.id === id);
  if (!d) return;
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Documento</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${docFormHTML(d)}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditDoc(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditDoc(id) {
  const idx = DOCUMENTS.findIndex(d => d.id === id);
  if (idx === -1) return;
  const title = document.getElementById('df_title')?.value.trim();
  if (!title) { cmsToast('Título obrigatório', 'error'); return; }
  const isConf = document.getElementById('df_conf').classList.contains('on');
  DOCUMENTS[idx] = {
    ...DOCUMENTS[idx], title,
    companyId: document.getElementById('df_company').value,
    category:  document.getElementById('df_cat').value.trim(),
    desc:      document.getElementById('df_desc').value.trim(),
    type:      document.getElementById('df_type').value,
    size:      document.getElementById('df_size').value.trim(),
    file:      document.getElementById('df_file').value.trim(),
    confidencial: isConf || undefined,
  };
  if (!isConf) delete DOCUMENTS[idx].confidencial;
  saveDocuments(DOCUMENTS);
  cmsCloseModal();
  cmsToast('Documento actualizado', 'success');
  renderCMSDocs(document.getElementById('cmsMain'));
}

function cmsDeleteDoc(id) {
  const d = DOCUMENTS.find(x => x.id === id);
  cmsConfirm('Eliminar documento', `Eliminar "<strong>${d?.title}</strong>"?`, () => {
    saveDocuments(DOCUMENTS.filter(x => x.id !== id));
    cmsToast('Documento eliminado', 'success');
    updateNavBadges();
    renderCMSDocs(document.getElementById('cmsMain'));
  });
}

// =============================================
// 6 — BRAND ASSETS
// =============================================
function renderCMSBrands(el, filterCompany = '') {
  const filtered = filterCompany ? BRAND_ASSETS.filter(b => b.companyId === filterCompany) : BRAND_ASSETS;

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Marcas &amp; Assets</div>
        <div class="cms-page-subtitle">${BRAND_ASSETS.length} assets · ${COMPANIES.length} empresas</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddBrand()">${CI.plus} Novo Asset</button>
      </div>
    </div>

    <div class="cms-filters">
      <select class="cms-filter-select" onchange="renderCMSBrands(document.getElementById('cmsMain'), this.value)">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}" ${filterCompany===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>

    ${COMPANIES.filter(c => !filterCompany || c.id === filterCompany).map(company => {
      const assets = BRAND_ASSETS.filter(b => b.companyId === company.id);
      if (!assets.length && filterCompany) return '';
      return `
        <div style="margin-bottom:24px;">
          <div class="cms-section-title" style="display:flex;align-items:center;gap:8px;">
            <div style="width:6px;height:6px;border-radius:50%;background:${company.accentColor};"></div>
            ${company.name}
            <span style="font-weight:400;font-size:.7rem;color:var(--txt-4);">${assets.length} asset${assets.length!==1?'s':''}</span>
          </div>
          ${assets.length ? `
          <div class="cms-brand-grid">
            ${assets.map(b => `
              <div class="cms-brand-card">
                <div class="cms-brand-preview" style="background:${b.colorBg};color:${b.color};">${b.initials}</div>
                <div class="cms-brand-info">
                  <div class="cms-brand-name">${b.name}</div>
                  <div class="cms-brand-meta">${b.format} · ${b.version} · ${cmsFormatDate(b.date)}</div>
                  <div class="cms-brand-actions">
                    <button class="cms-btn cms-btn-outline cms-btn-sm" onclick="cmsToast('Download simulado: ${b.name}','success')" style="flex:1;">Descarregar</button>
                    <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" onclick="cmsOpenEditBrand(${b.id})">${CI.edit}</button>
                    <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" style="color:var(--red);" onclick="cmsDeleteBrand(${b.id})">${CI.trash}</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ` : `<div style="color:var(--txt-4);font-size:.8rem;padding:10px 0;">Nenhum asset de marca para esta empresa.</div>`}
        </div>
      `;
    }).join('')}
  `;
}

function brandFormHTML(b = {}) {
  return `
    <div class="cms-form-row">
      <label class="cms-label">Nome do asset <span>*</span></label>
      <input class="cms-input" id="bf_name" placeholder="Ex: INOV Holding — Logo Principal" value="${b.name||''}" />
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Empresa</label>
        <select class="cms-select" id="bf_company">
          ${COMPANIES.map(c => `<option value="${c.id}" ${b.companyId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="cms-label">Formato</label>
        <input class="cms-input" id="bf_format" placeholder="Ex: SVG + PNG, PDF" value="${b.format||''}" />
      </div>
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Versão</label>
        <input class="cms-input" id="bf_version" placeholder="Ex: v3.0" value="${b.version||''}" />
      </div>
      <div>
        <label class="cms-label">Iniciais / Preview</label>
        <input class="cms-input" id="bf_initials" placeholder="Ex: INOV, FI, AM" value="${b.initials||''}" />
      </div>
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Cor do texto</label>
        <input class="cms-input" id="bf_color" type="color" value="${b.color||'#ffffff'}" />
      </div>
      <div>
        <label class="cms-label">Cor de fundo</label>
        <input class="cms-input" id="bf_bg" type="color" value="${b.colorBg||'#0C1A35'}" />
      </div>
    </div>
    <div class="cms-upload-zone" onclick="cmsToast('Upload simulado — integre com backend para ficheiros reais','')">
      ${CI.upload}
      <div style="margin-top:4px;">Clique para simular upload do ficheiro de marca</div>
      <div style="font-size:.7rem;margin-top:2px;color:var(--txt-4);">SVG, PNG, PDF · Máx. 10MB</div>
    </div>
  `;
}

function cmsOpenAddBrand() {
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Novo Asset de Marca</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${brandFormHTML()}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddBrand()">Guardar Asset</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddBrand() {
  const name = document.getElementById('bf_name')?.value.trim();
  if (!name) { cmsToast('O nome é obrigatório', 'error'); return; }
  BRAND_ASSETS.push({
    id: Date.now(), name,
    companyId: document.getElementById('bf_company').value,
    format:    document.getElementById('bf_format').value.trim() || 'SVG + PNG',
    version:   document.getElementById('bf_version').value.trim() || 'v1.0',
    initials:  document.getElementById('bf_initials').value.trim(),
    color:     document.getElementById('bf_color').value,
    colorBg:   document.getElementById('bf_bg').value,
    bg: 'dark', date: new Date().toISOString().split('T')[0],
  });
  saveBrandAssets(BRAND_ASSETS);
  cmsCloseModal();
  cmsToast('Asset de marca adicionado!', 'success');
  renderCMSBrands(document.getElementById('cmsMain'));
}

function cmsOpenEditBrand(id) {
  const b = BRAND_ASSETS.find(x => x.id === id);
  if (!b) return;
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Asset de Marca</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${brandFormHTML(b)}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditBrand(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditBrand(id) {
  const idx = BRAND_ASSETS.findIndex(b => b.id === id);
  if (idx === -1) return;
  BRAND_ASSETS[idx] = {
    ...BRAND_ASSETS[idx],
    name:      document.getElementById('bf_name').value.trim(),
    companyId: document.getElementById('bf_company').value,
    format:    document.getElementById('bf_format').value.trim(),
    version:   document.getElementById('bf_version').value.trim(),
    initials:  document.getElementById('bf_initials').value.trim(),
    color:     document.getElementById('bf_color').value,
    colorBg:   document.getElementById('bf_bg').value,
  };
  saveBrandAssets(BRAND_ASSETS);
  cmsCloseModal();
  cmsToast('Asset actualizado', 'success');
  renderCMSBrands(document.getElementById('cmsMain'));
}

function cmsDeleteBrand(id) {
  const b = BRAND_ASSETS.find(x => x.id === id);
  cmsConfirm('Eliminar asset', `Eliminar "<strong>${b?.name}</strong>"?`, () => {
    saveBrandAssets(BRAND_ASSETS.filter(x => x.id !== id));
    cmsToast('Asset eliminado', 'success');
    renderCMSBrands(document.getElementById('cmsMain'));
  });
}

// =============================================
// 7 — GALLERY
// =============================================
function renderCMSGallery(el, filterCompany = '') {
  const filtered = filterCompany ? GALLERY.filter(g => g.companyId === filterCompany) : GALLERY;
  const cats = ['Stand','Impressão','Brindes','Evento','Interno','Produto','Campanha','Fotografia','Operacional'];

  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Galeria</div>
        <div class="cms-page-subtitle">${GALLERY.length} itens no portfólio visual</div>
      </div>
      <div class="cms-page-actions">
        <button class="cms-btn cms-btn-primary" onclick="cmsOpenAddGallery()">${CI.plus} Adicionar Item</button>
      </div>
    </div>

    <div class="cms-filters">
      <select class="cms-filter-select" onchange="renderCMSGallery(document.getElementById('cmsMain'), this.value)">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}" ${filterCompany===c.id?'selected':''}>${c.name}</option>`).join('')}
      </select>
    </div>

    <div class="cms-gallery-grid">
      ${filtered.map(g => {
        const emoji = { Stand:'🏗️', Impressão:'🖨️', Brindes:'🎁', Evento:'🎉', Interno:'📸', Produto:'📦', Campanha:'📣', Fotografia:'📷', Operacional:'⚙️' };
        return `
          <div class="cms-gallery-card">
            <div class="cms-gallery-thumb" style="background:${g.color||'#222'};">
              <span style="font-size:2rem;">${emoji[g.category]||'🖼️'}</span>
            </div>
            <div class="cms-gallery-info">
              <div class="cms-gallery-title">${g.project}</div>
              <div class="cms-gallery-meta">
                ${getCompanyName(g.companyId)} ·
                <span class="cms-chip cms-chip-gray" style="font-size:.65rem;">${g.category}</span>
              </div>
              <div class="cms-gallery-actions">
                <button class="cms-btn cms-btn-outline cms-btn-sm" style="flex:1;" onclick="cmsOpenEditGallery(${g.id})">${CI.edit} Editar</button>
                <button class="cms-btn cms-btn-ghost cms-btn-sm cms-btn-icon" style="color:var(--red);" onclick="cmsDeleteGallery(${g.id})">${CI.trash}</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
      ${filtered.length === 0 ? `<div style="grid-column:1/-1;"><div class="cms-empty"><div class="cms-empty-icon">🖼️</div><h3>Sem itens de galeria</h3><p>Adicione o primeiro item do portfólio</p></div></div>` : ''}
    </div>
  `;
}

function galleryFormHTML(g = {}) {
  const cats = ['Stand','Impressão','Brindes','Evento','Interno','Produto','Campanha','Fotografia','Operacional'];
  return `
    <div class="cms-form-row">
      <label class="cms-label">Título do projecto <span>*</span></label>
      <input class="cms-input" id="gf_title" placeholder="Ex: Stand Sika — FILDA 2026" value="${g.project||''}" />
    </div>
    <div class="cms-form-row row-2">
      <div>
        <label class="cms-label">Empresa</label>
        <select class="cms-select" id="gf_company">
          ${COMPANIES.map(c => `<option value="${c.id}" ${g.companyId===c.id?'selected':''}>${c.name}</option>`).join('')}
        </select>
      </div>
      <div>
        <label class="cms-label">Categoria</label>
        <select class="cms-select" id="gf_cat">
          ${cats.map(c => `<option value="${c}" ${g.category===c?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="cms-form-row">
      <label class="cms-label">Cor de fundo (thumbnail)</label>
      <input class="cms-input" id="gf_color" type="color" value="${g.color||'#1A1A2E'}" />
    </div>
    <div class="cms-upload-zone" onclick="cmsToast('Upload simulado — integre com backend para imagens reais','')">
      ${CI.upload}
      <div style="margin-top:4px;">Clique para simular upload de imagens</div>
      <div style="font-size:.7rem;margin-top:2px;color:var(--txt-4);">JPG, PNG, WebP · Máx. 10MB por imagem</div>
    </div>
  `;
}

function cmsOpenAddGallery() {
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Adicionar à Galeria</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${galleryFormHTML()}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitAddGallery()">Adicionar</button>
      </div>
    </div>
  `);
}

function cmsSubmitAddGallery() {
  const title = document.getElementById('gf_title')?.value.trim();
  if (!title) { cmsToast('O título é obrigatório', 'error'); return; }
  GALLERY.push({
    id: Date.now(), project: title,
    companyId: document.getElementById('gf_company').value,
    category:  document.getElementById('gf_cat').value,
    color:     document.getElementById('gf_color').value,
  });
  saveGallery(GALLERY);
  cmsCloseModal();
  cmsToast('Item adicionado à galeria!', 'success');
  renderCMSGallery(document.getElementById('cmsMain'));
}

function cmsOpenEditGallery(id) {
  const g = GALLERY.find(x => x.id === id);
  if (!g) return;
  cmsOpenModal(`
    <div class="cms-modal">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar Item de Galeria</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">${galleryFormHTML(g)}</div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditGallery(${id})">Guardar</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditGallery(id) {
  const idx = GALLERY.findIndex(g => g.id === id);
  if (idx === -1) return;
  const title = document.getElementById('gf_title')?.value.trim();
  if (!title) { cmsToast('Título obrigatório', 'error'); return; }
  GALLERY[idx] = {
    ...GALLERY[idx], project: title,
    companyId: document.getElementById('gf_company').value,
    category:  document.getElementById('gf_cat').value,
    color:     document.getElementById('gf_color').value,
  };
  saveGallery(GALLERY);
  cmsCloseModal();
  cmsToast('Item actualizado', 'success');
  renderCMSGallery(document.getElementById('cmsMain'));
}

function cmsDeleteGallery(id) {
  const g = GALLERY.find(x => x.id === id);
  cmsConfirm('Remover da galeria', `Remover "<strong>${g?.project}</strong>"?`, () => {
    saveGallery(GALLERY.filter(x => x.id !== id));
    cmsToast('Item removido da galeria', 'success');
    renderCMSGallery(document.getElementById('cmsMain'));
  });
}

// =============================================
// 8 — EMPRESAS
// =============================================
function renderCMSEmpresas(el) {
  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Empresas</div>
        <div class="cms-page-subtitle">Gerir conteúdo institucional das ${COMPANIES.length} empresas do grupo</div>
      </div>
    </div>

    <div class="cms-alert cms-alert-info">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>As alterações feitas aqui actualizam automaticamente as páginas institucionais na intranet.</span>
    </div>

    <div class="cms-company-list">
      ${COMPANIES.map(c => `
        <div class="cms-company-row">
          <div class="cms-company-dot" style="background:${c.coverGradient};color:${c.accentColor};">${c.shortName}</div>
          <div class="cms-company-meta" style="flex:1;">
            <div class="cms-company-meta-name">${c.name}</div>
            <div class="cms-company-meta-sector">${c.sector} · ${c.location} · ${c.employees} colaboradores</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;">
            <span class="cms-chip cms-chip-gray">${(c.services||[]).length} serviços</span>
            <span class="cms-chip cms-chip-gray">${(c.values||[]).length} valores</span>
          </div>
          <div class="cms-company-actions">
            <button class="cms-btn cms-btn-outline cms-btn-sm" onclick="cmsOpenEditEmpresa('${c.id}')">${CI.edit} Editar</button>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function cmsOpenEditEmpresa(id) {
  const c = COMPANIES.find(x => x.id === id);
  if (!c) return;
  cmsOpenModal(`
    <div class="cms-modal wide">
      <div class="cms-modal-header">
        <div class="cms-modal-title">Editar — ${c.name}</div>
        <button class="cms-modal-close" onclick="cmsCloseModal()">${CI.x}</button>
      </div>
      <div class="cms-modal-body">
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Nome da empresa</label>
            <input class="cms-input" id="ef_name" value="${c.name}" />
          </div>
          <div>
            <label class="cms-label">Tagline</label>
            <input class="cms-input" id="ef_tagline" value="${c.tagline||''}" />
          </div>
        </div>
        <div class="cms-form-row">
          <label class="cms-label">Descrição</label>
          <textarea class="cms-textarea" id="ef_desc" rows="3">${c.description||''}</textarea>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Sector</label>
            <input class="cms-input" id="ef_sector" value="${c.sector||''}" />
          </div>
          <div>
            <label class="cms-label">Localização</label>
            <input class="cms-input" id="ef_location" value="${c.location||''}" />
          </div>
        </div>
        <div class="cms-form-row row-3">
          <div>
            <label class="cms-label">Fundada</label>
            <input class="cms-input" id="ef_founded" value="${c.founded||''}" />
          </div>
          <div>
            <label class="cms-label">Colaboradores</label>
            <input class="cms-input" id="ef_employees" value="${c.employees||''}" />
          </div>
          <div>
            <label class="cms-label">Website</label>
            <input class="cms-input" id="ef_web" value="${c.contacts?.web||''}" />
          </div>
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Email</label>
            <input class="cms-input" id="ef_email" value="${c.contacts?.email||''}" />
          </div>
          <div>
            <label class="cms-label">Telefone</label>
            <input class="cms-input" id="ef_tel" value="${c.contacts?.tel||''}" />
          </div>
        </div>
        <div class="cms-form-row">
          <label class="cms-label">Serviços <span style="font-weight:400;color:var(--txt-4);">(separados por vírgula)</span></label>
          <input class="cms-input" id="ef_services" value="${(c.services||[]).join(', ')}" />
        </div>
        <div class="cms-form-row">
          <label class="cms-label">Valores <span style="font-weight:400;color:var(--txt-4);">(separados por vírgula)</span></label>
          <input class="cms-input" id="ef_values" value="${(c.values||[]).join(', ')}" />
        </div>
        <div class="cms-form-row row-2">
          <div>
            <label class="cms-label">Cor de destaque (accent)</label>
            <input class="cms-input" id="ef_accent" type="color" value="${c.accentColor||'#C9A24C'}" />
          </div>
          <div>
            <label class="cms-label">Cor base</label>
            <input class="cms-input" id="ef_color" type="color" value="${c.color||'#0C1A35'}" />
          </div>
        </div>
      </div>
      <div class="cms-modal-footer">
        <button class="cms-btn cms-btn-outline" onclick="cmsCloseModal()">Cancelar</button>
        <button class="cms-btn cms-btn-primary" onclick="cmsSubmitEditEmpresa('${id}')">Guardar Alterações</button>
      </div>
    </div>
  `);
}

function cmsSubmitEditEmpresa(id) {
  const idx = COMPANIES.findIndex(c => c.id === id);
  if (idx === -1) return;
  COMPANIES[idx] = {
    ...COMPANIES[idx],
    name:         document.getElementById('ef_name').value.trim(),
    tagline:      document.getElementById('ef_tagline').value.trim(),
    description:  document.getElementById('ef_desc').value.trim(),
    sector:       document.getElementById('ef_sector').value.trim(),
    location:     document.getElementById('ef_location').value.trim(),
    founded:      document.getElementById('ef_founded').value.trim(),
    employees:    document.getElementById('ef_employees').value.trim(),
    accentColor:  document.getElementById('ef_accent').value,
    color:        document.getElementById('ef_color').value,
    services:     document.getElementById('ef_services').value.split(',').map(s=>s.trim()).filter(Boolean),
    values:       document.getElementById('ef_values').value.split(',').map(s=>s.trim()).filter(Boolean),
    contacts: {
      ...COMPANIES[idx].contacts,
      email: document.getElementById('ef_email').value.trim(),
      tel:   document.getElementById('ef_tel').value.trim(),
      web:   document.getElementById('ef_web').value.trim(),
    },
  };
  saveCompanies(COMPANIES);
  cmsCloseModal();
  cmsToast(`${COMPANIES[idx].name} actualizada com sucesso!`, 'success');
  renderCMSEmpresas(document.getElementById('cmsMain'));
}

// =============================================
// 9 — SETTINGS
// =============================================
function renderCMSSettings(el) {
  el.innerHTML = `
    <div class="cms-page-header">
      <div>
        <div class="cms-page-title">Definições</div>
        <div class="cms-page-subtitle">Configurações do sistema e perfil de administrador</div>
      </div>
    </div>

    <div class="cms-grid-2">
      <!-- Profile -->
      <div class="cms-card">
        <div class="cms-card-header">
          <div><div class="cms-card-title">Perfil de Administrador</div></div>
        </div>
        <div class="cms-card-body">
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px;">
            <div style="width:52px;height:52px;background:var(--gold);color:#0D1117;border-radius:12px;font-size:1.1rem;font-weight:800;display:flex;align-items:center;justify-content:center;">${cmsUser.avatar}</div>
            <div>
              <div style="font-size:.95rem;font-weight:700;">${cmsUser.name}</div>
              <div style="font-size:.78rem;color:var(--txt-3);">${cmsUser.email}</div>
              <div style="margin-top:4px;">${getRoleChip(cmsUser.role)}</div>
            </div>
          </div>
          <div class="cms-settings-section">
            <div class="cms-settings-label">Informações pessoais</div>
            <div class="cms-form-row row-2">
              <div><label class="cms-label">Nome</label><input class="cms-input" id="sp_name" value="${cmsUser.name}" /></div>
              <div><label class="cms-label">Email</label><input class="cms-input" id="sp_email" value="${cmsUser.email}" /></div>
            </div>
            <div class="cms-form-row row-2">
              <div><label class="cms-label">Empresa</label><input class="cms-input" id="sp_company" value="${cmsUser.company||''}" /></div>
              <div><label class="cms-label">Função</label><input class="cms-input" id="sp_job" value="${cmsUser.job||''}" /></div>
            </div>
          </div>
          <div class="cms-settings-section">
            <div class="cms-settings-label">Alterar password</div>
            <div class="cms-form-row row-2">
              <div><label class="cms-label">Nova password</label><input class="cms-input" id="sp_pass" type="password" placeholder="Nova password" /></div>
              <div><label class="cms-label">Confirmar</label><input class="cms-input" id="sp_pass2" type="password" placeholder="Confirmar password" /></div>
            </div>
          </div>
          <button class="cms-btn cms-btn-primary" onclick="cmsSubmitSettings()" style="width:100%;margin-top:4px;">Guardar Perfil</button>
        </div>
      </div>

      <!-- System -->
      <div style="display:flex;flex-direction:column;gap:16px;">
        <div class="cms-card">
          <div class="cms-card-header">
            <div><div class="cms-card-title">Sistema &amp; Dados</div></div>
          </div>
          <div class="cms-card-body">
            <div class="cms-toggle-row">
              <div>
                <div class="cms-toggle-label">Modo de manutenção</div>
                <div class="cms-toggle-sub">Bloqueia acesso de utilizadores comuns</div>
              </div>
              <button class="cms-toggle" id="tog_maintenance" onclick="this.classList.toggle('on');cmsToast(this.classList.contains('on')?'Modo de manutenção activado':'Modo de manutenção desactivado','')"></button>
            </div>
            <div class="cms-toggle-row">
              <div>
                <div class="cms-toggle-label">Notificações de sistema</div>
                <div class="cms-toggle-sub">Alertas de novos registos e conteúdos</div>
              </div>
              <button class="cms-toggle on" id="tog_notif" onclick="this.classList.toggle('on')"></button>
            </div>
            <div class="cms-toggle-row" style="border-top:1px solid var(--border-2);padding-top:14px;margin-top:4px;">
              <div>
                <div class="cms-toggle-label">Registos públicos</div>
                <div class="cms-toggle-sub">Permitir que utilizadores se registem</div>
              </div>
              <button class="cms-toggle on" id="tog_reg" onclick="this.classList.toggle('on')"></button>
            </div>
          </div>
        </div>

        <div class="cms-card">
          <div class="cms-card-header">
            <div><div class="cms-card-title">Informações do Sistema</div></div>
          </div>
          <div class="cms-card-body">
            ${[
              ['Versão CMS',        'v1.0.0'],
              ['Utilizadores',      getAllUsers().length + ' registados'],
              ['Notícias',          NEWS.length + ' publicadas'],
              ['Documentos',        DOCUMENTS.length + ' carregados'],
              ['Comunicados',       COMUNICADOS.length + ' activos'],
              ['Assets de Marca',   BRAND_ASSETS.length + ' disponíveis'],
              ['Itens de Galeria',  GALLERY.length + ' no portfólio'],
              ['Empresas',          COMPANIES.length + ' do grupo'],
              ['Armazenamento',     'localStorage (modo demo)'],
            ].map(([k,v]) => `
              <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border-2);font-size:.8rem;">
                <span style="color:var(--txt-3);">${k}</span>
                <span style="font-weight:600;">${v}</span>
              </div>
            `).join('')}
            <button class="cms-btn cms-btn-danger cms-btn-sm" style="margin-top:14px;width:100%;" onclick="cmsResetData()">
              Limpar Cache de Dados
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function cmsSubmitSettings() {
  const name = document.getElementById('sp_name')?.value.trim();
  const pass  = document.getElementById('sp_pass')?.value;
  const pass2 = document.getElementById('sp_pass2')?.value;
  if (pass && pass !== pass2) { cmsToast('As passwords não coincidem', 'error'); return; }
  if (pass && pass.length < 8) { cmsToast('Password deve ter ≥ 8 caracteres', 'error'); return; }
  const users = getAllUsers();
  const idx = users.findIndex(u => u.id === cmsUser.id);
  if (idx !== -1) {
    users[idx] = {
      ...users[idx],
      name: name || users[idx].name,
      company: document.getElementById('sp_company').value.trim(),
      job: document.getElementById('sp_job').value.trim(),
      ...(pass ? { password: pass } : {}),
    };
    saveAllUsers(users);
    setSession(users[idx]);
    cmsUser = users[idx];
    document.getElementById('cmsUserName').textContent = cmsUser.name;
    document.getElementById('cmsUserAv').textContent   = cmsUser.avatar;
  }
  cmsToast('Perfil actualizado com sucesso!', 'success');
}

function cmsResetData() {
  cmsConfirm('Limpar Cache', 'Isto vai redefinir todos os dados para os valores originais. Tem a certeza?', () => {
    ['inov_news','inov_comunicados','inov_docs','inov_companies','inov_brands','inov_gallery','inov_content_ver'].forEach(k => localStorage.removeItem(k));
    cmsToast('Cache limpo. A recarregar…', 'warn');
    setTimeout(() => window.location.reload(), 1200);
  });
}
