/* =============================================
   INOV CMS — Admin API Bridge
   Liga o painel de administração à API real.
   Carrega ANTES de admin-app.js para definir
   window._adminAPIBoot antes do DOMContentLoaded.
   ============================================= */

(function () {
  'use strict';

  // ── Helpers ──────────────────────────────────────────────────────

  // Mapeia role do formulário (UI) para role da API
  function toApiRole(uiRole) {
    const map = { user: 'colaborador', colaborador: 'colaborador', editor: 'editor', admin: 'admin', super_admin: 'super_admin' };
    return map[uiRole] || 'colaborador';
  }

  // Encontra company_id a partir do nome (COMPANIES está carregado da API)
  function findCompanyId(name) {
    return window.COMPANIES?.find(c => c.name === name)?.id ?? null;
  }

  // Desactiva/reativa botão submit durante operações async
  function setBtnLoading(label) {
    const btn = document.querySelector('.cms-modal-footer .cms-btn-primary');
    if (!btn) return null;
    const orig = btn.textContent;
    btn.textContent = label;
    btn.disabled = true;
    return () => { btn.textContent = orig; btn.disabled = false; };
  }

  // Recarrega dados da API e re-renderiza o módulo activo
  async function reloadModule(module) {
    await _refreshData();
    const main = document.getElementById('cmsMain');
    if (!main) return;
    if (window.cmsCurrentModule === module) {
      const renders = {
        users:       window.renderCMSUsers,
        news:        window.renderCMSNews,
        comunicados: window.renderCMSComunicados,
        docs:        window.renderCMSDocs,
      };
      renders[module]?.(main);
    }
    window.updateNavBadges?.();
  }

  // Recarrega dados reais da API para os globals
  async function _refreshData() {
    const [newsRes, comunRes, usersRes, docsRes] = await Promise.allSettled([
      api.news({ per_page: 200 }),
      api.announcements({ per_page: 200 }),
      api.users({ per_page: 200 }),
      api.documents({ per_page: 200 }),
    ]);

    if (newsRes.status === 'fulfilled' && newsRes.value?.success) {
      window.NEWS = normalizeNews(newsRes.value.data?.items || newsRes.value.data || []);
    }
    if (comunRes.status === 'fulfilled' && comunRes.value?.success) {
      window.COMUNICADOS = normalizeComunicados(comunRes.value.data?.items || comunRes.value.data || []);
    }
    if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
      window._apiUsers = usersRes.value.data?.items || usersRes.value.data || [];
    }
    if (docsRes.status === 'fulfilled' && docsRes.value?.success) {
      window.DOCUMENTS = normalizeDocuments(docsRes.value.data?.items || docsRes.value.data || []);
    }
  }

  // ── Override getAllUsers para usar dados reais da API ─────────────
  // Chamada pela renderCMSUsers e updateNavBadges de admin-app.js
  const _origGetAllUsers = window.getAllUsers;
  window.getAllUsers = function () {
    if (window._apiUsers?.length) {
      return window._apiUsers.map(u => ({
        id:      u.id,
        name:    u.name,
        email:   u.email,
        role:    u.role === 'colaborador' ? 'user' : u.role,
        status:  u.status,
        company: u.company_name || '',
        dept:    u.department   || '',
        job:     u.job_title    || '',
        avatar:  u.avatar       || (u.name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'U',
        joined:  u.joined_date  || (u.created_at || '').split('T')[0] || '',
        company_id: u.company_id,
      }));
    }
    return _origGetAllUsers?.() || [];
  };

  // ── API Boot ──────────────────────────────────────────────────────
  window._adminAPIBoot = async function () {
    const shell = document.getElementById('cmsShell');
    if (shell) shell.style.opacity = '0.4';

    // 1. Verificar sessão via API
    const meRes = await api.me();
    if (!meRes.success) {
      window.location.href = '../index.html';
      return;
    }

    const su     = meRes.data;
    const uiRole = (su.role === 'super_admin' || su.role === 'admin') ? 'admin'
                 : su.role === 'editor' ? 'editor' : 'user';

    if (!['admin', 'editor'].includes(uiRole)) {
      window.location.href = '../app.html';
      return;
    }

    // Actualizar sessão local com dados frescos do servidor
    setSession({
      id:         su.id,
      name:       su.name,
      email:      su.email,
      role:       uiRole,
      roleRaw:    su.role,
      company:    su.company_name || '',
      company_id: su.company_id,
      dept:       su.department   || '',
      job:        su.job_title    || '',
      avatar:     su.avatar       || (su.name || '').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || 'A',
      avatarUrl:  su.avatar_path  || null,
      loggedAt:   new Date().toISOString(),
    });
    window.cmsUser = getSession();

    // 2. Carregar dados reais da API em paralelo
    const [companiesRes, newsRes, comunRes, usersRes, docsRes] = await Promise.allSettled([
      api.companies({ per_page: 100 }),
      api.news({ per_page: 200 }),
      api.announcements({ per_page: 200 }),
      api.users({ per_page: 200 }),
      api.documents({ per_page: 200 }),
    ]);

    if (companiesRes.status === 'fulfilled' && companiesRes.value?.success) {
      window.COMPANIES = normalizeCompanies(companiesRes.value.data?.items || companiesRes.value.data || []);
    }
    if (newsRes.status === 'fulfilled' && newsRes.value?.success) {
      window.NEWS = normalizeNews(newsRes.value.data?.items || newsRes.value.data || []);
    }
    if (comunRes.status === 'fulfilled' && comunRes.value?.success) {
      window.COMUNICADOS = normalizeComunicados(comunRes.value.data?.items || comunRes.value.data || []);
    }
    if (usersRes.status === 'fulfilled' && usersRes.value?.success) {
      window._apiUsers = usersRes.value.data?.items || usersRes.value.data || [];
    }
    if (docsRes.status === 'fulfilled' && docsRes.value?.success) {
      window.DOCUMENTS = normalizeDocuments(docsRes.value.data?.items || docsRes.value.data || []);
    }

    // 3. Arrancar a UI
    if (shell) shell.style.opacity = '';
    cmsBootUI();
    cmsNavigate('dashboard');

    // 4. Activar overrides das funções de escrita
    _installWriteOverrides();
  };

  // ── Write Function Overrides ──────────────────────────────────────
  function _installWriteOverrides() {

    // ══ UTILIZADORES ═════════════════════════════════════════════════

    window.cmsSubmitAddUser = async function () {
      const name        = document.getElementById('nu_name')?.value.trim();
      const email       = document.getElementById('nu_email')?.value.trim();
      const pass        = document.getElementById('nu_pass')?.value;
      const roleUI      = document.getElementById('nu_role')?.value;
      const status      = document.getElementById('nu_status')?.value;
      const companyName = document.getElementById('nu_company')?.value;
      const dept        = document.getElementById('nu_dept')?.value.trim();
      const job         = document.getElementById('nu_job')?.value.trim();

      if (!name || !email || !pass) { cmsToast('Preencha todos os campos obrigatórios', 'error'); return; }
      if (pass.length < 8)          { cmsToast('Password deve ter ≥ 8 caracteres', 'error'); return; }

      const restore = setBtnLoading('A criar…');
      const res = await api.createUser({
        name, email,
        password:              pass,
        password_confirmation: pass,
        role:                  toApiRole(roleUI),
        status,
        company_id:            findCompanyId(companyName),
        department:            dept,
        job_title:             job,
        joined_date:           new Date().toISOString().split('T')[0],
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast(`${name} criado com sucesso`, 'success');
        await reloadModule('users');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao criar utilizador', 'error');
      }
    };

    window.cmsSubmitEditUser = async function (id) {
      const name        = document.getElementById('eu_name')?.value.trim();
      const email       = document.getElementById('eu_email')?.value.trim();
      const roleUI      = document.getElementById('eu_role')?.value;
      const status      = document.getElementById('eu_status')?.value;
      const companyName = document.getElementById('eu_company')?.value;
      const dept        = document.getElementById('eu_dept')?.value.trim();
      const job         = document.getElementById('eu_job')?.value.trim();
      const newPass     = document.getElementById('eu_pass')?.value;

      const restore = setBtnLoading('A guardar…');
      const payload = {
        name, email,
        role:       toApiRole(roleUI),
        status,
        company_id: findCompanyId(companyName),
        department: dept,
        job_title:  job,
      };
      if (newPass && newPass.length >= 8) {
        payload.password              = newPass;
        payload.password_confirmation = newPass;
      }

      const res = await api.updateUser(id, payload);
      if (res.success) {
        cmsCloseModal();
        cmsToast('Utilizador actualizado', 'success');
        await reloadModule('users');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao actualizar utilizador', 'error');
      }
    };

    window.cmsDeleteUser = async function (id) {
      const u = window.getAllUsers().find(x => x.id === id) || { name: 'este utilizador' };
      cmsConfirm('Eliminar utilizador',
        `Tem a certeza que deseja eliminar <strong>${u.name}</strong>? Esta acção não pode ser desfeita.`,
        async () => {
          const res = await api.deleteUser(id);
          if (res.success) {
            cmsToast('Utilizador eliminado', 'success');
            await reloadModule('users');
          } else {
            cmsToast(res.message || 'Erro ao eliminar utilizador', 'error');
          }
        }
      );
    };

    // ══ COMUNICADOS ══════════════════════════════════════════════════

    window.cmsSubmitAddComun = async function () {
      const title   = document.getElementById('cf_title')?.value.trim();
      const body    = document.getElementById('cf_body')?.value.trim();
      const prio    = document.getElementById('cf_prio')?.value  || 'medium';
      const vis     = document.getElementById('cf_vis')?.value   || 'global';
      const coId    = parseInt(document.getElementById('cf_company')?.value) || null;

      if (!title || !body) { cmsToast('Título e conteúdo são obrigatórios', 'error'); return; }

      const restore = setBtnLoading('A publicar…');
      const res = await api.createAnnouncement({
        title,
        body:       `<p>${body}</p>`,
        priority:   prio,
        visibility: vis,
        company_id: vis === 'company' ? coId : null,
        is_pinned:  0,
        is_active:  1,
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast('Comunicado publicado!', 'success');
        await reloadModule('comunicados');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao criar comunicado', 'error');
      }
    };

    window.cmsSubmitEditComun = async function (id) {
      const title = document.getElementById('cf_title')?.value.trim();
      const body  = document.getElementById('cf_body')?.value.trim();
      const prio  = document.getElementById('cf_prio')?.value  || 'medium';
      const vis   = document.getElementById('cf_vis')?.value   || 'global';
      const coId  = parseInt(document.getElementById('cf_company')?.value) || null;

      if (!title) { cmsToast('Título obrigatório', 'error'); return; }

      const restore = setBtnLoading('A guardar…');
      const res = await api.updateAnnouncement(id, {
        title,
        body:       `<p>${body}</p>`,
        priority:   prio,
        visibility: vis,
        company_id: vis === 'company' ? coId : null,
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast('Comunicado actualizado', 'success');
        await reloadModule('comunicados');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao actualizar comunicado', 'error');
      }
    };

    window.cmsDeleteComun = async function (id) {
      const c = window.COMUNICADOS?.find(x => x.id === id) || { title: 'este comunicado' };
      cmsConfirm('Eliminar comunicado', `Eliminar "<strong>${c.title}</strong>"?`, async () => {
        const res = await api.deleteAnnouncement(id);
        if (res.success) {
          cmsToast('Comunicado eliminado', 'success');
          await reloadModule('comunicados');
        } else {
          cmsToast(res.message || 'Erro ao eliminar comunicado', 'error');
        }
      });
    };

    // ══ NOTÍCIAS ═════════════════════════════════════════════════════

    window.cmsSubmitAddNews = async function () {
      const title     = document.getElementById('nf_title')?.value.trim();
      const companyId = parseInt(document.getElementById('nf_company')?.value);

      if (!title)     { cmsToast('O título é obrigatório', 'error'); return; }
      if (!companyId) { cmsToast('Seleccione uma empresa', 'error'); return; }

      const restore = setBtnLoading('A publicar…');
      const res = await api.createNews({
        title,
        summary:    document.getElementById('nf_summary')?.value.trim()  || '',
        body:       document.getElementById('nf_body')?.innerHTML         || '',
        company_id: companyId,
        category:   document.getElementById('nf_cat')?.value.trim()       || 'Geral',
        status:     'published',
        is_featured: document.getElementById('nf_featured')?.classList.contains('on') ? 1 : 0,
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast('Notícia publicada com sucesso!', 'success');
        await reloadModule('news');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao publicar notícia', 'error');
      }
    };

    window.cmsSubmitEditNews = async function (id) {
      const title     = document.getElementById('nf_title')?.value.trim();
      const companyId = parseInt(document.getElementById('nf_company')?.value);

      if (!title)     { cmsToast('O título é obrigatório', 'error'); return; }
      if (!companyId) { cmsToast('Seleccione uma empresa', 'error'); return; }

      const restore = setBtnLoading('A guardar…');
      const res = await api.updateNews(id, {
        title,
        summary:    document.getElementById('nf_summary')?.value.trim()  || '',
        body:       document.getElementById('nf_body')?.innerHTML         || '',
        company_id: companyId,
        category:   document.getElementById('nf_cat')?.value.trim()       || '',
        is_featured: document.getElementById('nf_featured')?.classList.contains('on') ? 1 : 0,
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast('Notícia actualizada', 'success');
        await reloadModule('news');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao actualizar notícia', 'error');
      }
    };

    window.cmsToggleFeatured = async function (id) {
      const n   = window.NEWS?.find(x => x.id === id);
      const res = await api.featureNews(id);
      if (res.success) {
        cmsToast(n?.featured ? 'Destaque removido' : 'Marcado como destaque ⭐', '');
        await reloadModule('news');
      } else {
        cmsToast(res.message || 'Erro ao alterar destaque', 'error');
      }
    };

    window.cmsDeleteNews = async function (id) {
      const n = window.NEWS?.find(x => x.id === id) || { title: 'esta notícia' };
      cmsConfirm('Eliminar notícia', `Eliminar "<strong>${n.title}</strong>"? Esta acção não pode ser desfeita.`, async () => {
        const res = await api.deleteNews(id);
        if (res.success) {
          cmsToast('Notícia eliminada', 'success');
          await reloadModule('news');
        } else {
          cmsToast(res.message || 'Erro ao eliminar notícia', 'error');
        }
      });
    };

    // ══ DOCUMENTOS ═══════════════════════════════════════════════════

    window.cmsSubmitAddDoc = async function () {
      const title     = document.getElementById('df_title')?.value.trim();
      const fileInput = document.getElementById('df_file_input');
      const file      = fileInput?.files?.[0];
      const companyId = document.getElementById('df_company')?.value;

      if (!title)     { cmsToast('O título é obrigatório', 'error'); return; }
      if (!file)      { cmsToast('Seleccione um ficheiro para carregar', 'error'); return; }
      if (!companyId) { cmsToast('Seleccione uma empresa', 'error'); return; }

      const restore = setBtnLoading('A carregar…');

      const fd = new FormData();
      fd.append('title',           title);
      fd.append('description',     document.getElementById('df_desc')?.value.trim() || '');
      fd.append('company_id',      companyId);
      fd.append('category',        document.getElementById('df_cat')?.value.trim()  || '');
      fd.append('is_confidential', document.getElementById('df_conf')?.classList.contains('on') ? '1' : '0');
      fd.append('file', file);

      const res = await api.uploadDocument(fd);
      if (res.success) {
        cmsCloseModal();
        cmsToast('Documento carregado com sucesso!', 'success');
        await reloadModule('docs');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao carregar documento', 'error');
      }
    };

    window.cmsSubmitEditDoc = async function (id) {
      const title = document.getElementById('df_title')?.value.trim();
      if (!title) { cmsToast('Título obrigatório', 'error'); return; }

      const restore = setBtnLoading('A guardar…');
      const res = await api.updateDocument(id, {
        title,
        description:     document.getElementById('df_desc')?.value.trim() || '',
        category:        document.getElementById('df_cat')?.value.trim()  || '',
        is_confidential: document.getElementById('df_conf')?.classList.contains('on') ? 1 : 0,
      });

      if (res.success) {
        cmsCloseModal();
        cmsToast('Documento actualizado', 'success');
        await reloadModule('docs');
      } else {
        restore?.();
        cmsToast(res.message || 'Erro ao actualizar documento', 'error');
      }
    };

    window.cmsDeleteDoc = async function (id) {
      const d = window.DOCUMENTS?.find(x => x.id === id) || { title: 'este documento' };
      cmsConfirm('Eliminar documento', `Eliminar "<strong>${d.title}</strong>"? Esta acção não pode ser desfeita.`, async () => {
        const res = await api.deleteDocument(id);
        if (res.success) {
          cmsToast('Documento eliminado', 'success');
          await reloadModule('docs');
        } else {
          cmsToast(res.message || 'Erro ao eliminar documento', 'error');
        }
      });
    };

  } // end _installWriteOverrides

})();
