/**
 * Akatsuki PhD Quest - Main Application
 * Version: 2.0.0 - FIXED
 */

// Wait for DOM to be fully loaded before doing anything
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing...');
    
    // Wait a tiny bit for data-loader to finish
    setTimeout(function() {
        initApp();
    }, 500);
});

// Global state
let state = {
    xp: 0,
    coins: 150,
    level: 1,
    streak: 0,
    lastResetDate: new Date().toISOString().slice(0,10),
    lastWeeklyResetDate: null,
    activeTasks: [],
    completedHistory: [],
    undoStack: [],
    redoStack: [],
    unlockedAchievements: [],
    avatar: {
        name: 'Shadow Scholar',
        equipped: [],
        inventory: []
    }
};

// Daily tasks
const DAILY_TASKS = [
    { title: "Morning Startup Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Critical", energy: "Low Energy",
      steps: ["Open mission board", "Review today's calendar", "Pick top 3 priorities", "Start first block"] },
    { title: "Daily Mission Log", domain: "Documentation", difficulty: "Easy", xp: 15, priority: "Important", energy: "Low Energy",
      steps: ["Write what you accomplished", "Note any blockers", "Record tomorrow's first task"] },
    { title: "Shutdown Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Important", energy: "Low Energy",
      steps: ["Review completed tasks", "Clear workspace", "Set tomorrow's first action"] }
];

// Weekly tasks
const WEEKLY_TASKS = [
    { title: "Weekly Review & Reset", domain: "Documentation", difficulty: "Medium", xp: 45, priority: "Critical", energy: "Standard Focus",
      steps: ["Review last week's wins", "Identify patterns/blockers", "Set next week's top 3 missions", "Update documentation"] }
];

// Shop items
const SHOP_ITEMS = [
    { id: 'cloak_basic', name: 'Akatsuki Cloak', slot: 'cloak', cost: 150, effect: { xpMult: 1.05, coinMult: 1.0 }, description: '+5% XP' },
    { id: 'mask_anbu', name: 'ANBU Mask', slot: 'mask', cost: 100, effect: { xpMult: 1.03, coinMult: 1.0 }, description: '+3% XP' },
    { id: 'ring_akatsuki', name: 'Akatsuki Ring', slot: 'accessory_left', cost: 80, effect: { xpMult: 1.02, coinMult: 1.02 }, description: '+2% XP, +2% Coins' },
    { id: 'raven_companion', name: 'Raven Companion', slot: 'companion', cost: 200, effect: { xpMult: 1.1, coinMult: 1.0 }, description: '+10% XP' },
    { id: 'aura_crimson', name: 'Crimson Aura', slot: 'aura', cost: 120, effect: { xpMult: 1.0, coinMult: 1.1 }, description: '+10% Coins' },
    { id: 'shadow_wolf', name: 'Shadow Wolf', slot: 'companion', cost: 350, effect: { xpMult: 1.15, coinMult: 1.05 }, description: '+15% XP, +5% Coins' },
    { id: 'elite_cloak', name: 'Elite Akatsuki Cloak', slot: 'cloak', cost: 400, effect: { xpMult: 1.12, coinMult: 1.08 }, description: '+12% XP, +8% Coins' }
];

// Achievements
const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first mission', requirement: 'Complete 1 mission', xpReward: 50 },
    { id: 'crimson_streak', name: 'Crimson Streak', description: 'Maintain 14-day streak', requirement: '14 day streak', xpReward: 200 }
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getLastMonday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0,10);
}

