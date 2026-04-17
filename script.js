"use strict";

/* ============================================================
   AKATSUKI PH.D QUEST – RPG
   Core game engine: state, data loading, UI, logic
============================================================ */
function initModalSystem() {
  const backdrop = document.querySelector("[data-ak-modal-backdrop]");
  const closeBtn = document.querySelector("[data-ak-modal-close]");

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      backdrop.classList.remove("active");
    });
  }
}

function openModal(title = "Modal", body = "") {
  const backdrop = document.querySelector("[data-ak-modal-backdrop]");
  const titleEl = document.querySelector("[data-ak-modal-title]");
  const bodyEl = document.querySelector("[data-ak-modal-body]");

  titleEl.textContent = title;
  bodyEl.innerHTML = body;

  backdrop.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  initModalSystem();
});

const AK = {
  config: {
    dataFiles: {
      gameData: "game-data.json",
      templates: "mission-templates.json",
      banks: [
        "task-bank-phd.json",
        "task-bank-skool.json",
        "task-bank-curriculum.json",
        "task-bank-ra.json",
        "task-bank-docs.json",
        "task-bank-rituals.json"
      ],
      bossBattles: "boss-battles.json",
      recoveryMissions: "recovery-missions.json",
      miniQuests: "mini-quests.json",
      achievements: "achievements.json",
      shopItems: "shop-items.json",
      avatarLayers: "avatar-layers.json"
    }
  },

  data: {
    rules: null,
    templates: [],
    banks: [],
    bossBattles: [],
    recoveryMissions: [],
    miniQuests: [],
    achievements: [],
    shopItems: [],
    avatarLayers: []
  },

  state: {
    xp: 0,
    coins: 0,
    level: 1,
    streak: 0,
    lastResetDate: null,
    dayCompleted: false,

    activeMissions: [],
    logs: [],
    undoStack: [],
    redoStack: [],

    avatar: {
      name: "Shadow Scholar",
      xpMultiplier: 1.0,
      coinMultiplier: 1.0,
      equipped: [],
      inventory: []
    },

    shop: {
      ownedItemIds: [],
      equippedByType: {}
    }
  },

  els: {},

  /* ================= INIT ================= */

  init() {
    this.cacheElements();
    this.bindGlobalEvents();
    window.AK_DataLoader.loadAll(this)
  .then(() => {
    this.loadStateFromStorage();
    this.ensureDailyReset();
    this.computeLevel();
    this.renderAll();
    this.startResetTimer();
    window.AK = this; // debug handle
      })
      .catch((err) => {
        console.error("Akatsuki init error:", err);
      });
  },

  cacheElements() {
    this.els.headerXpValue = document.querySelector("[data-ak-xp-value]");
    this.els.headerXpNext = document.querySelector("[data-ak-xp-next]");
    this.els.headerXpFill = document.querySelector("[data-ak-xp-bar-fill]");
    this.els.headerLevel = document.querySelector("[data-ak-level]");
    this.els.headerCoins = document.querySelector("[data-ak-coins]");
    this.els.headerStreak = document.querySelector("[data-ak-streak]");
    this.els.headerResetTimer = document.querySelector("[data-ak-reset-timer]");

    this.els.sidebar = document.querySelector("[data-ak-sidebar]");
    this.els.sidebarToggle = document.querySelector("[data-ak-sidebar-toggle]");
    this.els.tabButtons = document.querySelectorAll("[data-ak-tab-target]");
    this.els.tabPanels = document.querySelectorAll("[data-ak-tab-panel]");

    this.els.winTheDayStatus = document.querySelector(
      "[data-ak-win-the-day-status]"
    );
    this.els.statusImportant = document.querySelector(
      "[data-ak-status-important]"
    );
    this.els.statusRitual = document.querySelector("[data-ak-status-ritual]");
    this.els.statusDoc = document.querySelector("[data-ak-status-doc]");
    this.els.dashboardXp = document.querySelector("[data-ak-dashboard-xp]");
    this.els.dashboardCompleted = document.querySelector(
      "[data-ak-dashboard-completed]"
    );
    this.els.dashboardActive = document.querySelector(
      "[data-ak-dashboard-active]"
    );
    this.els.dashboardStreak = document.querySelector(
      "[data-ak-dashboard-streak]"
    );
    this.els.dashboardDocStreak = document.querySelector(
      "[data-ak-dashboard-doc-streak]"
    );
    this.els.dashboardLastReset = document.querySelector(
      "[data-ak-dashboard-last-reset]"
    );

    this.els.activeMissionList = document.querySelector(
      "[data-ak-active-mission-list]"
    );

    this.els.bankMissionList = document.querySelector(
      "[data-ak-bank-mission-list]"
    );

    this.els.genForm = document.querySelector("[data-ak-task-generator-form]");
    this.els.genGoal = document.querySelector("[data-ak-gen-goal]");
    this.els.genDomain = document.querySelector("[data-ak-gen-domain]");
    this.els.genDifficulty = document.querySelector("[data-ak-gen-difficulty]");
    this.els.genHorizon = document.querySelector("[data-ak-gen-horizon]");
    this.els.genType = document.querySelector("[data-ak-gen-type]");
    this.els.genPriority = document.querySelector("[data-ak-gen-priority]");
    this.els.genEnergy = document.querySelector("[data-ak-gen-energy]");
    this.els.genContext = document.querySelector("[data-ak-gen-context]");
    this.els.genGenerate = document.querySelector("[data-ak-gen-generate]");
    this.els.genMissionList = document.querySelector(
      "[data-ak-gen-mission-list]"
    );
    this.els.genAddActive = document.querySelector("[data-ak-gen-add-active]");
    this.els.genSaveTemplate = document.querySelector(
      "[data-ak-gen-save-template]"
    );

    this.els.avatarSvg = document.querySelector("[data-ak-avatar-svg]");
    this.els.avatarNameInput = document.querySelector(
      "[data-ak-avatar-name-input]"
    );
    this.els.avatarXpMult = document.querySelector("[data-ak-avatar-xp-mult]");
    this.els.avatarCoinMult = document.querySelector(
      "[data-ak-avatar-coin-mult]"
    );
    this.els.gearEquippedList = document.querySelector(
      "[data-ak-gear-equipped-list]"
    );
    this.els.gearInventoryList = document.querySelector(
      "[data-ak-gear-inventory-list]"
    );

    this.els.shopItemList = document.querySelector("[data-ak-shop-item-list]");

    this.els.logForm = document.querySelector("[data-ak-log-form]");
    this.els.logText = document.querySelector("[data-ak-log-text]");
    this.els.logSave = document.querySelector("[data-ak-log-save]");
    this.els.logList = document.querySelector("[data-ak-log-list]");

    this.els.dataBanks = document.querySelector("[data-ak-data-banks]");
    this.els.resetDay = document.querySelector("[data-ak-reset-day]");
    this.els.resetAll = document.querySelector("[data-ak-reset-all]");

    this.els.undoButton = document.querySelector("[data-ak-undo-button]");
    this.els.redoButton = document.querySelector("[data-ak-redo-button]");
    this.els.historyList = document.querySelector("[data-ak-history-list]");

    this.els.modalBackdrop = document.querySelector(
      "[data-ak-modal-backdrop]"
    );
    this.els.modal = document.querySelector("[data-ak-modal]");
    this.els.modalTitle = document.querySelector("[data-ak-modal-title]");
    this.els.modalBody = document.querySelector("[data-ak-modal-body]");
    this.els.modalFooter = document.querySelector("[data-ak-modal-footer]");
    this.els.modalClose = document.querySelector("[data-ak-modal-close]");
  },

  bindGlobalEvents() {
    if (this.els.sidebarToggle) {
      this.els.sidebarToggle.addEventListener("click", () =>
        this.toggleSidebar()
      );
    }

    this.els.tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-ak-tab-target");
        this.switchTab(targetId, btn);
      });
    });

    if (this.els.genGenerate) {
      this.els.genGenerate.addEventListener("click", () =>
        this.handleGenerateChain()
      );
    }
    if (this.els.genAddActive) {
      this.els.genAddActive.addEventListener("click", () =>
        this.handleAddGeneratedToActive()
      );
    }
    if (this.els.genSaveTemplate) {
      this.els.genSaveTemplate.addEventListener("click", () =>
        this.handleSaveGeneratedAsTemplate()
      );
    }

    if (this.els.avatarNameInput) {
      this.els.avatarNameInput.addEventListener("change", (e) => {
        this.state.avatar.name = e.target.value || "Shadow Scholar";
        this.saveStateToStorage();
      });
    }

    if (this.els.logSave) {
      this.els.logSave.addEventListener("click", () => this.saveLogEntry());
    }

    if (this.els.resetDay) {
      this.els.resetDay.addEventListener("click", () => this.forceDailyReset());
    }
    if (this.els.resetAll) {
      this.els.resetAll.addEventListener("click", () => this.wipeAllProgress());
    }

    if (this.els.undoButton) {
      this.els.undoButton.addEventListener("click", () => this.undo());
    }
    if (this.els.redoButton) {
      this.els.redoButton.addEventListener("click", () => this.redo());
    }

    if (this.els.modalClose) {
      this.els.modalClose.addEventListener("click", () => this.closeModal());
    }
    if (this.els.modalBackdrop) {
      this.els.modalBackdrop.addEventListener("click", (e) => {
        if (e.target === this.els.modalBackdrop) this.closeModal();
      });
    }
  },

  /* ================= DATA LOADING ================= */

  async loadAllData() {
    const files = this.config.dataFiles;
    const promises = [];

    promises.push(this.fetchJson(files.gameData));
    promises.push(this.fetchJson(files.templates));
    files.banks.forEach((f) => promises.push(this.fetchJson(f)));
    promises.push(this.fetchJson(files.bossBattles));
    promises.push(this.fetchJson(files.recoveryMissions));
    promises.push(this.fetchJson(files.miniQuests));
    promises.push(this.fetchJson(files.achievements));
    promises.push(this.fetchJson(files.shopItems));
    promises.push(this.fetchJson(files.avatarLayers));

    const [
      gameData,
      templates,
      ...rest
    ] = await Promise.all(promises);

    const banksCount = files.banks.length;
    const banks = rest.slice(0, banksCount);
    const [
      bossBattles,
      recoveryMissions,
      miniQuests,
      achievements,
      shopItems,
      avatarLayers
    ] = rest.slice(banksCount);

    this.data.rules = gameData;
    this.data.templates = templates || [];
    this.data.banks = banks.filter(Boolean);
    this.data.bossBattles = bossBattles || [];
    this.data.recoveryMissions = recoveryMissions || [];
    this.data.miniQuests = miniQuests || [];
    this.data.achievements = achievements || [];
    this.data.shopItems = shopItems || [];
    this.data.avatarLayers = avatarLayers || [];
  },

  async fetchJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`Failed to load ${path}`);
      return await res.json();
    } catch (e) {
      console.warn("JSON load error:", path, e);
      return null;
    }
  },

  /* ================= STATE PERSISTENCE ================= */

  get storageKeys() {
    const rules = this.data.rules;
    if (!rules || !rules.resetRules) {
      return {
        xp: "ak_xp",
        level: "ak_level",
        coins: "ak_coins",
        streak: "ak_streak",
        sections: "ak_sections",
        shop: "ak_shop",
        avatar: "ak_avatar",
        bank: "ak_bank",
        undo: "ak_undo",
        sidebarHidden: "ak_sidebar_hidden",
        lastResetDate: "ak_last_reset_date",
        dayCompletedPrefix: "ak_day_completed_",
        stepsPrefix: "ak_steps_"
      };
    }
    return rules.resetRules.localStorageKeys;
  },

  loadStateFromStorage() {
    const keys = this.storageKeys;

    const xp = parseInt(localStorage.getItem(keys.xp) || "0", 10);
    const coins = parseInt(localStorage.getItem(keys.coins) || "0", 10);
    const level = parseInt(localStorage.getItem(keys.level) || "1", 10);
    const streak = parseInt(localStorage.getItem(keys.streak) || "0", 10);
    const lastResetDate = localStorage.getItem(keys.lastResetDate);

    this.state.xp = isNaN(xp) ? 0 : xp;
    this.state.coins = isNaN(coins) ? 0 : coins;
    this.state.level = isNaN(level) ? 1 : level;
    this.state.streak = isNaN(streak) ? 0 : streak;
    this.state.lastResetDate = lastResetDate || null;

    const avatarRaw = localStorage.getItem(keys.avatar);
    if (avatarRaw) {
      try {
        this.state.avatar = JSON.parse(avatarRaw);
      } catch {
        /* ignore */
      }
    }

    const sectionsRaw = localStorage.getItem(keys.sections);
    if (sectionsRaw) {
      try {
        const parsed = JSON.parse(sectionsRaw);
        this.state.activeMissions = parsed.activeMissions || [];
        this.state.logs = parsed.logs || [];
      } catch {
        /* ignore */
      }
    }

    const undoRaw = localStorage.getItem(keys.undo);
    if (undoRaw) {
      try {
        const parsed = JSON.parse(undoRaw);
        this.state.undoStack = parsed.undo || [];
        this.state.redoStack = parsed.redo || [];
      } catch {
        /* ignore */
      }
    }
  },

  saveStateToStorage() {
    const keys = this.storageKeys;
    localStorage.setItem(keys.xp, String(this.state.xp));
    localStorage.setItem(keys.coins, String(this.state.coins));
    localStorage.setItem(keys.level, String(this.state.level));
    localStorage.setItem(keys.streak, String(this.state.streak));
    if (this.state.lastResetDate) {
      localStorage.setItem(keys.lastResetDate, this.state.lastResetDate);
    }

    localStorage.setItem(keys.avatar, JSON.stringify(this.state.avatar));
    localStorage.setItem(
      keys.sections,
      JSON.stringify({
        activeMissions: this.state.activeMissions,
        logs: this.state.logs
      })
    );
    localStorage.setItem(
      keys.undo,
      JSON.stringify({
        undo: this.state.undoStack,
        redo: this.state.redoStack
      })
    );
  },

  /* ================= DAILY RESET & STREAK ================= */

  ensureDailyReset() {
    const today = this.getTodayString();
    if (this.state.lastResetDate !== today) {
      this.applyDailyReset(today);
    }
  },

  applyDailyReset(todayStr) {
    const keys = this.storageKeys;
    const yesterdayCompletedKey = keys.dayCompletedPrefix + this.getYesterdayString();
    const yesterdayCompleted = localStorage.getItem(yesterdayCompletedKey) === "1";

    if (yesterdayCompleted) {
      this.state.streak += 1;
    } else {
      this.state.streak = 0;
    }

    this.state.activeMissions = this.state.activeMissions.map((m) => {
      if (m.repeatability === "Daily" || m.repeatability === "Repeatable") {
        return { ...m, completed: false, steps: this.resetSteps(m.steps) };
      }
      return m;
    });

    this.state.lastResetDate = todayStr;
    this.state.dayCompleted = false;
    this.saveStateToStorage();
  },

  resetSteps(steps) {
    if (!Array.isArray(steps)) return steps;
    return steps.map((s) => ({ ...s, completed: false }));
  },

  startResetTimer() {
    const update = () => {
      const now = new Date();
      const nextMidnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );
      const diff = nextMidnight - now;
      const hours = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const minutes = String(
        Math.floor((diff / (1000 * 60)) % 60)
      ).padStart(2, "0");
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
      if (this.els.headerResetTimer) {
        this.els.headerResetTimer.textContent = `${hours}:${minutes}:${seconds}`;
      }
    };
    update();
    setInterval(update, 1000);
  },

  markDayCompleted() {
    if (this.state.dayCompleted) return;
    const keys = this.storageKeys;
    const todayKey = keys.dayCompletedPrefix + this.getTodayString();
    localStorage.setItem(todayKey, "1");
    this.state.dayCompleted = true;
  },

  forceDailyReset() {
    const today = this.getTodayString();
    this.applyDailyReset(today);
    this.renderAll();
  },

  wipeAllProgress() {
    if (!confirm("Wipe all local progress? This cannot be undone.")) return;
    const keys = this.storageKeys;
    Object.values(keys).forEach((k) => {
      if (typeof k === "string") localStorage.removeItem(k);
    });
    this.state = {
      xp: 0,
      coins: 0,
      level: 1,
      streak: 0,
      lastResetDate: null,
      dayCompleted: false,
      activeMissions: [],
      logs: [],
      undoStack: [],
      redoStack: [],
      avatar: {
        name: "Shadow Scholar",
        xpMultiplier: 1.0,
        coinMultiplier: 1.0,
        equipped: [],
        inventory: []
      },
      shop: {
        ownedItemIds: [],
        equippedByType: {}
      }
    };
    this.renderAll();
  },

  getTodayString() {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  },

  getYesterdayString() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  },

  /* ================= XP / LEVEL / COINS ================= */

  computeLevel() {
    const rules = this.data.rules;
    if (!rules || !rules.xpRules) return;
    const xpPerLevel = rules.xpRules.xpPerLevel || 500;
    this.state.level = Math.floor(this.state.xp / xpPerLevel) + 1;
  },

  grantXpAndCoins(baseXp, source) {
    const rules = this.data.rules;
    if (!rules || !rules.xpRules) return;

    const xpMultiplier = this.state.avatar.xpMultiplier || 1.0;
    const coinMultiplier = this.state.avatar.coinMultiplier || 1.0;
    const xpGain = Math.round(baseXp * xpMultiplier);
    const coinRatio = rules.xpRules.coinRatio || 0.2;
    const coinsGain = Math.round(baseXp * coinRatio * coinMultiplier);

    const prevLevel = this.state.level;
    this.state.xp += xpGain;
    this.state.coins += coinsGain;
    this.computeLevel();

    const action = {
      type: "reward",
      source,
      xpGain,
      coinsGain,
      prevLevel,
      newLevel: this.state.level
    };
    this.pushUndo(action);
    this.saveStateToStorage();
    this.renderHeader();
  },

  /* ================= MISSIONS ================= */

  completeMission(missionId) {
    const mission = this.state.activeMissions.find((m) => m.id === missionId);
    if (!mission || mission.completed) return;

    mission.completed = true;
    if (Array.isArray(mission.steps)) {
      mission.steps = mission.steps.map((s) => ({ ...s, completed: true }));
    }

    const baseXp = mission.xp || this.getDefaultXpForDifficulty(mission.difficulty);
    this.grantXpAndCoins(baseXp, { type: "mission", id: missionId });

    if (mission.repeatability && mission.repeatability !== "One-time") {
      this.markDayCompleted();
    }

    this.saveStateToStorage();
    this.renderActiveMissions();
    this.renderDashboard();
  },

  toggleStep(missionId, stepIndex) {
    const mission = this.state.activeMissions.find((m) => m.id === missionId);
    if (!mission || !Array.isArray(mission.steps)) return;
    const step = mission.steps[stepIndex];
    if (!step) return;

    step.completed = !step.completed;

    const allDone = mission.steps.every((s) => s.completed);
    if (allDone && !mission.completed) {
      this.completeMission(missionId);
    } else {
      this.saveStateToStorage();
      this.renderActiveMissions();
    }
  },

  getDefaultXpForDifficulty(diff) {
    const rules = this.data.rules;
    if (!rules || !rules.difficulties) return 20;
    const found = rules.difficulties.find((d) => d.id === diff);
    return found ? found.defaultXp : 20;
  },

  /* ================= TASK GENERATOR ================= */

  handleGenerateChain() {
    const goal = (this.els.genGoal.value || "").trim();
    if (!goal) {
      alert("Describe your goal first.");
      return;
    }

    const domain = this.els.genDomain.value || "PhD";
    const difficulty = this.els.genDifficulty.value || "Medium";
    const horizon = this.els.genHorizon.value || "today";
    const missionType = this.els.genType.value || "Standard Mission";
    const priority = this.els.genPriority.value || "Important";
    const energy = this.els.genEnergy.value || "Standard Focus";
    const context = this.els.genContext.value || "Online";

    const chain = this.generateMissionChainFromGoal({
      goal,
      domain,
      difficulty,
      horizon,
      missionType,
      priority,
      energy,
      context
    });

    this.generatedChain = chain;
    this.renderGeneratedChain();
  },

  generateMissionChainFromGoal(params) {
    const { goal, domain, difficulty, horizon, missionType, priority, energy, context } =
      params;

    const baseId = `gen-${Date.now()}`;
    const missions = [];

    const stepsCount = horizon === "month" ? 4 : horizon === "week" ? 3 : 2;

    for (let i = 0; i < stepsCount; i++) {
      const id = `${baseId}-${i + 1}`;
      const title =
        i === 0
          ? `Prep: ${goal}`
          : i === stepsCount - 1
          ? `Finalize: ${goal}`
          : `Progress: ${goal} (Part ${i})`;

      const mission = {
        id,
        title,
        domain,
        theme: this.mapDomainToTheme(domain),
        subject: "Generated Mission",
        sideTopic: "Generated",
        missionType,
        difficulty,
        xp: this.getDefaultXpForDifficulty(difficulty),
        repeatability: "One-time",
        estimatedTime: horizon === "today" ? 45 : 90,
        priority,
        energy,
        context,
        successCriteria: "All steps completed and outcome feels usable.",
        failureCondition: "Steps left incomplete without a recovery mission.",
        reward: "XP, coins, and progress toward your arc.",
        recoveryMission: `Recovery: create a smaller re-entry mission for "${goal}".`,
        steps: this.buildGeneratedSteps(title),
        tags: [domain, missionType, difficulty],
        notes: "Generated by Task Generator."
      };
      missions.push(mission);
    }

    return missions;
  },

  buildGeneratedSteps(title) {
    return [
      { label: `Clarify scope for: ${title}`, completed: false },
      { label: "Open relevant files, notes, or references.", completed: false },
      { label: "Do focused work on this mission only.", completed: false },
      { label: "Capture a brief note of what you did.", completed: false },
      { label: "Decide the next concrete step.", completed: false }
    ];
  },

  mapDomainToTheme(domain) {
    switch (domain) {
      case "PhD":
        return "Shadow Research Missions";
      case "Skool":
        return "Clan Leadership & Skool Community";
      case "Curriculum":
        return "Village Knowledge Expansion";
      case "Research Assistantship":
        return "Intelligence Gathering";
      case "Documentation":
        return "Eternal Documentation Scrolls";
      case "Rituals":
        return "Discipline & Rituals";
      case "Boss":
        return "Boss Battles";
      case "Recovery":
        return "Recovery & Reset Protocols";
      default:
        return "Shadow Research Missions";
    }
  },

  renderGeneratedChain() {
    if (!this.els.genMissionList) return;
    this.els.genMissionList.innerHTML = "";
    if (!this.generatedChain || !this.generatedChain.length) return;

    this.generatedChain.forEach((m) => {
      const card = document.createElement("article");
      card.className = "ak-mission-card";
      card.innerHTML = `
        <header>
          <h4>${m.title}</h4>
          <p class="ak-mission-meta">
            <span>${m.domain}</span> ·
            <span>${m.difficulty}</span> ·
            <span>${m.missionType}</span>
          </p>
        </header>
        <p class="ak-mission-desc">${m.successCriteria}</p>
      `;
      this.els.genMissionList.appendChild(card);
    });
  },

  handleAddGeneratedToActive() {
    if (!this.generatedChain || !this.generatedChain.length) return;
    this.generatedChain.forEach((m) => {
      this.state.activeMissions.push({ ...m, completed: false });
    });
    this.saveStateToStorage();
    this.renderActiveMissions();
    this.renderDashboard();
    alert("Generated mission chain added to Active Missions.");
  },

  handleSaveGeneratedAsTemplate() {
    if (!this.generatedChain || !this.generatedChain.length) return;
    const existing =
      JSON.parse(localStorage.getItem("ak_custom_templates") || "[]") || [];
    const merged = existing.concat(this.generatedChain);
    localStorage.setItem("ak_custom_templates", JSON.stringify(merged));
    alert("Generated mission chain saved as custom templates.");
  },

  /* ================= LOGS ================= */

  saveLogEntry() {
    const text = (this.els.logText.value || "").trim();
    if (!text) return;
    const entry = {
      id: `log-${Date.now()}`,
      date: this.getTodayString(),
      text
    };
    this.state.logs.unshift(entry);
    this.els.logText.value = "";
    this.saveStateToStorage();
    this.renderLogs();
  },

  /* ================= UNDO / REDO ================= */

  pushUndo(action) {
    this.state.undoStack.push(action);
    this.state.redoStack = [];
    this.saveStateToStorage();
    this.renderHistory();
  },

  undo() {
    const action = this.state.undoStack.pop();
    if (!action) return;

    if (action.type === "reward") {
      this.state.xp -= action.xpGain;
      this.state.coins -= action.coinsGain;
      this.state.level = action.prevLevel;
    }

    this.state.redoStack.push(action);
    this.saveStateToStorage();
    this.renderHeader();
    this.renderHistory();
  },

  redo() {
    const action = this.state.redoStack.pop();
    if (!action) return;

    if (action.type === "reward") {
      this.state.xp += action.xpGain;
      this.state.coins += action.coinsGain;
      this.state.level = action.newLevel;
    }

    this.state.undoStack.push(action);
    this.saveStateToStorage();
    this.renderHeader();
    this.renderHistory();
  },

  /* ================= UI: TABS & SIDEBAR ================= */

  toggleSidebar() {
    if (!this.els.sidebar) return;
    const hidden = this.els.sidebar.getAttribute("data-hidden") === "true";
    this.els.sidebar.setAttribute("data-hidden", hidden ? "false" : "true");
  },

  switchTab(targetId, button) {
    this.els.tabPanels.forEach((panel) => {
      panel.classList.toggle(
        "ak-tab-panel--active",
        panel.id === targetId
      );
    });
    this.els.tabButtons.forEach((btn) => {
      btn.classList.toggle(
        "ak-tab-button--active",
        btn === button
      );
    });
  },

  /* ================= UI: RENDERING ================= */

  renderAll() {
    this.renderHeader();
    this.renderDashboard();
    this.renderActiveMissions();
    this.renderTaskBank();
    this.renderAvatar();
    this.renderShop();
    this.renderLogs();
    this.renderSettings();
    this.renderHistory();
  },

  renderHeader() {
    const rules = this.data.rules;
    const xpPerLevel = rules?.xpRules?.xpPerLevel || 500;
    const currentLevelXp = (this.state.level - 1) * xpPerLevel;
    const nextLevelXp = this.state.level * xpPerLevel;
    const progress = Math.max(
      0,
      Math.min(
        1,
        (this.state.xp - currentLevelXp) / (nextLevelXp - currentLevelXp || 1)
      )
    );

    if (this.els.headerXpValue) {
      this.els.headerXpValue.textContent = this.state.xp;
    }
    if (this.els.headerXpNext) {
      this.els.headerXpNext.textContent = nextLevelXp;
    }
    if (this.els.headerXpFill) {
      this.els.headerXpFill.style.width = `${progress * 100}%`;
    }
    if (this.els.headerLevel) {
      this.els.headerLevel.textContent = this.state.level;
    }
    if (this.els.headerCoins) {
      this.els.headerCoins.textContent = this.state.coins;
    }
    if (this.els.headerStreak) {
      this.els.headerStreak.textContent = this.state.streak;
    }
  },

  renderDashboard() {
    const completed = this.state.activeMissions.filter((m) => m.completed).length;
    const active = this.state.activeMissions.filter((m) => !m.completed).length;

    if (this.els.dashboardXp) {
      this.els.dashboardXp.textContent = this.state.xp;
    }
    if (this.els.dashboardCompleted) {
      this.els.dashboardCompleted.textContent = completed;
    }
    if (this.els.dashboardActive) {
      this.els.dashboardActive.textContent = active;
    }
    if (this.els.dashboardStreak) {
      this.els.dashboardStreak.textContent = `${this.state.streak} days`;
    }
    if (this.els.dashboardLastReset) {
      this.els.dashboardLastReset.textContent =
        this.state.lastResetDate || "--";
    }

    const importantDone = this.state.activeMissions.some(
      (m) => m.completed && m.priority === "Critical"
    );
    const ritualDone = this.state.activeMissions.some(
      (m) => m.completed && m.missionType === "Ritual"
    );
    const docDone = this.state.activeMissions.some(
      (m) => m.completed && m.domain === "Documentation"
    );

    if (this.els.statusImportant) {
      this.els.statusImportant.textContent = `${importantDone ? 1 : 0} / 1`;
    }
    if (this.els.statusRitual) {
      this.els.statusRitual.textContent = `${ritualDone ? 1 : 0} / 1`;
    }
    if (this.els.statusDoc) {
      this.els.statusDoc.textContent = `${docDone ? 1 : 0} / 1`;
    }
    if (this.els.winTheDayStatus) {
      this.els.winTheDayStatus.textContent =
        importantDone && ritualDone && docDone
          ? "Win condition achieved."
          : "Win condition not yet met.";
    }
  },

  renderActiveMissions() {
    if (!this.els.activeMissionList) return;
    this.els.activeMissionList.innerHTML = "";

    this.state.activeMissions.forEach((m) => {
      const card = document.createElement("article");
      card.className = "ak-mission-card";
      card.innerHTML = `
        <header>
          <h4>${m.title}</h4>
          <p class="ak-mission-meta">
            <span>${m.domain}</span> ·
            <span>${m.theme}</span> ·
            <span>${m.difficulty}</span>
          </p>
        </header>
        <p class="ak-mission-desc">${m.successCriteria || ""}</p>
        <div class="ak-mission-footer">
          <button class="ak-button ak-button--primary" data-complete="${m.id}">
            ${m.completed ? "Completed" : "Complete"}
          </button>
        </div>
      `;
      const btn = card.querySelector("[data-complete]");
      btn.addEventListener("click", () => this.completeMission(m.id));
      this.els.activeMissionList.appendChild(card);
    });
  },

  renderTaskBank() {
    if (!this.els.bankMissionList) return;
    this.els.bankMissionList.innerHTML = "";

    const allTasks = [];
    this.data.banks.forEach((bank) => {
      if (Array.isArray(bank.tasks)) {
        allTasks.push(...bank.tasks);
      }
    });

    allTasks.forEach((t) => {
      const card = document.createElement("article");
      card.className = "ak-mission-card";
      card.innerHTML = `
        <header>
          <h4>${t.title}</h4>
          <p class="ak-mission-meta">
            <span>${t.domain || ""}</span> ·
            <span>${t.theme || ""}</span> ·
            <span>${t.difficulty || ""}</span>
          </p>
        </header>
        <p class="ak-mission-desc">${t.successCriteria || ""}</p>
      `;
      this.els.bankMissionList.appendChild(card);
    });
  },

  renderAvatar() {
    if (this.els.avatarNameInput) {
      this.els.avatarNameInput.value = this.state.avatar.name;
    }
    if (this.els.avatarXpMult) {
      this.els.avatarXpMult.textContent = `${this.state.avatar.xpMultiplier.toFixed(
        2
      )}x`;
    }
    if (this.els.avatarCoinMult) {
      this.els.avatarCoinMult.textContent = `${this.state.avatar.coinMultiplier.toFixed(
        2
      )}x`;
    }

    if (this.els.avatarSvg) {
      this.els.avatarSvg.innerHTML = `
        <circle cx="100" cy="100" r="80" fill="#111" stroke="#d62828" stroke-width="4" />
        <text x="50%" y="50%" fill="#e6e6e6" text-anchor="middle" dy=".3em" font-size="14">
          ${this.state.avatar.name || "Shadow Scholar"}
        </text>
      `;
    }
  },

  renderShop() {
    if (!this.els.shopItemList) return;
    this.els.shopItemList.innerHTML = "";

    this.data.shopItems.forEach((item) => {
      const card = document.createElement("article");
      card.className = "ak-shop-item";
      card.innerHTML = `
        <div class="ak-shop-emoji">${item.emoji || "🎴"}</div>
        <h4>${item.name}</h4>
        <p class="ak-shop-cost">${item.cost} coins</p>
        <p class="ak-shop-desc">${item.description || ""}</p>
        <button class="ak-button ak-button--primary" data-buy="${item.id}">
          Buy
        </button>
      `;
      const btn = card.querySelector("[data-buy]");
      btn.addEventListener("click", () => this.buyShopItem(item));
      this.els.shopItemList.appendChild(card);
    });
  },

  buyShopItem(item) {
    if (this.state.coins < item.cost) {
      alert("Not enough coins.");
      return;
    }
    this.state.coins -= item.cost;
    this.state.avatar.inventory.push(item.id);
    this.saveStateToStorage();
    this.renderHeader();
    this.renderAvatar();
  },

  renderLogs() {
    if (!this.els.logList) return;
    this.els.logList.innerHTML = "";
    this.state.logs.forEach((log) => {
      const li = document.createElement("li");
      li.textContent = `${log.date}: ${log.text}`;
      this.els.logList.appendChild(li);
    });
  },

  renderSettings() {
    if (!this.els.dataBanks) return;
    this.els.dataBanks.innerHTML = "";

    const rows = [];

    rows.push({
      name: "Core Rules",
      file: this.config.dataFiles.gameData,
      status: this.data.rules ? "Loaded" : "Missing"
    });
    rows.push({
      name: "Mission Templates",
      file: this.config.dataFiles.templates,
      status: this.data.templates ? "Loaded" : "Missing"
    });

    this.config.dataFiles.banks.forEach((file, idx) => {
      rows.push({
        name: `Domain Bank ${idx + 1}`,
        file,
        status: this.data.banks[idx] ? "Loaded" : "Missing"
      });
    });

    [
      ["Boss Battles", this.config.dataFiles.bossBattles, this.data.bossBattles],
      [
        "Recovery Missions",
        this.config.dataFiles.recoveryMissions,
        this.data.recoveryMissions
      ],
      ["Mini Quests", this.config.dataFiles.miniQuests, this.data.miniQuests],
      [
        "Achievements",
        this.config.dataFiles.achievements,
        this.data.achievements
      ],
      ["Shop Items", this.config.dataFiles.shopItems, this.data.shopItems],
      ["Avatar Layers", this.config.dataFiles.avatarLayers, this.data.avatarLayers]
    ].forEach(([name, file, data]) => {
      rows.push({
        name,
        file,
        status: data ? "Loaded" : "Missing"
      });
    });

    rows.forEach((r) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.name}</td>
        <td>${r.file}</td>
        <td>${r.status}</td>
      `;
      this.els.dataBanks.appendChild(tr);
    });
  },

  renderHistory() {
    if (!this.els.historyList) return;
    this.els.historyList.innerHTML = "";
    this.state.undoStack
      .slice(-20)
      .reverse()
      .forEach((a, idx) => {
        const li = document.createElement("li");
        li.textContent = `${idx + 1}. ${a.type} (+${a.xpGain || 0} XP)`;
        this.els.historyList.appendChild(li);
      });
  },

  /* ================= MODAL ================= */

  openModal(title, bodyHtml, footerHtml) {
    if (!this.els.modalBackdrop) return;
    this.els.modalTitle.textContent = title;
    this.els.modalBody.innerHTML = bodyHtml || "";
    this.els.modalFooter.innerHTML = footerHtml || "";
    this.els.modalBackdrop.hidden = false;
  },

  closeModal() {
    if (!this.els.modalBackdrop) return;
    this.els.modalBackdrop.hidden = true;
  }
};

document.addEventListener("DOMContentLoaded", () => AK.init());
