/* script.js — Akatsuki PhD Quest RPG (v3.1)
   - Adds Bank tasks with steps (partial XP per step)
   - Shop items apply appearance changes and small bonuses
   - Avatar rendered as a composed inline SVG with overlays
   - Steps persist; completing steps awards partial XP/coins
   - Bank tasks can be imported into sections as full tasks
*/

(() => {
  const XP_PER_LEVEL = 150;
  const STORAGE = {
    xp: 'ak_xp',
    level: 'ak_level',
    coins: 'ak_coins',
    streak: 'ak_streak',
    sections: 'ak_sections',
    shop: 'ak_shop',
    avatar: 'ak_avatar',
    bank: 'ak_bank',
    sidebarHidden: 'ak_sidebar_hidden'
  };

  // DOM refs
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

  // State
  const state = {
    xp: 0,
    level: 1,
    coins: 0,
    streak: 0,
    sections: null,
    shop: [],
    avatar: null,
    bank: null
  };

  // Helpers
  const safeJSON = s => { try { return JSON.parse(s); } catch(e){ return null; } };
  const save = () => {
    localStorage.setItem(STORAGE.xp, String(state.xp));
    localStorage.setItem(STORAGE.level, String(state.level));
    localStorage.setItem(STORAGE.coins, String(state.coins));
    localStorage.setItem(STORAGE.streak, String(state.streak));
    localStorage.setItem(STORAGE.sections, JSON.stringify(state.sections));
    localStorage.setItem(STORAGE.shop, JSON.stringify(state.shop));
    localStorage.setItem(STORAGE.avatar, JSON.stringify(state.avatar));
    localStorage.setItem(STORAGE.bank, JSON.stringify(state.bank));
  };
  const load = () => {
    const xp = parseInt(localStorage.getItem(STORAGE.xp)); if(!Number.isNaN(xp)) state.xp = xp;
    const level = parseInt(localStorage.getItem(STORAGE.level)); if(!Number.isNaN(level)) state.level = level;
    const coins = parseInt(localStorage.getItem(STORAGE.coins)); if(!Number.isNaN(coins)) state.coins = coins;
    const streak = parseInt(localStorage.getItem(STORAGE.streak)); if(!Number.isNaN(streak)) state.streak = streak;
    const sections = safeJSON(localStorage.getItem(STORAGE.sections)); if(sections) state.sections = sections;
    const shop = safeJSON(localStorage.getItem(STORAGE.shop)); if(Array.isArray(shop)) state.shop = shop;
    const avatar = safeJSON(localStorage.getItem(STORAGE.avatar)); if(avatar) state.avatar = avatar;
    const bank = safeJSON(localStorage.getItem(STORAGE.bank)); if(bank) state.bank = bank;
  };

  const levelFromXp = xp => Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpToNext = xp => XP_PER_LEVEL - (xp % XP_PER_LEVEL);
  const escapeHtml = s => String(s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  // Load game-data.json (bank + sections + shop + avatarDefaults)
  function loadGameData() {
    return fetch('game-data.json', { cache: 'no-store' })
      .then(r => { if(!r.ok) throw new Error('no json'); return r.json(); })
      .then(data => {
        // bank
        state.bank = data.bank || data.sections?.bank || state.bank || { items: [] };
        // sections: prefer saved sections (prevents regeneration)
        const savedSections = safeJSON(localStorage.getItem(STORAGE.sections));
        state.sections = savedSections || data.sections || state.sections || {};
        // shop
        const savedShop = safeJSON(localStorage.getItem(STORAGE.shop));
        state.shop = (Array.isArray(savedShop) && savedShop.length) ? savedShop : (data.shop || state.shop || []);
        // avatar
        const savedAvatar = safeJSON(localStorage.getItem(STORAGE.avatar));
        state.avatar = savedAvatar || data.avatarDefaults || state.avatar || { name: 'Rogue Scholar', title: 'Akatsuki Initiate', appearance: {} };
      })
      .catch(() => {
        // if fetch fails, keep whatever is in state (or fallback minimal)
        state.bank = state.bank || { items: [] };
        state.sections = state.sections || {};
        state.shop = state.shop || [];
        state.avatar = state.avatar || { name: 'Rogue Scholar', title: 'Akatsuki Initiate', appearance: {} };
      });
  }

  // UI rendering
  function updateUI() {
    state.level = levelFromXp(state.xp);
    if (levelDisplay) levelDisplay.textContent = `Level: ${state.level} | XP: ${state.xp} | 💰 Coins: ${state.coins} | 🔥 Streak: ${state.streak} days`;
    const inLevel = state.xp % XP_PER_LEVEL;
    const pct = Math.round((inLevel / XP_PER_LEVEL) * 100);
    if (xpFill) xpFill.style.width = pct + '%';
    if (xpNext) xpNext.textContent = `${xpToNext(state.xp)} XP to next level`;
    if (xpPercent) xpPercent.textContent = `${pct}%`;

    renderAvatar();
    renderShop();
    renderBank();
    renderSections();
    save();
  }

  // Render bank (templates)
  function renderBank() {
    // create or find a bank container in content area; if not present, create a temporary panel at top of content
    let bankPanel = document.getElementById('bank-panel');
    if (!bankPanel) {
      bankPanel = document.createElement('section');
      bankPanel.id = 'bank-panel';
      bankPanel.className = 'tab-content active';
      bankPanel.innerHTML = `<div class="section-header"><h2>Task Bank</h2><div class="controls"><div style="color:var(--muted)">Import templates into sections</div></div></div><div id="bank-items" class="task-list"></div>`;
      const content = document.getElementById('content');
      content.insertBefore(bankPanel, content.firstChild);
      // add a sidebar button if not present
      if (!document.querySelector('.tab-btn[data-target="bank"]')) {
        const btn = document.createElement('button');
        btn.className = 'tab-btn';
        btn.dataset.target = 'bank';
        btn.textContent = 'Bank';
        const nav = document.querySelector('#sidebar .menu-group');
        if (nav) nav.insertBefore(btn, nav.firstChild);
        btn.addEventListener('click', () => {
          tabButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          tabContents.forEach(tc => tc.classList.remove('active'));
          bankPanel.classList.add('active');
        });
        tabButtons.push(btn);
      }
    }

    const bankItemsEl = document.getElementById('bank-items');
    bankItemsEl.innerHTML = '';
    const items = (state.bank && state.bank.items) ? state.bank.items : [];
    items.forEach((t, idx) => {
      const div = document.createElement('div');
      div.className = 'task';
      // steps count
      const stepsCount = Array.isArray(t.steps) ? t.steps.length : 0;
      div.innerHTML = `
        <div class="left">
          <div style="display:flex;flex-direction:column;">
            <div class="title">${escapeHtml(t.title)} <span style="color:var(--muted);font-weight:600;font-size:0.85rem">(${t.xp} XP)</span></div>
            <div class="meta">${escapeHtml(t.notes || '')}</div>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div style="display:flex;gap:6px">
            <button class="import-bank" data-index="${idx}">Import</button>
            <button class="toggle-steps" data-index="${idx}">Steps ▾</button>
          </div>
          <div style="font-size:0.85rem;color:var(--muted)">${stepsCount} steps</div>
        </div>
      `;
      bankItemsEl.appendChild(div);

      // steps panel
      const stepsPanel = document.createElement('div');
      stepsPanel.className = 'task-steps';
      stepsPanel.style.display = 'none';
      stepsPanel.style.marginTop = '8px';
      stepsPanel.style.padding = '8px';
      stepsPanel.style.borderRadius = '8px';
      stepsPanel.style.background = 'rgba(255,255,255,0.02)';
      if (Array.isArray(t.steps) && t.steps.length) {
        t.steps.forEach((s, si) => {
          const stepRow = document.createElement('div');
          stepRow.style.display = 'flex';
          stepRow.style.justifyContent = 'space-between';
          stepRow.style.alignItems = 'center';
          stepRow.style.padding = '6px 0';
          stepRow.innerHTML = `<div style="color:#fff">${escapeHtml(s.title)} <span style="color:var(--muted);font-size:0.9rem">(${s.xp} XP)</span></div>
            <div><button class="preview-step" data-bank="${idx}" data-step="${si}">Preview</button></div>`;
          stepsPanel.appendChild(stepRow);
        });
      } else {
        stepsPanel.innerHTML = `<div style="color:var(--muted)">No steps defined.</div>`;
      }
      div.appendChild(stepsPanel);
    });

    // attach listeners
    bankItemsEl.querySelectorAll('.toggle-steps').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        const parent = btn.closest('.task');
        const panel = parent.querySelector('.task-steps');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    });

    bankItemsEl.querySelectorAll('.import-bank').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.index);
        importBankTask(idx);
      });
    });

    bankItemsEl.querySelectorAll('.preview-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const b = Number(btn.dataset.bank);
        const s = Number(btn.dataset.step);
        previewBankStep(b, s);
      });
    });
  }

  // Import a bank task into a section (user chooses section)
  function importBankTask(bankIndex) {
    const bank = state.bank && state.bank.items && state.bank.items[bankIndex];
    if (!bank) return showToast('Bank task not found');
    const keys = Object.keys(state.sections);
    const choice = prompt('Import into which section? Options: ' + keys.join(', '), keys[0]);
    if (!choice || !state.sections[choice]) return showToast('Invalid section');
    // clone the bank task into the section (preserve steps)
    const newTask = JSON.parse(JSON.stringify(bank));
    // ensure unique id
    newTask.id = `${newTask.id || 'banktask'}_${Date.now()}`;
    if (!Array.isArray(state.sections[choice].items)) state.sections[choice].items = [];
    state.sections[choice].items.push(newTask);
    updateUI();
    showToast(`Imported "${bank.title}" into ${state.sections[choice].title}`);
  }

  function previewBankStep(bankIndex, stepIndex) {
    const bank = state.bank && state.bank.items && state.bank.items[bankIndex];
    if (!bank || !Array.isArray(bank.steps) || !bank.steps[stepIndex]) return;
    const step = bank.steps[stepIndex];
    alert(`Step: ${step.title}\nXP: ${step.xp}\n\nNotes: ${bank.notes || ''}`);
  }

  // Render sections (tasks with steps)
  function renderSections() {
    Object.keys(state.sections).forEach(sectionId => {
      const container = document.getElementById(sectionId);
      if (!container) return;
      const sec = state.sections[sectionId];
      container.innerHTML = '';
      const header = document.createElement('div');
      header.className = 'section-header';
      header.innerHTML = `<h2>${escapeHtml(sec.title)}</h2>
        <div class="controls">
          <button data-section="${sectionId}" class="add-task-section">+ Add</button>
          <button data-section="${sectionId}" class="shuffle-section">🔀</button>
        </div>`;
      container.appendChild(header);

      const list = document.createElement('div');
      list.className = 'task-list';
      if (!Array.isArray(sec.items) || sec.items.length === 0) {
        const empty = document.createElement('div');
        empty.style.color = 'var(--muted)';
        empty.style.padding = '12px';
        empty.textContent = 'No tasks in this section. Import from the Bank or add a custom task.';
        list.appendChild(empty);
      } else {
        sec.items.forEach((task, tIndex) => {
          const t = document.createElement('div');
          t.className = 'task';
          // show if task has steps
          const hasSteps = Array.isArray(task.steps) && task.steps.length > 0;
          t.innerHTML = `
            <div class="left">
              <div style="display:flex;flex-direction:column;">
                <div class="title">${escapeHtml(task.title)} ${hasSteps ? '<span style="color:var(--muted);font-weight:600;font-size:0.85rem">[steps]</span>' : ''}</div>
                <div class="meta">${escapeHtml(task.notes || '')}</div>
              </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
              <div style="display:flex;gap:6px">
                ${hasSteps ? `<button class="toggle-task-steps" data-section="${sectionId}" data-index="${tIndex}">Steps ▾</button>` : `<button class="complete-btn" data-section="${sectionId}" data-index="${tIndex}">Complete</button>`}
                <button class="remove-task" data-section="${sectionId}" data-index="${tIndex}">Delete</button>
              </div>
              <div style="font-size:0.85rem;color:var(--muted)">${task.xp || 0} XP</div>
            </div>
          `;
          list.appendChild(t);

          // steps panel (if any)
          if (hasSteps) {
            const stepsPanel = document.createElement('div');
            stepsPanel.className = 'task-steps';
            stepsPanel.style.display = 'none';
            stepsPanel.style.marginTop = '8px';
            stepsPanel.style.padding = '8px';
            stepsPanel.style.borderRadius = '8px';
            stepsPanel.style.background = 'rgba(255,255,255,0.02)';
            // track step completion per task in localStorage: key = ak_steps_<taskId>
            const stepStateKey = `ak_steps_${task.id || (sectionId + '_' + tIndex)}`;
            const savedSteps = safeJSON(localStorage.getItem(stepStateKey)) || [];
            task.steps.forEach((s, si) => {
              const done = !!savedSteps[si];
              const row = document.createElement('div');
              row.style.display = 'flex';
              row.style.justifyContent = 'space-between';
              row.style.alignItems = 'center';
              row.style.padding = '6px 0';
              row.innerHTML = `<div style="color:${done ? '#9fd79f' : '#fff'}">${escapeHtml(s.title)} <span style="color:var(--muted);font-size:0.9rem">(${s.xp} XP)</span></div>
                <div><button class="step-btn" data-section="${sectionId}" data-task="${tIndex}" data-step="${si}">${done ? '✓' : 'Do'}</button></div>`;
              stepsPanel.appendChild(row);
            });
            t.appendChild(stepsPanel);
          }
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
    document.querySelectorAll('.remove-task').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        const idx = Number(btn.dataset.index);
        if (!confirm('Delete this task?')) return;
        state.sections[sec].items.splice(idx, 1);
        updateUI();
      });
    });
    document.querySelectorAll('.add-task-section').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        addCustomTaskToSection(sec);
      });
    });
    document.querySelectorAll('.shuffle-section').forEach(btn => {
      btn.addEventListener('click', () => {
        shuffleSection(btn.dataset.section);
      });
    });
    // toggle steps
    document.querySelectorAll('.toggle-task-steps').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        const idx = Number(btn.dataset.index);
        const container = document.getElementById(sec);
        const taskEl = container.querySelectorAll('.task')[idx];
        const panel = taskEl.querySelector('.task-steps');
        if (!panel) return;
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    });
    // step buttons
    document.querySelectorAll('.step-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = btn.dataset.section;
        const tIndex = Number(btn.dataset.task);
        const sIndex = Number(btn.dataset.step);
        completeStep(sec, tIndex, sIndex);
      });
    });
  }

  // Complete a whole task (no steps)
  function completeTask(sectionId, index) {
    const sec = state.sections[sectionId];
    if (!sec || !Array.isArray(sec.items) || !sec.items[index]) return;
    const task = sec.items[index];
    const xpGain = Number(task.xp) || 0;
    state.xp += xpGain;
    state.coins += Math.round(xpGain * 0.5);
    sec.items.splice(index, 1);
    const newLevel = levelFromXp(state.xp);
    if (newLevel > state.level) {
      state.coins += 10 * (newLevel - state.level);
      flashLevelUp(newLevel);
    }
    state.level = newLevel;
    updateUI();
  }

  // Complete a step inside a task
  function completeStep(sectionId, taskIndex, stepIndex) {
    const sec = state.sections[sectionId];
    if (!sec || !Array.isArray(sec.items) || !sec.items[taskIndex]) return;
    const task = sec.items[taskIndex];
    if (!Array.isArray(task.steps) || !task.steps[stepIndex]) return;
    const step = task.steps[stepIndex];
    // step state key
    const stepStateKey = `ak_steps_${task.id || (sectionId + '_' + taskIndex)}`;
    const saved = safeJSON(localStorage.getItem(stepStateKey)) || [];
    if (saved[stepIndex]) return showToast('Step already completed');
    // award xp and coins for step
    const xpGain = Number(step.xp) || 0;
    state.xp += xpGain;
    state.coins += Math.round(xpGain * 0.5);
    saved[stepIndex] = true;
    localStorage.setItem(stepStateKey, JSON.stringify(saved));
    // check if all steps done -> remove task and clear step state
    const allDone = task.steps.every((_, i) => saved[i]);
    if (allDone) {
      // remove task
      sec.items.splice(taskIndex, 1);
      localStorage.removeItem(stepStateKey);
      showToast(`Task "${task.title}" completed`);
    } else {
      showToast(`Step completed (+${xpGain} XP)`);
    }
    const newLevel = levelFromXp(state.xp);
    if (newLevel > state.level) {
      state.coins += 10 * (newLevel - state.level);
      flashLevelUp(newLevel);
    }
    state.level = newLevel;
    updateUI();
    // if avatar has companion xpSparkle, show small sparkle
    if (state.avatar && state.avatar.appearance && state.avatar.appearance.companion && state.shop.find(i => i.id === 'summon')) {
      showSparkle();
    }
  }

  // Shop
  function renderShop() {
    if (!shopItemsEl) return;
    shopItemsEl.innerHTML = '';
    state.shop.forEach(item => {
      const div = document.createElement('div');
      div.className = 'shop-item';
      const owned = state.avatar.gear && state.avatar.gear.includes(item.id);
      div.innerHTML = `
        <h3>${item.emoji} ${escapeHtml(item.name)}</h3>
        <p>${escapeHtml(item.description || '')}</p>
        <p>Cost: ${item.cost} coins</p>
        <button ${owned ? 'disabled' : ''} data-item="${item.id}">${owned ? 'Owned' : 'Buy'}</button>
      `;
      shopItemsEl.appendChild(div);
    });
    shopItemsEl.querySelectorAll('button[data-item]').forEach(btn => {
      btn.addEventListener('click', () => buyItem(btn.dataset.item));
    });
  }

  function buyItem(itemId) {
    const item = state.shop.find(i => i.id === itemId);
    if (!item) return showToast('Item not found');
    if (state.coins < item.cost) return showToast('Not enough coins');
    state.coins -= item.cost;
    if (!Array.isArray(state.avatar.gear)) state.avatar.gear = [];
    if (!state.avatar.gear.includes(itemId)) state.avatar.gear.push(itemId);
    // apply effect if present
    if (item.effect && item.effect.appearance) {
      state.avatar.appearance = Object.assign({}, state.avatar.appearance, item.effect.appearance);
    }
    // small bonus handling (streak bonus etc.) — store in avatar.bonuses
    if (item.effect && item.effect.bonus) {
      state.avatar.bonuses = Object.assign({}, state.avatar.bonuses || {}, item.effect.bonus);
    }
    updateUI();
    showToast(`Purchased ${item.name}`);
  }

  // Avatar rendering: composed inline SVG
  function renderAvatar() {
    // Build a small SVG character using avatar.appearance
    const ap = state.avatar.appearance || {};
    const skin = ap.skin || '#f2d7c9';
    const hair = ap.hair || 'short';
    const outfit = ap.outfit || 'default';
    const accent = ap.accentColor || '#b30000';
    const accessory = ap.accessory || null;
    const faceMask = ap.faceMask || null;
    const companion = ap.companion || null;
    const handItem = ap.handItem || null;

    // Create SVG markup
    const svg = `
      <svg width="160" height="200" viewBox="0 0 160 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeHtml(state.avatar.name || '')}">
        <defs>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#000" flood-opacity="0.35"/></filter>
        </defs>
        <!-- background circle -->
        <rect x="0" y="0" width="160" height="200" rx="12" fill="transparent"/>
        <!-- body -->
        <g transform="translate(0,10)">
          <!-- outfit -->
          <rect x="30" y="90" width="100" height="70" rx="12" fill="${outfit === 'cloak' ? '#2b0b0b' : '#1a1a1a'}" stroke="${accent}" stroke-width="2" filter="url(#soft)"/>
          <!-- head -->
          <circle cx="80" cy="60" r="30" fill="${skin}" stroke="#00000010" stroke-width="1"/>
          <!-- hair -->
          ${hair === 'short' ? `<path d="M50 50 q30 -30 60 0 q-10 -18 -60 0" fill="#2b1b1b"/>` : `<path d="M50 45 q30 -40 60 0 q-10 -10 -60 0" fill="#2b1b1b"/>`}
          <!-- eyes -->
          <circle cx="70" cy="60" r="3" fill="#111"/>
          <circle cx="90" cy="60" r="3" fill="#111"/>
          <!-- mask overlay -->
          ${faceMask === 'anbu' ? `<rect x="60" y="52" width="40" height="16" rx="6" fill="#111" opacity="0.95"/>` : ''}
          <!-- accessory (ring/ dagger shown as small icon near body) -->
          ${accessory === 'dagger' ? `<rect x="110" y="120" width="10" height="30" rx="3" fill="#666"/>` : ''}
          ${handItem === 'notebook' ? `<rect x="40" y="120" width="28" height="20" rx="3" fill="#6b4f2b"/>` : ''}
          <!-- companion -->
          ${companion === 'raven' ? `<g transform="translate(120,40) scale(0.7)"><path d="M0 10 q10 -10 20 0 q-6 -4 -12 0 q6 4 12 0" fill="#111"/></g>` : ''}
        </g>
      </svg>
    `;
    avatarVisual.innerHTML = svg;
    avatarNameEl.textContent = `Name: ${state.avatar.name || 'Rogue Scholar'}`;
    avatarTitleEl.textContent = `Title: ${state.avatar.title || 'Akatsuki Initiate'}`;
    if (state.avatar.gear && state.avatar.gear.length) {
      const names = state.avatar.gear.map(id => {
        const it = state.shop.find(s => s.id === id);
        return it ? it.name : id;
      });
      avatarGearEl.textContent = 'Gear: ' + names.join(', ');
    } else {
      avatarGearEl.textContent = 'Gear: None';
    }
  }

  // Small sparkle animation when companion present
  function showSparkle() {
    const s = document.createElement('div');
    s.textContent = '✨';
    Object.assign(s.style, { position: 'fixed', right: '120px', bottom: '120px', fontSize: '28px', zIndex: 9999 });
    document.body.appendChild(s);
    setTimeout(() => s.remove(), 900);
  }

  // Add custom task
  function addCustomTaskToSection(sectionId) {
    const title = prompt('Enter task title:');
    if (!title) return;
    const xp = parseInt(prompt('XP value (default 10):', '10')) || 10;
    const hasSteps = confirm('Does this task have steps? OK = yes, Cancel = no');
    const task = { id: `${sectionId}_${Date.now()}`, title: title.trim(), xp, notes: '', steps: [] };
    if (hasSteps) {
      let more = true;
      while (more) {
        const stepTitle = prompt('Step title (leave blank to stop):');
        if (!stepTitle) break;
        const stepXp = parseInt(prompt('Step XP (default 5):', '5')) || 5;
        task.steps.push({ id: `${task.id}_s${task.steps.length}`, title: stepTitle.trim(), xp: stepXp });
        more = confirm('Add another step?');
      }
    }
    if (!state.sections[sectionId]) state.sections[sectionId] = { title: sectionId, items: [] };
    state.sections[sectionId].items.push(task);
    updateUI();
    showToast('Custom task added');
  }

  // Shuffle
  function shuffleSection(sectionId) {
    const arr = state.sections[sectionId].items;
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    updateUI();
    showToast('Shuffled tasks');
  }

  // Reset
  function resetAll() {
    if (!confirm('Reset all progress? This will clear local data.')) return;
    Object.values(STORAGE).forEach(k => localStorage.removeItem(k));
    location.reload();
  }

  // UI helpers
  function flashLevelUp(newLevel) {
    levelDisplay.style.transition = 'transform 220ms ease, color 220ms ease';
    levelDisplay.style.transform = 'scale(1.06)';
    levelDisplay.style.color = '#fff';
    setTimeout(() => { levelDisplay.style.transform = ''; levelDisplay.style.color = ''; }, 700);
    showToast(`Level Up! You reached level ${newLevel} — bonus coins awarded`);
  }
  function showToast(text, ms = 2000) {
    const t = document.createElement('div');
    t.textContent = text;
    Object.assign(t.style, { position: 'fixed', right: '18px', bottom: '18px', background: 'linear-gradient(180deg, rgba(179,0,0,0.95), rgba(179,0,0,0.8))', color: '#fff', padding: '10px 14px', borderRadius: '10px', zIndex: 9999 });
    document.body.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity 300ms ease'; t.style.opacity = '0'; }, ms);
    setTimeout(() => t.remove(), ms + 400);
  }

  // Init UI wiring
  function setupTabs() {
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const target = btn.dataset.target;
        tabContents.forEach(tc => tc.classList.remove('active'));
        const el = document.getElementById(target);
        if (el) el.classList.add('active');
      });
    });
    if (tabButtons.length) tabButtons[0].click();
  }

  function setupSidebarToggle() {
    const hidden = localStorage.getItem(STORAGE.sidebarHidden) === '1';
    if (hidden) sidebar.classList.add('hidden');
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
      localStorage.setItem(STORAGE.sidebarHidden, sidebar.classList.contains('hidden') ? '1' : '0');
    });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'm' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        sidebar.classList.toggle('hidden');
        localStorage.setItem(STORAGE.sidebarHidden, sidebar.classList.contains('hidden') ? '1' : '0');
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
        // also set a simple appearance mapping for emoji choices
        if (state.avatar.emoji === '🧥') state.avatar.appearance.outfit = 'cloak';
        if (state.avatar.emoji === '📚') state.avatar.appearance.handItem = 'notebook';
        if (state.avatar.emoji === '🗡️') state.avatar.appearance.accessory = 'dagger';
        updateUI();
      });
    });
  }

  // Initialization
  function init() {
    // load saved
    load();
    // load game-data.json then merge with saved
    loadGameData().then(() => {
      // ensure defaults
      state.sections = state.sections || {};
      state.shop = state.shop || [];
      state.avatar = state.avatar || { name: 'Rogue Scholar', title: 'Akatsuki Initiate', appearance: {} };
      state.bank = state.bank || { items: [] };

      // wire UI
      setupTabs();
      setupSidebarToggle();
      setupAvatarControls();

      // global actions
      if (addGlobalTaskBtn) addGlobalTaskBtn.addEventListener('click', () => {
        const keys = Object.keys(state.sections);
        const choice = prompt('Add custom task to which section? Options: ' + keys.join(', '), keys[0]);
        if (!choice || !state.sections[choice]) return showToast('Invalid section');
        addCustomTaskToSection(choice);
      });
      if (resetProgressBtn) resetProgressBtn.addEventListener('click', resetAll);

      // initial render
      updateUI();
    });
  }

  // Expose for debugging
  window.AK = { state, save, load, updateUI, completeTask: () => {}, buyItem: () => {}, importBankTask: () => {} };

  // Run
  init();
})();
