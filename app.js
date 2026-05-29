/* ══════════════════════════════════════════════════
   Kelas 8B Ahmad bin Hambal — Task Board
   Extreme Neo-Brutalism | Full Interactive Logic
   ══════════════════════════════════════════════════ */

(() => {
  'use strict';

  // ── Constants ───────────────────────────────────
  const STORAGE_KEY   = 'kelas8b_tasks_v2';
  const AUTH_KEY      = 'kelas8b_auth';
  const ENERGY_KEY    = 'kelas8b_energy';
  const MARQUEE_KEY   = 'kelas8b_marquee';
  const SECRETARY_PW  = 'sekretaris8b';

  const DEFAULT_MARQUEE = '🚨 PENGUMUMAN: BESOK PR MATEMATIKA DIKUMPULKAN! 🚨  ·  📋 CEK BOARD SETIAP HARI YA, GUYS!  ·  🎯 JANGAN LUPA KERJAIN TUGASNYA!  ·  ⏰ DEADLINE DEKAT — JANGAN NUNDA!  ·  ';

  // ── Subject Config (Map — no prototype pollution risk) ──
  const SUBJECT_COLORS = new Map([
    ['Matematika',       '#ffbe0b'],
    ['IPA',              '#00f5d4'],
    ['Bahasa Inggris',   '#3a86ff'],
    ['Bahasa Indonesia', '#fb5607'],
    ['IPS',              '#ccff00'],
    ['PKN',              '#00f5d4'],
    ['Seni Budaya',      '#ff006e'],
    ['PJOK',             '#3a86ff'],
    ['Informatika',      '#8338ec'],
    ['Prakarya',         '#fb5607'],
    ['PAI',              '#d0d0d0'],
    ['Lainnya',          '#e0e0e0'],
  ]);

  const SUBJECT_ICONS = new Map([
    ['Matematika',       '📐'],
    ['IPA',              '🔬'],
    ['Bahasa Inggris',   '🌍'],
    ['Bahasa Indonesia', '📖'],
    ['IPS',              '🗺️'],
    ['PKN',              '⚖️'],
    ['Seni Budaya',      '🎨'],
    ['PJOK',             '⚽'],
    ['Informatika',      '💻'],
    ['Prakarya',         '🛠️'],
    ['PAI',              '🕌'],
    ['Lainnya',          '📌'],
  ]);

  function getSubjectColor(sub) { return SUBJECT_COLORS.get(sub) ?? '#e0e0e0'; }
  function getSubjectIcon(sub)  { return SUBJECT_ICONS.get(sub)  ?? '📌'; }

  const ALLOWED_TOAST_TYPES = new Set(['success', 'error']);

  // ── State ────────────────────────────────────────
  let tasks        = [];
  let isLoggedIn   = false;
  let activeFilter = 'all';
  let energyData   = { '🔥': 0, '🚀': 0, '💀': 0, '😴': 0 };
  let userVote     = null; // which emoji this session voted for
  let marqueeText  = DEFAULT_MARQUEE;

  // ── DOM Refs ─────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  const cursor         = $('cursor');
  const cursorDot      = $('cursorDot');
  const navbar         = $('navbar');
  const logoBadge      = $('logoBadge');
  const btnOpenLogin   = $('btnOpenLogin');
  const btnDashboard   = $('btnDashboard');
  const btnAddTask     = $('btnAddTask');
  const btnLogout      = $('btnLogout');
  const marqueeText1   = $('marqueeText1');
  const marqueeText2   = $('marqueeText2');
  const viewDashboard  = $('viewDashboard');
  const viewAdmin      = $('viewAdmin');
  const taskGrid       = $('taskGrid');
  const filterBar      = $('filterBar');
  const statTotal      = $('statTotal');
  const statUrgent     = $('statUrgent');
  const statUpcoming   = $('statUpcoming');
  const energyVotes    = $('energyVotes');
  const energyBars     = $('energyBars');
  const formAddTask    = $('formAddTask');
  const inputSubject   = $('inputSubject');
  const inputTitle     = $('inputTitle');
  const inputDeadline  = $('inputDeadline');
  const inputDesc      = $('inputDescription');
  const adminTaskItems = $('adminTaskItems');
  const inputMarquee   = $('inputMarquee');
  const btnSaveMarquee = $('btnSaveMarquee');
  const btnAdminBack   = $('btnAdminBack');
  const btnAdminLogout = $('btnAdminLogout');
  const modalLogin     = $('modalLogin');
  const formLogin      = $('formLogin');
  const inputPassword  = $('inputPassword');
  const loginError     = $('loginError');
  const btnCloseLogin  = $('btnCloseLogin');
  const btnTogglePass  = $('btnTogglePassword');
  const toast          = $('toast');
  const toastIcon      = $('toastIcon');
  const toastMsg       = $('toastMessage');

  // ═══════════════════════════════════════════════
  // CUSTOM CURSOR
  // ═══════════════════════════════════════════════
  function initCursor() {
    let cx = 0, cy = 0;
    let dx = 0, dy = 0;

    document.addEventListener('mousemove', e => {
      cx = e.clientX;
      cy = e.clientY;
      // Dot follows instantly
      cursorDot.style.transform = `translate(calc(${cx}px - 50%), calc(${cy}px - 50%))`;
    });

    // Cursor ring follows with slight lag (lerp)
    function animateCursor() {
      dx += (cx - dx) * 0.2;
      dy += (cy - dy) * 0.2;
      cursor.style.transform = `translate(calc(${dx}px - 50%), calc(${dy}px - 50%))`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    // Hover state: expand to star on interactive elements
    document.addEventListener('mouseover', e => {
      const el = e.target.closest('button, a, input, select, textarea, .task-card, .filter-chip, .stat-box, .energy-btn, [role="button"]');
      if (el) document.body.classList.add('cursor-hover');
    });

    document.addEventListener('mouseout', e => {
      const el = e.target.closest('button, a, input, select, textarea, .task-card, .filter-chip, .stat-box, .energy-btn, [role="button"]');
      if (el) document.body.classList.remove('cursor-hover');
    });

    // Press state
    document.addEventListener('mousedown', () => document.body.classList.add('cursor-pressing'));
    document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-pressing'));
  }

  // ═══════════════════════════════════════════════
  // MAGNETIC BUTTONS
  // ═══════════════════════════════════════════════
  function initMagneticButtons() {
    function bindMag(el) {
      let isPressed = false;

      el.addEventListener('mousemove', e => {
        if (isPressed) return;
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width  / 2;
        const cy = rect.top  + rect.height / 2;
        const dx = (e.clientX - cx) * 0.28;
        const dy = (e.clientY - cy) * 0.28;
        el.style.transition = 'none';
        el.style.transform  = `translate(${dx}px, ${dy}px)`;
      });

      el.addEventListener('mouseleave', () => {
        isPressed = false;
        el.style.transition = `transform 0.45s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s`;
        el.style.transform  = 'translate(0,0)';
      });

      el.addEventListener('mousedown', () => {
        isPressed = true;
        el.style.transition = 'transform 0.05s ease, box-shadow 0.05s ease';
        el.style.transform  = 'translate(8px, 8px)';
        el.style.boxShadow  = '0 0 0 var(--black, #0a0a0a)';
      });

      el.addEventListener('mouseup', () => {
        isPressed = false;
        el.style.transition = `transform 0.5s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s`;
        el.style.transform  = 'translate(0,0)';
        el.style.boxShadow  = '';
      });
    }

    $$('.mag-btn').forEach(bindMag);

    // Re-bind for dynamically added buttons
    window._bindMag = bindMag;
  }

  // ═══════════════════════════════════════════════
  // DATA PERSISTENCE
  // ═══════════════════════════════════════════════
  function loadAll() {
    // Tasks
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      tasks = raw ? JSON.parse(raw) : getSeedTasks();
      if (!raw) saveTasks();
    } catch { tasks = getSeedTasks(); saveTasks(); }

    // Energy
    try {
      const raw = localStorage.getItem(ENERGY_KEY);
      if (raw) energyData = JSON.parse(raw);
    } catch { /* keep defaults */ }

    // Marquee
    const savedMarquee = localStorage.getItem(MARQUEE_KEY);
    if (savedMarquee) marqueeText = savedMarquee;

    // Auth
    isLoggedIn = sessionStorage.getItem(AUTH_KEY) === 'true';

    // User vote (session)
    userVote = sessionStorage.getItem('kelas8b_vote') || null;
  }

  function saveTasks()  { localStorage.setItem(STORAGE_KEY,  JSON.stringify(tasks)); }
  function saveEnergy() { localStorage.setItem(ENERGY_KEY,   JSON.stringify(energyData)); }
  function saveMarquee(text) { localStorage.setItem(MARQUEE_KEY, text); }

  // ── Seed Data ────────────────────────────────────
  function getSeedTasks() {
    const now = new Date();
    const addDays = d => new Date(now.getTime() + d * 864e5).toISOString();
    return [
      { id: genId(), subject: 'Matematika',       title: 'Latihan Soal Persamaan Linear',    description: 'Kerjakan halaman 87–92. Tulis di buku tulis, kumpulkan fisik.',               deadline: addDays(2),  createdAt: now.toISOString(), done: false },
      { id: genId(), subject: 'IPA',               title: 'Laporan Praktikum Fotosintesis',   description: 'Buat laporan praktikum dengan data pengamatan dan analisis lengkap.',          deadline: addDays(5),  createdAt: now.toISOString(), done: false },
      { id: genId(), subject: 'Bahasa Inggris',    title: 'Essay: My Dream Vacation',          description: 'Write a 200-word essay using past tense and descriptive adjectives.',           deadline: addDays(3),  createdAt: now.toISOString(), done: false },
      { id: genId(), subject: 'Informatika',       title: 'Presentasi HTML & CSS',             description: 'Siapkan slide presentasi tentang dasar-dasar HTML dan CSS, kelompok 3–4 org.', deadline: addDays(7),  createdAt: now.toISOString(), done: false },
      { id: genId(), subject: 'Bahasa Indonesia',  title: 'Rangkuman Cerpen "Laskar Pelangi"', description: 'Buat rangkuman di buku sastra, minimal 1 halaman.',                             deadline: addDays(1),  createdAt: now.toISOString(), done: false },
      { id: genId(), subject: 'Seni Budaya',       title: 'Gambar Batik Nusantara',            description: 'Buat motif batik di kertas A3, warnai dengan pensil warna.',                    deadline: addDays(10), createdAt: now.toISOString(), done: false },
    ];
  }

  // ═══════════════════════════════════════════════
  // UTILITIES
  // ═══════════════════════════════════════════════
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getDeadlineInfo(iso) {
    const now      = new Date();
    const deadline = new Date(iso);
    const diffMs   = deadline - now;
    const diffH    = diffMs / 36e5;
    const diffD    = diffMs / 864e5;

    if (diffMs < 0)      return { label: 'OVERDUE',                  cls: 'overdue', icon: '☠️' };
    if (diffH < 24)      return { label: `${Math.ceil(diffH)}J LAGI`, cls: 'urgent',  icon: '🔥' };
    if (diffD <= 3)      return { label: `${Math.ceil(diffD)}H LAGI`, cls: 'urgent',  icon: '⏰' };
    if (diffD <= 7)      return { label: `${Math.ceil(diffD)}H LAGI`, cls: 'soon',    icon: '📅' };
    return               { label: `${Math.ceil(diffD)}H LAGI`,        cls: 'safe',    icon: '✅' };
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short', year:'numeric' })
      + ', ' + d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });
  }

  // ═══════════════════════════════════════════════
  // SAFE DOM HELPERS (no innerHTML)
  // ═══════════════════════════════════════════════
  function el(tag, opts = {}) {
    const node = document.createElement(tag);
    if (opts.cls)         node.className     = opts.cls;
    if (opts.text !== undefined) node.textContent = opts.text;
    if (opts.attrs)       Object.entries(opts.attrs).forEach(([k,v]) => node.setAttribute(k, v));
    if (opts.style)       Object.entries(opts.style).forEach(([k,v]) => node.style.setProperty(k, v));
    if (opts.children)    opts.children.forEach(c => node.appendChild(c));
    return node;
  }

  function clearEl(node) { node.replaceChildren(); }

  // ═══════════════════════════════════════════════
  // MARQUEE
  // ═══════════════════════════════════════════════
  function renderMarquee() {
    // Duplicate text so the scroll is seamless
    const doubled = marqueeText + ' ' + marqueeText;
    marqueeText1.textContent = doubled;
    marqueeText2.textContent = doubled;
    if (inputMarquee) inputMarquee.value = marqueeText;
  }

  // ═══════════════════════════════════════════════
  // STATS
  // ═══════════════════════════════════════════════
  function renderStats() {
    const now = new Date();
    const active = tasks.filter(t => !t.done);
    const total    = active.length;
    const urgent   = active.filter(t => { const d = (new Date(t.deadline)-now)/864e5; return d >= 0 && d <= 3; }).length;
    const upcoming = active.filter(t => (new Date(t.deadline)-now)/864e5 > 3).length;
    animCount(statTotal,    total);
    animCount(statUrgent,   urgent);
    animCount(statUpcoming, upcoming);
  }

  function animCount(node, target) {
    const start  = performance.now();
    const from   = parseInt(node.textContent) || 0;
    const dur    = 500;
    if (from === target) return;
    function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      node.textContent = Math.round(from + (target - from) * e);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ═══════════════════════════════════════════════
  // FILTERS
  // ═══════════════════════════════════════════════
  function renderFilters() {
    const subjects = [...new Set(tasks.map(t => t.subject))].sort();
    filterBar.querySelectorAll('.filter-chip:not([data-filter="all"])').forEach(c => c.remove());

    subjects.forEach(sub => {
      const chip = document.createElement('button');
      chip.className = 'filter-chip mag-btn' + (activeFilter === sub ? ' active' : '');
      chip.dataset.filter = sub;
      chip.textContent = `${getSubjectIcon(sub)} ${sub.toUpperCase()}`;
      chip.addEventListener('click', () => setFilter(sub));
      if (window._bindMag) window._bindMag(chip);
      filterBar.appendChild(chip);
    });

    const allChip = filterBar.querySelector('[data-filter="all"]');
    if (allChip) {
      allChip.className = 'filter-chip mag-btn' + (activeFilter === 'all' ? ' active' : '');
      allChip.onclick = () => setFilter('all');
    }
  }

  function setFilter(f) {
    activeFilter = f;
    renderFilters();
    renderTaskGrid();
  }

  // ═══════════════════════════════════════════════
  // TASK GRID
  // ═══════════════════════════════════════════════
  const ROTATIONS = [-4, -2, -1, 0, 1, 2, 3, -3];
  let rotIdx = 0;

  function buildCard(task) {
    const color = getSubjectColor(task.subject);
    const icon  = getSubjectIcon(task.subject);
    const dl    = getDeadlineInfo(task.deadline);
    const rot   = ROTATIONS[rotIdx % ROTATIONS.length];
    rotIdx++;

    // Article
    const card = el('article', {
      cls: 'task-card' + (task.done ? ' done' : ''),
      style: { '--card-accent': color, 'transform': `rotate(${rot}deg)` },
      attrs: { 'data-id': String(task.id), 'data-subject': task.subject, 'data-rotation': String(rot) },
    });

    // SELESAI Stamp (hidden until done)
    const stamp = el('div', { cls: 'selesai-stamp' + (task.done ? ' visible' : '') });
    stamp.appendChild(el('div', { cls: 'selesai-stamp__text', text: 'SELESAI' }));
    card.appendChild(stamp);

    // Stripe via ::before (CSS handles this)

    // Header
    const header = el('div', { cls: 'task-card__header' });
    header.appendChild(el('span', {
      cls: 'task-card__subject',
      text: `${icon} ${task.subject.toUpperCase()}`,
      style: { 'background': color },
    }));
    header.appendChild(el('span', {
      cls: `task-card__deadline-badge ${dl.cls}`,
      text: `${dl.icon} ${dl.label}`,
    }));
    card.appendChild(header);

    // Title
    card.appendChild(el('h3', { cls: 'task-card__title', text: task.title }));

    // Desc
    card.appendChild(el('p', { cls: 'task-card__desc', text: task.description || 'Tidak ada deskripsi.' }));

    // Footer
    const footer = el('div', { cls: 'task-card__footer' });
    footer.appendChild(el('span', { cls: 'task-card__date', text: `📅 ${fmtDate(task.deadline)}` }));

    const actions = el('div', { cls: 'task-card__actions' });

    // Done button (students can mark done)
    if (!task.done) {
      const doneBtn = el('button', {
        cls:   'task-card__done-btn mag-btn',
        text:  '✓ SELESAI',
        attrs: { title: 'Tandai selesai' },
      });
      doneBtn.addEventListener('click', e => {
        e.stopPropagation();
        markDone(task.id, card);
      });
      if (window._bindMag) window._bindMag(doneBtn);
      actions.appendChild(doneBtn);
    }

    // Delete (only secretary)
    if (isLoggedIn) {
      const delBtn = el('button', {
        cls:   'task-card__delete-btn mag-btn',
        text:  '🗑',
        attrs: { title: 'Hapus tugas' },
      });
      delBtn.addEventListener('click', e => {
        e.stopPropagation();
        deleteTask(task.id);
      });
      if (window._bindMag) window._bindMag(delBtn);
      actions.appendChild(delBtn);
    }

    footer.appendChild(actions);
    card.appendChild(footer);

    // Init drag
    initCardDrag(card);

    return card;
  }

  function renderTaskGrid() {
    const filtered = (activeFilter === 'all' ? [...tasks] : tasks.filter(t => t.subject === activeFilter))
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    clearEl(taskGrid);

    if (filtered.length === 0) {
      const empty = el('div', { cls: 'empty-state' });
      empty.appendChild(el('div', { cls: 'empty-state__icon', text: '📭' }));
      empty.appendChild(el('h3', { cls: 'empty-state__title', text: 'TIDAK ADA TUGAS' }));
      empty.appendChild(el('p',  {
        cls: 'empty-state__text',
        text: activeFilter === 'all'
          ? 'Sekretaris belum posting tugas. Nikmatin!'
          : `Tidak ada tugas ${activeFilter} sekarang.`,
      }));
      taskGrid.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    filtered.forEach(t => frag.appendChild(buildCard(t)));
    taskGrid.appendChild(frag);
  }

  // ═══════════════════════════════════════════════
  // CARD DRAG (playful tilt)
  // ═══════════════════════════════════════════════
  function initCardDrag(card) {
    let dragging = false;
    let startX, startY;
    const baseRot = parseFloat(card.dataset.rotation) || 0;

    card.addEventListener('pointerdown', e => {
      if (e.target.closest('button')) return;
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      card.setPointerCapture(e.pointerId);
      card.style.transition = 'box-shadow 0.1s';
      card.style.zIndex  = '50';
      card.style.boxShadow = '14px 14px 0 #0a0a0a';
      card.style.cursor  = 'grabbing';
    });

    card.addEventListener('pointermove', e => {
      if (!dragging) return;
      const dx  = e.clientX - startX;
      const dy  = e.clientY - startY;
      const rot = baseRot + dx * 0.04;
      card.style.transform = `translate(${dx}px, ${dy}px) rotate(${rot}deg)`;
    });

    const stopDrag = () => {
      if (!dragging) return;
      dragging = false;
      card.releasePointerCapture && card.releasePointerCapture();
      card.style.transition = 'transform 0.55s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s';
      card.style.transform  = `rotate(${baseRot}deg)`;
      card.style.boxShadow  = '';
      card.style.zIndex     = '';
      card.style.cursor     = 'grab';
    };

    card.addEventListener('pointerup',     stopDrag);
    card.addEventListener('pointercancel', stopDrag);
  }

  // ═══════════════════════════════════════════════
  // MARK DONE — CONFETTI + STAMP
  // ═══════════════════════════════════════════════
  function markDone(id, cardEl) {
    const task = tasks.find(t => t.id === id);
    if (!task || task.done) return;

    // Stamp reveal
    const stamp = cardEl.querySelector('.selesai-stamp');
    if (stamp) stamp.classList.add('visible');

    cardEl.classList.add('done');

    // Update state
    task.done = true;
    saveTasks();
    renderStats();

    // Remove done button
    const doneBtn = cardEl.querySelector('.task-card__done-btn');
    if (doneBtn) doneBtn.remove();

    // CONFETTI!
    if (typeof confetti !== 'undefined') {
      confetti({
        particleCount: 180,
        spread: 90,
        startVelocity: 40,
        origin: { y: 0.55 },
        colors: ['#ffbe0b', '#ff006e', '#00f5d4', '#ccff00', '#fb5607', '#8338ec', '#3a86ff'],
        ticks: 200,
      });
      // Second burst
      setTimeout(() => confetti({
        particleCount: 80,
        spread: 120,
        origin: { y: 0.6, x: 0.3 },
        colors: ['#ffbe0b', '#ff006e', '#00f5d4'],
      }), 200);
    }

    showToast('🎉 TUGAS SELESAI! GG!', 'success');
  }

  // ═══════════════════════════════════════════════
  // ADMIN TASK LIST
  // ═══════════════════════════════════════════════
  function buildAdminItem(task) {
    const icon = getSubjectIcon(task.subject);
    const dl   = getDeadlineInfo(task.deadline);

    const row = el('div', {
      cls: 'admin-task-item',
      attrs: { 'data-id': String(task.id) },
    });

    const info = el('div', { cls: 'admin-task-item__info' });
    info.appendChild(el('span', { cls: 'admin-task-item__title', text: `${icon} ${task.title}` }));
    info.appendChild(el('span', {
      cls: 'admin-task-item__meta',
      text: `${task.subject} · ${dl.icon} ${dl.label} · ${fmtDate(task.deadline)}`,
    }));

    const delBtn = el('button', {
      cls: 'admin-task-item__delete mag-btn',
      text: '🗑 HAPUS',
      attrs: { title: 'Hapus tugas' },
    });
    delBtn.addEventListener('click', () => deleteTask(task.id));
    if (window._bindMag) window._bindMag(delBtn);

    row.appendChild(info);
    row.appendChild(delBtn);
    return row;
  }

  function renderAdminList() {
    clearEl(adminTaskItems);
    const sorted = [...tasks].sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    if (sorted.length === 0) {
      adminTaskItems.appendChild(el('div', {
        cls: 'empty-state',
        style: { padding: '40px 24px' },
        children: [
          el('div', { cls: 'empty-state__icon', text: '📭' }),
          el('p',   { cls: 'empty-state__text',  text: 'Belum ada tugas. Tambah lewat form di atas.' }),
        ],
      }));
      return;
    }
    const frag = document.createDocumentFragment();
    sorted.forEach(t => frag.appendChild(buildAdminItem(t)));
    adminTaskItems.appendChild(frag);
  }

  // ═══════════════════════════════════════════════
  // TASK CRUD
  // ═══════════════════════════════════════════════
  function addTask(subject, title, deadline, desc) {
    tasks.unshift({
      id:          genId(),
      subject,
      title:       title.trim(),
      description: desc.trim(),
      deadline:    new Date(deadline).toISOString(),
      createdAt:   new Date().toISOString(),
      done:        false,
    });
    saveTasks();
    renderStats();
    renderFilters();
    renderTaskGrid();
    renderAdminList();
  }

  function deleteTask(id) {
    const safeId = CSS.escape(String(id));
    const card   = document.querySelector(`[data-id="${safeId}"]`);
    if (card) {
      card.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
      card.style.transform  = `rotate(${parseFloat(card.dataset.rotation||0)+15}deg) scale(0.85)`;
      card.style.opacity    = '0';
    }
    setTimeout(() => {
      tasks = tasks.filter(t => t.id !== id);
      saveTasks();
      renderStats();
      renderFilters();
      renderTaskGrid();
      renderAdminList();
      showToast('Tugas dihapus.', 'error');
    }, 250);
  }

  // ═══════════════════════════════════════════════
  // ENERGY METER
  // ═══════════════════════════════════════════════
  const ENERGY_META = [
    { emoji: '🔥', label: 'GASSS',  key: '🔥', fillCls: 'energy-bar-fill--fire'   },
    { emoji: '🚀', label: 'FOKUS',  key: '🚀', fillCls: 'energy-bar-fill--rocket' },
    { emoji: '💀', label: 'MATI',   key: '💀', fillCls: 'energy-bar-fill--skull'  },
    { emoji: '😴', label: 'NGANTUK',key: '😴', fillCls: 'energy-bar-fill--sleep'  },
  ];

  function renderEnergyBars() {
    clearEl(energyBars);
    const total = Object.values(energyData).reduce((a, b) => a + b, 0) || 1;

    ENERGY_META.forEach(meta => {
      const count = energyData[meta.emoji] ?? 0;
      const pct   = Math.round((count / total) * 100);

      const row = el('div', { cls: 'energy-bar-row' });
      row.appendChild(el('span', { cls: 'energy-bar-label', text: meta.emoji }));

      const track = el('div', { cls: 'energy-bar-track' });
      const fill  = el('div', { cls: `energy-bar-fill ${meta.fillCls}`, style: { width: `${pct}%` } });
      fill.textContent = pct > 12 ? `${pct}%` : '';
      track.appendChild(fill);
      row.appendChild(track);

      row.appendChild(el('span', { cls: 'energy-bar-count', text: `${count} vote${count !== 1 ? 's' : ''}` }));
      energyBars.appendChild(row);
    });
  }

  function handleEnergyVote(emoji) {
    if (userVote === emoji) return; // already voted this

    // Remove previous vote
    if (userVote) {
      energyData[userVote] = Math.max(0, (energyData[userVote] ?? 0) - 1);
    }

    energyData[emoji] = (energyData[emoji] ?? 0) + 1;
    userVote = emoji;

    sessionStorage.setItem('kelas8b_vote', emoji);
    saveEnergy();
    renderEnergyBars();

    // Update button styles
    energyVotes.querySelectorAll('.energy-btn').forEach(btn => {
      btn.classList.toggle('voted', btn.dataset.emoji === emoji);
    });

    showToast(`${emoji} Vote tercatat!`, 'success');
  }

  // ═══════════════════════════════════════════════
  // AUTH
  // ═══════════════════════════════════════════════
  function checkAuth() {
    isLoggedIn = sessionStorage.getItem(AUTH_KEY) === 'true';
    updateAuthUI();
  }

  function login(pw) {
    if (pw === SECRETARY_PW) {
      isLoggedIn = true;
      sessionStorage.setItem(AUTH_KEY, 'true');
      updateAuthUI();
      closeModal(modalLogin);
      switchView('admin');
      showToast('Welcome, Sekretaris! 👋', 'success');
      return true;
    }
    return false;
  }

  function logout() {
    isLoggedIn = false;
    sessionStorage.removeItem(AUTH_KEY);
    updateAuthUI();
    switchView('dashboard');
    showToast('Logged out.', 'success');
  }

  function updateAuthUI() {
    btnOpenLogin.style.display = isLoggedIn ? 'none' : '';
    btnDashboard.style.display = isLoggedIn ? ''     : 'none';
    btnAddTask.style.display   = isLoggedIn ? ''     : 'none';
    btnLogout.style.display    = isLoggedIn ? ''     : 'none';
    renderTaskGrid(); // show/hide delete buttons on cards
  }

  // ═══════════════════════════════════════════════
  // VIEW SWITCHING
  // ═══════════════════════════════════════════════
  function switchView(view) {
    if (view === 'admin' && isLoggedIn) {
      viewAdmin.classList.add('active');
      viewDashboard.classList.remove('active');
      renderAdminList();
    } else {
      viewAdmin.classList.remove('active');
      viewDashboard.classList.add('active');
      renderTaskGrid();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ═══════════════════════════════════════════════
  // MODAL
  // ═══════════════════════════════════════════════
  function openModal(modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
      const inp = modal.querySelector('input');
      if (inp) inp.focus();
    }, 200);
  }

  function closeModal(modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    loginError.classList.remove('visible');
    inputPassword.value = '';
  }

  // ═══════════════════════════════════════════════
  // TOAST
  // ═══════════════════════════════════════════════
  function showToast(msg, type = 'success') {
    const safeType = ALLOWED_TOAST_TYPES.has(type) ? type : 'success';
    toastMsg.textContent  = msg;
    toastIcon.textContent = safeType === 'error' ? '✕' : '✓';
    toast.className = `nb-toast nb-toast--${safeType} visible`;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  // ═══════════════════════════════════════════════
  // SECRET DOUBLE-CLICK LOGIN TRIGGER
  // ═══════════════════════════════════════════════
  function initSecretLogin() {
    logoBadge.addEventListener('dblclick', e => {
      e.preventDefault();
      if (isLoggedIn) {
        switchView('admin');
      } else {
        openModal(modalLogin);
      }
    });
  }

  // ═══════════════════════════════════════════════
  // MIN DEADLINE
  // ═══════════════════════════════════════════════
  function setMinDeadline() {
    const now    = new Date();
    const offset = now.getTimezoneOffset();
    const local  = new Date(now.getTime() - offset * 60000);
    if (inputDeadline) inputDeadline.min = local.toISOString().slice(0, 16);
  }

  // ═══════════════════════════════════════════════
  // EVENT BINDING
  // ═══════════════════════════════════════════════
  function bindEvents() {
    // Nav brand → dashboard
    document.getElementById('navBrand').addEventListener('click', e => {
      e.preventDefault();
      if (isLoggedIn) switchView('admin');
      else switchView('dashboard');
    });

    // Open login modal
    btnOpenLogin.addEventListener('click', () => openModal(modalLogin));

    // Close modal
    btnCloseLogin.addEventListener('click', () => closeModal(modalLogin));
    modalLogin.addEventListener('click', e => { if (e.target === modalLogin) closeModal(modalLogin); });

    // Toggle password visibility
    btnTogglePass.addEventListener('click', () => {
      const isPw = inputPassword.type === 'password';
      inputPassword.type = isPw ? 'text' : 'password';
      btnTogglePass.textContent = isPw ? '🙈' : '👁';
    });

    // Login form
    formLogin.addEventListener('submit', e => {
      e.preventDefault();
      if (!login(inputPassword.value)) {
        loginError.classList.add('visible');
        inputPassword.value = '';
        inputPassword.focus();
      }
    });

    // Logout buttons
    btnLogout.addEventListener('click', logout);
    btnAdminLogout.addEventListener('click', logout);

    // Nav buttons
    btnDashboard.addEventListener('click', () => switchView('dashboard'));
    btnAddTask.addEventListener('click', () => switchView('admin'));

    // Admin back
    btnAdminBack.addEventListener('click', () => switchView('dashboard'));

    // Add task form
    formAddTask.addEventListener('submit', e => {
      e.preventDefault();
      addTask(inputSubject.value, inputTitle.value, inputDeadline.value, inputDesc.value);
      formAddTask.reset();
      showToast('✅ Tugas berhasil diposting!', 'success');

      // Confetti for task add too
      if (typeof confetti !== 'undefined') {
        confetti({ particleCount: 60, spread: 60, origin: { y: 0.4 } });
      }
    });

    // Save marquee
    btnSaveMarquee.addEventListener('click', () => {
      const newText = inputMarquee.value.trim();
      if (newText) {
        marqueeText = newText + '  ·  ';
        saveMarquee(marqueeText);
        renderMarquee();
        showToast('📢 Pengumuman diperbarui!', 'success');
      }
    });

    // Energy vote buttons
    energyVotes.querySelectorAll('.energy-btn').forEach(btn => {
      btn.addEventListener('click', () => handleEnergyVote(btn.dataset.emoji));
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closeModal(modalLogin);
    });

    // Restore user vote display
    if (userVote) {
      energyVotes.querySelectorAll('.energy-btn').forEach(btn => {
        btn.classList.toggle('voted', btn.dataset.emoji === userVote);
      });
    }
  }

  // ═══════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════
  function init() {
    loadAll();
    checkAuth();
    renderMarquee();
    renderStats();
    renderFilters();
    renderTaskGrid();
    renderEnergyBars();
    setMinDeadline();
    initCursor();
    initMagneticButtons();
    initSecretLogin();
    bindEvents();

    if (isLoggedIn) switchView('admin');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
