/* ══════════════════════════════════════════════════
   Kelas 8B Task Manager — Application Logic
   ══════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── Constants ───────────────────────────────
  const STORAGE_KEY = 'kelas8b_tasks';
  const AUTH_KEY = 'kelas8b_auth';
  const SECRETARY_PASSWORD = 'sekretaris8b'; // simple password for the class secretary

  // Using Map instead of plain objects to avoid bracket-notation prototype pollution risks.
  const SUBJECT_COLORS = new Map([
    ['Matematika',      '#6c5ce7'],
    ['IPA',             '#00b894'],
    ['Bahasa Inggris',  '#0984e3'],
    ['Bahasa Indonesia', '#e17055'],
    ['IPS',             '#fdcb6e'],
    ['PKN',             '#00cec9'],
    ['Seni Budaya',     '#fd79a8'],
    ['PJOK',            '#55a3e8'],
    ['Informatika',     '#a29bfe'],
    ['Prakarya',        '#e84393'],
    ['PAI',             '#2d3436'],
    ['Lainnya',         '#636e72'],
  ]);

  const SUBJECT_ICONS = new Map([
    ['Matematika',      '📐'],
    ['IPA',             '🔬'],
    ['Bahasa Inggris',  '🌍'],
    ['Bahasa Indonesia', '📖'],
    ['IPS',             '🗺️'],
    ['PKN',             '⚖️'],
    ['Seni Budaya',     '🎨'],
    ['PJOK',            '⚽'],
    ['Informatika',     '💻'],
    ['Prakarya',        '🛠️'],
    ['PAI',             '🕌'],
    ['Lainnya',         '📌'],
  ]);

  // Allowed toast types to prevent class injection
  const ALLOWED_TOAST_TYPES = new Set(['success', 'error']);

  // ── Safe Lookup Helpers ─────────────────────
  // Map.get() only accesses explicitly added entries — no prototype pollution risk.
  function getSubjectColor(subject) {
    return SUBJECT_COLORS.get(subject) || SUBJECT_COLORS.get('Lainnya');
  }

  function getSubjectIcon(subject) {
    return SUBJECT_ICONS.get(subject) || '📌';
  }

  // ── State ───────────────────────────────────
  let tasks = [];
  let isLoggedIn = false;
  let activeFilter = 'all';

  // ── DOM References ──────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const navbar = $('#navbar');
  const navBrand = $('#navBrand');
  const btnOpenLogin = $('#btnOpenLogin');
  const btnAddTask = $('#btnAddTask');
  const btnLogout = $('#btnLogout');
  const viewDashboard = $('#viewDashboard');
  const viewAdmin = $('#viewAdmin');
  const taskGrid = $('#taskGrid');
  const filterBar = $('#filterBar');
  const statsBar = $('#statsBar');
  const statTotal = $('#statTotal');
  const statUrgent = $('#statUrgent');
  const statUpcoming = $('#statUpcoming');

  const modalLogin = $('#modalLogin');
  const formLogin = $('#formLogin');
  const inputPassword = $('#inputPassword');
  const loginError = $('#loginError');
  const btnCloseLogin = $('#btnCloseLogin');
  const btnTogglePassword = $('#btnTogglePassword');

  const formAddTask = $('#formAddTask');
  const inputSubject = $('#inputSubject');
  const inputTitle = $('#inputTitle');
  const inputDeadline = $('#inputDeadline');
  const inputDescription = $('#inputDescription');
  const adminTaskItems = $('#adminTaskItems');

  const toastEl = $('#toastSuccess');
  const toastMessage = $('#toastMessage');
  const confettiContainer = $('#confettiContainer');

  // ── Data Persistence ────────────────────────
  function loadTasks() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : getSeedTasks();
      if (!raw) saveTasks(); // persist seed data
    } catch {
      tasks = getSeedTasks();
      saveTasks();
    }
  }

  function saveTasks() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }

  function getSeedTasks() {
    const now = new Date();
    return [
      {
        id: generateId(),
        subject: 'Matematika',
        title: 'Latihan Soal Persamaan Linear',
        description: 'Kerjakan latihan soal halaman 87–92. Tulis jawaban di buku tulis, kumpulkan fisik.',
        deadline: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: generateId(),
        subject: 'IPA',
        title: 'Laporan Praktikum Fotosintesis',
        description: 'Buat laporan praktikum minggu lalu tentang proses fotosintesis. Sertakan data pengamatan dan analisis.',
        deadline: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: generateId(),
        subject: 'Bahasa Inggris',
        title: 'Essay: My Dream Vacation',
        description: 'Write a 200-word essay about your dream vacation. Use past tense and descriptive adjectives.',
        deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: generateId(),
        subject: 'Informatika',
        title: 'Presentasi HTML & CSS',
        description: 'Siapkan slide presentasi tentang dasar-dasar HTML dan CSS. Kelompok 3–4 orang.',
        deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: generateId(),
        subject: 'Bahasa Indonesia',
        title: 'Rangkuman Cerpen "Laskar Pelangi"',
        description: 'Buat rangkuman cerpen yang telah dibaca, tulis di buku sastra. Minimal 1 halaman.',
        deadline: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
      {
        id: generateId(),
        subject: 'Seni Budaya',
        title: 'Gambar Batik Nusantara',
        description: 'Buat gambar motif batik dari salah satu daerah di Indonesia di kertas A3. Warnai dengan pensil warna.',
        deadline: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: now.toISOString(),
      },
    ];
  }

  // ── Utilities ───────────────────────────────
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getDeadlineInfo(deadlineISO) {
    const now = new Date();
    const deadline = new Date(deadlineISO);
    const diffMs = deadline - now;
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffMs < 0) {
      return { label: 'Overdue', class: 'overdue', icon: '⚠' };
    } else if (diffHours < 24) {
      const hrs = Math.max(1, Math.ceil(diffHours));
      return { label: `${hrs}h left`, class: 'urgent', icon: '🔥' };
    } else if (diffDays <= 3) {
      const d = Math.ceil(diffDays);
      return { label: `${d} day${d > 1 ? 's' : ''} left`, class: 'urgent', icon: '⏰' };
    } else if (diffDays <= 7) {
      const d = Math.ceil(diffDays);
      return { label: `${d} days left`, class: 'soon', icon: '📅' };
    } else {
      const d = Math.ceil(diffDays);
      return { label: `${d} days left`, class: 'safe', icon: '✅' };
    }
  }

  function formatDate(isoStr) {
    const d = new Date(isoStr);
    return d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }) + ', ' + d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Safe DOM Helpers ────────────────────────
  // Creates an element with optional class, attributes, and text content.
  function createElement(tag, options = {}) {
    const el = document.createElement(tag);
    if (options.className) el.className = options.className;
    if (options.textContent !== undefined) el.textContent = options.textContent;
    if (options.attrs) {
      for (const [key, val] of Object.entries(options.attrs)) {
        el.setAttribute(key, val);
      }
    }
    if (options.style) {
      for (const [prop, val] of Object.entries(options.style)) {
        el.style.setProperty(prop, val);
      }
    }
    if (options.children) {
      for (const child of options.children) {
        el.appendChild(child);
      }
    }
    return el;
  }

  // Safely clears all children of a DOM element without innerHTML.
  function clearChildren(el) {
    el.replaceChildren();
  }

  // ── Rendering ───────────────────────────────
  function renderDashboard() {
    renderStats();
    renderFilters();
    renderTaskGrid();
  }

  function renderStats() {
    const now = new Date();
    const total = tasks.length;
    const urgent = tasks.filter(t => {
      const diff = (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 3;
    }).length;
    const upcoming = tasks.filter(t => {
      const diff = (new Date(t.deadline) - now) / (1000 * 60 * 60 * 24);
      return diff > 3;
    }).length;

    animateCounter(statTotal, total);
    animateCounter(statUrgent, urgent);
    animateCounter(statUpcoming, upcoming);
  }

  function animateCounter(el, target) {
    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const start = performance.now();

    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(current + (target - current) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function renderFilters() {
    const subjects = [...new Set(tasks.map(t => t.subject))].sort();
    const existingChips = filterBar.querySelectorAll('.filter-chip:not([data-filter="all"])');
    existingChips.forEach(c => c.remove());

    subjects.forEach(sub => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip' + (activeFilter === sub ? ' active' : '');
      chip.dataset.filter = sub;
      // Safe: uses textContent so no HTML injection, and getSubjectIcon guards against prototype access
      chip.textContent = `${getSubjectIcon(sub)} ${sub}`;
      chip.addEventListener('click', () => setFilter(sub));
      filterBar.appendChild(chip);
    });

    // update "all" chip state
    const allChip = filterBar.querySelector('[data-filter="all"]');
    allChip.className = 'filter-chip' + (activeFilter === 'all' ? ' active' : '');
    allChip.onclick = () => setFilter('all');
  }

  function setFilter(filter) {
    activeFilter = filter;
    renderFilters();
    renderTaskGrid();
  }

  // ── Build a single task card using safe DOM API ──
  function buildTaskCard(task) {
    const color = getSubjectColor(task.subject);
    const icon = getSubjectIcon(task.subject);
    const dl = getDeadlineInfo(task.deadline);

    // Article wrapper
    const article = createElement('article', {
      className: 'task-card',
      style: { '--card-accent': color },
      attrs: { 'data-id': String(task.id) },
    });

    // Header
    const header = createElement('div', { className: 'task-card__header' });

    // Subject badge
    const subjectBadge = createElement('span', { className: 'task-card__subject' });
    subjectBadge.appendChild(createElement('span', { className: 'task-card__subject-dot' }));
    subjectBadge.appendChild(document.createTextNode(` ${icon} ${task.subject}`));

    // Deadline badge
    const deadlineBadge = createElement('span', {
      className: `task-card__deadline-badge ${dl.class}`,
      textContent: `${dl.icon} ${dl.label}`,
    });

    header.appendChild(subjectBadge);
    header.appendChild(deadlineBadge);

    // Title
    const title = createElement('h3', {
      className: 'task-card__title',
      textContent: task.title,
    });

    // Description
    const desc = createElement('p', {
      className: 'task-card__description',
      textContent: task.description || 'No description provided.',
    });

    // Footer
    const footer = createElement('div', { className: 'task-card__footer' });

    const dateSpan = createElement('span', { className: 'task-card__date' });
    dateSpan.appendChild(createElement('span', {
      className: 'task-card__date-icon',
      textContent: '📅',
    }));
    dateSpan.appendChild(document.createTextNode(` ${formatDate(task.deadline)}`));
    footer.appendChild(dateSpan);

    // Delete button (only for logged-in secretary)
    if (isLoggedIn) {
      const deleteBtn = createElement('button', {
        className: 'task-card__delete btn--icon',
        textContent: '🗑',
        attrs: {
          'data-delete': String(task.id),
          'title': 'Delete task',
        },
      });
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteTask(task.id);
      });
      footer.appendChild(deleteBtn);
    }

    // Assemble
    article.appendChild(header);
    article.appendChild(title);
    article.appendChild(desc);
    article.appendChild(footer);

    return article;
  }

  function renderTaskGrid() {
    const filtered = activeFilter === 'all'
      ? [...tasks]
      : tasks.filter(t => t.subject === activeFilter);

    // Sort: soonest deadline first, overdue at the top
    filtered.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Clear previous content safely
    clearChildren(taskGrid);

    if (filtered.length === 0) {
      // Build empty state with safe DOM API
      const emptyState = createElement('div', { className: 'empty-state' });
      emptyState.appendChild(createElement('div', {
        className: 'empty-state__icon',
        textContent: '📭',
      }));
      emptyState.appendChild(createElement('h3', {
        className: 'empty-state__title',
        textContent: 'No assignments yet',
      }));

      const emptyText = activeFilter === 'all'
        ? 'The class secretary hasn\'t posted any tasks. Enjoy the break!'
        : `No tasks for ${activeFilter} right now.`;

      emptyState.appendChild(createElement('p', {
        className: 'empty-state__text',
        textContent: emptyText, // textContent auto-escapes
      }));

      taskGrid.appendChild(emptyState);
      return;
    }

    // Build each card with safe DOM API
    const fragment = document.createDocumentFragment();
    filtered.forEach(task => {
      fragment.appendChild(buildTaskCard(task));
    });
    taskGrid.appendChild(fragment);
  }

  // ── Build a single admin task row using safe DOM API ──
  function buildAdminTaskItem(task) {
    const icon = getSubjectIcon(task.subject);
    const dl = getDeadlineInfo(task.deadline);

    const row = createElement('div', {
      className: 'admin-task-item',
      attrs: { 'data-id': String(task.id) },
    });

    const info = createElement('div', { className: 'admin-task-item__info' });

    info.appendChild(createElement('span', {
      className: 'admin-task-item__title',
      textContent: `${icon} ${task.title}`,
    }));

    info.appendChild(createElement('span', {
      className: 'admin-task-item__meta',
      textContent: `${task.subject} · ${dl.icon} ${dl.label} · ${formatDate(task.deadline)}`,
    }));

    const deleteBtn = createElement('button', {
      className: 'btn btn--danger btn--sm admin-task-item__delete',
      textContent: '🗑',
      attrs: {
        'data-delete-admin': String(task.id),
        'title': 'Delete',
      },
    });
    deleteBtn.addEventListener('click', () => deleteTask(task.id));

    row.appendChild(info);
    row.appendChild(deleteBtn);

    return row;
  }

  function renderAdminTaskList() {
    const sorted = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    // Clear previous content safely
    clearChildren(adminTaskItems);

    if (sorted.length === 0) {
      const emptyState = createElement('div', {
        className: 'empty-state',
        style: { padding: '40px 0' },
      });
      emptyState.appendChild(createElement('div', {
        className: 'empty-state__icon',
        textContent: '📭',
      }));
      emptyState.appendChild(createElement('p', {
        className: 'empty-state__text',
        textContent: 'No tasks posted yet. Use the form above to add one!',
      }));
      adminTaskItems.appendChild(emptyState);
      return;
    }

    const fragment = document.createDocumentFragment();
    sorted.forEach(task => {
      fragment.appendChild(buildAdminTaskItem(task));
    });
    adminTaskItems.appendChild(fragment);
  }

  // ── Task CRUD ───────────────────────────────
  function addTask(subject, title, deadline, description) {
    const task = {
      id: generateId(),
      subject,
      title: title.trim(),
      description: description.trim(),
      deadline: new Date(deadline).toISOString(),
      createdAt: new Date().toISOString(),
    };
    tasks.unshift(task);
    saveTasks();
    renderDashboard();
    renderAdminTaskList();
  }

  function deleteTask(id) {
    // Sanitize id to a safe string for the attribute selector
    const safeId = CSS.escape(String(id));
    const card = document.querySelector(`[data-id="${safeId}"]`);
    if (card) {
      card.style.transition = 'all 300ms var(--ease-out-expo)';
      card.style.transform = 'scale(0.92)';
      card.style.opacity = '0';
    }
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderDashboard();
      renderAdminTaskList();
      showToast('Assignment deleted.', 'error');
    }, 280);
  }

  // ── Authentication ──────────────────────────
  function checkAuth() {
    isLoggedIn = sessionStorage.getItem(AUTH_KEY) === 'true';
    updateAuthUI();
  }

  function login(password) {
    if (password === SECRETARY_PASSWORD) {
      isLoggedIn = true;
      sessionStorage.setItem(AUTH_KEY, 'true');
      updateAuthUI();
      closeModal(modalLogin);
      switchView('admin');
      showToast('Welcome back, Secretary! 👋', 'success');
      return true;
    }
    return false;
  }

  function logout() {
    isLoggedIn = false;
    sessionStorage.removeItem(AUTH_KEY);
    updateAuthUI();
    switchView('dashboard');
    showToast('Logged out successfully.', 'success');
  }

  function updateAuthUI() {
    btnOpenLogin.style.display = isLoggedIn ? 'none' : '';
    btnAddTask.style.display = isLoggedIn ? '' : 'none';
    btnLogout.style.display = isLoggedIn ? '' : 'none';
    renderDashboard(); // re-render to show/hide delete buttons
  }

  // ── View Switching ──────────────────────────
  function switchView(view) {
    viewDashboard.classList.remove('active');
    viewAdmin.classList.remove('active');

    if (view === 'admin' && isLoggedIn) {
      viewAdmin.classList.add('active');
      renderAdminTaskList();
    } else {
      viewDashboard.classList.add('active');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Modal Handling ──────────────────────────
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Focus first input
    setTimeout(() => {
      const input = modal.querySelector('input, textarea, select');
      if (input) input.focus();
    }, 200);
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // Reset form states
    loginError.classList.remove('visible');
    inputPassword.value = '';
  }

  // ── Toast ───────────────────────────────────
  function showToast(message, type = 'success') {
    // Sanitize type against allowlist to prevent class injection
    const safeType = ALLOWED_TOAST_TYPES.has(type) ? type : 'success';
    toastMessage.textContent = message;
    toastEl.className = `toast toast--${safeType} visible`;

    clearTimeout(showToast._timeout);
    showToast._timeout = setTimeout(() => {
      toastEl.classList.remove('visible');
    }, 3000);
  }

  // ── Confetti ────────────────────────────────
  function spawnConfetti() {
    const colors = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#fd79a8', '#0984e3', '#a29bfe'];
    const count = 40;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'confetti-particle';
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = '-10px';
      // Safe: numeric index into a hardcoded local array — no user input involved
      const colorIndex = Math.floor(Math.random() * colors.length);
      particle.style.background = colors[colorIndex];
      particle.style.animationDelay = Math.random() * 0.5 + 's';
      particle.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
      particle.style.transform = `rotate(${Math.random() * 360}deg)`;
      confettiContainer.appendChild(particle);
    }

    setTimeout(() => {
      // Safe DOM clearing without innerHTML
      clearChildren(confettiContainer);
    }, 2000);
  }

  // ── Navbar Scroll Effect ────────────────────
  function setupScrollEffect() {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          navbar.classList.toggle('scrolled', window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // ── Event Listeners ─────────────────────────
  function bindEvents() {
    // Nav brand => go back to dashboard
    navBrand.addEventListener('click', (e) => {
      e.preventDefault();
      switchView('dashboard');
    });

    // Open login modal
    btnOpenLogin.addEventListener('click', () => openModal(modalLogin));

    // Close login modal
    btnCloseLogin.addEventListener('click', () => closeModal(modalLogin));
    modalLogin.addEventListener('click', (e) => {
      if (e.target === modalLogin) closeModal(modalLogin);
    });

    // Toggle password visibility
    btnTogglePassword.addEventListener('click', () => {
      const isPassword = inputPassword.type === 'password';
      inputPassword.type = isPassword ? 'text' : 'password';
      btnTogglePassword.textContent = isPassword ? '🙈' : '👁';
    });

    // Login form submit
    formLogin.addEventListener('submit', (e) => {
      e.preventDefault();
      const success = login(inputPassword.value);
      if (!success) {
        loginError.classList.add('visible');
        inputPassword.value = '';
        inputPassword.focus();
      }
    });

    // Logout
    btnLogout.addEventListener('click', logout);

    // Add task button (nav) => switch to admin
    btnAddTask.addEventListener('click', () => switchView('admin'));

    // Add task form submit
    formAddTask.addEventListener('submit', (e) => {
      e.preventDefault();
      addTask(
        inputSubject.value,
        inputTitle.value,
        inputDeadline.value,
        inputDescription.value
      );

      // Reset form
      formAddTask.reset();

      // Success feedback
      showToast('Assignment posted successfully! 🎉', 'success');
      spawnConfetti();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeModal(modalLogin);
      }
    });
  }

  // ── Set minimum datetime for deadline input ──
  function setMinDeadline() {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60 * 1000);
    inputDeadline.min = local.toISOString().slice(0, 16);
  }

  // ── Initialize ──────────────────────────────
  function init() {
    loadTasks();
    checkAuth();
    renderDashboard();
    setupScrollEffect();
    bindEvents();
    setMinDeadline();

    // If logged in, show admin view
    if (isLoggedIn) {
      switchView('admin');
    }
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
