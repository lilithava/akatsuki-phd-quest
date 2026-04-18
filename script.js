/**
 * Akatsuki PhD Quest - Main Application
 * Version: 2.0.1
 * 
 * Fixed: Proper load ordering, defensive checks, DOM ready handling
 */

// Wait for DOM to be fully ready before doing anything
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, waiting for dependencies...');
    
    // Check if dependencies are loaded, if not wait for them
    function checkDependenciesAndInit() {
        const taskGeneratorReady = typeof AkatsukiTaskGenerator !== 'undefined';
        const avatarRendererReady = typeof AkatsukiAvatarRenderer !== 'undefined';
        const dataLoaded = window.AK_DATA && Object.keys(window.AK_DATA).length > 0;
        
        console.log('Dependency status:', { taskGeneratorReady, avatarRendererReady, dataLoaded });
        
        if (taskGeneratorReady && avatarRendererReady && dataLoaded) {
            console.log('All dependencies ready, initializing app...');
            initApp();
        } else {
            console.log('Waiting for dependencies...');
            setTimeout(checkDependenciesAndInit, 100);
        }
    }
    
    // Start checking after a short delay to let scripts load
    setTimeout(checkDependenciesAndInit, 200);
});

// Shop items (fallback if data not loaded)
const DEFAULT_SHOP_ITEMS = [
    { id: 'cloak_basic', name: 'Akatsuki Cloak', slot: 'cloak', cost: 150, effect: { xpMult: 1.05, coinMult: 1.0 }, description: '+5% XP' },
    { id: 'mask_anbu', name: 'ANBU Mask', slot: 'mask', cost: 100, effect: { xpMult: 1.03, coinMult: 1.0 }, description: '+3% XP' },
    { id: 'ring_akatsuki', name: 'Akatsuki Ring', slot: 'accessory_left', cost: 80, effect: { xpMult: 1.02, coinMult: 1.02 }, description: '+2% XP, +2% Coins' },
    { id: 'companion_raven', name: 'Raven Companion', slot: 'companion', cost: 200, effect: { xpMult: 1.1, coinMult: 1.0 }, description: '+10% XP' },
    { id: 'aura_crimson', name: 'Crimson Aura', slot: 'aura', cost: 120, effect: { xpMult: 1.0, coinMult: 1.1 }, description: '+10% Coins' }
];

// Achievements
const DEFAULT_ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first mission', requirement: 'Complete 1 mission', xpReward: 50 },
    { id: 'crimson_streak', name: 'Crimson Streak', description: 'Maintain 14-day streak', requirement: '14 day streak', xpReward: 200 }
];

// Daily recurring tasks
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

// Global state
let state = {
    xp: 0,
    coins: 150,
    level: 1,
    streak: 0,
    lastResetDate: null,
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

let taskGenerator = null;
let avatarRenderer = null;

// Helper functions
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
        setTimeout(() => toast.classList.remove('show'), 2000);
    }
    renderHeader();
    renderDashboard();
    updateXPBar();
}

function getMultipliers() {
    let xpMult = 1.0;
    let coinMult = 1.0;
    if (state.avatar.equipped && state.avatar.equipped.length > 0) {
        const shopItems = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
        state.avatar.equipped.forEach(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            if (item && item.effect) {
                xpMult *= (item.effect.xpMult || 1);
                coinMult *= (item.effect.coinMult || 1);
            }
        });
    }
    return { xpMult, coinMult };
}

function updateXPLevel() {
    const xpPerLevel = window.AK_DATA?.rules?.xpRules?.xpPerLevel || 500;
    const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
    if (newLevel > state.level) {
        const bonus = 100;
        state.coins += bonus;
        showReward(`Level Up! You reached level ${newLevel}`, 0, bonus);
        if (avatarRenderer && typeof avatarRenderer.triggerLevelUp === 'function') {
            avatarRenderer.triggerLevelUp();
        }
    }
    state.level = newLevel;
    updateStreak();
    updateXPBar();
}

