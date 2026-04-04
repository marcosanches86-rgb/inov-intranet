/* =============================================
   INOV INTRANET — ADMIN API BRIDGE
   Substitui todas as funções admin do app.js
   por versões ligadas à API real do backend.
   ============================================= */

// ── Helpers internos ──────────────────────────────────────────

function getCompanyOptions(selectedId) {
  return COMPANIES.map(c =>
    `<option value="${c.id}" ${String(c.id)===String(selectedId)?'selected':''}>${c.name}</option>`
  ).join('');
}

function refreshAdmin() {
  if (typeof renderAdmin === 'function') renderAdmin();
}

function _goGalleryTab() {
  const btn = document.querySelector('.admin-tab[onclick*="gallery-admin"]');
  if (btn && typeof switchAdminTab === 'function') switchAdminTab('gallery-admin', btn);
}

function _goContentTab() {
  const btn = document.querySelector('.admin-tab[onclick*="content"]');
  if (btn && typeof switchAdminTab === 'function') switchAdminTab('content', btn);
}

function reloadData(then) {
  Promise.allSettled([
    api.news({ per_page: 100 }),
    api.announcements({ per_page: 100 }),
    api.documents({ per_page: 100 }),
    api.companies({ per_page: 100 }),
    api.brandAssets(false),
    api.gallery({ per_page: 100 }),
  ]).then(([nR, cR, dR, coR, bR, gR]) => {
    if (nR.value?.success)  window.NEWS         = normalizeNews(nR.value.data?.items || nR.value.data || []);
    if (cR.value?.success)  window.COMUNICADOS  = normalizeComunicados(cR.value.data?.items || cR.value.data || []);
    if (dR.value?.success)  window.DOCUMENTS    = normalizeDocuments(dR.value.data?.items || dR.value.data || []);
    if (coR.value?.success) window.COMPANIES    = normalizeCompanies(coR.value.data?.items || coR.value.data || []);
    if (bR.value?.success)  window.BRAND_ASSETS = normalizeBrandAssets(bR.value.data?.items || bR.value.data || []);
    if (gR.value?.success)  window.GALLERY      = normalizeGallery(gR.value.data?.items || gR.value.data || []);
    if (typeof then === 'function') then();
  });
}

// ── NOTÍCIAS ─────────────────────────────────────────────────

function showNewsModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:660px;">
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
          <select class="form-select" id="newNewsCompany">${getCompanyOptions()}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria *</label>
          <input class="form-input" id="newNewsCat" placeholder="ex: Estratégia, RH…" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Resumo *</label>
        <textarea class="form-textarea" id="newNewsSummary" rows="2" placeholder="Breve descrição"></textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo completo</label>
        <textarea class="form-textarea" id="newNewsBody" rows="5" placeholder="Texto completo da notícia…"></textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Imagem de capa (opcional)</label>
        <input type="file" class="form-input" id="newNewsCover" accept="image/*" style="padding:6px;" />
      </div>
      <div class="form-field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="newNewsFeatured" style="width:auto;" />
        <label class="form-label" style="margin:0;">Publicar em Destaque</label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="submitNewsBtn" onclick="submitNews()">Publicar Notícia</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitNews() {
  const title = document.getElementById('newNewsTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }

  const btn = document.getElementById('submitNewsBtn');
  btn.disabled = true; btn.textContent = 'A publicar…';

  const fd = new FormData();
  fd.append('title',      title);
  fd.append('company_id', document.getElementById('newNewsCompany').value);
  fd.append('category',   document.getElementById('newNewsCat').value || 'Geral');
  fd.append('summary',    document.getElementById('newNewsSummary').value);
  fd.append('body',       document.getElementById('newNewsBody').value);
  fd.append('status',     'published');
  fd.append('is_featured', document.getElementById('newNewsFeatured').checked ? '1' : '0');
  const coverFile = document.getElementById('newNewsCover').files[0];
  if (coverFile) fd.append('cover', coverFile);

  const res = await api.createNews(fd);
  btn.disabled = false; btn.textContent = 'Publicar Notícia';

  if (res.success) {
    closeModal();
    toast('Notícia publicada com sucesso!', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao publicar notícia', 'error');
  }
}

function showEditNewsModal(id) {
  const n = NEWS.find(x => String(x.id) === String(id));
  if (!n) return;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:660px;">
      <div class="modal-header">
        <h3>Editar Notícia</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="editNewsTitle" value="${escHtml(n.title)}" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa</label>
          <select class="form-select" id="editNewsCompany">${getCompanyOptions(n.company_id)}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria</label>
          <input class="form-input" id="editNewsCat" value="${escHtml(n.category||'')}" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Resumo</label>
        <textarea class="form-textarea" id="editNewsSummary" rows="2">${escHtml(n.summary||'')}</textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo completo</label>
        <textarea class="form-textarea" id="editNewsBody" rows="6">${escHtml((n.body||'').replace(/<[^>]*>/g,''))}</textarea>
      </div>
      <div class="form-field">
        <label class="form-label">Substituir imagem de capa (opcional)</label>
        <input type="file" class="form-input" id="editNewsCover" accept="image/*" style="padding:6px;" />
      </div>
      <div class="form-field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="editNewsFeatured" ${n.featured||n.is_featured?'checked':''} style="width:auto;" />
        <label class="form-label" style="margin:0;">Publicar em Destaque</label>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="editNewsSubmitBtn" onclick="submitEditNews(${id})">Guardar Alterações</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitEditNews(id) {
  const title = document.getElementById('editNewsTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }

  const btn = document.getElementById('editNewsSubmitBtn');
  btn.disabled = true; btn.textContent = 'A guardar…';

  const fd = new FormData();
  fd.append('_method',    'PUT');
  fd.append('title',      title);
  fd.append('company_id', document.getElementById('editNewsCompany').value);
  fd.append('category',   document.getElementById('editNewsCat').value);
  fd.append('summary',    document.getElementById('editNewsSummary').value);
  fd.append('body',       document.getElementById('editNewsBody').value);
  fd.append('is_featured', document.getElementById('editNewsFeatured').checked ? '1' : '0');
  const coverFile = document.getElementById('editNewsCover').files[0];
  if (coverFile) fd.append('cover', coverFile);

  const res = await api.updateNews(id, fd);
  btn.disabled = false; btn.textContent = 'Guardar Alterações';

  if (res.success) {
    closeModal();
    toast('Notícia actualizada com sucesso!', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao actualizar notícia', 'error');
  }
}

async function adminDeleteNews(id) {
  if (!confirm('Eliminar esta notícia permanentemente?')) return;
  const res = await api.deleteNews(id);
  if (res.success) {
    toast('Notícia eliminada', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao eliminar notícia', 'error');
  }
}

// ── COMUNICADOS ───────────────────────────────────────────────

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
          <label class="form-label">Visibilidade</label>
          <select class="form-select" id="newComunVisibility" onchange="toggleComunCompany(this.value)">
            <option value="global">Global (todo o grupo)</option>
            <option value="company">Apenas uma empresa</option>
          </select>
        </div>
      </div>
      <div class="form-field" id="comunCompanyField" style="display:none;">
        <label class="form-label">Empresa</label>
        <select class="form-select" id="newComunCompany">${getCompanyOptions()}</select>
      </div>
      <div class="form-field">
        <label class="form-label">Data de expiração (opcional)</label>
        <input type="date" class="form-input" id="newComunExpiry" />
      </div>
      <div class="form-field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="newComunPinned" style="width:auto;" />
        <label class="form-label" style="margin:0;">Fixar no topo</label>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo *</label>
        <textarea class="form-textarea" id="newComunBody" rows="5" placeholder="Texto do comunicado…"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="submitComunBtn" onclick="submitComun()">Publicar</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

function toggleComunCompany(val) {
  document.getElementById('comunCompanyField').style.display = val === 'company' ? '' : 'none';
}

async function submitComun() {
  const title = document.getElementById('newComunTitle')?.value.trim();
  const body  = document.getElementById('newComunBody')?.value.trim();
  if (!title || !body) { toast('Preencha título e conteúdo', 'error'); return; }

  const btn = document.getElementById('submitComunBtn');
  btn.disabled = true; btn.textContent = 'A publicar…';

  const visibility = document.getElementById('newComunVisibility').value;
  const payload = {
    title,
    body,
    priority:    document.getElementById('newComunPrio').value,
    visibility,
    is_pinned:   document.getElementById('newComunPinned').checked ? 1 : 0,
    expires_at:  document.getElementById('newComunExpiry').value || null,
    company_id:  visibility === 'company' ? document.getElementById('newComunCompany').value : null,
    is_active:   1,
  };

  const res = await api.createAnnouncement(payload);
  btn.disabled = false; btn.textContent = 'Publicar';

  if (res.success) {
    closeModal();
    toast('Comunicado publicado!', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao publicar comunicado', 'error');
  }
}

function showEditComunModal(id) {
  const c = COMUNICADOS.find(x => String(x.id) === String(id));
  if (!c) return;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Editar Comunicado</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="editComunTitle" value="${escHtml(c.title)}" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Prioridade</label>
          <select class="form-select" id="editComunPrio">
            <option value="low" ${c.priority==='low'?'selected':''}>Baixa</option>
            <option value="medium" ${(!c.priority||c.priority==='medium')?'selected':''}>Média</option>
            <option value="high" ${c.priority==='high'?'selected':''}>Alta</option>
          </select>
        </div>
        <div class="form-field">
          <label class="form-label">Visibilidade</label>
          <select class="form-select" id="editComunVisibility" onchange="toggleEditComunCompany(this.value)">
            <option value="global" ${(c.visibility||'global')==='global'?'selected':''}>Global</option>
            <option value="company" ${c.visibility==='company'?'selected':''}>Apenas uma empresa</option>
          </select>
        </div>
      </div>
      <div class="form-field" id="editComunCompanyField" style="display:${c.visibility==='company'?'':'none'};">
        <label class="form-label">Empresa</label>
        <select class="form-select" id="editComunCompany">${getCompanyOptions(c.company_id)}</select>
      </div>
      <div class="form-field" style="display:flex;align-items:center;gap:10px;">
        <input type="checkbox" id="editComunPinned" ${c.is_pinned||c.pinned?'checked':''} style="width:auto;" />
        <label class="form-label" style="margin:0;">Fixar no topo</label>
      </div>
      <div class="form-field">
        <label class="form-label">Conteúdo *</label>
        <textarea class="form-textarea" id="editComunBody" rows="5">${escHtml(c.body||c.content||'')}</textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="editComunBtn" onclick="submitEditComun(${id})">Guardar Alterações</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

function toggleEditComunCompany(val) {
  document.getElementById('editComunCompanyField').style.display = val === 'company' ? '' : 'none';
}

async function submitEditComun(id) {
  const title = document.getElementById('editComunTitle')?.value.trim();
  const body  = document.getElementById('editComunBody')?.value.trim();
  if (!title || !body) { toast('Preencha título e conteúdo', 'error'); return; }

  const btn = document.getElementById('editComunBtn');
  btn.disabled = true; btn.textContent = 'A guardar…';

  const visibility = document.getElementById('editComunVisibility').value;
  const payload = {
    title,
    body,
    priority:   document.getElementById('editComunPrio').value,
    visibility,
    is_pinned:  document.getElementById('editComunPinned').checked ? 1 : 0,
    company_id: visibility === 'company' ? document.getElementById('editComunCompany').value : null,
  };

  const res = await api.updateAnnouncement(id, payload);
  btn.disabled = false; btn.textContent = 'Guardar Alterações';

  if (res.success) {
    closeModal();
    toast('Comunicado actualizado!', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao actualizar comunicado', 'error');
  }
}

async function adminDeleteComun(id) {
  if (!confirm('Eliminar este comunicado permanentemente?')) return;
  const res = await api.deleteAnnouncement(id);
  if (res.success) {
    toast('Comunicado eliminado', 'success');
    reloadData(() => { refreshAdmin(); switchToContentTab(); });
  } else {
    toast(res.message || 'Erro ao eliminar comunicado', 'error');
  }
}

// ── DOCUMENTOS ────────────────────────────────────────────────

function showAddDocModal(isConfidencial) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:620px;">
      <div class="modal-header">
        <h3>${isConfidencial ? '🔒 Documento Confidencial' : 'Adicionar Documento'}</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      ${isConfidencial ? '<div style="background:var(--red-pale);border:1px solid #FECACA;border-radius:6px;padding:10px 14px;font-size:0.8rem;color:var(--red);margin-bottom:16px;">Este documento só será visível para administradores.</div>' : ''}
      <div class="form-field">
        <label class="form-label">Ficheiro *</label>
        <input type="file" class="form-input" id="addDocFile" accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,.png,.jpg" style="padding:6px;" required />
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="addDocTitle" placeholder="Título do documento" />
      </div>
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="addDocDesc" placeholder="Breve descrição" />
      </div>
      <div class="form-grid-2">
        ${!isConfidencial ? `
        <div class="form-field">
          <label class="form-label">Empresa *</label>
          <select class="form-select" id="addDocCompany">${getCompanyOptions()}</select>
        </div>` : `<input type="hidden" id="addDocCompany" value="${COMPANIES[0]?.id||1}" />`}
        <div class="form-field">
          <label class="form-label">Categoria *</label>
          <input class="form-input" id="addDocCat" placeholder="ex: Governança, RH…" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="addDocBtn" onclick="submitAddDoc(${!!isConfidencial})">Fazer Upload</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitAddDoc(isConfidencial) {
  const fileInput = document.getElementById('addDocFile');
  const title     = document.getElementById('addDocTitle')?.value.trim();
  const cat       = document.getElementById('addDocCat')?.value.trim();

  if (!fileInput?.files[0]) { toast('Seleccione um ficheiro', 'error'); return; }
  if (!title || !cat)       { toast('Preencha título e categoria', 'error'); return; }

  const btn = document.getElementById('addDocBtn');
  btn.disabled = true; btn.textContent = 'A fazer upload…';

  const fd = new FormData();
  fd.append('file',           fileInput.files[0]);
  fd.append('title',          title);
  fd.append('description',    document.getElementById('addDocDesc')?.value || '');
  fd.append('company_id',     document.getElementById('addDocCompany')?.value || COMPANIES[0]?.id || 1);
  fd.append('category',       cat);
  fd.append('is_confidential', isConfidencial ? '1' : '0');
  fd.append('is_active',      '1');

  const res = await api.uploadDocument(fd);
  btn.disabled = false; btn.textContent = 'Fazer Upload';

  if (res.success) {
    closeModal();
    toast('Documento adicionado com sucesso!', 'success');
    reloadData(() => {
      refreshAdmin();
      switchToContentTab();
      setTimeout(() => {
        const tab = isConfidencial ? 'cconf' : 'cdocs';
        const btn2 = document.getElementById('ctab-btn-' + (isConfidencial ? 'conf' : 'docs'));
        if (typeof switchContentTab === 'function') switchContentTab(tab, btn2);
      }, 50);
    });
  } else {
    toast(res.message || 'Erro ao fazer upload do documento', 'error');
  }
}

function showEditDocModal(id) {
  const d = DOCUMENTS.find(x => String(x.id) === String(id));
  if (!d) return;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:580px;">
      <div class="modal-header">
        <h3>Editar Documento</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título *</label>
        <input class="form-input" id="editDocTitle" value="${escHtml(d.title)}" />
      </div>
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="editDocDesc" value="${escHtml(d.description||d.desc||'')}" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa</label>
          <select class="form-select" id="editDocCompany">${getCompanyOptions(d.company_id)}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria</label>
          <input class="form-input" id="editDocCat" value="${escHtml(d.category||'')}" />
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="editDocBtn" onclick="submitEditDoc(${id})">Guardar Alterações</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitEditDoc(id) {
  const title = document.getElementById('editDocTitle')?.value.trim();
  const cat   = document.getElementById('editDocCat')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }

  const btn = document.getElementById('editDocBtn');
  btn.disabled = true; btn.textContent = 'A guardar…';

  const res = await api.updateDocument(id, {
    title,
    description: document.getElementById('editDocDesc').value,
    category:    cat,
    company_id:  document.getElementById('editDocCompany').value,
  });
  btn.disabled = false; btn.textContent = 'Guardar Alterações';

  if (res.success) {
    closeModal();
    toast('Documento actualizado!', 'success');
    const wasConf = DOCUMENTS.find(x => String(x.id)===String(id))?.confidential;
    reloadData(() => {
      refreshAdmin(); switchToContentTab();
      setTimeout(() => {
        const tab = wasConf ? 'cconf' : 'cdocs';
        const btn2 = document.getElementById('ctab-btn-' + (wasConf ? 'conf' : 'docs'));
        if (typeof switchContentTab === 'function') switchContentTab(tab, btn2);
      }, 50);
    });
  } else {
    toast(res.message || 'Erro ao actualizar documento', 'error');
  }
}

async function adminDeleteDoc(id) {
  if (!confirm('Eliminar este documento permanentemente?')) return;
  const doc = DOCUMENTS.find(d => String(d.id) === String(id));
  const wasConf = doc?.confidential || doc?.confidencial;
  const res = await api.deleteDocument(id);
  if (res.success) {
    toast('Documento eliminado', 'success');
    reloadData(() => {
      refreshAdmin();
      switchToContentTab();
      setTimeout(() => {
        const tab = wasConf ? 'cconf' : 'cdocs';
        const btn = document.getElementById('ctab-btn-' + (wasConf ? 'conf' : 'docs'));
        if (typeof switchContentTab === 'function') switchContentTab(tab, btn);
      }, 50);
    });
  } else {
    toast(res.message || 'Erro ao eliminar documento', 'error');
  }
}

// ── UTILIZADORES ──────────────────────────────────────────────

async function deleteUserAdmin(id) {
  if (!confirm('Remover este utilizador da plataforma?')) return;
  const res = await api.deleteUser(id);
  if (res.success) {
    toast('Utilizador removido', 'success');
    reloadData(refreshAdmin);
  } else {
    toast(res.message || 'Erro ao remover utilizador', 'error');
  }
}

function showCreateUserModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;">
      <div class="modal-header">
        <h3>Novo Utilizador</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Nome completo *</label>
          <input class="form-input" id="newUserName" placeholder="Nome Apelido" />
        </div>
        <div class="form-field">
          <label class="form-label">Email *</label>
          <input class="form-input" id="newUserEmail" type="email" placeholder="email@empresa.ao" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Password *</label>
          <input class="form-input" id="newUserPass" type="password" placeholder="Mínimo 8 caracteres" />
        </div>
        <div class="form-field">
          <label class="form-label">Função / Cargo</label>
          <input class="form-input" id="newUserJob" placeholder="ex: Director Comercial" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa</label>
          <select class="form-select" id="newUserCompany">${getCompanyOptions()}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Papel / Role</label>
          <select class="form-select" id="newUserRole">
            <option value="colaborador">Colaborador</option>
            <option value="editor">Editor</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="createUserBtn" onclick="submitCreateUser()">Criar Utilizador</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitCreateUser() {
  const name  = document.getElementById('newUserName')?.value.trim();
  const email = document.getElementById('newUserEmail')?.value.trim();
  const pass  = document.getElementById('newUserPass')?.value;
  if (!name || !email || !pass) { toast('Preencha todos os campos obrigatórios', 'error'); return; }

  const btn = document.getElementById('createUserBtn');
  btn.disabled = true; btn.textContent = 'A criar…';

  const res = await api.createUser({
    name,
    email,
    password:              pass,
    password_confirmation: pass,
    job_title:   document.getElementById('newUserJob').value,
    company_id:  document.getElementById('newUserCompany').value,
    role:        document.getElementById('newUserRole').value,
    status:      'active',
  });
  btn.disabled = false; btn.textContent = 'Criar Utilizador';

  if (res.success) {
    closeModal();
    toast('Utilizador criado com sucesso!', 'success');
    reloadData(refreshAdmin);
  } else {
    toast(res.message || 'Erro ao criar utilizador', 'error');
  }
}

// ── MARCAS & BRAND ASSETS ─────────────────────────────────────

function showAddBrandModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:580px;">
      <div class="modal-header">
        <h3>Adicionar Activo de Marca</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Ficheiro (logo, ícone, guia…) *</label>
        <input type="file" class="form-input" id="brandFile" accept=".svg,.png,.jpg,.jpeg,.pdf,.ai,.eps,.zip" style="padding:6px;" />
      </div>
      <div class="form-field">
        <label class="form-label">Nome *</label>
        <input class="form-input" id="brandName" placeholder="ex: Logótipo Principal SVG" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa *</label>
          <select class="form-select" id="brandCompany">${getCompanyOptions()}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria</label>
          <select class="form-select" id="brandCategory">
            <option value="logo">Logótipo</option>
            <option value="icon">Ícone / Favicon</option>
            <option value="colors">Paleta de Cores</option>
            <option value="typography">Tipografia</option>
            <option value="guide">Manual de Identidade</option>
            <option value="template">Template</option>
            <option value="other">Outro</option>
          </select>
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <input class="form-input" id="brandDesc" placeholder="Breve descrição do ficheiro" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="addBrandBtn" onclick="submitAddBrand()">Fazer Upload</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitAddBrand() {
  const fileInput = document.getElementById('brandFile');
  const name      = document.getElementById('brandName')?.value.trim();
  if (!fileInput?.files[0]) { toast('Seleccione um ficheiro', 'error'); return; }
  if (!name)                 { toast('Preencha o nome', 'error'); return; }

  const btn = document.getElementById('addBrandBtn');
  btn.disabled = true; btn.textContent = 'A fazer upload…';

  const fd = new FormData();
  fd.append('file',        fileInput.files[0]);
  fd.append('name',        name);
  fd.append('company_id',  document.getElementById('brandCompany').value);
  fd.append('category',    document.getElementById('brandCategory').value);
  fd.append('description', document.getElementById('brandDesc').value || '');
  fd.append('is_active',   '1');

  const res = await api.createBrandAsset(fd);
  btn.disabled = false; btn.textContent = 'Fazer Upload';

  if (res.success) {
    closeModal();
    toast('Activo de marca adicionado!', 'success');
    reloadData(() => { refreshAdmin(); });
  } else {
    toast(res.message || 'Erro ao fazer upload', 'error');
  }
}

async function adminDeleteBrand(id) {
  if (!confirm('Eliminar este activo de marca?')) return;
  const res = await api.deleteBrandAsset(id);
  if (res.success) {
    toast('Activo eliminado', 'success');
    reloadData(refreshAdmin);
  } else {
    toast(res.message || 'Erro ao eliminar', 'error');
  }
}

// ── GALERIA ───────────────────────────────────────────────────

function showCreateAlbumModal() {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;">
      <div class="modal-header">
        <h3>Novo Álbum</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Título do álbum *</label>
        <input class="form-input" id="albumTitle" placeholder="ex: Evento de Lançamento 2026" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Empresa *</label>
          <select class="form-select" id="albumCompany">${getCompanyOptions()}</select>
        </div>
        <div class="form-field">
          <label class="form-label">Categoria</label>
          <input class="form-input" id="albumCategory" placeholder="ex: Evento, Instalações…" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Descrição</label>
        <textarea class="form-textarea" id="albumDesc" rows="2" placeholder="Descrição do álbum"></textarea>
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="createAlbumBtn" onclick="submitCreateAlbum()">Criar Álbum</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitCreateAlbum() {
  const title = document.getElementById('albumTitle')?.value.trim();
  if (!title) { toast('Preencha o título', 'error'); return; }

  const btn = document.getElementById('createAlbumBtn');
  btn.disabled = true; btn.textContent = 'A criar…';

  const fd = new FormData();
  fd.append('title',       title);
  fd.append('company_id',  document.getElementById('albumCompany').value);
  fd.append('category',    document.getElementById('albumCategory')?.value || '');
  fd.append('description', document.getElementById('albumDesc')?.value || '');

  const res = await api.createAlbum(fd);
  btn.disabled = false; btn.textContent = 'Criar Álbum';

  if (res.success) {
    closeModal();
    toast('Álbum criado! Agora podes adicionar fotos.', 'success');
    reloadData(() => { refreshAdmin(); _goGalleryTab(); });
  } else {
    toast(res.message || 'Erro ao criar álbum', 'error');
  }
}

function showUploadPhotosModal(albumId, albumTitle) {
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:560px;">
      <div class="modal-header">
        <h3>Adicionar Fotos — ${escHtml(albumTitle)}</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-field">
        <label class="form-label">Seleccionar imagens (múltiplas permitidas)</label>
        <input type="file" class="form-input" id="photoFiles" accept="image/*" multiple style="padding:6px;" />
      </div>
      <div id="uploadProgress" style="font-size:0.8rem;color:var(--text-3);margin-top:8px;"></div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="uploadPhotosBtn" onclick="submitUploadPhotos(${albumId})">Fazer Upload</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitUploadPhotos(albumId) {
  const files = document.getElementById('photoFiles')?.files;
  if (!files || files.length === 0) { toast('Seleccione pelo menos uma imagem', 'error'); return; }

  const btn      = document.getElementById('uploadPhotosBtn');
  const progress = document.getElementById('uploadProgress');
  btn.disabled = true;

  let done = 0, failed = 0, lastError = '';
  for (const file of files) {
    progress.textContent = `A fazer upload ${done + failed + 1} de ${files.length}: ${file.name}`;
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name.replace(/\.[^.]+$/, ''));
    try {
      const res = await api.addGalleryItem(albumId, fd);
      if (res.success) {
        done++;
        progress.textContent = `✓ ${file.name} adicionado`;
      } else {
        failed++;
        lastError = res.message || 'Erro desconhecido';
        progress.style.color = 'red';
        progress.textContent = `✗ ${file.name}: ${lastError}`;
      }
    } catch (e) {
      failed++;
      lastError = e.message;
      progress.style.color = 'red';
      progress.textContent = `✗ Erro: ${e.message}`;
    }
  }

  btn.disabled = false;
  if (done > 0) {
    closeModal();
    toast(`${done} imagem(ns) adicionada(s)!${failed > 0 ? ` (${failed} falharam: ${lastError})` : ''}`, 'success');
  } else {
    // Não fechar o modal — mostrar o erro para o utilizador ver
    btn.textContent = 'Tentar de novo';
    toast(`Upload falhou: ${lastError || 'Formato não suportado. Use JPG, PNG ou WEBP.'}`, 'error');
    return;
  }
  reloadData(() => { refreshAdmin(); _goGalleryTab(); });
}

async function adminDeleteAlbum(id) {
  if (!confirm('Eliminar este álbum e todas as suas imagens permanentemente?')) return;
  const res = await api.deleteAlbum(id);
  if (res.success) {
    toast('Álbum eliminado', 'success');
    reloadData(refreshAdmin);
  } else {
    toast(res.message || 'Erro ao eliminar álbum', 'error');
  }
}

// ── EMPRESAS ──────────────────────────────────────────────────

function showEditCompanyModal(id) {
  const c = COMPANIES.find(x => String(x.id) === String(id));
  if (!c) return;
  const overlay = document.getElementById('modalOverlay');
  overlay.innerHTML = `
    <div class="modal" style="max-width:640px;">
      <div class="modal-header">
        <h3>Editar Empresa — ${escHtml(c.name)}</h3>
        <button class="modal-close" onclick="closeModal()">${ICONS.x}</button>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Nome *</label>
          <input class="form-input" id="editCoName" value="${escHtml(c.name)}" />
        </div>
        <div class="form-field">
          <label class="form-label">Abreviatura</label>
          <input class="form-input" id="editCoShort" value="${escHtml(c.shortName||c.short_name||'')}" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Tagline</label>
        <input class="form-input" id="editCoTagline" value="${escHtml(c.tagline||'')}" />
      </div>
      <div class="form-field">
        <label class="form-label">Sector</label>
        <input class="form-input" id="editCoSector" value="${escHtml(c.sector||'')}" />
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Ano de fundação</label>
          <input class="form-input" id="editCoFounded" value="${escHtml(c.founded||c.founded_year||'')}" />
        </div>
        <div class="form-field">
          <label class="form-label">Nº de colaboradores</label>
          <input class="form-input" id="editCoEmployees" value="${escHtml(c.employees||c.employees_count||'')}" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Cor principal (hex)</label>
          <input class="form-input" id="editCoColor" value="${escHtml(c.color||'#0C1A35')}" placeholder="#0C1A35" />
        </div>
        <div class="form-field">
          <label class="form-label">Cor de destaque (hex)</label>
          <input class="form-input" id="editCoAccent" value="${escHtml(c.accentColor||c.accent_color||'#C9A24C')}" placeholder="#C9A24C" />
        </div>
      </div>
      <div class="form-grid-2">
        <div class="form-field">
          <label class="form-label">Email de contacto</label>
          <input class="form-input" id="editCoEmail" value="${escHtml(c.contacts?.email||c.email||'')}" />
        </div>
        <div class="form-field">
          <label class="form-label">Website</label>
          <input class="form-input" id="editCoWeb" value="${escHtml(c.contacts?.web||c.website||'')}" />
        </div>
      </div>
      <div class="form-field">
        <label class="form-label">Logótipo (opcional)</label>
        <input type="file" class="form-input" id="editCoLogo" accept="image/*,.svg" style="padding:6px;" />
      </div>
      <div class="modal-footer">
        <button class="btn btn-outline" onclick="closeModal()">Cancelar</button>
        <button class="btn btn-primary" id="editCoBtn" onclick="submitEditCompany(${id})">Guardar Empresa</button>
      </div>
    </div>`;
  overlay.classList.add('open');
}

async function submitEditCompany(id) {
  const name = document.getElementById('editCoName')?.value.trim();
  if (!name) { toast('Preencha o nome da empresa', 'error'); return; }

  const btn = document.getElementById('editCoBtn');
  btn.disabled = true; btn.textContent = 'A guardar…';

  const fd = new FormData();
  fd.append('_method',         'PUT');
  fd.append('name',            name);
  fd.append('short_name',      document.getElementById('editCoShort').value);
  fd.append('tagline',         document.getElementById('editCoTagline').value);
  fd.append('sector',          document.getElementById('editCoSector').value);
  fd.append('founded_year',    document.getElementById('editCoFounded').value);
  fd.append('employees_count', document.getElementById('editCoEmployees').value);
  fd.append('color',           document.getElementById('editCoColor').value);
  fd.append('accent_color',    document.getElementById('editCoAccent').value);
  fd.append('email',           document.getElementById('editCoEmail').value);
  fd.append('website',         document.getElementById('editCoWeb').value);
  const logo = document.getElementById('editCoLogo').files[0];
  if (logo) fd.append('logo', logo);

  const res = await api.updateCompany(id, fd);
  btn.disabled = false; btn.textContent = 'Guardar Empresa';

  if (res.success) {
    closeModal();
    toast('Empresa actualizada com sucesso!', 'success');
    reloadData(refreshAdmin);
  } else {
    toast(res.message || 'Erro ao guardar empresa', 'error');
  }
}

// ── MELHORAR PAINEL ADMIN — adicionar tabs Marcas e Galeria ───

// Override renderAdmin para incluir tabs extra e botão "Novo Utilizador"
const _origRenderAdmin = typeof renderAdmin === 'function' ? renderAdmin : null;

function renderAdmin() {
  const el = document.getElementById('page-admin');
  if (!el) return;

  const users = window.currentUser ? (() => {
    // Will be refreshed from API; use DOCUMENTS as proxy for loaded state
    return [];
  })() : [];

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title-group">
        <div class="page-title">Administração</div>
        <div class="page-subtitle">Gestão completa da plataforma</div>
      </div>
    </div>

    <div class="admin-tabs">
      <button class="admin-tab active" onclick="switchAdminTab('users',this)">Utilizadores</button>
      <button class="admin-tab"        onclick="switchAdminTab('content',this)">Conteúdos</button>
      <button class="admin-tab"        onclick="switchAdminTab('brands-admin',this)">Marcas</button>
      <button class="admin-tab"        onclick="switchAdminTab('gallery-admin',this)">Galeria</button>
      <button class="admin-tab"        onclick="switchAdminTab('companies-admin',this)">Empresas</button>
    </div>

    <!-- UTILIZADORES -->
    <div id="adminTab-users" class="admin-tab-content active">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
        <div style="font-size:0.85rem;color:var(--text-3);">Utilizadores registados na plataforma</div>
        <button class="btn btn-primary btn-sm" onclick="showCreateUserModal()">${ICONS.plus} Novo Utilizador</button>
      </div>
      ${renderUsersTable()}
    </div>

    <!-- CONTEÚDOS -->
    <div id="adminTab-content" class="admin-tab-content">
      ${renderAdminContentTab()}
    </div>

    <!-- MARCAS -->
    <div id="adminTab-brands-admin" class="admin-tab-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:0.85rem;color:var(--text-3);">Ficheiros de marca, logos e guias de identidade</div>
        <button class="btn btn-primary btn-sm" onclick="showAddBrandModal()">${ICONS.plus} Adicionar Activo</button>
      </div>
      ${renderBrandsAdminTable()}
    </div>

    <!-- GALERIA -->
    <div id="adminTab-gallery-admin" class="admin-tab-content">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
        <div style="font-size:0.85rem;color:var(--text-3);">Álbuns de fotos e eventos do grupo</div>
        <button class="btn btn-primary btn-sm" onclick="showCreateAlbumModal()">${ICONS.plus} Novo Álbum</button>
      </div>
      ${renderGalleryAdminTable()}
    </div>

    <!-- EMPRESAS -->
    <div id="adminTab-companies-admin" class="admin-tab-content">
      <div class="companies-grid">
        ${COMPANIES.map(c => `
          <div class="company-card">
            <div class="company-card-cover" style="background:${c.coverGradient||c.color};">
              <div class="company-card-logo" style="color:${c.accentColor};">${c.shortName}</div>
            </div>
            <div class="company-card-body">
              <h4>${c.name}</h4>
              <p>${c.sector||''}</p>
            </div>
            <div class="company-card-footer">
              <button class="btn btn-ghost btn-sm" onclick="navigate('company-${c.id}')">${ICONS.eye} Ver</button>
              <button class="btn btn-outline btn-sm" onclick="showEditCompanyModal(${c.id})">${ICONS.edit} Editar</button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderUsersTable() {
  // Usar a lista de COMPANIES para cruzar dados
  // Os utilizadores são carregados via API separada se necessário
  // Por agora mostramos o currentUser + prompt para carregar
  return `
    <div class="doc-table-wrap">
      <table>
        <thead><tr><th>Nome</th><th>Email</th><th>Empresa</th><th>Papel</th><th>Estado</th><th>Ações</th></tr></thead>
        <tbody id="usersTableBody">
          <tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-3);">
            <button class="btn btn-outline btn-sm" onclick="loadUsersTable()">Carregar utilizadores</button>
          </td></tr>
        </tbody>
      </table>
    </div>`;
}

async function loadUsersTable() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px;color:var(--text-3);">A carregar…</td></tr>';

  const res = await api.users({ per_page: 100 });
  if (!res.success) { tbody.innerHTML = '<tr><td colspan="6" style="color:var(--red);padding:12px;">Erro ao carregar utilizadores</td></tr>'; return; }

  const users = res.data?.items || res.data || [];
  const roleLabels = { super_admin:'Super Admin', admin:'Administrador', editor:'Editor', colaborador:'Colaborador' };
  const roleColors = { super_admin:'var(--navy)', admin:'var(--blue)', editor:'var(--amber)', colaborador:'var(--green)' };

  tbody.innerHTML = users.map(u => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px;">
        <div style="width:28px;height:28px;border-radius:50%;background:var(--navy);color:white;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;flex-shrink:0;">${u.avatar||'U'}</div>
        <div style="font-size:0.85rem;font-weight:500;">${escHtml(u.name)}</div>
      </div></td>
      <td style="font-size:0.78rem;color:var(--text-3);">${escHtml(u.email)}</td>
      <td><span class="badge badge-gray" style="font-size:0.65rem;">${escHtml(u.company_name||'—')}</span></td>
      <td><span class="badge" style="background:var(--navy-pale);color:${roleColors[u.role]||'var(--navy)'};font-size:0.65rem;">${roleLabels[u.role]||u.role}</span></td>
      <td><span class="badge" style="background:${u.status==='active'?'var(--green-pale)':'var(--red-pale)'};color:${u.status==='active'?'var(--green)':'var(--red)'};font-size:0.65rem;">${u.status==='active'?'Activo':'Inactivo'}</span></td>
      <td><div style="display:flex;gap:4px;">
        ${u.id !== window.currentUser?.id ? `<button class="btn btn-danger btn-sm btn-icon" onclick="deleteUserAdmin(${u.id})" title="Remover">${ICONS.trash}</button>` : '<span style="font-size:0.7rem;color:var(--text-4);">tu</span>'}
      </div></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-3);padding:20px;">Sem utilizadores</td></tr>';
}

function renderBrandsAdminTable() {
  if (!BRAND_ASSETS || BRAND_ASSETS.length === 0) {
    return '<div style="text-align:center;padding:40px;color:var(--text-3);">Sem activos de marca. Clique em "+ Adicionar Activo" para começar.</div>';
  }
  return `
    <div class="doc-table-wrap">
      <table>
        <thead><tr><th>Nome</th><th>Empresa</th><th>Categoria</th><th>Formato</th><th>Data</th><th>Ações</th></tr></thead>
        <tbody>
          ${BRAND_ASSETS.map(b => `
            <tr>
              <td><div class="doc-name-text" style="font-size:0.845rem;">${escHtml(b.name)}</div></td>
              <td><span class="badge badge-navy" style="font-size:0.65rem;">${escHtml(b.company_name||b.company||'—')}</span></td>
              <td><span class="badge badge-gray" style="font-size:0.65rem;">${escHtml(b.category||'—')}</span></td>
              <td style="font-size:0.78rem;color:var(--text-3);">${escHtml(b.format||b.file_type||'—')}</td>
              <td style="font-size:0.78rem;color:var(--text-3);">${formatDate(b.date||b.created_at)}</td>
              <td><div style="display:flex;gap:4px;">
                ${b.url||b.file_path ? `<a href="${b.url||'/backend/storage/uploads/'+b.file_path}" target="_blank" class="btn btn-ghost btn-sm btn-icon" title="Download">${ICONS.download}</a>` : ''}
                <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteBrand(${b.id})" title="Eliminar">${ICONS.trash}</button>
              </div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

function renderGalleryAdminTable() {
  if (!GALLERY || GALLERY.length === 0) {
    return '<div style="text-align:center;padding:40px;color:var(--text-3);">Sem álbuns. Clique em "+ Novo Álbum" para criar o primeiro.</div>';
  }
  return `
    <div class="doc-table-wrap">
      <table>
        <thead><tr><th>Álbum</th><th>Empresa</th><th>Categoria</th><th>Fotos</th><th>Ações</th></tr></thead>
        <tbody>
          ${GALLERY.map(g => `
            <tr>
              <td><div class="doc-name-text" style="font-size:0.845rem;">${escHtml(g.title)}</div></td>
              <td><span class="badge badge-navy" style="font-size:0.65rem;">${escHtml(g.company_name||g.company||'—')}</span></td>
              <td><span class="badge badge-gray" style="font-size:0.65rem;">${escHtml(g.category||'—')}</span></td>
              <td style="font-size:0.78rem;color:var(--text-3);">${g.item_count||0} foto(s)</td>
              <td><div style="display:flex;gap:4px;">
                <button class="btn btn-primary btn-sm btn-icon" onclick="showUploadPhotosModal(${g.id},'${escHtml(g.title).replace(/'/g,"\\'")}')  " title="Adicionar fotos">${ICONS.plus}</button>
                <button class="btn btn-danger btn-sm btn-icon" onclick="adminDeleteAlbum(${g.id})" title="Eliminar álbum">${ICONS.trash}</button>
              </div></td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

// ── Utilitários ───────────────────────────────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}