function getTodayStr() {
    return new Date().toISOString().slice(0,10);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showReward(message, xpGain, coinGain) {
    const toast = document.getElementById('rewardToast');
    if (toast) {
        toast.innerHTML = `✨ +${xpGain} XP  💰 +${coinGain} Coins<br>${message}`;
        toast.classList.add('show');
        setTimeout(function() { toast.classList.remove('show'); }, 2000);
    }
    renderHeader();
    renderDashboard();
    updateXPBar();
}

function getMultipliers() {
    let xpMult = 1.0;
    let coinMult = 1.0;
    if (state.avatar.equipped) {
        state.avatar.equipped.forEach(function(itemId) {
            const item = SHOP_ITEMS.find(function(i) { return i.id === itemId; });
            if (item && item.effect) {
                xpMult *= (item.effect.xpMult || 1);
                coinMult *= (item.effect.coinMult || 1);
            }
        });
    }
    return { xpMult: xpMult, coinMult: coinMult };
}

function updateXPBar() {
    const xpPerLevel = 500;
    const currentLevelXp = (state.level - 1) * xpPerLevel;
    const nextLevelXp = state.level * xpPerLevel;
    const progress = ((state.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    
    const xpFill = document.getElementById('xpFill');
    if (xpFill) xpFill.style.width = Math.min(100, Math.max(0, progress)) + '%';
    
    const xpCurrent = document.getElementById('xpCurrent');
    const xpNext = document.getElementById('xpNext');
    const nextLevelSpan = document.getElementById('nextLevel');
    if (xpCurrent) xpCurrent.innerText = state.xp;
    if (xpNext) xpNext.innerText = nextLevelXp;
    if (nextLevelSpan) nextLevelSpan.innerText = state.level + 1;
}

function updateXPLevel() {
    const xpPerLevel = 500;
    const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
    if (newLevel > state.level) {
        const bonus = 100;
        state.coins += bonus;
        showReward('Level Up! You reached level ' + newLevel, 0, bonus);
    }
    state.level = newLevel;
    updateStreak();
    updateXPBar();
}

function updateStreak() {
    const completionsByDate = {};
    state.completedHistory.forEach(function(h) {
        const date = h.completedAt ? h.completedAt.slice(0,10) : null;
        if (date) completionsByDate[date] = true;
    });
    let streak = 0;
    let today = getTodayStr();
    let check = today;
    while (completionsByDate[check]) {
        streak++;
        let d = new Date(check);
        d.setDate(d.getDate() - 1);
        check = d.toISOString().slice(0,10);
    }
    state.streak = streak;
}

function updateTaskCompletion(task) {
    const allStepsDone = task.steps.every(function(s) { return s.completed; });
    if (allStepsDone && !task.completed) {
        completeTask(task.id);
    }
}

function completeTask(taskId) {
    const task = state.activeTasks.find(function(t) { return t.id === taskId; });
    if (!task || task.completed) return;
    
    const mult = getMultipliers();
    const baseXp = task.xp || 30;
    const baseCoins = Math.floor(baseXp * 0.2);
    
    const xpGain = Math.floor(baseXp * mult.xpMult);
    const coinGain = Math.floor(baseCoins * mult.coinMult);
    
    task.completed = true;
    task.finishedAt = new Date().toISOString();
    state.xp += xpGain;
    state.coins += coinGain;
    
    state.completedHistory.push({
        taskId: task.id,
        title: task.title,
        completedAt: task.finishedAt,
        xpGained: xpGain,
        coinsGained: coinGain,
        notes: task.notes || '',
        steps: task.steps.map(function(s) { return { text: s.text, completed: s.completed }; })
    });
    
    showReward('Completed: ' + task.title, xpGain, coinGain);
    pushUndo({ type: 'completeTask', taskId: taskId, xpGain: xpGain, coinGain: coinGain });
    updateXPLevel();
    saveState();
    checkAchievements();
    renderAll();
}

function checkAndRegenerateTasks() {
    if (!state.lastWeeklyResetDate) {
        state.lastWeeklyResetDate = getLastMonday();
    }
    
    const today = getTodayStr();
    const todayDate = new Date(today);
    const lastResetDate = new Date(state.lastResetDate);
    
    if (todayDate > lastResetDate) {
        state.activeTasks = state.activeTasks.filter(function(t) {
            if (t.repeatability === 'Daily' && t.completed) return false;
            return true;
        });
        
        DAILY_TASKS.forEach(function(taskTemplate) {
            const existingDaily = state.activeTasks.find(function(t) {
                return t.title === taskTemplate.title && t.repeatability === 'Daily' && !t.completed;
            });
            if (!existingDaily) {
                state.activeTasks.push({
                    id: Date.now() + '_' + Math.random(),
                    title: taskTemplate.title,
                    domain: taskTemplate.domain,
                    difficulty: taskTemplate.difficulty,
                    xp: taskTemplate.xp,
                    repeatability: 'Daily',
                    priority: taskTemplate.priority,
                    energy: taskTemplate.energy,
                    steps: taskTemplate.steps.map(function(text) { return { text: text, completed: false }; }),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false
                });
            }
        });
        state.lastResetDate = today;
    }
    
    const thisMonday = getLastMonday();
    const lastWeekly = new Date(state.lastWeeklyResetDate);
    const thisMondayDate = new Date(thisMonday);
    
    if (thisMondayDate > lastWeekly) {
        state.activeTasks = state.activeTasks.filter(function(t) {
            if (t.repeatability === 'Weekly' && t.completed) return false;
            return true;
        });
        
        WEEKLY_TASKS.forEach(function(taskTemplate) {
            const existingWeekly = state.activeTasks.find(function(t) {
                return t.title === taskTemplate.title && t.repeatability === 'Weekly' && !t.completed;
            });
            if (!existingWeekly) {
                state.activeTasks.push({
                    id: Date.now() + '_' + Math.random(),
                    title: taskTemplate.title,
                    domain: taskTemplate.domain,
                    difficulty: taskTemplate.difficulty,
                    xp: taskTemplate.xp,
                    repeatability: 'Weekly',
                    priority: taskTemplate.priority,
                    energy: taskTemplate.energy,
                    steps: taskTemplate.steps.map(function(text) { return { text: text, completed: false }; }),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false
                });
            }
        });
        state.lastWeeklyResetDate = thisMonday;
    }
}

function pushUndo(action) {
    state.undoStack.push(action);
    state.redoStack = [];
    if (state.undoStack.length > 50) state.undoStack.shift();
    saveState();
}

function undo() {
    const action = state.undoStack.pop();
    if (!action) return;
    state.redoStack.push(action);
    
    if (action.type === 'toggleStep') {
        const task = state.activeTasks.find(function(t) { return t.id === action.taskId; });
        if (task && task.steps[action.stepIndex]) {
            task.steps[action.stepIndex].completed = action.oldState;
            updateTaskCompletion(task);
        }
    } else if (action.type === 'completeTask') {
        const task = state.activeTasks.find(function(t) { return t.id === action.taskId; });
        if (task) {
            task.completed = false;
            task.finishedAt = null;
            state.xp -= action.xpGain;
            state.coins -= action.coinGain;
            state.completedHistory = state.completedHistory.filter(function(h) { return h.taskId !== action.taskId; });
        }
    } else if (action.type === 'addTask') {
        state.activeTasks = state.activeTasks.filter(function(t) { return t.id !== action.taskId; });
    }
    
    updateXPLevel();
    saveState();
    renderAll();
}

function redo() {
    const action = state.redoStack.pop();
    if (!action) return;
    state.undoStack.push(action);
    
    if (action.type === 'toggleStep') {
        const task = state.activeTasks.find(function(t) { return t.id === action.taskId; });
        if (task && task.steps[action.stepIndex]) {
            task.steps[action.stepIndex].completed = !action.oldState;
            updateTaskCompletion(task);
        }
    } else if (action.type === 'completeTask') {
        const task = state.activeTasks.find(function(t) { return t.id === action.taskId; });
        if (task) {
            task.completed = true;
            task.finishedAt = new Date().toISOString();
            state.xp += action.xpGain;
            state.coins += action.coinGain;
            state.completedHistory.push({
                taskId: action.taskId,
                title: task.title,
                completedAt: task.finishedAt,
                xpGained: action.xpGain,
                coinsGained: action.coinGain,
                notes: task.notes || ''
            });
        }
    } else if (action.type === 'addTask') {
        state.activeTasks.push(action.task);
    }
    
    updateXPLevel();
    saveState();
    renderAll();
}

function checkAchievements() {
    let changed = false;
    
    ACHIEVEMENTS.forEach(function(ach) {
        if (state.unlockedAchievements.includes(ach.id)) return;
        
        let unlocked = false;
        if (ach.id === 'first_blood' && state.completedHistory.length >= 1) unlocked = true;
        if (ach.id === 'crimson_streak' && state.streak >= 14) unlocked = true;
        
        if (unlocked) {
            state.unlockedAchievements.push(ach.id);
            state.xp += ach.xpReward;
            showReward('🏆 Achievement: ' + ach.name + ' (+' + ach.xpReward + ' XP)', ach.xpReward, 0);
            changed = true;
        }
    });
    
    if (changed) {
        updateXPLevel();
        renderAchievements();
    }
}

function saveState() {
    localStorage.setItem('akatsuki_state', JSON.stringify(state));
}

function loadState() {
    const saved = localStorage.getItem('akatsuki_state');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            state.activeTasks = (state.activeTasks || []).map(function(t) {
                return {
                    ...t,
                    steps: (t.steps || []).map(function(s) {
                        return typeof s === 'string' ? { text: s, completed: false } : s;
                    })
                };
            });
            state.completedHistory = state.completedHistory || [];
            state.unlockedAchievements = state.unlockedAchievements || [];
            state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
        } catch(e) { console.error(e); }
    }
    
    checkAndRegenerateTasks();
    
    if (state.activeTasks.length === 0) {
        DAILY_TASKS.forEach(function(taskTemplate) {
            state.activeTasks.push({
                id: Date.now() + '_' + Math.random(),
                title: taskTemplate.title,
                domain: taskTemplate.domain,
                difficulty: taskTemplate.difficulty,
                xp: taskTemplate.xp,
                repeatability: 'Daily',
                priority: taskTemplate.priority,
                energy: taskTemplate.energy,
                steps: taskTemplate.steps.map(function(text) { return { text: text, completed: false }; }),
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            });
        });
    }
    
    updateXPLevel();
    saveState();
}

// ============================================================
// RENDER FUNCTIONS
// ============================================================

function renderAll() {
    renderHeader();
    renderDashboard();
    renderActiveMissions();
    renderTaskBank();
    renderHistory();
    renderAvatar();
    renderShop();
    renderAchievements();
}

function renderHeader() {
    const levelEl = document.getElementById('level');
    const xpEl = document.getElementById('xp');
    const coinsEl = document.getElementById('coins');
    const streakEl = document.getElementById('streak');
    if (levelEl) levelEl.innerText = state.level;
    if (xpEl) xpEl.innerText = state.xp;
    if (coinsEl) coinsEl.innerText = state.coins;
    if (streakEl) streakEl.innerText = state.streak;
}

function renderDashboard() {
    const activeCount = state.activeTasks.filter(function(t) { return !t.completed; }).length;
    const completedToday = state.completedHistory.filter(function(h) {
        return h.completedAt && h.completedAt.slice(0,10) === getTodayStr();
    }).length;
    
    const activeCountEl = document.getElementById('activeCount');
    const completedTodayEl = document.getElementById('completedToday');
    const totalXPEl = document.getElementById('totalXP');
    const streakDisplayEl = document.getElementById('streakDisplay');
    
    if (activeCountEl) activeCountEl.innerText = activeCount;
    if (completedTodayEl) completedTodayEl.innerText = completedToday;
    if (totalXPEl) totalXPEl.innerText = state.xp;
    if (streakDisplayEl) streakDisplayEl.innerText = state.streak;
    
    const hasImportant = state.activeTasks.some(function(t) { return t.completed && (t.priority === 'Critical' || t.priority === 'Important'); });
    const hasRitual = state.activeTasks.some(function(t) { return t.completed && t.domain === 'Rituals'; });
    const hasDoc = state.activeTasks.some(function(t) { return t.completed && t.domain === 'Documentation'; });
    
    const winImportant = document.getElementById('winImportant');
    const winRitual = document.getElementById('winRitual');
    const winDoc = document.getElementById('winDoc');
    const winResult = document.getElementById('winResult');
    
    if (winImportant) winImportant.innerHTML = hasImportant ? '✅' : '⬜';
    if (winRitual) winRitual.innerHTML = hasRitual ? '✅' : '⬜';
    if (winDoc) winDoc.innerHTML = hasDoc ? '✅' : '⬜';
    if (winResult) {
        winResult.innerHTML = (hasImportant && hasRitual && hasDoc) ? '✅ WIN THE DAY!' : '❌ NOT YET';
    }
}

function renderActiveMissions() {
    const container = document.getElementById('activeMissionsList');
    if (!container) return;
    
    const activeTasks = state.activeTasks.filter(function(t) { return !t.completed; });
    
    if (activeTasks.length === 0) {
        container.innerHTML = '<div class="ak-card">✨ No active missions. Add some from the Task Bank or Generator!</div>';
        return;
    }
    
    let html = '';
    for (let i = 0; i < activeTasks.length; i++) {
        const task = activeTasks[i];
        html += `
            <div class="mission-item" data-task-id="${task.id}">
                <div class="mission-header">
                    <div class="mission-title">${escapeHtml(task.title)}</div>
                    <div class="mission-badge">
                        <span class="badge ${task.difficulty ? task.difficulty.toLowerCase() : 'medium'}">${task.difficulty || 'Medium'}</span>
                        <span class="badge ${task.priority ? task.priority.toLowerCase() : 'important'}">${task.priority || 'Important'}</span>
                    </div>
                </div>
                <div class="mission-meta">
                    <span>📁 ${task.domain || 'General'}</span>
                    <span>🔄 ${task.repeatability || 'One-time'}</span>
                    <span>⭐ ${task.xp || 30} XP</span>
                </div>
                <ul class="step-list">
        `;
        for (let s = 0; s < task.steps.length; s++) {
            const step = task.steps[s];
            html += `
                <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${s}">
                    <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                    <label class="step-label">${escapeHtml(step.text)}</label>
                    <button class="step-edit-btn" data-step-idx="${s}">✏️</button>
                </li>
            `;
        }
        html += `
                </ul>
                <div class="mission-actions">
                    <button class="step-add-btn">+ Add Step</button>
                    <button class="view-task-details" data-task-id="${task.id}">📝 Details</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    attachMissionEventListeners();
}

function attachMissionEventListeners() {
    // Step checkboxes
    const checkboxes = document.querySelectorAll('.step-checkbox');
    for (let i = 0; i < checkboxes.length; i++) {
        checkboxes[i].removeEventListener('change', handleStepToggle);
        checkboxes[i].addEventListener('change', handleStepToggle);
    }
    
    // Step edit buttons
    const editBtns = document.querySelectorAll('.step-edit-btn');
    for (let i = 0; i < editBtns.length; i++) {
        editBtns[i].removeEventListener('click', handleStepEditClick);
        editBtns[i].addEventListener('click', handleStepEditClick);
    }
    
    // Add step buttons
    const addBtns = document.querySelectorAll('.step-add-btn');
    for (let i = 0; i < addBtns.length; i++) {
        addBtns[i].removeEventListener('click', handleAddStep);
        addBtns[i].addEventListener('click', handleAddStep);
    }
    
    // Details buttons
    const detailBtns = document.querySelectorAll('.view-task-details');
    for (let i = 0; i < detailBtns.length; i++) {
        detailBtns[i].removeEventListener('click', handleDetailsClick);
        detailBtns[i].addEventListener('click', handleDetailsClick);
    }
}

function handleStepToggle(e) {
    const checkbox = e.target;
    const li = checkbox.closest('.step-item');
    const stepIndex = parseInt(li.dataset.stepIndex);
    const missionDiv = li.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    
    const task = state.activeTasks.find(function(t) { return t.id === taskId; });
    if (task && task.steps[stepIndex]) {
        const oldState = task.steps[stepIndex].completed;
        task.steps[stepIndex].completed = checkbox.checked;
        
        if (checkbox.checked) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }
        
        pushUndo({ type: 'toggleStep', taskId: taskId, stepIndex: stepIndex, oldState: oldState });
        updateTaskCompletion(task);
        saveState();
        renderDashboard();
        renderHeader();
    }
}

function handleStepEditClick(e) {
    const btn = e.target;
    const li = btn.closest('.step-item');
    const stepIndex = parseInt(li.dataset.stepIndex);
    const missionDiv = li.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    const task = state.activeTasks.find(function(t) { return t.id === taskId; });
    const step = task ? task.steps[stepIndex] : null;
    
    if (!step) return;
    
    const newText = prompt('Edit step:', step.text);
    if (newText && newText.trim()) {
        step.text = newText.trim();
        const label = li.querySelector('.step-label');
        if (label) label.innerText = newText.trim();
        pushUndo({ type: 'editStep', taskId: taskId, stepIndex: stepIndex, oldText: step.text, newText: newText });
        saveState();
    }
}

function handleAddStep(e) {
    const btn = e.target;
    const missionDiv = btn.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    const newStepText = prompt('Enter new step:');
    
    if (newStepText && newStepText.trim()) {
        const task = state.activeTasks.find(function(t) { return t.id === taskId; });
        if (task) {
            const newStep = { text: newStepText.trim(), completed: false };
            task.steps.push(newStep);
            pushUndo({ type: 'addStep', taskId: taskId, stepData: newStep });
            saveState();
            renderActiveMissions();
        }
    }
}

function handleDetailsClick(e) {
    const btn = e.target;
    const missionDiv = btn.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    openTaskModal(taskId);
}

function openTaskModal(taskId) {
    const task = state.activeTasks.find(function(t) { return t.id === taskId; });
    if (!task) return;
    
    const modal = document.getElementById('taskModal');
    if (!modal) return;
    
    document.getElementById('modalTitle').innerText = task.title;
    document.getElementById('modalBody').innerHTML = `
        <p><strong>Domain:</strong> ${task.domain}</p>
        <p><strong>Difficulty:</strong> ${task.difficulty}</p>
        <p><strong>XP Reward:</strong> ${task.xp}</p>
        <p><strong>Repeatability:</strong> ${task.repeatability || 'One-time'}</p>
        <p><strong>Priority:</strong> ${task.priority || 'Normal'}</p>
        <p><strong>Started:</strong> ${task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Finished:</strong> ${task.finishedAt ? new Date(task.finishedAt).toLocaleString() : 'In progress'}</p>
    `;
    document.getElementById('taskNotes').value = task.notes || '';
    
    const saveBtn = document.getElementById('saveTaskNotes');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.onclick = function() {
        task.notes = document.getElementById('taskNotes').value;
        saveState();
        modal.style.display = 'none';
        showReward('Notes saved!', 0, 0);
    };
    
    const deleteBtn = document.getElementById('deleteTaskBtn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.onclick = function() {
            if (confirm('Delete task "' + task.title + '"? This cannot be undone.')) {
                state.activeTasks = state.activeTasks.filter(function(t) { return t.id !== taskId; });
                pushUndo({ type: 'deleteTask', taskId: taskId, taskData: task });
                saveState();
                modal.style.display = 'none';
                renderAll();
                showReward('Deleted: ' + task.title, 0, 0);
            }
        };
    }
    
    modal.style.display = 'flex';
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = function() { modal.style.display = 'none'; };
}

function renderTaskBank() {
    const container = document.getElementById('taskBankList');
    if (!container) return;
    
    // Sample tasks for the bank
    const sampleTasks = [
        { title: "Write Literature Review Section", domain: "PhD", difficulty: "Hard", xp: 90, steps: ["Find 10 sources", "Read and annotate", "Write synthesis", "Add citations"] },
        { title: "Create Weekly Skool Post", domain: "Skool", difficulty: "Medium", xp: 35, steps: ["Choose topic", "Write hook", "Add 3 tips", "Post and engage"] },
        { title: "Design Lesson Plan", domain: "Curriculum", difficulty: "Medium", xp: 40, steps: ["Define outcomes", "Create activities", "Build assessment", "Review"] },
        { title: "Code Interview Transcript", domain: "Research Assistantship", difficulty: "Hard", xp: 80, steps: ["Open transcript", "Apply codes", "Write memo", "Save"] },
        { title: "Write Daily Log", domain: "Documentation", difficulty: "Easy", xp: 15, steps: ["Open template", "Record work done", "Note blockers", "Set next action"] },
        { title: "Morning Startup Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, steps: ["Open mission board", "Review calendar", "Pick top 3", "Start first block"] }
    ];
    
    let html = '';
    for (let i = 0; i < sampleTasks.length; i++) {
        const t = sampleTasks[i];
        html += `
            <div class="mission-item">
                <div class="mission-header">
                    <div class="mission-title">${escapeHtml(t.title)}</div>
                    <div class="mission-badge">
                        <span class="badge ${t.difficulty.toLowerCase()}">${t.difficulty}</span>
                    </div>
                </div>
                <div class="mission-meta">
                    <span>📁 ${t.domain}</span>
                    <span>⭐ ${t.xp} XP</span>
                </div>
                <div class="mission-actions">
                    <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain}" data-difficulty="${t.difficulty}" data-xp="${t.xp}" data-steps='${JSON.stringify(t.steps)}'>+ Add to Active</button>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    const addBtns = document.querySelectorAll('.add-from-bank');
    for (let i = 0; i < addBtns.length; i++) {
        addBtns[i].removeEventListener('click', handleAddFromBank);
        addBtns[i].addEventListener('click', handleAddFromBank);
    }
}

function handleAddFromBank(e) {
    const btn = e.target;
    let stepsArray = [];
    try {
        stepsArray = JSON.parse(btn.dataset.steps);
    } catch(e) { 
        stepsArray = ["Plan this task", "Execute the main work", "Review and document"]; 
    }
    
    const newTask = {
        id: Date.now() + '_' + Math.random(),
        title: btn.dataset.title,
        domain: btn.dataset.domain,
        difficulty: btn.dataset.difficulty,
        xp: parseInt(btn.dataset.xp),
        repeatability: 'One-time',
        priority: 'Important',
        energy: 'Standard Focus',
        steps: stepsArray.map(function(text) { return { text: text, completed: false }; }),
        notes: '',
        startedAt: new Date().toISOString(),
        completed: false
    };
    
    state.activeTasks.push(newTask);
    pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask });
    saveState();
    renderAll();
    showReward('Added: ' + newTask.title, 0, 0);
}

