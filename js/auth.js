/* =============================================
   INOV INTRANET — AUTH ENGINE
   Login · Register · Recover · Session
   ============================================= */

const AUTH_KEY   = 'inov_session';
const USERS_KEY  = 'inov_users';
const USERS_VER_KEY = 'inov_users_ver';

// Seed default users — re-seeds automatically when USERS_VERSION changes
function seedUsers() {
  if (localStorage.getItem(USERS_VER_KEY) !== USERS_VERSION) {
    localStorage.setItem(USERS_KEY, JSON.stringify(INOV_USERS));
    localStorage.setItem(USERS_VER_KEY, USERS_VERSION);
  }
}

function getAllUsers() {
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch { return []; }
}

function saveAllUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
  catch { return null; }
}

function setSession(user) {
  const sess = { ...user, password: undefined, loggedAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(sess));
}

function clearSession() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem('inov_csrf');
  // Notificar o servidor (fire-and-forget)
  if (window.api) api.logout().catch(() => {});
}

function requireAuth() {
  const sess = getSession();
  if (!sess) {
    window.location.href = 'index.html';
    return null;
  }
  return sess;
}

function requireGuest() {
  const sess = getSession();
  if (sess) {
    window.location.href = 'app.html';
  }
}

// ============ LOGIN PAGE ============
function initLogin() {
  seedUsers();
  requireGuest();

  const form    = document.getElementById('loginForm');
  const alert   = document.getElementById('loginAlert');
  const passEl  = document.getElementById('loginPass');
  const toggleBtn = document.getElementById('togglePass');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isText = passEl.type === 'text';
      passEl.type = isText ? 'password' : 'text';
      toggleBtn.innerHTML = isText
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
        : `<svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`;
    });
  }

  if (!form) return;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pass  = passEl.value;
    const btn   = form.querySelector('.btn-auth');

    btn.textContent = 'A verificar…';
    btn.classList.add('loading');
    showAlert(alert, '', '');

    try {
      const res = await api.login(email, pass);

      if (res.success) {
        const u = res.data.user;
        const uiRole = (u.role === 'super_admin' || u.role === 'admin') ? 'admin'
                     : u.role === 'editor' ? 'editor' : 'user';
        setSession({
          id:         u.id,
          name:       u.name,
          email:      u.email,
          role:       uiRole,
          roleRaw:    u.role,
          company:    u.company_name  || '',
          dept:       u.department    || '',
          job:        u.job_title     || '',
          avatar:     u.avatar        || (u.name||'').split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(),
          avatarUrl:  u.avatar_path   || null,
          company_id: u.company_id,
          loggedAt:   new Date().toISOString(),
        });
        btn.textContent = '✓ Bem-vindo!';
        setTimeout(() => { window.location.href = 'app.html'; }, 500);
      } else {
        btn.textContent = 'Entrar';
        btn.classList.remove('loading');
        const msg = res.message || 'Email ou password incorrectos.';
        showAlert(alert, 'error', msg);
      }
    } catch (err) {
      btn.textContent = 'Entrar';
      btn.classList.remove('loading');
      showAlert(alert, 'error', 'Erro de ligação ao servidor. Verifique a sua ligação.');
    }
  });
}