function updateXPBar() {
    const xpPerLevel = window.AK_DATA?.rules?.xpRules?.xpPerLevel || 500;
    const currentLevelXp = (state.level - 1) * xpPerLevel;
    const nextLevelXp = state.level * xpPerLevel;
    const progress = ((state.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    
    const xpFill = document.getElementById('xpFill');
    if (xpFill) xpFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    
    const xpCurrent = document.getElementById('xpCurrent');
    const xpNext = document.getElementById('xpNext');
    const nextLevelSpan = document.getElementById('nextLevel');
    if (xpCurrent) xpCurrent.innerText = state.xp;
    if (xpNext) xpNext.innerText = nextLevelXp;
    if (nextLevelSpan) nextLevelSpan.innerText = state.level + 1;
}

function updateStreak() {
    const completionsByDate = {};
    state.completedHistory.forEach(h => {
        const date = h.completedAt?.slice(0,10) || h.date;
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
    const allStepsDone = task.steps.every(s => s.completed);
    if (allStepsDone && !task.completed) {
        completeTask(task.id);
    }
}

function completeTask(taskId) {
    const task = state.activeTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    const { xpMult, coinMult } = getMultipliers();
    let baseXp = task.xp || 30;
    let baseCoins = Math.floor(baseXp * 0.2);
    
    const xpGain = Math.floor(baseXp * xpMult);
    const coinGain = Math.floor(baseCoins * coinMult);
    
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
        steps: task.steps.map(s => ({ text: s.text, completed: s.completed }))
    });
    
    showReward(`Completed: ${task.title}`, xpGain, coinGain);
    pushUndo({ type: 'completeTask', taskId, xpGain, coinGain });
    updateXPLevel();
    saveState();
    checkAchievements();
    renderAll();
}

function checkAndRegenerateTasks() {
    if (!state.lastResetDate) state.lastResetDate = getTodayStr();
    if (!state.lastWeeklyResetDate) state.lastWeeklyResetDate = getLastMonday();
    
    const today = getTodayStr();
    const todayDate = new Date(today);
    const lastResetDate = new Date(state.lastResetDate);
    
    if (todayDate > lastResetDate) {
        // Remove completed daily tasks
        state.activeTasks = state.activeTasks.filter(t => {
            if (t.repeatability === 'Daily' && t.completed) return false;
            return true;
        });
        
        // Add fresh daily tasks
        DAILY_TASKS.forEach(taskTemplate => {
            const existingDaily = state.activeTasks.find(t => t.title === taskTemplate.title && t.repeatability === 'Daily' && !t.completed);
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
                    steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false })),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false
                });
            }
        });
        state.lastResetDate = today;
    }
    
    const thisMonday = getLastMonday();
    if (thisMonday > state.lastWeeklyResetDate) {
        // Remove completed weekly tasks
        state.activeTasks = state.activeTasks.filter(t => {
            if (t.repeatability === 'Weekly' && t.completed) return false;
            return true;
        });
        
        // Add fresh weekly tasks
        WEEKLY_TASKS.forEach(taskTemplate => {
            const existingWeekly = state.activeTasks.find(t => t.title === taskTemplate.title && t.repeatability === 'Weekly' && !t.completed);
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
                    steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false })),
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
        const task = state.activeTasks.find(t => t.id === action.taskId);
        if (task && task.steps[action.stepIndex]) {
            task.steps[action.stepIndex].completed = action.oldState;
            updateTaskCompletion(task);
        }
    } else if (action.type === 'completeTask') {
        const task = state.activeTasks.find(t => t.id === action.taskId);
        if (task) {
            task.completed = false;
            task.finishedAt = null;
            state.xp -= action.xpGain;
            state.coins -= action.coinGain;
            state.completedHistory = state.completedHistory.filter(h => h.taskId !== action.taskId);
        }
    } else if (action.type === 'addTask') {
        state.activeTasks = state.activeTasks.filter(t => t.id !== action.taskId);
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
        const task = state.activeTasks.find(t => t.id === action.taskId);
        if (task && task.steps[action.stepIndex]) {
            task.steps[action.stepIndex].completed = !action.oldState;
            updateTaskCompletion(task);
        }
    } else if (action.type === 'completeTask') {
        const task = state.activeTasks.find(t => t.id === action.taskId);
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
    const achievements = window.AK_DATA?.achievements?.achievements || DEFAULT_ACHIEVEMENTS;
    let changed = false;
    
    achievements.forEach(ach => {
        if (state.unlockedAchievements.includes(ach.id)) return;
        
        let unlocked = false;
        if (ach.id === 'first_blood' && state.completedHistory.length >= 1) unlocked = true;
        if (ach.id === 'crimson_streak' && state.streak >= 14) unlocked = true;
        
        if (unlocked) {
            state.unlockedAchievements.push(ach.id);
            state.xp += ach.xpReward || 0;
            showReward(`🏆 Achievement: ${ach.name} (+${ach.xpReward || 0} XP)`, ach.xpReward || 0, 0);
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
            state.activeTasks = (state.activeTasks || []).map(t => ({
                ...t,
                steps: (t.steps || []).map(s => typeof s === 'string' ? { text: s, completed: false } : s)
            }));
            state.completedHistory = state.completedHistory || [];
            state.unlockedAchievements = state.unlockedAchievements || [];
            state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
        } catch(e) { console.error('Error loading state:', e); }
    }
    
    if (!state.lastResetDate) state.lastResetDate = getTodayStr();
    if (!state.lastWeeklyResetDate) state.lastWeeklyResetDate = getLastMonday();
    
    checkAndRegenerateTasks();
    
    if (state.activeTasks.length === 0) {
        DAILY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: Date.now() + '_' + Math.random(),
                title: taskTemplate.title,
                domain: taskTemplate.domain,
                difficulty: taskTemplate.difficulty,
                xp: taskTemplate.xp,
                repeatability: 'Daily',
                priority: taskTemplate.priority,
                energy: taskTemplate.energy,
                steps: taskTemplate.steps.map(text => ({ text, completed: false })),
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
    renderSettings();
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
    const activeCount = state.activeTasks.filter(t => !t.completed).length;
    const completedToday = state.completedHistory.filter(h => 
        h.completedAt?.slice(0,10) === getTodayStr()
    ).length;
    
    const activeCountEl = document.getElementById('activeCount');
    const completedTodayEl = document.getElementById('completedToday');
    const totalXPEl = document.getElementById('totalXP');
    const streakDisplayEl = document.getElementById('streakDisplay');
    
    if (activeCountEl) activeCountEl.innerText = activeCount;
    if (completedTodayEl) completedTodayEl.innerText = completedToday;
    if (totalXPEl) totalXPEl.innerText = state.xp;
    if (streakDisplayEl) streakDisplayEl.innerText = state.streak;
    
    const hasImportant = state.activeTasks.some(t => t.completed && (t.priority === 'Critical' || t.priority === 'Important'));
    const hasRitual = state.activeTasks.some(t => t.completed && t.domain === 'Rituals');
    const hasDoc = state.activeTasks.some(t => t.completed && t.domain === 'Documentation');
    
    const winImportant = document.getElementById('winImportant');
    const winRitual = document.getElementById('winRitual');
    const winDoc = document.getElementById('winDoc');
    const winResult = document.getElementById('winResult');
    
    if (winImportant) winImportant.innerHTML = hasImportant ? '✅' : '⬜';
    if (winRitual) winRitual.innerHTML = hasRitual ? '✅' : '⬜';
    if (winDoc) winDoc.innerHTML = hasDoc ? '✅' : '⬜';
    if (winResult) {
        winResult.innerHTML = (hasImportant && hasRitual && hasDoc) ? '✅ WIN THE DAY!' : '❌ NOT YET';
        winResult.style.color = (hasImportant && hasRitual && hasDoc) ? '#00cc66' : '#888';
    }
}

function renderActiveMissions() {
    const container = document.getElementById('activeMissionsList');
    if (!container) return;
    
    let filteredTasks = state.activeTasks;
    const showAll = document.getElementById('filterStatus')?.value === 'all';
    if (!showAll) filteredTasks = filteredTasks.filter(t => !t.completed);
    
    const domainFilter = document.getElementById('filterDomain')?.value || '';
    const difficultyFilter = document.getElementById('filterDifficulty')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    
    if (domainFilter) filteredTasks = filteredTasks.filter(t => t.domain === domainFilter);
    if (difficultyFilter) filteredTasks = filteredTasks.filter(t => t.difficulty === difficultyFilter);
    if (priorityFilter) filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
    
    if (filteredTasks.length === 0) {
        container.innerHTML = '<div class="ak-card">✨ No missions. Generate some from the Task Bank or Generator!</div>';
        return;
    }
    
    container.innerHTML = filteredTasks.map(task => `
        <div class="mission-item" data-task-id="${task.id}">
            <div class="mission-header">
                <div class="mission-title">${escapeHtml(task.title)}</div>
                <div class="mission-badge">
                    <span class="badge ${(task.difficulty || 'medium').toLowerCase()}">${task.difficulty || 'Medium'}</span>
                    <span class="badge ${(task.priority || 'normal').toLowerCase()}">${task.priority || 'Normal'}</span>
                    ${task.completed ? '<span class="badge" style="background:#00cc66">✓ COMPLETED</span>' : ''}
                </div>
            </div>
            <div class="mission-meta">
                <span>📁 ${task.domain || 'General'}</span>
                <span>🔄 ${task.repeatability || 'One-time'}</span>
                <span>⭐ ${task.xp || 30} XP</span>
            </div>
            <ul class="step-list">
                ${task.steps.map((step, idx) => `
                    <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                        <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                        <label class="step-label">${escapeHtml(step.text)}</label>
                        <button class="step-edit-btn" data-step-idx="${idx}">✏️</button>
                    </li>
                `).join('')}
            </ul>
            <div class="mission-actions">
                <button class="step-add-btn">+ Add Step</button>
                <button class="edit-task-btn">✏️ Edit Task</button>
                <button class="view-task-details">📝 Details</button>
            </div>
        </div>
    `).join('');
    
    attachMissionEventListeners();
}

function attachMissionEventListeners() {
    // Step checkboxes
    document.querySelectorAll('.step-checkbox').forEach(cb => {
        cb.removeEventListener('change', handleStepToggle);
        cb.addEventListener('change', handleStepToggle);
    });
    
    // Step edit buttons
    document.querySelectorAll('.step-edit-btn').forEach(btn => {
        btn.removeEventListener('click', handleStepEditClick);
        btn.addEventListener('click', handleStepEditClick);
    });
    
    // Add step buttons
    document.querySelectorAll('.step-add-btn').forEach(btn => {
        btn.removeEventListener('click', handleAddStep);
        btn.addEventListener('click', handleAddStep);
    });
    
    // Edit task buttons
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
        btn.removeEventListener('click', handleEditTask);
        btn.addEventListener('click', handleEditTask);
    });
    
    // Details buttons
    document.querySelectorAll('.view-task-details').forEach(btn => {
        btn.removeEventListener('click', handleDetailsClick);
        btn.addEventListener('click', handleDetailsClick);
    });
}