function renderAvatar() {
    const nameInput = document.getElementById('avatarName');
    if (nameInput) {
        nameInput.value = state.avatar.name;
        nameInput.onchange = function(e) {
            state.avatar.name = e.target.value;
            const nameText = document.getElementById('avatarNameText');
            if (nameText) nameText.textContent = state.avatar.name.substring(0, 15);
            saveState();
        };
    }
    
    const nameText = document.getElementById('avatarNameText');
    if (nameText) nameText.textContent = state.avatar.name.substring(0, 15);
    
    const mult = getMultipliers();
    const xpMultEl = document.getElementById('xpMult');
    const coinMultEl = document.getElementById('coinMult');
    if (xpMultEl) xpMultEl.innerText = mult.xpMult.toFixed(2);
    if (coinMultEl) coinMultEl.innerText = mult.coinMult.toFixed(2);
    
    const totalXPEarned = state.completedHistory.reduce(function(sum, h) { return sum + (h.xpGained || 0); }, 0);
    const missionsCompleted = state.completedHistory.length;
    const totalXPEarnedEl = document.getElementById('totalXPEarned');
    const missionsCompletedEl = document.getElementById('missionsCompleted');
    if (totalXPEarnedEl) totalXPEarnedEl.innerText = totalXPEarned;
    if (missionsCompletedEl) missionsCompletedEl.innerText = missionsCompleted;
    
    // Equipped gear
    const equippedContainer = document.getElementById('equippedList');
    if (equippedContainer) {
        if (!state.avatar.equipped || state.avatar.equipped.length === 0) {
            equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Visit the Shop!</div>';
        } else {
            let gearHtml = '';
            for (let i = 0; i < state.avatar.equipped.length; i++) {
                const itemId = state.avatar.equipped[i];
                const item = SHOP_ITEMS.find(function(it) { return it.id === itemId; });
                gearHtml += `<div class="gear-item">${item ? item.name : itemId} 
                    <button class="unequip-btn" data-item="${itemId}">✖</button></div>`;
            }
            equippedContainer.innerHTML = gearHtml;
            
            const unequipBtns = document.querySelectorAll('.unequip-btn');
            for (let i = 0; i < unequipBtns.length; i++) {
                unequipBtns[i].onclick = function() {
                    const itemId = this.dataset.item;
                    state.avatar.equipped = state.avatar.equipped.filter(function(id) { return id !== itemId; });
                    saveState();
                    renderAvatar();
                    showReward('Unequipped item', 0, 0);
                };
            }
        }
    }
    
    // Inventory
    const inventoryContainer = document.getElementById('inventoryList');
    if (inventoryContainer) {
        const ownedNotEquipped = (state.avatar.inventory || []).filter(function(id) {
            return !(state.avatar.equipped || []).includes(id);
        });
        if (ownedNotEquipped.length === 0) {
            inventoryContainer.innerHTML = '<div class="gear-item">No items in inventory. Buy from Shop!</div>';
        } else {
            let invHtml = '';
            for (let i = 0; i < ownedNotEquipped.length; i++) {
                const itemId = ownedNotEquipped[i];
                const item = SHOP_ITEMS.find(function(it) { return it.id === itemId; });
                invHtml += `<div class="gear-item">${item ? item.name : itemId} 
                    <button class="equip-btn" data-item="${itemId}">⚔️ Equip</button></div>`;
            }
            inventoryContainer.innerHTML = invHtml;
            
            const equipBtns = document.querySelectorAll('.equip-btn');
            for (let i = 0; i < equipBtns.length; i++) {
                equipBtns[i].onclick = function() {
                    const itemId = this.dataset.item;
                    if (!state.avatar.equipped.includes(itemId)) {
                        state.avatar.equipped.push(itemId);
                        saveState();
                        renderAvatar();
                        const item = SHOP_ITEMS.find(function(it) { return it.id === itemId; });
                        showReward('Equipped ' + (item ? item.name : itemId), 0, 0);
                    }
                };
            }
        }
    }
}

