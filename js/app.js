/* =============================================
   INOV INTRANET — MAIN APPLICATION
   SPA Router + All View Renderers
   ============================================= */

let currentUser = null;
let currentPage = 'dashboard';

// =============================================
// BOOT
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  // Carrega dados da API e arranca a UI (definido em loader.js)
  loadAndBoot();
});

function bootUI() {
  // Sidebar user
  document.getElementById('sidebarUserName').textContent = currentUser.name;
  document.getElementById('sidebarUserRole').textContent = currentUser.job || currentUser.role;
  document.getElementById('sidebarUserAv').textContent   = currentUser.avatar || 'U';
  document.getElementById('headerAvatar').textContent    = currentUser.avatar || 'U';

  // Hide admin nav if not admin
  if (currentUser.role !== 'admin') {
    document.querySelectorAll('[data-admin-only]').forEach(el => el.style.display = 'none');
  }

  // Mobile sidebar
  document.getElementById('menuBtn').addEventListener('click', toggleMobileSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    clearSession();
    window.location.href = 'index.html';
  });

  // Notification count
  const unread = COMUNICADOS.filter(c => !c.read).length;
  if (unread > 0) {
    document.getElementById('notifBadge').textContent = unread;
    document.getElementById('notifDot').style.display = 'block';
  }
  document.getElementById('notifBtn').addEventListener('click', () => navigate('comunicados'));
}

// =============================================
// ROUTER
// =============================================
function navigate(page, param) {
  currentPage = page;
  closeMobileSidebar();

  // Update nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(b => {
    b.classList.toggle('active', b.dataset.page === page || (page.startsWith('company-') && b.dataset.page === 'companies'));
  });

  // Hide all pages, show target
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page) || document.getElementById('page-dynamic');
  if (target) {
    target.classList.add('active');
    target.scrollTop = 0;
  }

  // Guard: bloquear acesso à área confidencial para não-admins
  if (page === 'confidencial' && currentUser.role !== 'admin') {
    toast('Acesso restrito — área exclusiva da administração', 'error');
    navigate('docs');
    return;
  }

  // Render
  const renders = {
    dashboard:    renderDashboard,
    group:        renderGroup,
    sobre:        renderSobre,
    companies:    renderCompanies,
    news:         renderNews,
    comunicados:  renderComunicados,
    docs:         renderDocs,
    brands:       renderBrands,
    gallery:      renderGallery,
    profile:      renderProfile,
    admin:        renderAdmin,
    confidencial: renderConfidencial,
  };

  if (page.startsWith('company-')) {
    renderCompanyPage(page.replace('company-', ''));
  } else if (page.startsWith('news-')) {
    renderNewsDetail(parseInt(page.replace('news-', '')));
  } else if (renders[page]) {
    renders[page](param);
  }

  // Breadcrumb
  const labels = {
    dashboard:'Dashboard', group:'Grupo INOV', sobre:'Sobre Nós',
    companies:'Empresas', news:'Notícias', comunicados:'Comunicados',
    docs:'Documentos', brands:'Logótipos & Marcas', gallery:'Galeria',
    profile:'Perfil', admin:'Administração', confidencial:'🔒 Confidencial'
  };
  const crumb = labels[page] || 'INOV Intranet';
  document.getElementById('breadcrumb').textContent = crumb;
}

// =============================================
// MOBILE SIDEBAR
// =============================================
function toggleMobileSidebar() {
  document.getElementById('sidebar').classList.toggle('mobile-open');
  document.getElementById('sidebarOverlay').style.display =
    document.getElementById('sidebar').classList.contains('mobile-open') ? 'block' : 'none';
}
function closeMobileSidebar() {
  document.getElementById('sidebar').classList.remove('mobile-open');
  document.getElementById('sidebarOverlay').style.display = 'none';
}

// =============================================
// TOAST
// =============================================
function toast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = msg;
  container.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// =============================================
// SVG ICONS
// =============================================
const ICONS = {
  newspaper: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/></svg>`,
  megaphone: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 11 19-9-9 19-2-8-8-2z"/></svg>`,
  folder:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  bookmark:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  image:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>`,
  building:  `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
  user:      `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>`,
  shield:    `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  download:  `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  eye:       `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  arrow:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  plus:      `<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  zoom:      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>`,
  chevron:   `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>`,
  check:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
  x:         `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  globe:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  mail:      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>`,
  phone:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6 6l.94-.94a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  users:     `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
};