function handleStepToggle(e) {
    const checkbox = e.target;
    const li = checkbox.closest('.step-item');
    const stepIndex = parseInt(li.dataset.stepIndex);
    const missionDiv = li.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    
    const task = state.activeTasks.find(t => t.id === taskId);
    if (task && task.steps[stepIndex]) {
        const oldState = task.steps[stepIndex].completed;
        task.steps[stepIndex].completed = checkbox.checked;
        
        if (checkbox.checked) {
            li.classList.add('completed');
        } else {
            li.classList.remove('completed');
        }
        
        pushUndo({ type: 'toggleStep', taskId, stepIndex, oldState });
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
    const task = state.activeTasks.find(t => t.id === taskId);
    const step = task?.steps[stepIndex];
    
    if (!step) return;
    
    const newText = prompt('Edit step text:', step.text);
    if (newText && newText.trim()) {
        const oldText = step.text;
        step.text = newText.trim();
        pushUndo({ type: 'editStep', taskId, stepIndex, oldText, newText: step.text });
        saveState();
        renderActiveMissions();
    }
}

function handleAddStep(e) {
    const btn = e.target;
    const missionDiv = btn.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    const newStepText = prompt('Enter new step:');
    
    if (newStepText && newStepText.trim()) {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
            const newStep = { text: newStepText.trim(), completed: false };
            task.steps.push(newStep);
            pushUndo({ type: 'addStep', taskId, stepData: newStep });
            saveState();
            renderActiveMissions();
        }
    }
}