// ============ REGISTER PAGE ============
function initRegister() {
  seedUsers();
  requireGuest();

  let currentStep = 1;
  const totalSteps = 2;

  const form     = document.getElementById('registerForm');
  const alert    = document.getElementById('registerAlert');
  const dots     = document.querySelectorAll('.step-dot');
  const step1    = document.getElementById('step1');
  const step2    = document.getElementById('step2');
  const nextBtn  = document.getElementById('nextBtn');
  const backBtn  = document.getElementById('backBtn');
  const submitBtn= document.getElementById('submitBtn');

  function updateSteps() {
    dots.forEach((d, i) => {
      d.classList.remove('active', 'done');
      if (i + 1 < currentStep) d.classList.add('done');
      if (i + 1 === currentStep) d.classList.add('active');
    });
    step1.style.display = currentStep === 1 ? 'block' : 'none';
    step2.style.display = currentStep === 2 ? 'block' : 'none';
    nextBtn.style.display   = currentStep < totalSteps ? 'block' : 'none';
    backBtn.style.display   = currentStep > 1 ? 'block' : 'none';
    submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';
  }

  // Password strength
  const passEl = document.getElementById('regPass');
  const bar    = document.getElementById('pwdBar');
  if (passEl && bar) {
    passEl.addEventListener('input', () => {
      const v = passEl.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      bar.className = 'pwd-strength-bar ' + ['', 'weak', 'fair', 'good', 'strong'][score];
    });
  }

  // Toggle passwords
  document.querySelectorAll('.i-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.target);
      if (!target) return;
      target.type = target.type === 'text' ? 'password' : 'text';
    });
  });

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const name  = document.getElementById('regName')?.value.trim();
      const email = document.getElementById('regEmail')?.value.trim();
      const company = document.getElementById('regCompany')?.value;
      if (!name || !email || !company) {
        showAlert(alert, 'error', 'Por favor preencha todos os campos obrigatórios.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showAlert(alert, 'error', 'Introduza um email válido.');
        return;
      }
      const users = getAllUsers();
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        showAlert(alert, 'error', 'Este email já está registado.');
        return;
      }
      showAlert(alert, '', '');
      currentStep = 2;
      updateSteps();
    });
  }

  if (backBtn) {
    backBtn.addEventListener('click', () => {
      currentStep = Math.max(1, currentStep - 1);
      updateSteps();
    });
  }

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass    = document.getElementById('regPass')?.value;
      const confirm = document.getElementById('regConfirm')?.value;
      if (pass !== confirm) {
        showAlert(alert, 'error', 'As passwords não coincidem.');
        return;
      }
      if (pass.length < 8) {
        showAlert(alert, 'error', 'A password deve ter pelo menos 8 caracteres.');
        return;
      }
      const dept = document.getElementById('regDept')?.value.trim();
      const job  = document.getElementById('regJob')?.value.trim();
      if (!dept || !job) {
        showAlert(alert, 'error', 'Preencha todos os campos.');
        return;
      }

      const users = getAllUsers();
      const newUser = {
        id:       Date.now(),
        name:     document.getElementById('regName').value.trim(),
        email:    document.getElementById('regEmail').value.trim().toLowerCase(),
        password: pass,
        role:     'user',
        company:  document.getElementById('regCompany').value,
        dept, job,
        avatar:   document.getElementById('regName').value.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase(),
        joined:   new Date().toISOString().split('T')[0],
      };
      users.push(newUser);
      saveAllUsers(users);

      submitBtn.textContent = '✓ Conta criada!';
      showAlert(alert, 'success', 'Conta criada com sucesso! A redirecionar…');
      setTimeout(() => {
        setSession(newUser);
        window.location.href = 'app.html';
      }, 1200);
    });
  }

  updateSteps();
}

// ============ RECOVER PAGE ============
function initRecover() {
  seedUsers();
  requireGuest();
  const form  = document.getElementById('recoverForm');
  const alert = document.getElementById('recoverAlert');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('recoverEmail').value.trim().toLowerCase();
    const btn   = form.querySelector('.btn-auth');
    btn.textContent = 'A verificar…';
    btn.classList.add('loading');
    setTimeout(() => {
      const users = getAllUsers();
      const user  = users.find(u => u.email.toLowerCase() === email);
      btn.textContent = 'Enviar Link de Recuperação';
      btn.classList.remove('loading');
      // Always show success for security
      showAlert(alert, 'success', user
        ? `Link de recuperação enviado para ${email}. Verifique a sua caixa de entrada.`
        : `Se o email estiver registado, receberá um link de recuperação.`
      );
      form.reset();
    }, 900);
  });
}

// ============ HELPERS ============
function showAlert(el, type, msg) {
  if (!el) return;
  el.className = 'auth-alert';
  if (!type || !msg) { el.style.display = 'none'; return; }
  el.classList.add(type, 'show');
  el.innerHTML = msg;
  el.style.display = '';
}

// Auto-init based on page
document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;
  if (page === 'login')    initLogin();
  if (page === 'register') initRegister();
  if (page === 'recover')  initRecover();
});