function renderShop() {
    const container = document.getElementById('shopItemsList');
    const coinsSpan = document.getElementById('shopCoins');
    if (coinsSpan) coinsSpan.innerText = state.coins;
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < SHOP_ITEMS.length; i++) {
        const item = SHOP_ITEMS[i];
        const owned = state.avatar.inventory ? state.avatar.inventory.includes(item.id) : false;
        const equipped = state.avatar.equipped ? state.avatar.equipped.includes(item.id) : false;
        html += `
            <div class="shop-item">
                <h4>${item.name}</h4>
                <p class="price">💰 ${item.cost} coins</p>
                <p class="effect">${item.description}</p>
                <p class="effect">${item.effect.xpMult > 1 ? '⚔️ +' + Math.round((item.effect.xpMult - 1) * 100) + '% XP' : ''} ${item.effect.coinMult > 1 ? '💰 +' + Math.round((item.effect.coinMult - 1) * 100) + '% Coins' : ''}</p>
                ${owned ? `<button class="buy-btn" disabled ${equipped ? 'style="background:#444"' : ''}>${equipped ? '✓ Equipped' : '✓ Owned'}</button>` :
                  `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">Purchase (${item.cost}💰)</button>`}
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    const buyBtns = document.querySelectorAll('.buy-btn[data-id]');
    for (let i = 0; i < buyBtns.length; i++) {
        buyBtns[i].onclick = function() {
            const itemId = this.dataset.id;
            const cost = parseInt(this.dataset.cost);
            const item = SHOP_ITEMS.find(function(it) { return it.id === itemId; });
            
            if (state.coins >= cost) {
                state.coins -= cost;
                if (!state.avatar.inventory) state.avatar.inventory = [];
                state.avatar.inventory.push(itemId);
                showReward('Purchased: ' + item.name, 0, -cost);
                saveState();
                renderShop();
                renderAvatar();
            } else {
                showReward('Not enough coins! Need ' + (cost - state.coins) + ' more', 0, 0);
            }
        };
    }
}