function handleEditTask(e) {
    const btn = e.target;
    const missionDiv = btn.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    const task = state.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newTitle = prompt('Edit task title:', task.title);
    if (newTitle && newTitle.trim()) task.title = newTitle.trim();
    
    const newDifficulty = prompt('Difficulty (Easy/Medium/Hard/Elite):', task.difficulty);
    if (newDifficulty && ['Easy','Medium','Hard','Elite'].includes(newDifficulty)) task.difficulty = newDifficulty;
    
    const newPriority = prompt('Priority (Critical/Important/Maintenance/Optional):', task.priority);
    if (newPriority && ['Critical','Important','Maintenance','Optional'].includes(newPriority)) task.priority = newPriority;
    
    saveState();
    renderActiveMissions();
    showReward(`Task updated: ${task.title}`, 0, 0);
}

function handleDetailsClick(e) {
    const btn = e.target;
    const missionDiv = btn.closest('.mission-item');
    const taskId = missionDiv.dataset.taskId;
    openTaskModal(taskId);
}

function openTaskModal(taskId) {
    const task = state.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('taskModal');
    if (!modal) return;
    
    document.getElementById('modalTitle').innerText = task.title;
    document.getElementById('modalBody').innerHTML = `
        <p><strong>Domain:</strong> ${task.domain || 'General'}</p>
        <p><strong>Difficulty:</strong> ${task.difficulty || 'Medium'}</p>
        <p><strong>XP Reward:</strong> ${task.xp || 30}</p>
        <p><strong>Repeatability:</strong> ${task.repeatability || 'One-time'}</p>
        <p><strong>Started:</strong> ${task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A'}</p>
        <p><strong>Finished:</strong> ${task.finishedAt ? new Date(task.finishedAt).toLocaleString() : 'In progress'}</p>
    `;
    document.getElementById('taskNotes').value = task.notes || '';
    
    const saveBtn = document.getElementById('saveTaskNotes');
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);
    newSaveBtn.onclick = () => {
        task.notes = document.getElementById('taskNotes').value;
        saveState();
        modal.style.display = 'none';
        showReward('Notes saved!', 0, 0);
    };
    
    const deleteBtn = document.getElementById('deleteTaskBtn');
    if (deleteBtn) {
        const newDeleteBtn = deleteBtn.cloneNode(true);
        deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
        newDeleteBtn.onclick = () => {
            if (confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
                state.activeTasks = state.activeTasks.filter(t => t.id !== taskId);
                pushUndo({ type: 'deleteTask', taskId, taskData: task });
                saveState();
                modal.style.display = 'none';
                renderAll();
                showReward(`Deleted: ${task.title}`, 0, 0);
            }
        };
    }
    
    modal.style.display = 'flex';
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
}

