/* script.js
   Akatsuki PhD Quest – RPG
   Full-featured client-side logic for:
   - persistent tasks, xp, coins, avatar
   - shop, purchases, gear
   - sidebar toggle, tabs, add task, shuffle, reset
   - safe fallback if game-data.json missing or malformed
*/

(() => {
  // ---------- Configuration ----------
  const XP_PER_LEVEL = 150;
  const STORAGE_KEYS = {
    xp: 'ak_xp',
    level: 'ak_level',
    coins: 'ak_coins',
    streak: 'ak_streak',
    sections: 'ak_sections',
    shop: 'ak_shop',
    avatar: 'ak_avatar',
    sidebarHidden: 'ak_sidebar_hidden'
  };

  // Fallback data (used if game-data.json missing)
  const FALLBACK = {
    sections: {
      phd: { title: "PhD Journey", items: [
        { title: "Topic Exploration Session", xp: 20 },
        { title: "Research Skill-Building Block", xp: 25 },
        { title: "Coursework & Reading Sprint", xp: 15 },
        { title: "Academic Writing Session", xp: 30 }
      ]},
      skool: { title: "Skool Community", items: [
        { title: "Community Engagement (Reply + Post)", xp: 15 },
        { title: "Lesson Recording Prep", xp: 20 },
        { title: "Curriculum Development Block", xp: 25 }
      ]},
      doc: { title: "Documentary Tracking", items: [
        { title: "Daily Log Entry", xp: 10 },
        { title: "Milestone Capture", xp: 15 },
        { title: "Monthly Reflection Draft", xp: 20 }
      ]},
      daily: { title: "Daily Systems", items: [
        { title: "Morning Routine Complete", xp: 10 },
        { title: "Deep Work Block (60 min)", xp: 40 },
        { title: "Evening Reflection", xp: 10 }
      ]},
      weekly: { title: "Weekly Systems", items: [
        { title: "Weekly Review", xp: 20 },
        { title: "Academic Progress Check", xp: 25 }
      ]},
      monthly: { title: "Monthly Systems", items: [
        { title: "Monthly Ecosystem Review", xp: 30 },
        { title: "PhD Direction Check-in", xp: 30 }
      ]}
    },
    shop: [
      { id: "cloak", name: "Akatsuki Cloak", cost: 100, emoji: "🧥", type: "gear" },
      { id: "ring", name: "Akatsuki Ring", cost: 60, emoji: "💍", type: "gear" },
      { id: "mask", name: "Anbu Mask", cost: 80, emoji: "🎭", type: "gear" },
      { id: "summon", name: "Summon Raven Companion", cost: 120, emoji: "🐦", type: "companion" }
    ],
    avatarDefaults: { name: "Rogue Scholar", title: "Akatsuki Initiate", gear: [], emoji: "🕶️" }
  };

  // ---------- State ----------
  const state = {
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
    sections: null, // object
    shop: [],
    avatar: null
  };

  // ---------- DOM refs ----------
  const sidebar = document.getElementById('sidebar');
  const menuToggle = document.getElementById('menu-toggle');
  const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
  const tabContents = Array.from(document.querySelectorAll('.tab-content'));
  const xpFill = document.getElementById('xp-fill');
  const levelDisplay = document.getElementById('level-display');
  const xpNext = document.getElementById('xp-next');
  const xpPercent = document.getElementById('xp-percent');
  const shopItemsEl = document.getElementById('shop-items');
  const avatarVisual = document.getElementById('avatar-visual');
  const avatarNameEl = document.getElementById('avatar-name');
  const avatarTitleEl = document.getElementById('avatar-title');
  const avatarGearEl = document.getElementById('avatar-gear');
  const avatarNameInput = document.getElementById('avatar-name-input');
  const saveAvatarBtn = document.getElementById('save-avatar');
  const emojiBtns = Array.from(document.querySelectorAll('.emoji-btn'));
  const addGlobalTaskBtn = document.getElementById('add-global-task');
  const resetProgressBtn = document.getElementById('reset-progress');

  // ---------- Helpers ----------
  function safeParseJSON(str) {
    try { return JSON.parse(str); } catch (e) { return null; }
  }

  function saveAll() {
    localStorage.setItem(STORAGE_KEYS.xp, String(state.xp));
    localStorage.setItem(STORAGE_KEYS.level, String(state.level));
    localStorage.setItem(STORAGE_KEYS.coins, String(state.coins));
    localStorage.setItem(STORAGE_KEYS.streak, String(state.streak));
    localStorage.setItem(STORAGE_KEYS.sections, JSON.stringify(state.sections));
    localStorage.setItem(STORAGE_KEYS.shop, JSON.stringify(state.shop));
    localStorage.setItem(STORAGE_KEYS.avatar, JSON.stringify(state.avatar));
  }

  function loadAll() {
    const xp = parseInt(localStorage.getItem(STORAGE_KEYS.xp));
    if (!Number.isNaN(xp)) state.xp = xp;
    const level = parseInt(localStorage.getItem(STORAGE_KEYS.level));
    if (!Number.isNaN(level)) state.level = level;
    const coins = parseInt(localStorage.getItem(STORAGE_KEYS.coins));
    if (!Number.isNaN(coins)) state.coins = coins;
    const streak = parseInt(localStorage.getItem(STORAGE_KEYS.streak));
    if (!Number.isNaN(streak)) state.streak = streak;

    const sections = safeParseJSON(localStorage.getItem(STORAGE_KEYS.sections));
    if (sections && typeof sections === 'object') state.sections = sections;

    const shop = safeParseJSON(localStorage.getItem(STORAGE_KEYS.shop));
    if (Array.isArray(shop)) state.shop = shop;

    const avatar = safeParseJSON(localStorage.getItem(STORAGE_KEYS.avatar));
    if (avatar && typeof avatar === 'object') state.avatar = avatar;
  }

  function levelFromXp(xp) { return Math.floor(xp / XP_PER_LEVEL) + 1; }
  function xpToNext(xp) { return XP_PER_LEVEL - (xp % XP_PER_LEVEL); }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function showToast(text, ms = 2000) {
    const t = document.createElement('div');
    t.textContent = text;
    Object.assign(t.style, {
      position: 'fixed', right: '18px', bottom: '18px',
      background: 'linear-gradient(180deg, rgba(179,0,0,0.95), rgba(179,0,0,0.8))',
      color: '#fff', padding: '10px 14px', borderRadius: '10px', zIndex: 9999, boxShadow: '0 10px 30px rgba(0,0,0,0.6)'
    });
    document.body.appendChild(t);
    setTimeout(()=>{ t.style.transition='opacity 300ms ease'; t.style.opacity='0'; }, ms);
    setTimeout(()=>t.remove(), ms + 400);
  }

  // ---------- Data loading ----------
  function loadGameData() {
    // Try fetch game-data.json; if fails, use fallback
    return fetch('game-data.json', { cache: 'no-store' })
      .then(r => {
        if (!r.ok) throw new Error('no json');
        return r.json();
      })
      .then(data => {
        // Use JSON but do not overwrite saved sections if present
        const jsonSections = data.sections || FALLBACK.sections;
        const jsonShop = data.shop || FALLBACK.shop;
        const jsonAvatar = data.avatarDefaults || FALLBACK.avatarDefaults;

        // If user has saved sections, keep them (prevents regeneration)
        const savedSections = safeParseJSON(localStorage.getItem(STORAGE_KEYS.sections));
        state.sections = (savedSections && typeof savedSections === 'object') ? savedSections : jsonSections;

        // Shop: if saved shop exists, keep it; otherwise use json
        const savedShop = safeParseJSON(localStorage.getItem(STORAGE_KEYS.shop));
        state.shop = (Array.isArray(savedShop) && savedShop.length>0) ? savedShop : jsonShop;

        // Avatar: if saved avatar exists, keep it; otherwise use json defaults
        const savedAvatar = safeParseJSON(localStorage.getItem(STORAGE_KEYS.avatar));
        state.avatar = (savedAvatar && typeof savedAvatar === 'object') ? savedAvatar : jsonAvatar;
      })
      .catch(() => {
        // fallback
        state.sections = state.sections || FALLBACK.sections;
        state.shop = state.shop && state.shop.length ? state.shop : FALLBACK.shop;
        state.avatar = state.avatar || FALLBACK.avatarDefaults;
      });
  }

  // ---------- Rendering ----------
  function updateUI() {
    state.level = levelFromXp(state.xp);
    // header
    if (levelDisplay) levelDisplay.textContent = `Level: ${state.level} | XP: ${state.xp} | 💰 Coins: ${state.coins} | 🔥 Streak: ${state.streak} days`;
    // xp bar
    if (xpFill) {
      const inLevel = state.xp % XP_PER_LEVEL;
      const pct = Math.round((inLevel / XP_PER_LEVEL) * 100);
      xpFill.style.width = pct + '%';
      if (xpNext) xpNext.textContent = `${xpToNext(state.xp)} XP to next level`;
      if (xpPercent) xpPercent.textContent = `${pct}%`;
    }
    renderAvatar();
    renderShop();
    renderSections();
    saveAll();
  }

  function renderSections() {
    Object.keys(state.sections).forEach(sectionId => {
      const container = document.getElementById(sectionId);
      if (!container) return;
      const sec = state.sections[sectionId];
      container.innerHTML = '';

      // header
      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `<h2>${escapeHtml(sec.title || sectionId)}</h2>
        <div class="controls">
          <button data-section="${sectionId}" class="add-task-section">+ Add</button>
          <button data-section="${sectionId}" class="shuffle-section" title="Shuffle tasks">🔀</button>
        </div>`;
      container.appendChild(header);

      // list
      const list = document.createElement('div');
      list.className = 'task-list';
      if (!Array.isArray(sec.items) || sec.items.length === 0) {
        const empty = document.createElement('div');
        empty.style.color = 'var(--muted)';
        empty.style.padding = '12px';
        empty.textContent = 'No tasks in this section. Add a custom task or complete other tasks to earn XP.';
        list.appendChild(empty);
      } else {
        sec.items.forEach((task, idx) => {
          const t = document.createElement('div');
          t.className = 'task';
          t.innerHTML = `
            <div class="left">
              <div class="title">${escapeHtml(task.title)}</div>
              <div class="meta">${task.xp} XP</div>
            </div>
            <div class="right">
              <button class="complete-btn" data-section="${sectionId}" data-index="${idx}">Complete</button>
            </div>
          `;
          list.appendChild(t);
        });
      }
      container.appendChild(list);
    });

    // attach listeners
    document.querySelectorAll('.complete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        const idx = Number(btn.dataset.index);
        completeTask(sec, idx);
      });
    });
    document.querySelectorAll('.add-task-section').forEach(btn => {
      btn.addEventListener('click', () => {
        addCustomTaskToSection(btn.dataset.section);
      });
    });
    document.querySelectorAll('.shuffle-section').forEach(btn => {
      btn.addEventListener('click', () => {
        shuffleSection(btn.dataset.section);
      });
    });
  }

  function renderShop() {
    if (!shopItemsEl) return;
    shopItemsEl.innerHTML = '';
    state.shop.forEach(item => {
      const div = document.createElement('div');
      div.className = 'shop-item';
      const owned = state.avatar.gear && state.avatar.gear.includes(item.id);
      div.innerHTML = `
        <h3>${item.emoji} ${escapeHtml(item.name)}</h3>
        <p>Cost: ${item.cost} coins</p>
        <button ${owned ? 'disabled' : ''} data-item="${item.id}">${owned ? 'Owned' : 'Buy'}</button>
      `;
      shopItemsEl.appendChild(div);
    });
    shopItemsEl.querySelectorAll('button[data-item]').forEach(btn => {
      btn.addEventListener('click', () => buyItem(btn.dataset.item));
    });
  }

  function renderAvatar() {
    if (!avatarVisual) return;
    avatarVisual.textContent = state.avatar.emoji || '🕶️';
    avatarNameEl.textContent = `Name: ${state.avatar.name || 'Rogue Scholar'}`;
    avatarTitleEl.textContent = `Title: ${state.avatar.title || 'Akatsuki Initiate'}`;
    if (state.avatar.gear && state.avatar.gear.length > 0) {
      const names = state.avatar.gear.map(id => {
        const it = state.shop.find(s => s.id === id);
        return it ? it.name : id;
      });
      avatarGearEl.textContent = 'Gear: ' + names.join(', ');
    } else {
      avatarGearEl.textContent = 'Gear: None';
    }
  }

  // ---------- Actions ----------
  function completeTask(sectionId, index) {
    const sec = state.sections[sectionId];
    if (!sec || !Array.isArray(sec.items) || !sec.items[index]) return;
    const task = sec.items[index];
    const xpGain = Number(task.xp) || 0;
    state.xp += xpGain;
    state.coins += Math.round(xpGain * 0.5); // coins = half xp
    sec.items.splice(index, 1);

    const newLevel = levelFromXp(state.xp);
    if (newLevel > state.level) {
      // level up bonus
      const levelsGained = newLevel - state.level;
      state.coins += 10 * levelsGained;
      flashLevelUp(newLevel);
    }
    state.level = newLevel;
    updateUI();
  }

  function buyItem(itemId) {
    const item = state.shop.find(i => i.id === itemId);
    if (!item) return showToast('Item not found');
    if (state.coins < item.cost) return showToast('Not enough coins');
    state.coins -= item.cost;
    if (!Array.isArray(state.avatar.gear)) state.avatar.gear = [];
    if (!state.avatar.gear.includes(itemId)) state.avatar.gear.push(itemId);
    updateUI();
    showToast(`Purchased ${item.name}`);
  }

  function addCustomTaskToSection(sectionId) {
    const title = prompt('Enter task title:');
    if (!title) return;
    const xp = parseInt(prompt('XP value (default 10):', '10')) || 10;
    if (!state.sections[sectionId]) state.sections[sectionId] = { title: sectionId, items: [] };
    state.sections[sectionId].items.push({ title: title.trim(), xp });
    updateUI();
    showToast('Task added');
  }

  function addGlobalCustomTask() {
    const keys = Object.keys(state.sections);
    const choice = prompt('Add to which section? Options: ' + keys.join(', '), keys[0]);
    if (!choice || !state.sections[choice]) return showToast('Invalid section');
    addCustomTaskToSection(choice);
  }

  function shuffleSection(sectionId) {
    const arr = state.sections[sectionId].items;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    updateUI();
    showToast('Shuffled tasks');
  }

  function resetProgress() {
    if (!confirm('Reset all progress and local data? This cannot be undone.')) return;
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  // ---------- UI helpers ----------
  function flashLevelUp(newLevel) {
    levelDisplay.style.transition = 'transform 220ms ease, color 220ms ease';
    levelDisplay.style.transform = 'scale(1.06)';
    levelDisplay.style.color = '#fff';
    setTimeout(() => { levelDisplay.style.transform = ''; levelDisplay.style.color = ''; }, 700);
    showToast(`Level Up! You reached level ${newLevel} — bonus coins awarded`);
  }

  // ---------- Tabs & sidebar ----------
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        tabContents.forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById(target);
        if (el) el.classList.add('active');
        setTimeout(() => el && el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
      });
    });
    // default
    if (tabButtons.length) tabButtons[0].click();
  }

  function setupSidebarToggle() {
    // restore saved state
    const hidden = localStorage.getItem(STORAGE_KEYS.sidebarHidden) === '1';
    if (hidden) sidebar.classList.add('hidden');
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      localStorage.setItem(STORAGE_KEYS.sidebarHidden, sidebar.classList.contains('hidden') ? '1' : '0');
    });
    // keyboard shortcut
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sidebar.classList.toggle('hidden');
        localStorage.setItem(STORAGE_KEYS.sidebarHidden, sidebar.classList.contains('hidden') ? '1' : '0');
      }
    });
  }

  function setupAvatarControls() {
    if (saveAvatarBtn) {
      saveAvatarBtn.addEventListener('click', () => {
        const name = avatarNameInput.value.trim();
        if (name) state.avatar.name = name;
        updateUI();
        showToast('Avatar saved');
      });
    }
    emojiBtns.forEach(b => {
      b.addEventListener('click', () => {
        state.avatar.emoji = b.textContent.trim();
        updateUI();
      });
    });
  }

  // ---------- Init ----------
  function init() {
    // load saved state first
    loadAll();
    // load game-data.json and merge with saved state
    loadGameData().then(() => {
      // ensure sections exist
      if (!state.sections) state.sections = FALLBACK.sections;
      if (!state.shop || state.shop.length === 0) state.shop = FALLBACK.shop;
      if (!state.avatar) state.avatar = FALLBACK.avatarDefaults;

      // wire UI
      setupTabs();
      setupSidebarToggle();
      setupAvatarControls();

      // global actions
      if (addGlobalTaskBtn) addGlobalTaskBtn.addEventListener('click', addGlobalCustomTask);
      if (resetProgressBtn) resetProgressBtn.addEventListener('click', resetProgress);

      // initial render
      updateUI();
    });
  }

  // Expose for debugging
  window.AK = {
    state,
    saveAll,
    loadAll,
    updateUI,
    completeTask,
    buyItem,
    addCustomTaskToSection
  };

  // Run
  init();
})();
