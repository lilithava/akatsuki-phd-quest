// ===============================
// AKATSUKI PHD QUEST – CORE ENGINE
// ===============================

// --------- GLOBAL STATE ---------
const DEFAULT_STATE = {
  xp: 0,
  level: 1,
  coins: 0,
  missionsCompleted: 0,
  missionsActive: 0,
  streak: {
    current: 0,
    documentation: 0,
    lastResetDate: null
  },
  daily: {
    important: 0,
    ritual: 0,
    documentation: 0
  },
  lastLoginDate: null
};

let gameState = { ...DEFAULT_STATE };

// ===============================
// STORAGE
// ===============================
const STORAGE_KEY = "akatsuki_phd_quest_state";

function loadGameState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      gameState = { ...DEFAULT_STATE };
      saveGameState();
      return;
    }
    gameState = { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch (e) {
    console.error("Failed to load game state:", e);
    gameState = { ...DEFAULT_STATE };
  }
}

function saveGameState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  } catch (e) {
    console.error("Failed to save game state:", e);
  }
}

// ===============================
// LEVEL / XP SYSTEM
// ===============================
function getXpForNextLevel(level) {
  // simple curve: 500 xp per level
  return 500 * level;
}

function addXP(amount) {
  gameState.xp += amount;
  checkLevelUp();
  saveGameState();
  updateDashboardUI();
}

function checkLevelUp() {
  let needed = getXpForNextLevel(gameState.level);
  while (gameState.xp >= needed) {
    gameState.level += 1;
    needed = getXpForNextLevel(gameState.level);
    // could trigger achievement popup here
  }
}

// ===============================
// STREAKS & DAILY RESET
// ===============================
function getTodayISO() {
  return new Date().toISOString().split("T")[0];
}

function checkDailyReset() {
  const today = getTodayISO();
  const lastReset = gameState.streak.lastResetDate;

  if (!lastReset) {
    // first time
    gameState.streak.lastResetDate = today;
    saveGameState();
    updateDashboardUI();
    return;
  }

  if (lastReset !== today) {
    runDailyReset(today);
  }
}

function runDailyReset(today) {
  // If last reset was yesterday -> streak continues
  const last = new Date(gameState.streak.lastResetDate);
  const now = new Date(today);
  const diffDays = Math.round(
    (now - last) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 1) {
    gameState.streak.current += 1;
  } else {
    gameState.streak.current = 0;
  }

  // reset daily counters
  gameState.daily = {
    important: 0,
    ritual: 0,
    documentation: 0
  };

  gameState.streak.lastResetDate = today;
  saveGameState();
  updateDashboardUI();
}

// ===============================
// MISSIONS (HOOKS ONLY FOR NOW)
// ===============================
function completeMission({ type = "generic", xp = 50, coins = 0 }) {
  // type: "important" | "ritual" | "documentation" | ...
  addXP(xp);
  gameState.coins += coins;
  gameState.missionsCompleted += 1;

  if (type === "important") gameState.daily.important += 1;
  if (type === "ritual") gameState.daily.ritual += 1;
  if (type === "documentation") {
    gameState.daily.documentation += 1;
    gameState.streak.documentation += 1;
  }

  saveGameState();
  updateDashboardUI();
}

// ===============================
// MODAL SYSTEM
// ===============================
function initModalSystem() {
  const backdrop = document.querySelector("[data-ak-modal-backdrop]");
  const closeBtn = document.querySelector("[data-ak-modal-close]");

  if (closeBtn && backdrop) {
    closeBtn.addEventListener("click", () => {
      backdrop.classList.remove("active");
    });

    // Optional: close on backdrop click
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        backdrop.classList.remove("active");
      }
    });
  }
}

function openModal(title = "Modal", body = "", footerHTML = "") {
  const backdrop = document.querySelector("[data-ak-modal-backdrop]");
  const titleEl = document.querySelector("[data-ak-modal-title]");
  const bodyEl = document.querySelector("[data-ak-modal-body]");
  const footerEl = document.querySelector("[data-ak-modal-footer]");

  if (!backdrop || !titleEl || !bodyEl || !footerEl) return;

  titleEl.textContent = title;
  bodyEl.innerHTML = body;
  footerEl.innerHTML = footerHTML;

  backdrop.classList.add("active");
}

function closeModal() {
  const backdrop = document.querySelector("[data-ak-modal-backdrop]");
  if (backdrop) backdrop.classList.remove("active");
}