function renderHistory() {
    const container = document.getElementById('weeklyHistory');
    if (!container) return;
    
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        let d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().slice(0,10));
    }
    
    let html = '';
    for (let i = 0; i < last7Days.length; i++) {
        const day = last7Days[i];
        const dayCompletions = state.completedHistory.filter(function(h) {
            return h.completedAt && h.completedAt.slice(0,10) === day;
        });
        html += `<div class="ak-card"><h3>📅 ${day}</h3><ul>`;
        if (dayCompletions.length === 0) {
            html += '<li>✨ No missions completed</li>';
        } else {
            for (let j = 0; j < dayCompletions.length; j++) {
                const c = dayCompletions[j];
                html += `<li>✅ ${escapeHtml(c.title)} (+${c.xpGained} XP, +${c.coinsGained || 0} coins)`;
                if (c.notes) html += `<br><span style="font-size:0.8rem; color:#888;">📝 ${escapeHtml(c.notes.substring(0, 100))}${c.notes.length > 100 ? '...' : ''}</span>`;
                html += `</li>`;
            }
        }
        html += `</ul></div>`;
    }
    container.innerHTML = html;
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < ACHIEVEMENTS.length; i++) {
        const ach = ACHIEVEMENTS[i];
        const unlocked = state.unlockedAchievements.includes(ach.id);
        html += `
            <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${unlocked ? '🏆' : '🔒'}</div>
                <h4>${ach.name}</h4>
                <p>${ach.description}</p>
                <small>${ach.xpReward} XP</small>
                ${unlocked ? '<small>✓ Unlocked</small>' : '<small>' + ach.requirement + '</small>'}
            </div>
        `;
    }
    container.innerHTML = html;
}