function renderTaskBank() {
    const container = document.getElementById('taskBankList');
    if (!container) return;
    
    // Collect tasks from loaded banks
    let allTasks = [];
    const bankKeys = ['phd', 'skool', 'curriculum', 'ra', 'docs', 'rituals'];
    for (const key of bankKeys) {
        const bank = window.AK_DATA[key];
        if (bank && bank.tasks) {
            allTasks.push(...bank.tasks.map(t => ({ ...t, sourceBank: key })));
        }
    }
    
    // Add daily/weekly tasks as templates
    allTasks.push(...DAILY_TASKS.map(t => ({ ...t, sourceBank: 'templates' })));
    allTasks.push(...WEEKLY_TASKS.map(t => ({ ...t, sourceBank: 'templates' })));
    
    const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
    const domainFilter = document.getElementById('bankDomainFilter')?.value || '';
    const difficultyFilter = document.getElementById('bankDifficultyFilter')?.value || '';
    
    let filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
    if (domainFilter) filtered = filtered.filter(t => t.domain === domainFilter);
    if (difficultyFilter) filtered = filtered.filter(t => t.difficulty === difficultyFilter);
    
    if (filtered.length === 0) {
        container.innerHTML = '<div class="ak-card">No tasks found. Use the Generator to create tasks!</div>';
        return;
    }
    
    container.innerHTML = filtered.slice(0, 30).map(t => `
        <div class="mission-item">
            <div class="mission-header">
                <div class="mission-title">${escapeHtml(t.title)}</div>
                <div class="mission-badge">
                    <span class="badge ${(t.difficulty || 'medium').toLowerCase()}">${t.difficulty || 'Medium'}</span>
                </div>
            </div>
            <div class="mission-meta">
                <span>📁 ${t.domain || 'General'}</span>
                <span>⭐ ${t.xp || 30} XP</span>
                ${t.sourceBank ? `<span>📦 ${t.sourceBank}</span>` : ''}
            </div>
            <div class="mission-actions">
                <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain || 'General'}" data-difficulty="${t.difficulty || 'Medium'}" data-xp="${t.xp || 30}" data-steps='${JSON.stringify(t.steps || ["Plan task", "Execute work", "Review results"])}'>+ Add to Active</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.add-from-bank').forEach(btn => {
        btn.removeEventListener('click', handleAddFromBank);
        btn.addEventListener('click', handleAddFromBank);
    });
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
        steps: stepsArray.map(text => ({ text: typeof text === 'string' ? text : text.text || text, completed: false })),
        notes: '',
        startedAt: new Date().toISOString(),
        completed: false
    };
    
    state.activeTasks.push(newTask);
    pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask });
    saveState();
    renderAll();
    showReward(`Added: ${newTask.title}`, 0, 0);
}

function renderAvatar() {
    // Name input
    const nameInput = document.getElementById('avatarName');
    if (nameInput) {
        nameInput.value = state.avatar.name;
        nameInput.onchange = (e) => {
            state.avatar.name = e.target.value;
            saveState();
        };
    }
    
    // Multipliers
    const { xpMult, coinMult } = getMultipliers();
    const xpMultEl = document.getElementById('xpMult');
    const coinMultEl = document.getElementById('coinMult');
    if (xpMultEl) xpMultEl.innerText = xpMult.toFixed(2);
    if (coinMultEl) coinMultEl.innerText = coinMult.toFixed(2);
    
    // Stats
    const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
    const missionsCompleted = state.completedHistory.length;
    const totalXPEarnedEl = document.getElementById('totalXPEarned');
    const missionsCompletedEl = document.getElementById('missionsCompleted');
    if (totalXPEarnedEl) totalXPEarnedEl.innerText = totalXPEarned;
    if (missionsCompletedEl) missionsCompletedEl.innerText = missionsCompleted;
    
    // Equipped gear
    const equippedContainer = document.getElementById('equippedList');
    if (equippedContainer) {
        const shopItems = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
        if (!state.avatar.equipped || state.avatar.equipped.length === 0) {
            equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Visit the Shop!</div>';
        } else {
            equippedContainer.innerHTML = state.avatar.equipped.map(itemId => {
                const item = shopItems.find(i => i.id === itemId);
                return `<div class="gear-item">${item ? item.name : itemId} 
                    <button class="unequip-btn" data-item="${itemId}">✖</button></div>`;
            }).join('');
            
            document.querySelectorAll('.unequip-btn').forEach(btn => {
                btn.onclick = () => {
                    state.avatar.equipped = state.avatar.equipped.filter(i => i !== btn.dataset.item);
                    saveState();
                    renderAvatar();
                    showReward(`Unequipped item`, 0, 0);
                };
            });
        }
    }
    
    // Inventory
    const inventoryContainer = document.getElementById('inventoryList');
    if (inventoryContainer) {
        const shopItems = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
        const ownedNotEquipped = (state.avatar.inventory || []).filter(id => !(state.avatar.equipped || []).includes(id));
        if (ownedNotEquipped.length === 0) {
            inventoryContainer.innerHTML = '<div class="gear-item">No items in inventory. Buy from Shop!</div>';
        } else {
            inventoryContainer.innerHTML = ownedNotEquipped.map(itemId => {
                const item = shopItems.find(i => i.id === itemId);
                return `<div class="gear-item">${item ? item.name : itemId} 
                    <button class="equip-btn" data-item="${itemId}">⚔️ Equip</button></div>`;
            }).join('');
            
            document.querySelectorAll('.equip-btn').forEach(btn => {
                btn.onclick = () => {
                    const itemId = btn.dataset.item;
                    if (!state.avatar.equipped.includes(itemId)) {
                        state.avatar.equipped.push(itemId);
                        saveState();
                        renderAvatar();
                        showReward(`Equipped ${shopItems.find(i => i.id === itemId)?.name}`, 0, 0);
                    }
                };
            });
        }
    }
}

function renderShop() {
    const container = document.getElementById('shopItemsList');
    const coinsSpan = document.getElementById('shopCoins');
    if (coinsSpan) coinsSpan.innerText = state.coins;
    if (!container) return;
    
    const shopItems = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
    
    container.innerHTML = shopItems.map(item => {
        const owned = state.avatar.inventory?.includes(item.id);
        const equipped = state.avatar.equipped?.includes(item.id);
        return `
            <div class="shop-item">
                <h4>${item.name}</h4>
                <p class="price">💰 ${item.cost} coins</p>
                <p class="effect">${item.description}</p>
                <p class="effect">${item.effect?.xpMult > 1 ? `⚔️ +${Math.round((item.effect.xpMult - 1) * 100)}% XP` : ''} ${item.effect?.coinMult > 1 ? `💰 +${Math.round((item.effect.coinMult - 1) * 100)}% Coins` : ''}</p>
                ${owned ? `<button class="buy-btn" disabled ${equipped ? 'style="background:#444"' : ''}>${equipped ? '✓ Equipped' : '✓ Owned'}</button>` :
                  `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">Purchase (${item.cost}💰)</button>`}
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.buy-btn[data-id]').forEach(btn => {
        btn.onclick = () => {
            const itemId = btn.dataset.id;
            const cost = parseInt(btn.dataset.cost);
            const shopItemsLocal = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
            const item = shopItemsLocal.find(i => i.id === itemId);
            
            if (state.coins >= cost) {
                state.coins -= cost;
                if (!state.avatar.inventory) state.avatar.inventory = [];
                state.avatar.inventory.push(itemId);
                showReward(`Purchased: ${item.name}`, 0, -cost);
                saveState();
                renderShop();
                renderAvatar();
            } else {
                showReward(`Not enough coins! Need ${cost - state.coins} more`, 0, 0);
            }
        };
    });
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
    for (const day of last7Days) {
        const dayCompletions = state.completedHistory.filter(h => h.completedAt?.slice(0,10) === day);
        html += `<div class="ak-card"><h3>📅 ${day}</h3><ul>`;
        if (dayCompletions.length === 0) {
            html += '<li>✨ No missions completed</li>';
        } else {
            dayCompletions.forEach(c => {
                html += `<li><strong>✅ ${escapeHtml(c.title)}</strong> (+${c.xpGained} XP, +${c.coinsGained || 0} coins)`;
                if (c.notes) html += `<br><span style="font-size:0.8rem; color:#aaa;">📝 ${escapeHtml(c.notes.substring(0, 100))}${c.notes.length > 100 ? '...' : ''}</span>`;
                html += `</li>`;
            });
        }
        html += `</ul></div>`;
    }
    container.innerHTML = html;
}