// =============================================
// DASHBOARD
// =============================================
function renderDashboard() {
  const el = document.getElementById('page-dashboard');
  const featuredNews = NEWS.filter(n => n.featured).slice(0, 3);
  const recentComun  = COMUNICADOS.slice(0, 4);
  const unread = COMUNICADOS.filter(c => !c.read).length;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Bom dia, ${currentUser.name.split(' ')[0]} 👋</div>
        <div class="page-subtitle">${new Date().toLocaleDateString('pt-AO', {weekday:'long', day:'numeric', month:'long', year:'numeric'})}</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="navigate('news')">${ICONS.newspaper} Ver Notícias</button>
        <button class="btn btn-primary" onclick="navigate('comunicados')">${ICONS.megaphone} Comunicados ${unread > 0 ? `<span style="background:var(--red);color:white;border-radius:20px;padding:1px 6px;font-size:0.65rem;margin-left:2px;">${unread}</span>` : ''}</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card" onclick="navigate('news')" style="cursor:pointer;">
        <div class="stat-card-top">
          <div class="stat-icon blue">${ICONS.newspaper}</div>
          <span class="stat-change up">↑ 12%</span>
        </div>
        <div class="stat-value">${NEWS.length}</div>
        <div class="stat-label">Notícias publicadas</div>
      </div>
      <div class="stat-card" onclick="navigate('comunicados')" style="cursor:pointer;">
        <div class="stat-card-top">
          <div class="stat-icon amber">${ICONS.megaphone}</div>
          ${unread > 0 ? `<span class="stat-change" style="color:var(--red)">${unread} novos</span>` : ''}
        </div>
        <div class="stat-value">${COMUNICADOS.length}</div>
        <div class="stat-label">Comunicados internos</div>
      </div>
      <div class="stat-card" onclick="navigate('docs')" style="cursor:pointer;">
        <div class="stat-card-top">
          <div class="stat-icon green">${ICONS.folder}</div>
        </div>
        <div class="stat-value">${DOCUMENTS.length}</div>
        <div class="stat-label">Documentos na biblioteca</div>
      </div>
      <div class="stat-card" onclick="navigate('companies')" style="cursor:pointer;">
        <div class="stat-card-top">
          <div class="stat-icon navy">${ICONS.building}</div>
        </div>
        <div class="stat-value">${COMPANIES.length}</div>
        <div class="stat-label">Empresas do grupo</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:20px;">
      <div class="card-header"><h3>Acesso Rápido</h3></div>
      <div class="card-body" style="padding:16px;">
        <div class="quick-links">
          ${QUICK_LINKS.filter(q => currentUser.role === 'admin' || q.page !== 'admin').map(q => `
            <div class="quick-link" onclick="navigate('${q.page}')">
              <div class="ql-icon stat-icon ${q.color}">${ICONS[q.icon]}</div>
              <div class="ql-label">${q.label}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="dashboard-main">
        <div class="card">
          <div class="card-header">
            <h3>Notícias em Destaque</h3>
            <button class="btn btn-ghost btn-sm" onclick="navigate('news')">Ver todas ${ICONS.arrow}</button>
          </div>
          <div class="card-body">
            <div class="news-grid" style="grid-template-columns:repeat(auto-fill,minmax(260px,1fr))">
              ${featuredNews.map(n => newsCardHtml(n)).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3>Empresas do Grupo</h3>
            <button class="btn btn-ghost btn-sm" onclick="navigate('companies')">Ver todas ${ICONS.arrow}</button>
          </div>
          <div class="card-body">
            <div class="companies-grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">
              ${COMPANIES.slice(0,4).map(c => companyCardHtml(c)).join('')}
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-side">
        <div class="card">
          <div class="card-header">
            <h3>Comunicados</h3>
            <button class="btn btn-ghost btn-sm" onclick="navigate('comunicados')">Ver todos ${ICONS.arrow}</button>
          </div>
          <div class="comun-list">
            ${recentComun.map(c => comunItemHtml(c)).join('')}
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Actividade Recente</h3></div>
          <div class="card-body" style="padding:12px 16px;">
            <div class="activity-list">
              ${ACTIVITY.slice(0,5).map(a => `
                <div class="activity-item">
                  <div class="activity-icon" style="background:var(--surface-2);font-size:1rem;">${a.icon}</div>
                  <div class="activity-content">
                    <div class="activity-text"><strong>${a.user}</strong> ${a.action} ${a.target}</div>
                    <div class="activity-time">${a.time} · ${a.company}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        ${renderMiniCalendar()}
      </div>
    </div>
  `;
}

// =============================================
// GROUP PAGE
// =============================================
function renderGroup() {
  const el = document.getElementById('page-group');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Grupo INOV</div>
        <div class="page-subtitle">Ecossistema empresarial integrado</div>
      </div>
    </div>

    <div class="card" style="margin-bottom:24px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0C1A35 0%,#1E3A6E 100%);padding:48px 40px;color:white;">
        <div style="display:flex;align-items:center;gap:20px;margin-bottom:28px;">
          <div style="width:64px;height:64px;background:var(--gold);border-radius:14px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:900;color:var(--navy);">INOV</div>
          <div>
            <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;">INOV Holding</h2>
            <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin-top:2px;">Ecossistema empresarial integrado para Angola e além</p>
          </div>
        </div>
        <p style="font-size:1rem;line-height:1.7;color:rgba(255,255,255,0.8);max-width:700px;">
          A INOV Holding é o centro estratégico de um ecossistema empresarial diversificado, construído com a visão de criar valor sustentável e transformar sectores-chave da economia angolana.
          Agregamos empresas complementares que partilham cultura, valores e missão — trabalhando em conjunto para um impacto maior.
        </p>
        <div style="display:flex;gap:24px;margin-top:28px;flex-wrap:wrap;">
          <div><strong style="font-size:1.5rem;color:var(--gold-light);">${COMPANIES.length}</strong><br/><span style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;">Empresas</span></div>
          <div><strong style="font-size:1.5rem;color:var(--gold-light);">120+</strong><br/><span style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;">Colaboradores</span></div>
          <div><strong style="font-size:1.5rem;color:var(--gold-light);">2023</strong><br/><span style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;">Fundação</span></div>
          <div><strong style="font-size:1.5rem;color:var(--gold-light);">Angola</strong><br/><span style="font-size:0.78rem;color:rgba(255,255,255,0.5);text-transform:uppercase;letter-spacing:0.8px;">Sede</span></div>
        </div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px;">
      <div class="card">
        <div class="card-header"><h3>Propósito & Visão</h3></div>
        <div class="card-body">
          <p style="font-size:0.875rem;color:var(--text-2);line-height:1.7;margin-bottom:16px;">
            Somos um grupo empresarial com propósito claro: <strong>construir empresas de impacto em Angola</strong>,
            que respondam às necessidades reais do mercado e contribuam para o desenvolvimento económico do país.
          </p>
          <p style="font-size:0.875rem;color:var(--text-2);line-height:1.7;">
            A nossa visão é ser o grupo empresarial de referência em Angola, reconhecido pela qualidade das suas
            empresas, pela cultura interna e pelo impacto positivo que gera na sociedade.
          </p>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Cultura Organizacional</h3></div>
        <div class="card-body">
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${['🎯 Foco em Resultados — Agimos com propósito e medimos o impacto de cada decisão.',
               '🤝 Colaboração Total — As empresas do grupo trabalham em conjunto, não em silos.',
               '💡 Mentalidade de Crescimento — Aprendemos continuamente e adaptamo-nos.',
               '🏆 Excelência como Padrão — Não aceitamos mediocridade em nenhum nível.',
               '🌍 Responsabilidade Social — O nosso sucesso deve beneficiar a comunidade.'].map(v => `
              <div style="display:flex;gap:10px;font-size:0.845rem;color:var(--text-2);">${v}</div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="section-sep"><h3>Ecossistema de Empresas</h3></div>
    <div class="companies-grid">
      ${COMPANIES.map(c => companyCardHtml(c)).join('')}
    </div>

    <div class="section-sep" style="margin-top:32px;"><h3>Liderança</h3></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">
      ${[
        { name:'Marco Sanches', role:'CEO & Fundador', company:'INOV Holding', av:'MS' },
        { name:'Ana Ferreira',  role:'Directora de Produção', company:'Factory Ideas', av:'AF' },
        { name:'Pedro Neto',    role:'Director Criativo', company:'Adventure Media', av:'PN' },
        { name:'Diana Costa',   role:'Gestora de Sinistros', company:'Hexa Seguros', av:'DC' },
      ].map(p => `
        <div class="card" style="padding:20px;text-align:center;">
          <div style="width:60px;height:60px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:800;color:white;margin:0 auto 12px;border:2px solid var(--gold);">${p.av}</div>
          <div style="font-size:0.875rem;font-weight:700;color:var(--navy);">${p.name}</div>
          <div style="font-size:0.75rem;color:var(--text-3);margin-top:3px;">${p.role}</div>
          <div style="font-size:0.72rem;color:var(--gold);font-weight:600;margin-top:5px;">${p.company}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// =============================================
// COMPANIES LIST
// =============================================
function renderCompanies() {
  const el = document.getElementById('page-companies');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Empresas Participadas</div>
        <div class="page-subtitle">${COMPANIES.length} empresas no ecossistema INOV</div>
      </div>
    </div>
    <div class="companies-grid">
      ${COMPANIES.map(c => companyCardHtml(c)).join('')}
    </div>
  `;
}

function companyCardHtml(c) {
  const logoHtml = c.logoPath
    ? `<img src="${c.logoPath}" alt="${c.name}" style="max-width:70%;max-height:60px;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"  /><div class="company-card-logo" style="color:${c.accentColor};display:none;">${c.shortName}</div>`
    : `<div class="company-card-logo" style="color:${c.accentColor};">${c.shortName}</div>`;
  return `
    <div class="company-card" onclick="navigate('company-${c.id}')" style="cursor:pointer;">
      <div class="company-card-cover" style="background:${c.coverGradient};display:flex;align-items:center;justify-content:center;">
        ${logoHtml}
      </div>
      <div class="company-card-body">
        <h4>${c.name}</h4>
        <p>${c.description}</p>
      </div>
      <div class="company-card-footer">
        <span>${c.sector}</span>
        <span>${c.employees} pessoas</span>
      </div>
    </div>
  `;
}

// =============================================
// COMPANY PAGE
// =============================================
function renderCompanyPage(id) {
  const c = getCompany(id);
  if (!c) return;
  const el = document.getElementById('page-dynamic');
  const companyNews = getNewsByCompany(id).slice(0, 3);
  const companyDocs = getDocsByCompany(id).slice(0, 4);

  el.innerHTML = `
    <div class="company-hero">
      <div class="company-hero-bg" style="background:${c.coverGradient};"></div>
      <div class="company-hero-overlay">
        ${c.logoPath
          ? `<img src="${c.logoPath}" alt="${c.name}" style="height:64px;max-width:140px;object-fit:contain;border-radius:12px;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" /><div class="company-logo-lg" style="color:${c.accentColor};display:none;">${c.shortName}</div>`
          : `<div class="company-logo-lg" style="color:${c.accentColor};">${c.shortName}</div>`}
        <div class="company-hero-info">
          <h1>${c.name}</h1>
          <p>${c.tagline}</p>
          <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
            <span class="badge badge-gray" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);">${c.sector}</span>
            <span class="badge badge-gray" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);">Fundada ${c.founded}</span>
            <span class="badge badge-gray" style="background:rgba(255,255,255,0.15);color:rgba(255,255,255,0.8);">${c.location}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="company-page-grid">
      <div class="company-page-main">
        <div class="card">
          <div class="card-header"><h3>Sobre a Empresa</h3></div>
          <div class="card-body">
            <p style="font-size:0.875rem;color:var(--text-2);line-height:1.75;">${c.description}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Serviços & Competências</h3></div>
          <div class="card-body">
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${c.services.map(s => `<span class="badge badge-navy" style="font-size:0.78rem;padding:6px 12px;">${s}</span>`).join('')}
            </div>
          </div>
        </div>

        ${companyNews.length ? `
          <div class="card">
            <div class="card-header">
              <h3>Notícias</h3>
              <button class="btn btn-ghost btn-sm" onclick="navigate('news')">Ver todas ${ICONS.arrow}</button>
            </div>
            <div class="card-body">
              <div class="news-grid" style="grid-template-columns:1fr">
                ${companyNews.map(n => `
                  <div style="display:flex;gap:14px;padding:12px 0;border-bottom:1px solid var(--border-light);cursor:pointer;" onclick="navigate('news-${n.id}')">
                    <div style="flex:1;">
                      <div style="font-size:0.72rem;color:var(--text-4);margin-bottom:4px;">${formatDate(n.date)} · ${n.category}</div>
                      <div style="font-size:0.875rem;font-weight:600;color:var(--navy);">${n.title}</div>
                    </div>
                    <div style="color:var(--text-4);flex-shrink:0;align-self:center;">${ICONS.arrow}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        ` : ''}

        ${companyDocs.length ? `
          <div class="card">
            <div class="card-header">
              <h3>Documentos</h3>
              <button class="btn btn-ghost btn-sm" onclick="navigate('docs')">Ver todos ${ICONS.arrow}</button>
            </div>
            <div class="card-body" style="padding:0;">
              ${companyDocs.map(d => docRowHtml(d)).join('')}
            </div>
          </div>
        ` : ''}
      </div>

      <div class="company-page-side">
        <div class="card">
          <div class="card-header"><h3>Informações</h3></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:12px;">
              ${[
                { label:'Fundação',    value:c.founded },
                { label:'Sector',      value:c.sector },
                { label:'Localização', value:c.location },
                { label:'Equipa',      value:c.employees + ' colaboradores' },
              ].map(i => `
                <div>
                  <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-4);margin-bottom:2px;">${i.label}</div>
                  <div style="font-size:0.875rem;color:var(--navy);font-weight:500;">${i.value}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Contactos</h3></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:10px;">
              <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--text-2);">${ICONS.mail} ${c.contacts.email}</div>
              <div style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--text-2);">${ICONS.phone} ${c.contacts.tel}</div>
              <a href="${c.contacts.web}" target="_blank" rel="noopener" style="display:flex;align-items:center;gap:8px;font-size:0.82rem;color:var(--blue);text-decoration:none;" onmouseover="this.style.textDecoration='underline'" onmouseout="this.style.textDecoration='none'">${ICONS.globe} ${c.contacts.web.replace('https://','')} <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg></a>
            </div>
          </div>
        </div>

        ${c.contacts.web ? `
        <a href="${c.contacts.web}" target="_blank" rel="noopener noreferrer"
           class="btn btn-gold" style="width:100%;justify-content:center;display:flex;gap:8px;text-decoration:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          Visitar Website
        </a>` : ''}

        <div class="card">
          <div class="card-header"><h3>Valores</h3></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${c.values.map((v,i) => `
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="width:24px;height:24px;border-radius:50%;background:var(--gold-dim);display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:var(--gold);">${i+1}</div>
                  <span style="font-size:0.845rem;font-weight:500;color:var(--text-2);">${v}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// NEWS
// =============================================
function renderNews() {
  const el = document.getElementById('page-news');
  let filtered = [...NEWS];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Notícias & Novidades</div>
        <div class="page-subtitle">${NEWS.length} artigos publicados</div>
      </div>
      ${currentUser.role !== 'user' ? `<div class="page-actions"><button class="btn btn-primary" onclick="showNewsModal()">${ICONS.plus} Nova Notícia</button></div>` : ''}
    </div>

    <div class="doc-filters" style="margin-bottom:20px;">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Pesquisar notícias…" id="newsSearch" oninput="filterNewsView()" />
      </div>
      <select class="filter-select" id="newsCompanyFilter" onchange="filterNewsView()">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <select class="filter-select" id="newsCatFilter" onchange="filterNewsView()">
        <option value="">Todas as categorias</option>
        ${[...new Set(NEWS.map(n => n.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
      </select>
    </div>

    <div class="news-grid" id="newsGrid">
      ${NEWS.map(n => newsCardHtml(n)).join('')}
    </div>
  `;
}

function filterNewsView() {
  const q    = document.getElementById('newsSearch')?.value.toLowerCase() || '';
  const comp = document.getElementById('newsCompanyFilter')?.value || '';
  const cat  = document.getElementById('newsCatFilter')?.value || '';
  const filtered = NEWS.filter(n => {
    const matchQ = !q || n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q);
    const matchC = !comp || n.companyId === comp;
    const matchCat = !cat || n.category === cat;
    return matchQ && matchC && matchCat;
  });
  const grid = document.getElementById('newsGrid');
  if (grid) grid.innerHTML = filtered.length
    ? filtered.map(n => newsCardHtml(n)).join('')
    : `<div class="empty-state" style="grid-column:1/-1;">${ICONS.newspaper}<h3>Sem resultados</h3><p>Tente ajustar os filtros de pesquisa.</p></div>`;
}

function newsCardHtml(n) {
  const c = getCompany(n.companyId);
  return `
    <div class="news-card" onclick="navigate('news-${n.id}')">
      <div class="news-card-img">
        <div style="width:100%;height:100%;background:${c ? c.coverGradient : 'var(--navy)'};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:2rem;opacity:0.3;">📰</span>
        </div>
        <span class="news-card-company">${c ? c.shortName : 'INOV'}</span>
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          <span class="news-cat-dot"></span>
          <span>${n.category}</span>
          <span>·</span>
          <span>${formatDate(n.date)}</span>
        </div>
        <h4>${n.title}</h4>
        <p>${n.summary}</p>
      </div>
      <div class="news-card-footer">
        <div class="news-author">
          <div class="author-av">${n.author[0]}</div>
          ${n.author.length > 20 ? n.author.slice(0,20)+'…' : n.author}
        </div>
        <div class="news-card-read">${n.readTime} ${ICONS.arrow}</div>
      </div>
    </div>
  `;
}

function renderNewsDetail(id) {
  const n = NEWS.find(x => x.id === id);
  if (!n) return;
  const c = getCompany(n.companyId);
  const el = document.getElementById('page-dynamic');
  el.innerHTML = `
    <div style="max-width:760px;margin:0 auto;">
      <button class="btn btn-ghost btn-sm" onclick="navigate('news')" style="margin-bottom:20px;">← Voltar às notícias</button>
      <div class="card" style="overflow:hidden;">
        <div style="height:240px;background:${c ? c.coverGradient : 'var(--navy)'};display:flex;align-items:center;justify-content:center;">
          <span style="font-size:4rem;opacity:0.3;">📰</span>
        </div>
        <div class="card-body" style="padding:32px 36px;">
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
            <span class="badge badge-navy">${n.category}</span>
            <span class="badge badge-gray">${formatDate(n.date)}</span>
            ${c ? `<span class="badge badge-gold">${c.name}</span>` : ''}
          </div>
          <h1 style="font-size:1.5rem;font-weight:800;color:var(--navy);line-height:1.3;margin-bottom:14px;">${n.title}</h1>
          <p style="font-size:0.9rem;color:var(--text-3);margin-bottom:28px;font-style:italic;">${n.summary}</p>
          <div style="display:flex;align-items:center;gap:12px;padding-bottom:24px;border-bottom:1px solid var(--border);margin-bottom:28px;">
            <div style="width:38px;height:38px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;color:white;font-size:0.8rem;font-weight:700;">${n.author[0]}</div>
            <div>
              <div style="font-size:0.845rem;font-weight:600;color:var(--navy);">${n.author}</div>
              <div style="font-size:0.72rem;color:var(--text-4);">${n.readTime} de leitura</div>
            </div>
          </div>
          <div style="font-size:0.9rem;color:var(--text-2);line-height:1.8;">${n.body}</div>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// COMUNICADOS
// =============================================
function renderComunicados() {
  const el = document.getElementById('page-comunicados');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Comunicados Internos</div>
        <div class="page-subtitle">Mensagens oficiais da administração e departamentos</div>
      </div>
      ${currentUser.role !== 'user' ? `<div class="page-actions"><button class="btn btn-primary" onclick="showComunModal()">${ICONS.plus} Novo Comunicado</button></div>` : ''}
    </div>

    <div style="display:flex;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
      <div style="flex:1;min-width:200px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;display:flex;align-items:center;gap:12px;">
        <div class="stat-icon red" style="width:38px;height:38px;"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
        <div><div style="font-size:1.3rem;font-weight:800;color:var(--navy);">${COMUNICADOS.filter(c=>!c.read).length}</div><div style="font-size:0.72rem;color:var(--text-3);">Não lidos</div></div>
      </div>
      <div style="flex:1;min-width:200px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;display:flex;align-items:center;gap:12px;">
        <div class="stat-icon red" style="width:38px;height:38px;background:var(--red-pale);color:var(--red);">${ICONS.megaphone}</div>
        <div><div style="font-size:1.3rem;font-weight:800;color:var(--navy);">${COMUNICADOS.filter(c=>c.priority==='high').length}</div><div style="font-size:0.72rem;color:var(--text-3);">Alta prioridade</div></div>
      </div>
      <div style="flex:1;min-width:200px;background:var(--white);border:1px solid var(--border);border-radius:var(--radius-lg);padding:16px 20px;display:flex;align-items:center;gap:12px;">
        <div class="stat-icon navy" style="width:38px;height:38px;">${ICONS.megaphone}</div>
        <div><div style="font-size:1.3rem;font-weight:800;color:var(--navy);">${COMUNICADOS.length}</div><div style="font-size:0.72rem;color:var(--text-3);">Total</div></div>
      </div>
    </div>

    <div class="card">
      <div class="card-header"><h3>Todos os Comunicados</h3></div>
      <div class="comun-list">
        ${COMUNICADOS.map(c => `
          <div class="comun-item ${!c.read ? 'comun-unread' : ''}" onclick="showComunDetail(${c.id})">
            <div class="comun-priority prio-${c.priority}"></div>
            <div class="comun-content">
              <div class="comun-title">${c.title}</div>
              <div class="comun-meta">
                <span>${c.author}</span>
                <span>·</span>
                <span>${formatDate(c.date)}</span>
                <span>·</span>
                <span class="badge badge-${c.priority==='high'?'red':c.priority==='medium'?'amber':'green'}" style="font-size:0.6rem;">${c.priority==='high'?'Alta':c.priority==='medium'?'Média':'Baixa'}</span>
              </div>
            </div>
            ${!c.read ? '<span class="comun-badge-new">NOVO</span>' : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function comunItemHtml(c) {
  return `
    <div class="comun-item ${!c.read ? 'comun-unread' : ''}" onclick="navigate('comunicados')">
      <div class="comun-priority prio-${c.priority}"></div>
      <div class="comun-content">
        <div class="comun-title">${c.title}</div>
        <div class="comun-meta"><span>${formatDate(c.date)}</span></div>
      </div>
      ${!c.read ? '<span class="comun-badge-new">NOVO</span>' : ''}
    </div>
  `;
}

function showComunDetail(id) {
  const c = COMUNICADOS.find(x => x.id === id);
  if (!c) return;
  c.read = true;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:620px;">
      <div class="modal-header">
        <div>
          <span class="badge badge-${c.priority==='high'?'red':c.priority==='medium'?'amber':'green'}" style="margin-bottom:6px;display:inline-block;">
            ${c.priority==='high'?'Alta Prioridade':c.priority==='medium'?'Média Prioridade':'Baixa Prioridade'}
          </span>
          <h3 style="font-size:1rem;line-height:1.3;">${c.title}</h3>
        </div>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div style="display:flex;gap:12px;margin-bottom:20px;font-size:0.78rem;color:var(--text-3);">
        <span>${ICONS.mail} ${c.author}</span>
        <span>·</span>
        <span>${formatDate(c.date)}</span>
      </div>
      <div style="font-size:0.875rem;color:var(--text-2);line-height:1.8;border-top:1px solid var(--border);padding-top:18px;">${c.body}</div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Fechar</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
}

// =============================================
// DOCUMENTS
// =============================================
function renderDocs() {
  const el = document.getElementById('page-docs');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Biblioteca de Documentos</div>
        <div class="page-subtitle">${DOCUMENTS.length} documentos disponíveis</div>
      </div>
      ${currentUser.role !== 'user' ? `<div class="page-actions"><button class="btn btn-primary">${ICONS.plus} Adicionar Documento</button></div>` : ''}
    </div>
    <div class="doc-filters">
      <div class="search-box">
        <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input type="text" placeholder="Pesquisar documentos…" id="docSearch" oninput="filterDocsView()" />
      </div>
      <select class="filter-select" id="docCompanyFilter" onchange="filterDocsView()">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <select class="filter-select" id="docCatFilter" onchange="filterDocsView()">
        <option value="">Todas as categorias</option>
        ${[...new Set(DOCUMENTS.map(d => d.category))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
      </select>
    </div>
    <div class="doc-table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:44%">Documento</th>
            <th>Empresa</th>
            <th>Categoria</th>
            <th>Tamanho</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody id="docsTableBody">
          ${DOCUMENTS.filter(d => !d.confidencial).map(d => docRowHtml(d)).join('')}
        </tbody>
      </table>
    </div>
  `;
}

function filterDocsView() {
  const q    = document.getElementById('docSearch')?.value.toLowerCase() || '';
  const comp = document.getElementById('docCompanyFilter')?.value || '';
  const cat  = document.getElementById('docCatFilter')?.value || '';
  const filtered = DOCUMENTS.filter(d => {
    if (d.confidencial) return false; // sempre ocultar confidencial da lista pública
    const matchQ = !q || d.title.toLowerCase().includes(q);
    const matchC = !comp || d.companyId === comp;
    const matchCat = !cat || d.category === cat;
    return matchQ && matchC && matchCat;
  });
  const tbody = document.getElementById('docsTableBody');
  if (tbody) tbody.innerHTML = filtered.length
    ? filtered.map(d => docRowHtml(d)).join('')
    : `<tr><td colspan="6"><div class="empty-state">${ICONS.folder}<h3>Sem resultados</h3></div></td></tr>`;
}

function docRowHtml(d) {
  const c = getCompany(d.companyId);
  const iconColors = { pdf:'pdf', ppt:'ppt', doc:'doc', zip:'zip', xls:'xls' };
  const docIcons   = { pdf:'📄', ppt:'📊', doc:'📝', zip:'🗜', xls:'📈' };
  return `
    <tr>
      <td>
        <div class="doc-name-cell">
          <div class="doc-icon ${iconColors[d.type] || 'doc'}">${docIcons[d.type] || '📄'}</div>
          <div>
            <div class="doc-name-text">${d.title}</div>
            <div class="doc-desc">${d.desc}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-navy" style="font-size:0.68rem;">${c ? c.shortName : '—'}</span></td>
      <td><span class="badge badge-gray">${d.category}</span></td>
      <td style="color:var(--text-3);font-size:0.8rem;">${d.size}</td>
      <td style="color:var(--text-3);font-size:0.8rem;">${formatDate(d.date)}</td>
      <td>
        <div style="display:flex;gap:5px;">
          <button class="btn btn-ghost btn-sm btn-icon" title="Pré-visualizar" onclick="toast('Pré-visualização: ${d.title}','')">
            ${ICONS.eye}
          </button>
          <button class="btn btn-primary btn-sm" onclick="toast('Download: ${d.title}','success')">
            ${ICONS.download}
          </button>
        </div>
      </td>
    </tr>
  `;
}

// =============================================
// BRAND LIBRARY
// =============================================
function renderBrands() {
  const el = document.getElementById('page-brands');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Logótipos & Activos de Marca</div>
        <div class="page-subtitle">Biblioteca oficial de identidade visual do grupo</div>
      </div>
    </div>
    <div class="doc-filters" style="margin-bottom:20px;">
      <select class="filter-select" id="brandCompFilter" onchange="filterBrandsView()">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="brand-grid" id="brandGrid">
      ${BRAND_ASSETS.map(b => brandCardHtml(b)).join('')}
    </div>
  `;
}

function filterBrandsView() {
  const comp = document.getElementById('brandCompFilter')?.value || '';
  const filtered = comp ? BRAND_ASSETS.filter(b => b.companyId === comp) : BRAND_ASSETS;
  const grid = document.getElementById('brandGrid');
  if (grid) grid.innerHTML = filtered.map(b => brandCardHtml(b)).join('');
}

function brandCardHtml(b) {
  const fileUrl  = b.url || (b.file_path ? `/backend/storage/uploads/${b.file_path}` : null);
  const bgColor  = b.colorBg || b.color_bg || b.company_color || '#111827';
  const textColor = b.color  || b.company_accent || '#ffffff';
  const initials  = b.initials || (b.name||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const fmt       = b.format || b.asset_type || '—';
  const ver       = b.version || '1.0';
  const previewHtml = fileUrl
    ? `<img src="${fileUrl}" alt="${b.name}" style="max-width:80%;max-height:80%;object-fit:contain;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><div class="brand-initials" style="color:${textColor};display:none;">${initials}</div>`
    : `<div class="brand-initials" style="color:${textColor};">${initials}</div>`;
  return `
    <div class="brand-card">
      <div class="brand-card-preview" style="background-color:${bgColor};">
        ${previewHtml}
      </div>
      <div class="brand-card-info">
        <h4>${b.name}</h4>
        <p>${fmt} · ${ver} · ${formatDate(b.date || b.created_at)}</p>
        <div class="brand-card-actions">
          <button class="brand-btn" onclick="${fileUrl ? `openBrandPreview('${fileUrl}','${(b.name||'').replace(/'/g,"\\'")}','${bgColor}')` : `toast('Sem ficheiro','error')`}">Ver</button>
          ${fileUrl ? `<a class="brand-btn primary" href="${fileUrl}" download="${(b.original_name||b.name||'logo').replace(/"/g,'')}">${ICONS.download} Download</a>` : `<button class="brand-btn primary" onclick="toast('Sem ficheiro','error')">${ICONS.download} Download</button>`}
        </div>
      </div>
    </div>
  `;
}

function openBrandPreview(fileUrl, name, bgColor) {
  const lb = document.getElementById('lightbox');
  const isImg = /\.(svg|png|jpg|jpeg|webp|gif)$/i.test(fileUrl);
  lb.innerHTML = `
    <div class="lightbox-content" style="max-width:700px;">
      <button class="lightbox-close" onclick="document.getElementById('lightbox').classList.remove('open')">${ICONS.x}</button>
      <div style="background:${bgColor||'#111827'};border-radius:8px;padding:40px;display:flex;align-items:center;justify-content:center;min-height:240px;">
        ${isImg
          ? `<img src="${fileUrl}" alt="${name}" style="max-width:100%;max-height:360px;object-fit:contain;" />`
          : `<div style="color:#fff;opacity:.6;font-size:3rem;">📄</div>`}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;">
        <span style="color:rgba(255,255,255,.7);font-size:.9rem;">${name}</span>
        <a href="${fileUrl}" download class="btn btn-primary btn-sm">${ICONS.download} Download</a>
      </div>
    </div>`;
  lb.classList.add('open');
  lb.onclick = (e) => { if (e.target === lb) lb.classList.remove('open'); };
}

// =============================================
// GALLERY
// =============================================
function renderGallery() {
  const el = document.getElementById('page-gallery');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Galeria & Portfólios</div>
        <div class="page-subtitle">Projectos, eventos e campanhas do grupo</div>
      </div>
      ${currentUser.role !== 'user' ? `<div class="page-actions"><button class="btn btn-primary" onclick="if(typeof showCreateAlbumModal==='function')showCreateAlbumModal()">${ICONS.plus} Novo Álbum</button></div>` : ''}
    </div>
    <div class="doc-filters" style="margin-bottom:20px;">
      <select class="filter-select" id="gallCompFilter" onchange="filterGalleryView()">
        <option value="">Todas as empresas</option>
        ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
      </select>
      <select class="filter-select" id="gallCatFilter" onchange="filterGalleryView()">
        <option value="">Todas as categorias</option>
        ${[...new Set(GALLERY.map(g => g.category).filter(Boolean))].map(cat => `<option value="${cat}">${cat}</option>`).join('')}
      </select>
    </div>
    <div class="gallery-grid" id="gallGrid">
      ${GALLERY.map(g => galleryItemHtml(g)).join('')}
    </div>
  `;
  // Refresh gallery from API silently so new uploads appear
  api.gallery({ per_page: 100 }).then(res => {
    if (res.success) {
      const items = res.data?.items || res.data || [];
      window.GALLERY = normalizeGallery(items);
      const grid = document.getElementById('gallGrid');
      if (grid) grid.innerHTML = GALLERY.map(g => galleryItemHtml(g)).join('');
    }
  });
}

function filterGalleryView() {
  const comp = document.getElementById('gallCompFilter')?.value || '';
  const cat  = document.getElementById('gallCatFilter')?.value || '';
  const filtered = GALLERY.filter(g => {
    return (!comp || g.companyId === comp) && (!cat || g.category === cat);
  });
  const grid = document.getElementById('gallGrid');
  if (grid) grid.innerHTML = filtered.map(g => galleryItemHtml(g)).join('');
}

function galleryItemHtml(g) {
  const title = g.title || g.project || '';
  const bgStyle = g.cover
    ? `background-image:url('${g.cover}');background-size:cover;background-position:center;`
    : `background:${g.cover_color || g.color || '#111827'};`;
  const count = g.item_count || g.photos?.length || 0;
  return `
    <div class="gallery-item" onclick="openAlbum(${g.id})">
      <div class="gallery-item-bg" style="${bgStyle}"></div>
      <div class="gallery-overlay">${ICONS.zoom}</div>
      <div class="gallery-item-label">${title}${count ? ` <span style="opacity:.6;font-size:.75rem;">(${count})</span>` : ''}</div>
    </div>
  `;
}

async function openAlbum(albumId) {
  const lb = document.getElementById('lightbox');
  lb.innerHTML = `<div class="lightbox-content" style="max-width:900px;"><div style="text-align:center;padding:60px;color:#fff;opacity:.6;">A carregar…</div></div>`;
  lb.classList.add('open');
  lb.onclick = (e) => { if (e.target === lb) lb.classList.remove('open'); };

  const res = await api.galleryAlbum(albumId);
  if (!res.success) {
    lb.innerHTML = `<div class="lightbox-content"><p style="color:#fff;padding:40px;">Erro ao carregar álbum.</p></div>`;
    return;
  }

  const album = res.data;
  const items = (album.items || []).map(item => ({
    ...item,
    url: item.file_path ? `/backend/storage/uploads/${item.file_path}` : null,
  }));

  let current = 0;

  function renderSlide() {
    const item = items[current];
    const total = items.length;
    lb.innerHTML = `
      <div class="lightbox-content" style="max-width:920px;position:relative;">
        <button class="lightbox-close" onclick="document.getElementById('lightbox').classList.remove('open')" style="position:absolute;top:12px;right:12px;z-index:10;">${ICONS.x}</button>
        <div style="font-size:.8rem;color:rgba(255,255,255,.5);margin-bottom:10px;">${album.title} · ${current+1} / ${total}</div>
        ${item ? `
          <div style="width:100%;max-height:65vh;display:flex;align-items:center;justify-content:center;background:#111;border-radius:8px;overflow:hidden;">
            <img src="${item.url}" alt="${item.title||''}" style="max-width:100%;max-height:65vh;object-fit:contain;" />
          </div>
          ${item.title ? `<div style="color:rgba(255,255,255,.7);margin-top:10px;font-size:.85rem;">${item.title}</div>` : ''}
        ` : `<div style="color:#fff;padding:40px;text-align:center;">Este álbum está vazio.</div>`}
        ${total > 1 ? `
          <div style="display:flex;justify-content:space-between;margin-top:14px;">
            <button onclick="event.stopPropagation();_albumNav(${albumId},${current}-1)" class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,.3);">← Anterior</button>
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:center;max-width:60%;">
              ${items.map((it,i) => `<img src="${it.url}" onclick="event.stopPropagation();_albumNav(${albumId},${i})" style="width:44px;height:44px;object-fit:cover;border-radius:4px;cursor:pointer;opacity:${i===current?1:.45};border:${i===current?'2px solid #fff':'2px solid transparent'};" />`).join('')}
            </div>
            <button onclick="event.stopPropagation();_albumNav(${albumId},${current}+1)" class="btn btn-outline" style="color:#fff;border-color:rgba(255,255,255,.3);">Próxima →</button>
          </div>
        ` : ''}
      </div>`;
    lb.onclick = (e) => { if (e.target === lb) lb.classList.remove('open'); };
  }

  window._albumNav = function(id, idx) {
    current = ((idx % items.length) + items.length) % items.length;
    renderSlide();
  };

  renderSlide();
}

// =============================================
// PROFILE
// =============================================
function renderProfile() {
  const el = document.getElementById('page-profile');
  const u  = currentUser;
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Meu Perfil</div>
        <div class="page-subtitle">Informações pessoais e da conta</div>
      </div>
      <div class="page-actions">
        <button class="btn btn-outline" onclick="toast('Funcionalidade disponível em breve','')">Editar Perfil</button>
      </div>
    </div>

    <div class="profile-header">
      <div class="profile-avatar">${u.avatar || 'U'}</div>
      <div class="profile-info">
        <h2>${u.name}</h2>
        <div class="profile-role">${u.job || '—'}</div>
        <div class="profile-tags">
          <span class="profile-tag navy">${u.company}</span>
          <span class="profile-tag">${u.dept}</span>
          <span class="profile-tag gold badge role-${u.role}">${u.role === 'admin' ? 'Administrador' : u.role === 'editor' ? 'Editor' : 'Colaborador'}</span>
        </div>
      </div>
    </div>

    <div class="profile-grid">
      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="card">
          <div class="card-header"><h3>Informações Pessoais</h3></div>
          <div class="card-body">
            <div class="form-grid-2">
              ${[
                { label:'Nome completo', value:u.name },
                { label:'Email', value:u.email },
                { label:'Empresa', value:u.company },
                { label:'Departamento', value:u.dept },
                { label:'Função', value:u.job },
                { label:'Data de registo', value:formatDate(u.joined) },
              ].map(f => `
                <div class="form-field">
                  <label class="form-label">${f.label}</label>
                  <input class="form-input" value="${f.value || '—'}" readonly style="background:var(--surface);" />
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Alterar Password</h3></div>
          <div class="card-body">
            <div class="form-field">
              <label class="form-label">Password actual</label>
              <input type="password" class="form-input" placeholder="••••••••" />
            </div>
            <div class="form-grid-2">
              <div class="form-field">
                <label class="form-label">Nova password</label>
                <input type="password" class="form-input" placeholder="••••••••" />
              </div>
              <div class="form-field">
                <label class="form-label">Confirmar</label>
                <input type="password" class="form-input" placeholder="••••••••" />
              </div>
            </div>
            <button class="btn btn-primary" onclick="toast('Password actualizada com sucesso','success')">Actualizar Password</button>
          </div>
        </div>
      </div>

      <div style="display:flex;flex-direction:column;gap:20px;">
        <div class="card">
          <div class="card-header"><h3>Resumo da Conta</h3></div>
          <div class="card-body">
            <div style="display:flex;flex-direction:column;gap:14px;">
              ${[
                { label:'Nível de acesso', value: u.role === 'admin' ? '🛡 Administrador' : u.role === 'editor' ? '✏️ Editor' : '👁 Colaborador' },
                { label:'Empresa', value: u.company },
                { label:'Membro desde', value: formatDate(u.joined) },
                { label:'Último acesso', value: 'Hoje' },
              ].map(i => `
                <div style="display:flex;justify-content:space-between;align-items:center;font-size:0.845rem;">
                  <span style="color:var(--text-3);">${i.label}</span>
                  <span style="font-weight:600;color:var(--navy);">${i.value}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><h3>Preferências</h3></div>
          <div class="card-body">
            ${[
              { label:'Notificações por email', on:true },
              { label:'Comunicados por WhatsApp', on:false },
              { label:'Newsletter semanal do grupo', on:true },
            ].map(p => `
              <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-light);">
                <span style="font-size:0.845rem;color:var(--text-2);">${p.label}</span>
                <label style="position:relative;width:38px;height:20px;flex-shrink:0;cursor:pointer;">
                  <input type="checkbox" ${p.on?'checked':''} style="display:none;" />
                  <span style="position:absolute;inset:0;background:${p.on?'var(--navy)':'var(--border)'};border-radius:20px;transition:background 0.2s;"></span>
                  <span style="position:absolute;top:2px;left:${p.on?'20':'2'}px;width:16px;height:16px;background:white;border-radius:50%;transition:left 0.2s;"></span>
                </label>
              </div>
            `).join('')}
          </div>
        </div>

        <button class="btn btn-danger" style="width:100%;" onclick="if(confirm('Terminar sessão?')){clearSession();window.location.href='index.html';}">Terminar Sessão</button>
      </div>
    </div>
  `;
}

// =============================================
// SOBRE NÓS / ECOSSISTEMA
// =============================================
function renderSobre() {
  const el = document.getElementById('page-sobre');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Sobre o Grupo INOV</div>
        <div class="page-subtitle">Ecossistema empresarial integrado — 7 empresas, 1 propósito</div>
      </div>
    </div>

    <!-- Banner do grupo -->
    <div style="background:linear-gradient(135deg,#0C1A35 0%,#1E3A6E 100%);border-radius:var(--radius-xl);padding:40px;margin-bottom:28px;color:white;position:relative;overflow:hidden;">
      <div style="position:absolute;right:-20px;top:-20px;width:200px;height:200px;border-radius:50%;background:rgba(201,162,76,0.08);pointer-events:none;"></div>
      <div style="position:absolute;right:60px;bottom:-40px;width:120px;height:120px;border-radius:50%;background:rgba(201,162,76,0.05);pointer-events:none;"></div>
      <div style="max-width:600px;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
          <div style="width:44px;height:44px;background:var(--gold);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:900;color:var(--navy);">INOV</div>
          <span style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:rgba(255,255,255,0.4);">Grupo INOV Holding</span>
        </div>
        <h2 style="font-size:1.6rem;font-weight:800;letter-spacing:-0.5px;margin-bottom:10px;line-height:1.25;">Construindo o ecossistema empresarial<br/>de referência em Angola</h2>
        <p style="font-size:0.9rem;color:rgba(255,255,255,0.65);line-height:1.7;margin-bottom:20px;">A INOV Holding agrega 7 empresas complementares que actuam em sectores estratégicos da economia angolana — comunicação visual, media digital, mobilidade, seguros, energia e agência criativa. Cada empresa partilha a mesma cultura de inovação, rigor e impacto.</p>
        <div style="display:flex;gap:28px;flex-wrap:wrap;">
          ${[['7','Empresas participadas'],['120+','Colaboradores'],['2023','Ano de fundação'],['5','Sectores de actuação']].map(([v,l])=>`
            <div>
              <div style="font-size:1.4rem;font-weight:800;color:var(--gold);">${v}</div>
              <div style="font-size:0.72rem;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:0.5px;">${l}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Grid de empresas -->
    <div class="section-sep"><h3>Empresas do Ecossistema</h3></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:20px;">
      ${COMPANIES.map(c => `
        <div class="card" style="overflow:hidden;">
          <!-- Cover -->
          <div style="background:${c.coverGradient};height:100px;position:relative;display:flex;align-items:flex-end;padding:16px;">
            <div style="background:white;border-radius:10px;padding:7px 14px;font-size:0.78rem;font-weight:800;color:${c.color};letter-spacing:-0.3px;">${c.shortName}</div>
          </div>
          <!-- Body -->
          <div class="card-body">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
              <div>
                <div style="font-size:1rem;font-weight:700;color:var(--navy);">${c.name}</div>
                <div style="font-size:0.72rem;color:var(--text-4);margin-top:2px;">${c.sector}</div>
              </div>
              <span class="badge badge-gray" style="font-size:0.62rem;flex-shrink:0;">${c.employees} pessoas</span>
            </div>
            <p style="font-size:0.82rem;color:var(--text-2);line-height:1.65;margin-bottom:16px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;">${c.description}</p>
            <!-- Serviços -->
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:16px;">
              ${c.services.slice(0,3).map(s=>`<span class="badge badge-gray" style="font-size:0.62rem;">${s}</span>`).join('')}
              ${c.services.length>3?`<span class="badge badge-gray" style="font-size:0.62rem;">+${c.services.length-3}</span>`:''}
            </div>
            <!-- Footer com contactos e link -->
            <div style="display:flex;align-items:center;justify-content:space-between;padding-top:14px;border-top:1px solid var(--border-light);gap:10px;">
              <div style="font-size:0.75rem;color:var(--text-3);min-width:0;">
                <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${c.contacts.email}</div>
                <div style="color:var(--text-4);">${c.location}</div>
              </div>
              <div style="display:flex;gap:6px;flex-shrink:0;">
                <button class="btn btn-outline btn-sm" onclick="navigate('company-${c.id}')">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                  Intranet
                </button>
                <a href="${c.contacts.web}" target="_blank" rel="noopener noreferrer"
                   class="btn btn-gold btn-sm" style="text-decoration:none;">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                  Website
                </a>
              </div>
            </div>
          </div>
        </div>
      `).join('')}
    </div>

    <!-- Contacto geral do grupo -->
    <div style="margin-top:28px;background:var(--surface-2);border:1px solid var(--border);border-radius:var(--radius-lg);padding:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px;">
      <div>
        <div style="font-size:0.92rem;font-weight:700;color:var(--navy);margin-bottom:4px;">Grupo INOV Holding</div>
        <div style="font-size:0.82rem;color:var(--text-3);">Para questões institucionais, parcerias e investimentos</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="mailto:geral@inov.ao" class="btn btn-outline btn-sm" style="text-decoration:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          geral@inov.ao
        </a>
        <a href="https://www.inov.ao" target="_blank" rel="noopener" class="btn btn-primary btn-sm" style="text-decoration:none;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
          www.inov.ao
        </a>
      </div>
    </div>
  `;
}

// =============================================
// ADMIN
// =============================================
function renderAdmin() {
  if (currentUser.role !== 'admin') {
    document.getElementById('page-admin').innerHTML = `
      <div class="empty-state">${ICONS.shield}<h3>Acesso Restrito</h3><p>Esta área é exclusiva para administradores.</p></div>
    `;
    return;
  }
  const users = getAllUsers();
  const el = document.getElementById('page-admin');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Painel de Administração</div>
        <div class="page-subtitle">Gestão de utilizadores, conteúdos e configurações</div>
      </div>
    </div>

    <div class="stats-row" style="grid-template-columns:repeat(4,1fr)">
      <div class="stat-card">
        <div class="stat-card-top"><div class="stat-icon blue">${ICONS.users}</div></div>
        <div class="stat-value">${users.length}</div>
        <div class="stat-label">Utilizadores registados</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top"><div class="stat-icon amber">${ICONS.newspaper}</div></div>
        <div class="stat-value">${NEWS.length}</div>
        <div class="stat-label">Notícias publicadas</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top"><div class="stat-icon green">${ICONS.folder}</div></div>
        <div class="stat-value">${DOCUMENTS.length}</div>
        <div class="stat-label">Documentos</div>
      </div>
      <div class="stat-card">
        <div class="stat-card-top"><div class="stat-icon purple">${ICONS.megaphone}</div></div>
        <div class="stat-value">${COMUNICADOS.length}</div>
        <div class="stat-label">Comunicados</div>
      </div>
    </div>

    <div class="admin-tabs">
      <button class="admin-tab active" onclick="switchAdminTab('users',this)">Utilizadores</button>
      <button class="admin-tab" onclick="switchAdminTab('content',this)">Conteúdos</button>
      <button class="admin-tab" onclick="switchAdminTab('companies-admin',this)">Empresas</button>
      <button class="admin-tab" onclick="switchAdminTab('settings',this)">Configurações</button>
    </div>

    <div id="adminTab-users" class="admin-tab-content active">
      <div class="page-actions" style="justify-content:flex-end;margin-bottom:16px;">
        <button class="btn btn-primary" onclick="toast('Funcionalidade em desenvolvimento','')"> ${ICONS.plus} Novo Utilizador</button>
      </div>
      <div class="doc-table-wrap">
        <table>
          <thead>
            <tr><th>Utilizador</th><th>Email</th><th>Empresa</th><th>Função</th><th>Nível</th><th>Registo</th><th>Ações</th></tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>
                  <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:34px;height:34px;border-radius:50%;background:var(--navy);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:700;color:white;flex-shrink:0;">${u.avatar||'U'}</div>
                    <span style="font-weight:600;color:var(--navy);">${u.name}</span>
                  </div>
                </td>
                <td style="font-size:0.8rem;color:var(--text-3);">${u.email}</td>
                <td><span class="badge badge-navy" style="font-size:0.65rem;">${u.company?.split(' ')[0]||'—'}</span></td>
                <td style="font-size:0.8rem;">${u.job||'—'}</td>
                <td><span class="badge role-${u.role}">${u.role==='admin'?'Admin':u.role==='editor'?'Editor':'Colaborador'}</span></td>
                <td style="font-size:0.78rem;color:var(--text-4);">${formatDate(u.joined)}</td>
                <td>
                  <div style="display:flex;gap:4px;">
                    <button class="btn btn-ghost btn-sm btn-icon" onclick="toast('Editar: ${u.name}','')">${ICONS.edit}</button>
                    ${u.id !== currentUser.id ? `<button class="btn btn-danger btn-sm btn-icon" onclick="deleteUserAdmin(${u.id})">${ICONS.trash}</button>` : ''}
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <div id="adminTab-content" class="admin-tab-content">
      ${renderAdminContentTab()}
    </div>

    <div id="adminTab-companies-admin" class="admin-tab-content">
      <div class="companies-grid">
        ${COMPANIES.map(c => `
          <div class="company-card">
            <div class="company-card-cover" style="background:${c.coverGradient};">
              <div class="company-card-logo" style="color:${c.accentColor};">${c.shortName}</div>
            </div>
            <div class="company-card-body">
              <h4>${c.name}</h4>
              <p>${c.sector}</p>
            </div>
            <div class="company-card-footer">
              <button class="btn btn-ghost btn-sm" onclick="navigate('company-${c.id}')">${ICONS.eye} Ver</button>
              <button class="btn btn-outline btn-sm" onclick="toast('Editar página: ${c.name}','')">${ICONS.edit} Editar</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>

    <div id="adminTab-settings" class="admin-tab-content">
      <div class="card" style="max-width:600px;">
        <div class="card-header"><h3>Configurações da Plataforma</h3></div>
        <div class="card-body">
          <div class="form-field">
            <label class="form-label">Nome da plataforma</label>
            <input class="form-input" value="INOV Intranet" />
          </div>
          <div class="form-field">
            <label class="form-label">Email de suporte</label>
            <input class="form-input" value="intranet@inov.ao" />
          </div>
          <div class="form-field">
            <label class="form-label">Aprovação de novos registos</label>
            <select class="form-select">
              <option selected>Automática (sem aprovação)</option>
              <option>Manual (require aprovação de admin)</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">Idioma padrão</label>
            <select class="form-select">
              <option selected>Português</option>
              <option>English</option>
            </select>
          </div>
          <button class="btn btn-primary" onclick="toast('Configurações guardadas','success')">Guardar Configurações</button>
        </div>
      </div>
    </div>
  `;
}

// =============================================
// ADMIN — GESTÃO DE CONTEÚDO
// =============================================
function switchToContentTab() {
  const btn = document.querySelector('.admin-tab:nth-child(2)');
  if (btn) switchAdminTab('content', btn);
}

function renderAdminContentTab() {
  const pubDocs  = DOCUMENTS.filter(d => !d.confidential && !d.confidencial);
  const confDocs = DOCUMENTS.filter(d =>  d.confidential ||  d.confidencial);
  const docIcons = { pdf:'📄', ppt:'📊', doc:'📝', zip:'🗜', xls:'📈' };
  return `
    <div class="tabs" style="margin-bottom:20px;">
      <button class="tab active" id="ctab-btn-news"   onclick="switchContentTab('cnews',this)">Notícias <span class="nav-badge" style="background:var(--navy);color:white;margin-left:6px;vertical-align:middle;">${NEWS.length}</span></button>
      <button class="tab" id="ctab-btn-comun"         onclick="switchContentTab('ccomun',this)">Comunicados <span class="nav-badge" style="background:var(--navy);color:white;margin-left:6px;vertical-align:middle;">${COMUNICADOS.length}</span></button>
      <button class="tab" id="ctab-btn-docs"          onclick="switchContentTab('cdocs',this)">Documentos <span class="nav-badge" style="background:var(--navy);color:white;margin-left:6px;vertical-align:middle;">${pubDocs.length}</span></button>
      <button class="tab" id="ctab-btn-conf"          onclick="switchContentTab('cconf',this)" style="color:var(--red);">Confidencial <span class="nav-badge" style="background:var(--red);color:white;margin-left:6px;vertical-align:middle;">${confDocs.length}</span></button>
    </div>

    <!-- NOTÍCIAS -->
    <div id="ctab-cnews" class="ctab-pane" style="display:block;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
        <button class="btn btn-primary btn-sm" onclick="showNewsModal()">${ICONS.plus} Nova Notícia</button>
      </div>
      <div class="doc-table-wrap">
        <table>
          <thead><tr><th style="width:40%">Título</th><th>Empresa</th><th>Categoria</th><th>Autor</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            ${NEWS.map(n => `<tr>
              <td><div class="doc-name-text" style="font-size:0.845rem;">${escHtml(n.title)}</div>${n.featured||n.is_featured ? '<span class="badge badge-gold" style="font-size:0.6rem;margin-top:3px;">Destaque</span>' : ''}</td>
              <td><span class="badge badge-navy" style="font-size:0.65rem;">${escHtml(n.company||n.company_name||'—')}</span></td>
              <td><span class="badge badge-gray" style="font-size:0.65rem;">${escHtml(n.category||'—')}</span></td>
              <td style="font-size:0.78rem;color:var(--text-3);">${escHtml(n.author||n.author_name||'—')}</td>
              <td style="font-size:0.78rem;color:var(--text-3);">${formatDate(n.date||n.published_at)}</td>
              <td><div style="display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="showEditNewsModal(${n.id})" title="Editar">${ICONS.edit}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteNews(${n.id})" title="Eliminar">${ICONS.trash}</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- COMUNICADOS -->
    <div id="ctab-ccomun" class="ctab-pane" style="display:none;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
        <button class="btn btn-primary btn-sm" onclick="showComunModal()">${ICONS.plus} Novo Comunicado</button>
      </div>
      <div class="doc-table-wrap">
        <table>
          <thead><tr><th style="width:42%">Título</th><th>Prioridade</th><th>Empresa</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            ${COMUNICADOS.map(c => {
              const pLabel = c.priority==='high'?'Alta':c.priority==='medium'?'Média':'Baixa';
              const pColor = c.priority==='high'?'var(--red)':c.priority==='medium'?'var(--amber)':'var(--green)';
              const pBg    = c.priority==='high'?'var(--red-pale)':c.priority==='medium'?'var(--amber-pale)':'var(--green-pale)';
              return `<tr>
                <td><div class="doc-name-text" style="font-size:0.845rem;">${escHtml(c.title)}</div>${c.is_pinned||c.pinned ? '<span class="badge" style="background:var(--amber-pale);color:var(--amber);font-size:0.6rem;margin-top:3px;">Fixado</span>' : ''}</td>
                <td><span class="badge" style="background:${pBg};color:${pColor};font-size:0.65rem;">${pLabel}</span></td>
                <td><span class="badge badge-navy" style="font-size:0.65rem;">${escHtml(c.company||c.company_name||'Global')}</span></td>
                <td style="font-size:0.78rem;color:var(--text-3);">${formatDate(c.date||c.created_at)}</td>
                <td><div style="display:flex;gap:4px;">
                  <button class="btn btn-ghost btn-sm btn-icon" onclick="showEditComunModal(${c.id})" title="Editar">${ICONS.edit}</button>
                  <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteComun(${c.id})" title="Eliminar">${ICONS.trash}</button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- DOCUMENTOS -->
    <div id="ctab-cdocs" class="ctab-pane" style="display:none;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
        <button class="btn btn-primary btn-sm" onclick="showAddDocModal(false)">${ICONS.plus} Adicionar Documento</button>
      </div>
      <div class="doc-table-wrap">
        <table>
          <thead><tr><th style="width:42%">Documento</th><th>Empresa</th><th>Categoria</th><th>Tamanho</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            ${pubDocs.map(d => `<tr>
              <td><div class="doc-name-cell">
                <div class="doc-icon ${d.fileType||d.file_type||'doc'}" style="font-size:1rem;">${docIcons[d.fileType||d.file_type]||'📄'}</div>
                <div><div class="doc-name-text">${escHtml(d.title)}</div><div class="doc-desc">${escHtml(d.description||d.desc||'')}</div></div>
              </div></td>
              <td><span class="badge badge-navy" style="font-size:0.65rem;">${escHtml(d.company||d.company_name||'—')}</span></td>
              <td><span class="badge badge-gray" style="font-size:0.65rem;">${escHtml(d.category||'—')}</span></td>
              <td style="font-size:0.78rem;color:var(--text-3);">${d.fileSize||d.file_size_human||'—'}</td>
              <td style="font-size:0.78rem;color:var(--text-3);">${formatDate(d.date||d.created_at)}</td>
              <td><div style="display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="showEditDocModal(${d.id})" title="Editar">${ICONS.edit}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteDoc(${d.id})" title="Eliminar">${ICONS.trash}</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- CONFIDENCIAL -->
    <div id="ctab-cconf" class="ctab-pane" style="display:none;">
      <div style="display:flex;justify-content:flex-end;margin-bottom:14px;">
        <button class="btn btn-sm" style="background:var(--red-pale);color:var(--red);border:1px solid #FECACA;" onclick="showAddDocModal(true)">${ICONS.plus} Adicionar Documento Confidencial</button>
      </div>
      <div class="doc-table-wrap">
        <table>
          <thead><tr><th style="width:42%">Documento</th><th>Categoria</th><th>Tamanho</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            ${confDocs.map(d => `<tr>
              <td><div class="doc-name-cell">
                <div class="doc-icon ${d.fileType||d.file_type||'doc'}" style="font-size:1rem;">${docIcons[d.fileType||d.file_type]||'📄'}</div>
                <div><div class="doc-name-text">${escHtml(d.title)}</div><div class="doc-desc">${escHtml(d.description||d.desc||'')}</div></div>
              </div></td>
              <td><span class="badge" style="background:var(--red-pale);color:var(--red);border:1px solid #FECACA;font-size:0.65rem;">Confidencial</span></td>
              <td style="font-size:0.78rem;color:var(--text-3);">${d.fileSize||d.file_size_human||'—'}</td>
              <td style="font-size:0.78rem;color:var(--text-3);">${formatDate(d.date||d.created_at)}</td>
              <td><div style="display:flex;gap:4px;">
                <button class="btn btn-ghost btn-sm btn-icon" onclick="showEditDocModal(${d.id})" title="Editar">${ICONS.edit}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteDoc(${d.id})" title="Eliminar">${ICONS.trash}</button>
              </div></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function switchContentTab(tab, btn) {
  document.querySelectorAll('.ctab-pane').forEach(p => p.style.display = 'none');
  document.querySelectorAll('#adminTab-content .tab').forEach(b => b.classList.remove('active'));
  const el = document.getElementById('ctab-' + tab);
  if (el) el.style.display = 'block';
  if (btn) btn.classList.add('active');
}

function adminDeleteNews(id) {
  if (!confirm('Eliminar esta notícia permanentemente?')) return;
  saveNews(NEWS.filter(n => n.id !== id));
  renderAdmin();
  switchToContentTab();
  toast('Notícia eliminada', 'success');
}

function adminDeleteComun(id) {
  if (!confirm('Eliminar este comunicado permanentemente?')) return;
  saveComunicados(COMUNICADOS.filter(c => c.id !== id));
  renderAdmin();
  switchToContentTab();
  toast('Comunicado eliminado', 'success');
}

function adminDeleteDoc(id) {
  if (!confirm('Eliminar este documento permanentemente?')) return;
  const wasConf = DOCUMENTS.find(d => d.id === id)?.confidencial;
  saveDocuments(DOCUMENTS.filter(d => d.id !== id));
  renderAdmin();
  switchToContentTab();
  // Switch to the right sub-tab
  setTimeout(() => {
    const tab  = wasConf ? 'cconf' : 'cdocs';
    const btn  = document.getElementById('ctab-btn-' + (wasConf ? 'conf' : 'docs'));
    switchContentTab(tab, btn);
  }, 50);
  toast('Documento eliminado', 'success');
}

function showEditNewsModal(id) {
  const n = NEWS.find(x => x.id === id);
  if (!n) return;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:640px;">
      <div class="modal-header">
        <h3>Editar Notícia</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="editNewsTitle" value="${n.title.replace(/"/g,'&quot;')}" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa</label>
          <select class="form-select" id="editNewsCompany">
            ${COMPANIES.map(c => `<option value="${c.id}" ${c.id===n.companyId?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria</label>
          <input class="form-input" id="editNewsCat" value="${n.category}" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Resumo</label>
        <textarea class="form-textarea" id="editNewsSummary" rows="2">${n.summary}</textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo completo</label>
        <textarea class="form-textarea" id="editNewsBody" rows="6">${(n.body||'').replace(/<[^>]*>/g,'')}</textarea>
      </div>
      <div class="form-field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="editNewsFeatured" ${n.featured?'checked':''} style="width:auto;" />
        <label class="form-label" style="margin:0;">Publicar em Destaque</label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitEditNews(${id})">Guardar Alterações</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
}

function submitEditNews(id) {
  const title = document.getElementById('editNewsTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }
  const updated = NEWS.map(n => n.id === id ? {
    ...n,
    title,
    companyId: document.getElementById('editNewsCompany').value,
    category:  document.getElementById('editNewsCat').value || n.category,
    summary:   document.getElementById('editNewsSummary').value,
    body:      `<p>${document.getElementById('editNewsBody').value}</p>`,
    featured:  document.getElementById('editNewsFeatured').checked,
  } : n);
  saveNews(updated);
  closeModal();
  toast('Notícia actualizada com sucesso', 'success');
  renderAdmin();
  switchToContentTab();
}

function showAddDocModal(isConfidencial) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:600px;">
      <div class="modal-header">
        <h3>${isConfidencial ? '🔒 Documento Confidencial' : 'Adicionar Documento'}</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      ${isConfidencial ? '<div style="background:var(--red-pale);border:1px solid #FECACA;border-radius:6px;padding:10px 14px;font-size:0.8rem;color:var(--red);margin-bottom:16px;">Este documento só será visível para administradores.</div>' : ''}
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="addDocTitle" placeholder="Título do documento" />
      </div>
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="addDocDesc" placeholder="Breve descrição do documento" />
      </div>
      <div class="form-grid-2">
        ${!isConfidencial ? `
        <div class="form-field">
          <label class="form-label">Empresa *</label>
          <select class="form-select" id="addDocCompany">
            ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>` : '<input type="hidden" id="addDocCompany" value="inov" />'}
        <div class="form-field">
          <label class="form-label">Categoria *</label>
          <input class="form-input" id="addDocCat" placeholder="ex: Governança, RH, Comercial…" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Tipo de ficheiro</label>
          <select class="form-select" id="addDocType">
            <option value="pdf">PDF</option>
            <option value="doc">Word (.docx)</option>
            <option value="xls">Excel (.xlsx)</option>
            <option value="ppt">PowerPoint (.pptx)</option>
            <option value="zip">ZIP</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Tamanho (ex: 2.4 MB)</label>
          <input class="form-input" id="addDocSize" placeholder="2.4 MB" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitAddDoc(${isConfidencial})">Adicionar Documento</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
}

function submitAddDoc(isConfidencial) {
  const title = document.getElementById('addDocTitle')?.value.trim();
  const cat   = document.getElementById('addDocCat')?.value.trim();
  if (!title || !cat) { toast('Preencha título e categoria', 'error'); return; }
  const d = {
    id:           Date.now(),
    companyId:    document.getElementById('addDocCompany')?.value || 'inov',
    category:     cat,
    title,
    desc:         document.getElementById('addDocDesc')?.value || '',
    file:         title.toLowerCase().replace(/\s+/g,'-') + '.' + (document.getElementById('addDocType')?.value || 'pdf'),
    type:         document.getElementById('addDocType')?.value || 'pdf',
    size:         document.getElementById('addDocSize')?.value || '—',
    date:         new Date().toISOString().split('T')[0],
    downloads:    0,
    confidencial: !!isConfidencial,
  };
  DOCUMENTS.push(d);
  saveDocuments(DOCUMENTS);
  closeModal();
  toast('Documento adicionado com sucesso', 'success');
  renderAdmin();
  switchToContentTab();
  setTimeout(() => {
    const tab = isConfidencial ? 'cconf' : 'cdocs';
    const btn = document.getElementById('ctab-btn-' + (isConfidencial ? 'conf' : 'docs'));
    switchContentTab(tab, btn);
  }, 50);
}

function switchAdminTab(tab, btn) {
  document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  const el = document.getElementById(`adminTab-${tab}`);
  if (el) el.classList.add('active');
}

function deleteUserAdmin(id) {
  if (!confirm('Remover este utilizador?')) return;
  const users = getAllUsers().filter(u => u.id !== id);
  saveAllUsers(users);
  renderAdmin();
  toast('Utilizador removido', 'success');
}

// =============================================
// CALENDAR WIDGET
// =============================================
function renderMiniCalendar() {
  const now = new Date();
  const month = now.toLocaleDateString('pt-AO', { month:'long', year:'numeric' });
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDay   = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const today = now.getDate();
  const eventDays  = [5, 12, 15, 22, 29];

  let cells = '';
  // Empty leading cells
  for (let i = 0; i < firstDay; i++) {
    cells += `<div class="cal-day other-month"></div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = d === today;
    const hasEv   = eventDays.includes(d);
    cells += `<div class="cal-day ${isToday?'today':''} ${hasEv&&!isToday?'has-event':''}">${d}</div>`;
  }

  return `
    <div class="mini-calendar">
      <div class="cal-header">
        <span class="cal-month" style="text-transform:capitalize;">${month}</span>
      </div>
      <div class="cal-grid">
        <div class="cal-days-header">
          ${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(d=>`<div>${d}</div>`).join('')}
        </div>
        <div class="cal-days">${cells}</div>
      </div>
    </div>
  `;
}

// =============================================
// CONFIDENCIAL
// =============================================
function renderConfidencial() {
  if (currentUser.role !== 'admin') { navigate('docs'); return; }
  const el = document.getElementById('page-confidencial');
  const confDocs = DOCUMENTS.filter(d => d.confidencial);

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title" style="display:flex;align-items:center;gap:10px;">
          <span style="width:36px;height:36px;background:var(--red-pale);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--red);">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </span>
          Pasta Confidencial
        </div>
        <div class="page-subtitle">${confDocs.length} documentos · Acesso exclusivo à Administração</div>
      </div>
    </div>

    <div style="background:var(--red-pale);border:1px solid #FECACA;border-radius:var(--radius);padding:14px 18px;margin-bottom:24px;display:flex;align-items:center;gap:12px;font-size:0.845rem;color:var(--red);">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span>Esta pasta é estritamente confidencial. Os documentos aqui presentes são para uso exclusivo dos membros da Administração do Grupo INOV. A sua divulgação não autorizada é expressamente proibida.</span>
    </div>

    <div class="doc-table-wrap">
      <table>
        <thead>
          <tr>
            <th style="width:50%">Documento</th>
            <th>Categoria</th>
            <th>Tamanho</th>
            <th>Data</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${confDocs.map(d => {
            const iconColors = { pdf:'pdf', ppt:'ppt', doc:'doc', zip:'zip', xls:'xls' };
            const docIcons   = { pdf:'📄', ppt:'📊', doc:'📝', zip:'🗜', xls:'📈' };
            return `
              <tr>
                <td>
                  <div class="doc-name-cell">
                    <div class="doc-icon ${iconColors[d.type] || 'doc'}">${docIcons[d.type] || '📄'}</div>
                    <div>
                      <div class="doc-name-text">${d.title}</div>
                      <div class="doc-desc">${d.desc}</div>
                    </div>
                  </div>
                </td>
                <td><span class="badge" style="background:var(--red-pale);color:var(--red);border:1px solid #FECACA;font-size:0.68rem;">Confidencial</span></td>
                <td style="color:var(--text-3);font-size:0.8rem;">${d.size}</td>
                <td style="color:var(--text-3);font-size:0.8rem;">${formatDate(d.date)}</td>
                <td>
                  <div style="display:flex;gap:5px;">
                    <button class="btn btn-ghost btn-sm btn-icon" title="Pré-visualizar" onclick="toast('Pré-visualização: ${d.title}','')">
                      ${ICONS.eye}
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="toast('Download: ${d.title}','success')">
                      ${ICONS.download}
                    </button>
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// =============================================
// MODALS
// =============================================
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

function showNewsModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Nova Notícia</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="newNewsTitle" placeholder="Título da notícia" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa *</label>
          <select class="form-select" id="newNewsCompany">
            ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria *</label>
          <input class="form-input" id="newNewsCat" placeholder="ex: Estratégia" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Resumo *</label>
        <textarea class="form-textarea" id="newNewsSummary" rows="2" placeholder="Breve descrição da notícia"></textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo completo</label>
        <textarea class="form-textarea" id="newNewsBody" rows="5" placeholder="Texto completo da notícia…"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitNews()">Publicar Notícia</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
}

function submitNews() {
  const title = document.getElementById('newNewsTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }
  const n = {
    id: Date.now(),
    companyId: document.getElementById('newNewsCompany').value,
    category:  document.getElementById('newNewsCat').value || 'Geral',
    title,
    summary:   document.getElementById('newNewsSummary').value,
    body:      `<p>${document.getElementById('newNewsBody').value}</p>`,
    author:    currentUser.name,
    date:      new Date().toISOString().split('T')[0],
    readTime:  '2 min',
    featured:  false,
  };
  NEWS.unshift(n);
  saveNews(NEWS);
  closeModal();
  toast('Notícia publicada com sucesso!', 'success');
  if (currentPage === 'admin') { renderAdmin(); switchToContentTab(); } else { navigate('news'); }
}

function showComunModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Novo Comunicado</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="newComunTitle" placeholder="Título do comunicado" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Prioridade</label>
          <select class="form-select" id="newComunPrio">
            <option value="low">Baixa</option>
            <option value="medium" selected>Média</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Empresa</label>
          <select class="form-select" id="newComunCompany">
            ${COMPANIES.map(c => `<option value="${c.id}">${c.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo *</label>
        <textarea class="form-textarea" id="newComunBody" rows="5" placeholder="Texto do comunicado…"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" onclick="submitComun()">Publicar</button>
      </div>
    </div>
  `;
  overlay.classList.add('open');
}

function submitComun() {
  const title = document.getElementById('newComunTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }
  COMUNICADOS.unshift({
    id:        Date.now(),
    priority:  document.getElementById('newComunPrio').value,
    companyId: document.getElementById('newComunCompany').value,
    title,
    body:      `<p>${document.getElementById('newComunBody').value}</p>`,
    author:    currentUser.name + ' — ' + currentUser.company,
    date:      new Date().toISOString().split('T')[0],
    read:      false,
  });
  saveComunicados(COMUNICADOS);
  closeModal();
  toast('Comunicado publicado!', 'success');
  navigate('comunicados');
}

// =============================================
// GLOBAL SEARCH
// =============================================
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = document.getElementById('headerSearchInput');
  if (!searchInput) return;
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) return;
      const newsMatch = NEWS.find(n => n.title.toLowerCase().includes(q));
      if (newsMatch) { navigate(`news-${newsMatch.id}`); searchInput.value = ''; return; }
      const compMatch = COMPANIES.find(c => c.name.toLowerCase().includes(q));
      if (compMatch) { navigate(`company-${compMatch.id}`); searchInput.value = ''; return; }
      toast(`A pesquisar por "${q}"…`, '');
    }
  });
});