function generateReport() {
    const mult = getMultipliers();
    const totalXPEarned = state.completedHistory.reduce(function(sum, h) { return sum + (h.xpGained || 0); }, 0);
    
    let report = '═══════════════════════════════════════════\n';
    report += '              🌙 AKATSUKI MISSION REPORT\n';
    report += '═══════════════════════════════════════════\n\n';
    report += '📅 GENERATED: ' + new Date().toLocaleString() + '\n';
    report += '👤 SCHOLAR: ' + state.avatar.name + '\n';
    report += '🏆 LEVEL: ' + state.level + ' | XP: ' + state.xp + ' | STREAK: ' + state.streak + ' days\n';
    report += '💰 COINS: ' + state.coins + ' | MULTIPLIERS: ' + mult.xpMult.toFixed(2) + 'x XP\n\n';
    
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += '📊 LIFETIME STATISTICS\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += 'Total Missions Completed: ' + state.completedHistory.length + '\n';
    report += 'Total XP Earned: ' + totalXPEarned + '\n';
    report += 'Current Streak: ' + state.streak + ' days\n\n';
    
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    report += '📜 COMPLETED MISSIONS\n';
    report += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
    
    if (state.completedHistory.length === 0) {
        report += 'No missions completed yet.\n\n';
    } else {
        for (let i = 0; i < state.completedHistory.length; i++) {
            const c = state.completedHistory[i];
            report += (i + 1) + '. ' + c.title + '\n';
            report += '   📅 Completed: ' + new Date(c.completedAt).toLocaleString() + '\n';
            report += '   🎯 XP Gained: ' + c.xpGained + ' | 💰 Coins: ' + (c.coinsGained || 0) + '\n';
            if (c.notes) report += '   📝 Notes: ' + c.notes + '\n';
            report += '\n';
        }
    }
    
    report += '\n💪 "The shadows remember every step you take."\n';
    report += '═══════════════════════════════════════════\n';
    
    const reportOutput = document.getElementById('reportOutput');
    if (reportOutput) {
        reportOutput.innerText = report;
        reportOutput.style.display = 'block';
        
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'akatsuki_report_' + new Date().toISOString().slice(0,10) + '.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
}

function batchImport() {
    const textarea = document.getElementById('batchImport');
    if (!textarea) return;
    
    const text = textarea.value;
    const lines = text.split('\n');
    let imported = 0;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split('|').map(function(p) { return p.trim(); });
        if (parts.length >= 2) {
            const title = parts[0];
            const domain = parts[1] || 'General';
            const difficulty = parts[2] || 'Medium';
            const xp = parseInt(parts[3]) || 30;
            const stepsText = parts[4] || 'Plan task,Execute work,Review results';
            const stepArray = stepsText.split(',');
            const steps = [];
            for (let s = 0; s < stepArray.length; s++) {
                steps.push({ text: stepArray[s].trim(), completed: false });
            }
            
            state.activeTasks.push({
                id: Date.now() + '_' + Math.random(),
                title: title,
                domain: domain,
                difficulty: difficulty,
                xp: xp,
                repeatability: 'One-time',
                priority: 'Important',
                energy: 'Standard Focus',
                steps: steps,
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            });
            imported++;
        }
    }
    
    if (imported > 0) {
        saveState();
        renderAll();
        showReward('Imported ' + imported + ' tasks!', 0, 0);
        textarea.value = '';
    } else {
        showReward('No valid tasks found. Use format: Title | Domain | Difficulty | XP | Step1, Step2', 0, 0);
    }
}