function renderAchievements() {
    const container = document.getElementById('achievementsList');
    if (!container) return;
    
    const achievements = window.AK_DATA?.achievements?.achievements || DEFAULT_ACHIEVEMENTS;
    
    container.innerHTML = achievements.map(ach => {
        const unlocked = state.unlockedAchievements.includes(ach.id);
        return `
            <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${unlocked ? '🏆' : '🔒'}</div>
                <h4>${ach.name}</h4>
                <p>${ach.description}</p>
                <small>${ach.xpReward || 0} XP</small>
                ${unlocked ? '<small>✓ Unlocked</small>' : `<small>${ach.requirement || 'Complete requirements'}</small>`}
            </div>
        `;
    }).join('');
}

function renderSettings() {
    const container = document.getElementById('dataStatus');
    if (!container) return;
    
    const banks = ['phd', 'skool', 'curriculum', 'ra', 'docs', 'rituals'];
    const statuses = banks.map(bank => {
        const loaded = window.AK_DATA[bank] !== null;
        return `<div>${bank}: ${loaded ? '✅ Loaded' : '⚠️ Missing'}</div>`;
    }).join('');
    
    container.innerHTML = `<div class="ak-card"><h3>Task Banks</h3>${statuses}</div>`;
}

function generateReport() {
    const { xpMult, coinMult } = getMultipliers();
    const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
    const totalCoinsEarned = state.completedHistory.reduce((sum, h) => sum + (h.coinsGained || 0), 0);
    
    let report = `═══════════════════════════════════════════\n`;
    report += `              🌙 AKATSUKI MISSION REPORT\n`;
    report += `═══════════════════════════════════════════\n\n`;
    report += `📅 GENERATED: ${new Date().toLocaleString()}\n`;
    report += `👤 SCHOLAR: ${state.avatar.name}\n`;
    report += `🏆 LEVEL: ${state.level} | XP: ${state.xp} | STREAK: ${state.streak} days\n`;
    report += `💰 COINS: ${state.coins} | MULTIPLIERS: ${xpMult.toFixed(2)}x XP, ${coinMult.toFixed(2)}x Coins\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📊 LIFETIME STATISTICS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total Missions Completed: ${state.completedHistory.length}\n`;
    report += `Total XP Earned: ${totalXPEarned}\n`;
    report += `Total Coins Earned: ${totalCoinsEarned}\n`;
    report += `Current Streak: ${state.streak} days\n`;
    report += `Next Level: ${(state.level * 500) - state.xp} XP needed\n\n`;
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📜 COMPLETED MISSIONS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (state.completedHistory.length === 0) {
        report += `No missions completed yet. Complete your first mission to see it here!\n\n`;
    } else {
        state.completedHistory.forEach((c, idx) => {
            report += `${idx + 1}. ${c.title}\n`;
            report += `   📅 Completed: ${new Date(c.completedAt).toLocaleString()}\n`;
            report += `   🎯 XP Gained: ${c.xpGained} | 💰 Coins: ${c.coinsGained || 0}\n`;
            if (c.notes) {
                report += `   📝 Notes: ${c.notes}\n`;
            }
            report += `\n`;
        });
    }
    
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `⚔️ EQUIPPED GEAR:\n`;
    if (!state.avatar.equipped || state.avatar.equipped.length === 0) {
        report += `   None equipped\n`;
    } else {
        const shopItems = window.AK_DATA?.shop?.items || DEFAULT_SHOP_ITEMS;
        state.avatar.equipped.forEach(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            report += `   • ${item ? item.name : itemId}\n`;
        });
    }
    
    report += `\n💪 "The shadows remember every step you take."\n`;
    report += `═══════════════════════════════════════════\n`;
    
    const reportOutput = document.getElementById('reportOutput');
    if (reportOutput) {
        reportOutput.innerText = report;
        reportOutput.style.display = 'block';
        
        // Also download as file
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `akatsuki_report_${new Date().toISOString().slice(0,10)}.txt`;
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
    
    for (const line of lines) {
        if (!line.trim()) continue;
        const parts = line.split('|').map(p => p.trim());
        if (parts.length >= 2) {
            const title = parts[0];
            const domain = parts[1] || 'General';
            const difficulty = parts[2] || 'Medium';
            const xp = parseInt(parts[3]) || 30;
            const stepsText = parts[4] || 'Plan task,Execute work,Review results';
            const steps = stepsText.split(',').map(s => ({ text: s.trim(), completed: false }));
            
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
        showReward(`Imported ${imported} tasks!`, 0, 0);
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
    a.download = `akatsuki_save_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showReward('Data exported!', 0, 0);
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
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

function setupFilters() {
    const domains = ['PhD', 'Skool', 'Curriculum', 'Research Assistantship', 'Documentation', 'Rituals', 'General'];
    const difficulties = ['Easy', 'Medium', 'Hard', 'Elite'];
    const priorities = ['Critical', 'Important', 'Maintenance', 'Optional'];
    
    const domainSelect = document.getElementById('filterDomain');
    const bankDomainSelect = document.getElementById('bankDomainFilter');
    if (domainSelect) {
        domainSelect.innerHTML = '<option value="">All Domains</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        domainSelect.addEventListener('change', () => renderActiveMissions());
    }
    if (bankDomainSelect) {
        bankDomainSelect.innerHTML = '<option value="">All Themes</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        bankDomainSelect.addEventListener('change', () => renderTaskBank());
    }
    
    const diffSelect = document.getElementById('filterDifficulty');
    const bankDiffSelect = document.getElementById('bankDifficultyFilter');
    if (diffSelect) {
        diffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        diffSelect.addEventListener('change', () => renderActiveMissions());
    }
    if (bankDiffSelect) {
        bankDiffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        bankDiffSelect.addEventListener('change', () => renderTaskBank());
    }
    
    const prioritySelect = document.getElementById('filterPriority');
    if (prioritySelect) {
        prioritySelect.innerHTML = '<option value="">All Priorities</option>' + priorities.map(p => `<option value="${p}">${p}</option>`).join('');
        prioritySelect.addEventListener('change', () => renderActiveMissions());
    }
    
    const statusSelect = document.getElementById('filterStatus');
    if (statusSelect) {
        statusSelect.addEventListener('change', () => renderActiveMissions());
    }
    
    const bankSearch = document.getElementById('bankSearch');
    if (bankSearch) bankSearch.addEventListener('input', () => renderTaskBank());
}

function setupGenerator() {
    // Initialize task generator if available
    if (typeof AkatsukiTaskGenerator !== 'undefined') {
        taskGenerator = new AkatsukiTaskGenerator({
            templates: window.AK_DATA?.templates?.templates || [],
            taskBanks: {
                phd: window.AK_DATA?.phd,
                skool: window.AK_DATA?.skool,
                curriculum: window.AK_DATA?.curriculum,
                ra: window.AK_DATA?.ra,
                docs: window.AK_DATA?.docs,
                rituals: window.AK_DATA?.rituals
            }
        });
        
        // Populate theme dropdown
        const themeSelect = document.getElementById('genTheme');
        if (themeSelect && taskGenerator.getThemes) {
            const themes = taskGenerator.getThemes();
            themeSelect.innerHTML = themes.map(theme => 
                `<option value="${theme.id}">${theme.icon || '📁'} ${theme.name}</option>`
            ).join('');
            
            themeSelect.addEventListener('change', () => {
                if (taskGenerator.getSubjects) {
                    const subjects = taskGenerator.getSubjects(themeSelect.value);
                    const subjectSelect = document.getElementById('genSubject');
                    if (subjectSelect) {
                        subjectSelect.innerHTML = '<option value="">Select Subject</option>' + 
                            subjects.map(s => `<option value="${s}">${s}</option>`).join('');
                        subjectSelect.disabled = subjects.length === 0;
                        subjectSelect.dispatchEvent(new Event('change'));
                    }
                }
            });
            themeSelect.dispatchEvent(new Event('change'));
        }
        
        // Subject change
        const subjectSelect = document.getElementById('genSubject');
        if (subjectSelect && taskGenerator.getSideTopics) {
            subjectSelect.addEventListener('change', () => {
                const theme = document.getElementById('genTheme')?.value;
                const subject = subjectSelect.value;
                const sideTopics = taskGenerator.getSideTopics(theme, subject);
                const sideTopicSelect = document.getElementById('genSideTopic');
                if (sideTopicSelect) {
                    sideTopicSelect.innerHTML = '<option value="">Select Side Topic</option>' + 
                        sideTopics.map(st => `<option value="${st}">${st}</option>`).join('');
                    sideTopicSelect.disabled = sideTopics.length === 0;
                }
            });
        }
    }
    
    // Generate single task
    const generateSingleBtn = document.getElementById('generateSingleBtn');
    if (generateSingleBtn) {
        generateSingleBtn.addEventListener('click', () => {
            const goal = document.getElementById('genGoal')?.value;
            if (!goal) {
                alert('Enter a goal first');
                return;
            }
            
            const theme = document.getElementById('genTheme')?.value || 'Shadow Research Missions';
            const subject = document.getElementById('genSubject')?.value || null;
            const sideTopic = document.getElementById('genSideTopic')?.value || null;
            const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
            const priority = document.getElementById('genPriority')?.value || 'Important';
            const energy = document.getElementById('genEnergy')?.value || 'Standard Focus';
            const repeatability = document.getElementById('genRepeatability')?.value || 'One-time';
            const context = document.getElementById('genContext')?.value || 'Online';
            
            if (taskGenerator && taskGenerator.generateTask) {
                const task = taskGenerator.generateTask(goal, {
                    theme, subject, sideTopic, difficulty, priority, energy, repeatability, context
                });
                displayGeneratedTask(task);
            } else {
                // Fallback simple generation
                const task = {
                    id: Date.now() + '_' + Math.random(),
                    title: goal,
                    theme: theme,
                    difficulty: difficulty,
                    xp: difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : 80,
                    repeatability: repeatability,
                    priority: priority,
                    steps: [
                        { text: `Clarify scope: ${goal.substring(0, 50)}`, completed: false },
                        { text: 'Break down into sub-tasks', completed: false },
                        { text: 'Execute main work', completed: false },
                        { text: 'Review and document results', completed: false }
                    ]
                };
                displayGeneratedTask(task);
            }
        });
    }
    
    // Add generated task button
    const addBtn = document.getElementById('addGeneratedBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            if (window.lastGeneratedTask) {
                state.activeTasks.push(window.lastGeneratedTask);
                pushUndo({ type: 'addTask', taskId: window.lastGeneratedTask.id, task: window.lastGeneratedTask });
                saveState();
                renderAll();
                document.getElementById('generatedPreview').innerHTML = '';
                addBtn.style.display = 'none';
                showReward(`Added: ${window.lastGeneratedTask.title}`, 0, 0);
                window.lastGeneratedTask = null;
            }
        });
    }
}

function displayGeneratedTask(task) {
    const previewDiv = document.getElementById('generatedPreview');
    if (!previewDiv) return;
    
    let stepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
    if (task.steps) {
        task.steps.forEach(s => stepsHtml += `<li>${escapeHtml(s.text || s)}</li>`);
    }
    stepsHtml += '</ul>';
    
    previewDiv.innerHTML = `
        <div class="mission-item">
            <div class="mission-header">
                <strong>📋 ${escapeHtml(task.title)}</strong>
                <div class="mission-badge">
                    <span class="badge ${(task.difficulty || 'medium').toLowerCase()}">${task.difficulty || 'Medium'}</span>
                    <span class="badge ${(task.priority || 'important').toLowerCase()}">${task.priority || 'Important'}</span>
                </div>
            </div>
            <div class="mission-meta">
                <span>📁 ${task.theme || 'General'}</span>
                <span>🔄 ${task.repeatability || 'One-time'}</span>
                <span>⭐ ${task.xp || 30} XP</span>
            </div>
            ${stepsHtml}
        </div>
    `;
    
    window.lastGeneratedTask = task;
    document.getElementById('addGeneratedBtn').style.display = 'inline-block';
}

function setupEventListeners() {
    // Tab switching
    document.querySelectorAll('.ak-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            document.querySelectorAll('.ak-tab').forEach(tab => tab.classList.remove('active'));
            const targetTab = document.getElementById(tabId);
            if (targetTab) targetTab.classList.add('active');
            document.querySelectorAll('.ak-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
    
    // Undo/Redo
    document.getElementById('undoBtn')?.addEventListener('click', () => { undo(); renderAll(); });
    document.getElementById('redoBtn')?.addEventListener('click', () => { redo(); renderAll(); });
    
    // Reset buttons
    document.getElementById('forceResetBtn')?.addEventListener('click', () => {
        state.lastResetDate = getTodayStr();
        checkAndRegenerateTasks();
        saveState();
        renderAll();
        showReward('Daily reset completed!', 0, 0);
    });
    
    document.getElementById('forceWeeklyResetBtn')?.addEventListener('click', () => {
        state.lastWeeklyResetDate = getLastMonday();
        checkAndRegenerateTasks();
        saveState();
        renderAll();
        showReward('Weekly reset completed!', 0, 0);
    });
    
    document.getElementById('clearAllBtn')?.addEventListener('click', () => {
        if (confirm('⚠️ WIPE ALL PROGRESS? This cannot be undone.')) {
            localStorage.clear();
            location.reload();
        }
    });
    
    // Report buttons
    document.getElementById('exportReportBtn')?.addEventListener('click', generateReport);
    document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
    
    // Quick generate
    document.getElementById('genQuickBtn')?.addEventListener('click', () => {
        document.querySelector('.ak-tab-btn[data-tab="generator"]')?.click();
    });
    
    // Batch import
    document.getElementById('batchImportBtn')?.addEventListener('click', () => {
        document.querySelector('.ak-tab-btn[data-tab="generator"]')?.click();
    });
    document.getElementById('batchImportExecute')?.addEventListener('click', batchImport);
    
    // Data export/import
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
        document.getElementById('importDataInput')?.click();
    });
    document.getElementById('importDataInput')?.addEventListener('change', (e) => {
        if (e.target.files[0]) importData(e.target.files[0]);
    });
}

// ============================================================
// INITIALIZATION
// ============================================================

function initApp() {
    console.log('Initializing Akatsuki Quest...');
    
    loadState();
    setupFilters();
    setupGenerator();
    setupEventListeners();
    renderAll();
    
    // Initialize avatar renderer if available
    if (typeof AkatsukiAvatarRenderer !== 'undefined' && document.getElementById('avatarContainer')) {
        try {
            avatarRenderer = new AkatsukiAvatarRenderer({
                container: document.getElementById('avatarContainer'),
                name: state.avatar.name,
                equipped: state.avatar.equipped || []
            });
            if (avatarRenderer.init) avatarRenderer.init();
        } catch(e) {
            console.warn('Avatar renderer init failed:', e);
        }
    }
    
    console.log('🎯 Akatsuki Quest Ready!', { 
        tasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        level: state.level
    });
}

// Make functions global for debugging
window.state = state;
window.renderAll = renderAll;