// ===============================
// DASHBOARD UI BINDING
// ===============================
function updateDashboardUI() {
  // XP / Level / Coins / Streak
  const xpEl = document.querySelector("[data-ak-xp]");
  const xpMaxEl = document.querySelector("[data-ak-xp-max]");
  const levelEl = document.querySelector("[data-ak-level]");
  const coinsEl = document.querySelector("[data-ak-coins]");
  const streakEl = document.querySelector("[data-ak-streak]");
  const docStreakEl = document.querySelector("[data-ak-doc-streak]");
  const lastResetEl = document.querySelector("[data-ak-last-reset]");

  const totalXpEl = document.querySelector("[data-ak-total-xp]");
  const completedEl = document.querySelector("[data-ak-completed-missions]");
  const activeEl = document.querySelector("[data-ak-active-missions]");

  const dailyImportantEl = document.querySelector("[data-ak-daily-important]");
  const dailyRitualEl = document.querySelector("[data-ak-daily-ritual]");
  const dailyDocEl = document.querySelector("[data-ak-daily-doc]");

  const xpForNext = getXpForNextLevel(gameState.level);

  if (xpEl) xpEl.textContent = gameState.xp;
  if (xpMaxEl) xpMaxEl.textContent = xpForNext;
  if (levelEl) levelEl.textContent = gameState.level;
  if (coinsEl) coinsEl.textContent = gameState.coins;
  if (streakEl) streakEl.textContent = gameState.streak.current;
  if (docStreakEl) docStreakEl.textContent = gameState.streak.documentation;
  if (lastResetEl) lastResetEl.textContent = gameState.streak.lastResetDate || "-";

  if (totalXpEl) totalXpEl.textContent = gameState.xp;
  if (completedEl) completedEl.textContent = gameState.missionsCompleted;
  if (activeEl) activeEl.textContent = gameState.missionsActive;

  if (dailyImportantEl) dailyImportantEl.textContent = gameState.daily.important;
  if (dailyRitualEl) dailyRitualEl.textContent = gameState.daily.ritual;
  if (dailyDocEl) dailyDocEl.textContent = gameState.daily.documentation;
}

// ===============================
// QUICK ACTIONS (BUTTON HOOKS)
// ===============================
function initQuickActions() {
  const genChainBtn = document.querySelector("[data-ak-generate-chain]");
  const miniQuestBtn = document.querySelector("[data-ak-mini-quest]");
  const recoveryBtn = document.querySelector("[data-ak-recovery]");

  if (genChainBtn) {
    genChainBtn.addEventListener("click", () => {
      openModal(
        "Generate Mission Chain",
        "<p>This will later hook into mission-engine.js.</p>"
      );
    });
  }

  if (miniQuestBtn) {
    miniQuestBtn.addEventListener("click", () => {
      openModal(
        "Mini-Quest",
        "<p>Draw a mini-quest from mini-quests.json (to be wired).</p>"
      );
    });
  }

  if (recoveryBtn) {
    recoveryBtn.addEventListener("click", () => {
      openModal(
        "Recovery Protocol",
        "<p>Trigger a recovery mission from recovery-missions.json (to be wired).</p>"
      );
    });
  }
}

// ===============================
// UNDO / REDO (SIMPLE HISTORY)
// ===============================
const HISTORY_KEY = "akatsuki_phd_quest_history";
let historyStack = [];
let futureStack = [];

function pushHistory() {
  historyStack.push(JSON.stringify(gameState));
  if (historyStack.length > 50) historyStack.shift();
  localStorage.setItem(HISTORY_KEY, JSON.stringify(historyStack));
}

function undo() {
  if (historyStack.length === 0) return;
  futureStack.push(JSON.stringify(gameState));
  const prev = historyStack.pop();
  gameState = JSON.parse(prev);
  saveGameState();
  updateDashboardUI();
}

function redo() {
  if (futureStack.length === 0) return;
  historyStack.push(JSON.stringify(gameState));
  const next = futureStack.pop();
  gameState = JSON.parse(next);
  saveGameState();
  updateDashboardUI();
}

// ===============================
// INIT
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  loadGameState();
  checkDailyReset();
  initModalSystem();
  initQuickActions();
  updateDashboardUI();

  // Optional: wire undo/redo buttons if present
  const undoBtn = document.querySelector("[data-ak-undo]");
  const redoBtn = document.querySelector("[data-ak-redo]");

  if (undoBtn) undoBtn.addEventListener("click", undo);
  if (redoBtn) redoBtn.addEventListener("click", redo);
});