function exportData() {
    const exportData = {
        version: '2.0.0',
        exportDate: new Date().toISOString(),
        state: {
            xp: state.xp,
            coins: state.coins,
            level: state.level,
            streak: state.streak,
            lastResetDate: state.lastResetDate,
            lastWeeklyResetDate: state.lastWeeklyResetDate,
            activeTasks: state.activeTasks,
            completedHistory: state.completedHistory,
            avatar: state.avatar,
            unlockedAchievements: state.unlockedAchievements
        }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'akatsuki_save_' + new Date().toISOString().slice(0,10) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showReward('Data exported!', 0, 0);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (imported.state) {
                state.xp = imported.state.xp || 0;
                state.coins = imported.state.coins || 150;
                state.level = imported.state.level || 1;
                state.streak = imported.state.streak || 0;
                state.lastResetDate = imported.state.lastResetDate || getTodayStr();
                state.lastWeeklyResetDate = imported.state.lastWeeklyResetDate || getLastMonday();
                state.activeTasks = imported.state.activeTasks || [];
                state.completedHistory = imported.state.completedHistory || [];
                state.avatar = imported.state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
                state.unlockedAchievements = imported.state.unlockedAchievements || [];
                
                saveState();
                renderAll();
                showReward('Data imported successfully!', 0, 0);
            } else {
                showReward('Invalid save file format', 0, 0);
            }
        } catch(err) {
            showReward('Error importing data', 0, 0);
        }
    };
    reader.readAsText(file);
}

// ============================================================
// SETUP FUNCTIONS
// ============================================================

function setupFilters() {
    const domains = ['PhD', 'Skool', 'Curriculum', 'Research Assistantship', 'Documentation', 'Rituals'];
    const difficulties = ['Easy', 'Medium', 'Hard', 'Elite'];
    const priorities = ['Critical', 'Important', 'Maintenance'];
    
    const domainSelect = document.getElementById('filterDomain');
    if (domainSelect) {
        let options = '<option value="">All Domains</option>';
        for (let i = 0; i < domains.length; i++) {
            options += '<option value="' + domains[i] + '">' + domains[i] + '</option>';
        }
        domainSelect.innerHTML = options;
        domainSelect.addEventListener('change', function() { renderActiveMissions(); });
    }
    
    const bankDomainSelect = document.getElementById('bankDomainFilter');
    if (bankDomainSelect) {
        let options = '<option value="">All Themes</option>';
        for (let i = 0; i < domains.length; i++) {
            options += '<option value="' + domains[i] + '">' + domains[i] + '</option>';
        }
        bankDomainSelect.innerHTML = options;
        bankDomainSelect.addEventListener('change', function() { renderTaskBank(); });
    }
    
    const diffSelect = document.getElementById('filterDifficulty');
    if (diffSelect) {
        let options = '<option value="">All Difficulties</option>';
        for (let i = 0; i < difficulties.length; i++) {
            options += '<option value="' + difficulties[i] + '">' + difficulties[i] + '</option>';
        }
        diffSelect.innerHTML = options;
        diffSelect.addEventListener('change', function() { renderActiveMissions(); });
    }
    
    const bankDiffSelect = document.getElementById('bankDifficultyFilter');
    if (bankDiffSelect) {
        let options = '<option value="">All Difficulties</option>';
        for (let i = 0; i < difficulties.length; i++) {
            options += '<option value="' + difficulties[i] + '">' + difficulties[i] + '</option>';
        }
        bankDiffSelect.innerHTML = options;
        bankDiffSelect.addEventListener('change', function() { renderTaskBank(); });
    }
    
    const prioritySelect = document.getElementById('filterPriority');
    if (prioritySelect) {
        let options = '<option value="">All Priorities</option>';
        for (let i = 0; i < priorities.length; i++) {
            options += '<option value="' + priorities[i] + '">' + priorities[i] + '</option>';
        }
        prioritySelect.innerHTML = options;
        prioritySelect.addEventListener('change', function() { renderActiveMissions(); });
    }
    
    const bankSearch = document.getElementById('bankSearch');
    if (bankSearch) {
        bankSearch.addEventListener('input', function() { renderTaskBank(); });
    }
}

function setupEventListeners() {
    // Tab switching
    const tabBtns = document.querySelectorAll('.ak-tab-btn');
    for (let i = 0; i < tabBtns.length; i++) {
        tabBtns[i].addEventListener('click', function() {
            const tabId = this.dataset.tab;
            const allTabs = document.querySelectorAll('.ak-tab');
            for (let j = 0; j < allTabs.length; j++) {
                allTabs[j].classList.remove('active');
            }
            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
            
            const allBtns = document.querySelectorAll('.ak-tab-btn');
            for (let j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
        });
    }
    
    // Undo/Redo
    const undoBtn = document.getElementById('undoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() { undo(); renderAll(); });
    }
    
    const redoBtn = document.getElementById('redoBtn');
    if (redoBtn) {
        redoBtn.addEventListener('click', function() { redo(); renderAll(); });
    }
    
    // Reset buttons
    const forceResetBtn = document.getElementById('forceResetBtn');
    if (forceResetBtn) {
        forceResetBtn.addEventListener('click', function() {
            state.lastResetDate = getTodayStr();
            checkAndRegenerateTasks();
            saveState();
            renderAll();
            showReward('Daily reset completed!', 0, 0);
        });
    }
    
    const forceWeeklyResetBtn = document.getElementById('forceWeeklyResetBtn');
    if (forceWeeklyResetBtn) {
        forceWeeklyResetBtn.addEventListener('click', function() {
            state.lastWeeklyResetDate = getLastMonday();
            checkAndRegenerateTasks();
            saveState();
            renderAll();
            showReward('Weekly reset completed!', 0, 0);
        });
    }
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', function() {
            if (confirm('⚠️ WIPE ALL PROGRESS? This cannot be undone.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    // Report buttons
    const exportReportBtn = document.getElementById('exportReportBtn');
    if (exportReportBtn) {
        exportReportBtn.addEventListener('click', generateReport);
    }
    
    const generateReportBtn = document.getElementById('generateReportBtn');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', generateReport);
    }
    
    // Quick generate
    const genQuickBtn = document.getElementById('genQuickBtn');
    if (genQuickBtn) {
        genQuickBtn.addEventListener('click', function() {
            const generatorTab = document.querySelector('.ak-tab-btn[data-tab="generator"]');
            if (generatorTab) generatorTab.click();
        });
    }
    
    // Batch import
    const batchImportBtn = document.getElementById('batchImportBtn');
    if (batchImportBtn) {
        batchImportBtn.addEventListener('click', function() {
            const generatorTab = document.querySelector('.ak-tab-btn[data-tab="generator"]');
            if (generatorTab) generatorTab.click();
        });
    }
    
    const batchImportExecute = document.getElementById('batchImportExecute');
    if (batchImportExecute) {
        batchImportExecute.addEventListener('click', batchImport);
    }
    
    // Data export/import
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', exportData);
    }
    
    const importDataBtn = document.getElementById('importDataBtn');
    if (importDataBtn) {
        importDataBtn.addEventListener('click', function() {
            document.getElementById('importDataInput').click();
        });
    }
    
    const importDataInput = document.getElementById('importDataInput');
    if (importDataInput) {
        importDataInput.addEventListener('change', function(e) {
            if (e.target.files[0]) importData(e.target.files[0]);
        });
    }
    
    // Task Generator - Single task
    const generateSingleBtn = document.getElementById('generateSingleBtn');
    if (generateSingleBtn) {
        generateSingleBtn.addEventListener('click', function() {
            const goal = document.getElementById('genGoal').value;
            if (!goal) {
                alert('Enter a goal first');
                return;
            }
            
            const theme = document.getElementById('genTheme').value || 'Shadow Research Missions';
            const difficulty = document.getElementById('genDifficulty').value || 'Medium';
            const priority = document.getElementById('genPriority').value || 'Important';
            const energy = document.getElementById('genEnergy').value || 'Standard Focus';
            const repeatability = document.getElementById('genRepeatability').value || 'One-time';
            
            const xpValue = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : difficulty === 'Hard' ? 90 : 200;
            
            const steps = [
                'Clarify scope: ' + goal.substring(0, 50),
                'Break down into sub-tasks',
                'Execute main work',
                'Review and document results'
            ];
            
            const generatedTask = {
                id: Date.now() + '_' + Math.random(),
                title: goal,
                domain: theme,
                difficulty: difficulty,
                xp: xpValue,
                repeatability: repeatability,
                priority: priority,
                energy: energy,
                steps: steps.map(function(text) { return { text: text, completed: false }; }),
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            };
            
            const previewDiv = document.getElementById('generatedPreview');
            if (previewDiv) {
                let stepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                for (let i = 0; i < steps.length; i++) {
                    stepsHtml += '<li>' + escapeHtml(steps[i]) + '</li>';
                }
                stepsHtml += '</ul>';
                previewDiv.innerHTML = `
                    <div class="mission-item">
                        <div class="mission-header">
                            <strong>📋 ${escapeHtml(goal)}</strong>
                            <div class="mission-badge">
                                <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                            </div>
                        </div>
                        <div class="mission-meta">
                            <span>📁 ${theme}</span>
                            <span>⭐ ${xpValue} XP</span>
                        </div>
                        ${stepsHtml}
                    </div>
                `;
            }
            
            window.lastGeneratedTask = generatedTask;
            const addBtn = document.getElementById('addGeneratedBtn');
            if (addBtn) addBtn.style.display = 'inline-block';
        });
    }
    
    // Add generated task button
    const addGeneratedBtn = document.getElementById('addGeneratedBtn');
    if (addGeneratedBtn) {
        addGeneratedBtn.addEventListener('click', function() {
            if (window.lastGeneratedTask) {
                state.activeTasks.push(window.lastGeneratedTask);
                pushUndo({ type: 'addTask', taskId: window.lastGeneratedTask.id, task: window.lastGeneratedTask });
                saveState();
                renderAll();
                document.getElementById('generatedPreview').innerHTML = '';
                addGeneratedBtn.style.display = 'none';
                showReward('Added: ' + window.lastGeneratedTask.title, 0, 0);
                window.lastGeneratedTask = null;
            }
        });
    }
    
    // Theme dropdown
    const themeSelect = document.getElementById('genTheme');
    if (themeSelect) {
        const themes = [
            'Shadow Research Missions',
            'Village Knowledge Expansion',
            'Clan Leadership & Skool Community',
            'Intelligence Gathering',
            'Eternal Documentation Scrolls',
            'Discipline & Rituals'
        ];
        let options = '';
        for (let i = 0; i < themes.length; i++) {
            options += '<option value="' + themes[i] + '">' + themes[i] + '</option>';
        }
        themeSelect.innerHTML = options;
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

function initApp() {
    console.log('Initializing Akatsuki Quest...');
    
    loadState();
    setupFilters();
    setupEventListeners();
    renderAll();
    
    console.log('🎯 Akatsuki Quest Ready!', { 
        tasks: state.activeTasks.filter(function(t) { return !t.completed; }).length,
        coins: state.coins,
        level: state.level
    });
}
