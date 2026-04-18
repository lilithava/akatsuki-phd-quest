// Akatsuki PhD Quest - Complete Working System with JSON Bank Integration
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting Akatsuki Quest...');
    // Wait for data to load
    const checkData = setInterval(() => {
        if (window.AK_DATA && Object.keys(window.AK_DATA).length > 0) {
            clearInterval(checkData);
            console.log('Data loaded:', Object.keys(window.AK_DATA));
            initApp();
        }
    }, 100);
    // Timeout after 3 seconds
    setTimeout(() => {
        clearInterval(checkData);
        console.log('Data load timeout, using defaults');
        initApp();
    }, 3000);
});

// Shop items with actual XP/coin multipliers
const SHOP_ITEMS = [
    { id: 'cloak_basic', name: 'Akatsuki Cloak', category: 'Cloak', cost: 150, effect: { xpMult: 1.05, coinMult: 1.0 }, description: 'Classic black cloak with red clouds' },
    { id: 'mask_anbu', name: 'ANBU Mask', category: 'Mask', cost: 100, effect: { xpMult: 1.03, coinMult: 1.0 }, description: 'White ANBU-style mask' },
    { id: 'ring_akatsuki', name: 'Akatsuki Ring', category: 'Accessory', cost: 80, effect: { xpMult: 1.02, coinMult: 1.02 }, description: 'Glowing ring with secret meaning' },
    { id: 'raven_companion', name: 'Raven Companion', category: 'Companion', cost: 200, effect: { xpMult: 1.1, coinMult: 1.0 }, description: 'Loyal messenger perched on shoulder' },
    { id: 'crimson_aura', name: 'Crimson Aura', category: 'Aura', cost: 120, effect: { xpMult: 1.0, coinMult: 1.1 }, description: 'Burning red energy aura' },
    { id: 'shadow_wolf', name: 'Shadow Wolf', category: 'Companion', cost: 350, effect: { xpMult: 1.15, coinMult: 1.05 }, description: 'Spectral wolf guardian' },
    { id: 'elite_cloak', name: 'Elite Akatsuki Cloak', category: 'Cloak', cost: 400, effect: { xpMult: 1.12, coinMult: 1.08 }, description: 'Glowing crimson cloud cloak' },
    { id: 'focus_charm', name: 'Focus Charm', category: 'Accessory', cost: 60, effect: { xpMult: 1.0, coinMult: 1.0 }, description: 'Charm that sharpens the mind' }
];

// Achievements system
const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first mission', requirement: 'Complete 1 mission', xpReward: 50 },
    { id: 'scroll_keeper', name: 'Scroll Keeper', description: 'Log documentation 7 days in a row', requirement: '7 day documentation streak', xpReward: 100 },
    { id: 'shadow_scholar', name: 'Shadow Scholar', description: 'Complete 10 literature tasks', requirement: '10 literature tasks', xpReward: 150 },
    { id: 'data_hunter', name: 'Data Hunter', description: 'Finish 5 data missions', requirement: '5 data missions', xpReward: 100 },
    { id: 'clan_builder', name: 'Clan Builder', description: 'Publish 10 community posts', requirement: '10 community posts', xpReward: 100 },
    { id: 'boss_slayer', name: 'Boss Slayer', description: 'Clear first elite mission', requirement: 'Complete an Elite mission', xpReward: 200 },
    { id: 'crimson_streak', name: 'Crimson Streak', description: 'Maintain 14-day streak', requirement: '14 day streak', xpReward: 200 },
    { id: 'akatsuki_commander', name: 'Akatsuki Commander', description: 'Reach level 10', requirement: 'Level 10', xpReward: 300 }
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

// Weekly recurring tasks
const WEEKLY_TASKS = [
    { title: "Weekly Review & Reset", domain: "Documentation", difficulty: "Medium", xp: 45, priority: "Critical", energy: "Standard Focus",
      steps: ["Review last week's wins", "Identify patterns/blockers", "Set next week's top 3 missions", "Update documentation"] }
];

// Theme hierarchy
const THEMES = {
    "Shadow Research Missions": {
        subjects: ["Research Question Development", "Literature Review", "Theory Building", "Methodology", "Data Analysis", "Academic Writing"],
        sideTopics: {
            "Literature Review": ["source finding", "annotation", "synthesis", "matrix building"],
            "Academic Writing": ["outlines", "drafting", "revision"]
        }
    },
    "Village Knowledge Expansion": {
        subjects: ["Course Planning", "Learning Outcomes", "Lesson Architecture", "Assessments"],
        sideTopics: {
            "Learning Outcomes": ["verbs", "mastery levels"],
            "Assessments": ["mastery checks", "rubrics"]
        }
    },
    "Clan Leadership & Skool Community": {
        subjects: ["Content Creation", "Engagement Systems", "Weekly Challenges"],
        sideTopics: {
            "Content Creation": ["post drafting", "clip repurposing"],
            "Engagement Systems": ["polls", "accountability loops"]
        }
    }
};

// Collect all tasks from loaded JSON banks
let globalTaskBank = [];

function loadTasksFromBanks() {
    globalTaskBank = [];
    
    // Define bank files and their display names
    const bankFiles = [
        { key: 'phd', name: 'PhD Missions', file: 'task-bank-phd.json' },
        { key: 'skool', name: 'Skool Missions', file: 'task-bank-skool.json' },
        { key: 'curriculum', name: 'Curriculum Missions', file: 'task-bank-curriculum.json' },
        { key: 'ra', name: 'RA Missions', file: 'task-bank-ra.json' },
        { key: 'docs', name: 'Documentation Missions', file: 'task-bank-docs.json' },
        { key: 'rituals', name: 'Rituals', file: 'task-bank-rituals.json' },
        { key: 'bosses', name: 'Boss Battles', file: 'boss-battles.json' },
        { key: 'recovery', name: 'Recovery Missions', file: 'recovery-missions.json' },
        { key: 'mini', name: 'Mini Quests', file: 'mini-quests.json' }
    ];
    
    for (const bank of bankFiles) {
        const data = window.AK_DATA[bank.key];
        if (data) {
            console.log(`Loading from ${bank.key}:`, data);
            // Handle different JSON structures
            if (data.tasks && Array.isArray(data.tasks)) {
                globalTaskBank.push(...data.tasks.map(t => ({ ...t, sourceBank: bank.name })));
            }
            if (data.missions && Array.isArray(data.missions)) {
                globalTaskBank.push(...data.missions.map(t => ({ ...t, sourceBank: bank.name })));
            }
            if (data.quests && Array.isArray(data.quests)) {
                globalTaskBank.push(...data.quests.map(t => ({ ...t, sourceBank: bank.name })));
            }
            if (data.bosses && Array.isArray(data.bosses)) {
                globalTaskBank.push(...data.bosses.map(t => ({ ...t, sourceBank: bank.name, difficulty: 'Elite', xp: t.xp || 250 })));
            }
        } else {
            console.warn(`Bank not loaded: ${bank.key}`);
        }
    }
    
    // Add default tasks if no banks loaded
    if (globalTaskBank.length === 0) {
        console.log('No banks loaded, using default tasks');
        globalTaskBank = [
            { title: "Write Literature Review Section", domain: "PhD", difficulty: "Hard", xp: 90, steps: ["Find 10 sources", "Read and annotate", "Write synthesis", "Add citations"] },
            { title: "Create Weekly Skool Post", domain: "Skool", difficulty: "Medium", xp: 35, steps: ["Choose topic", "Write hook", "Add 3 tips", "Post and engage"] },
            { title: "Design Lesson Plan", domain: "Curriculum", difficulty: "Medium", xp: 40, steps: ["Define outcomes", "Create activities", "Build assessment", "Review"] },
            { title: "Code Interview Transcript", domain: "Research Assistantship", difficulty: "Hard", xp: 80, steps: ["Open transcript", "Apply codes", "Write memo", "Save"] }
        ];
    }
    
    console.log(`Loaded ${globalTaskBank.length} tasks from banks`);
}

function initApp() {
    // Load tasks from JSON banks
    loadTasksFromBanks();
    
    // ---------- STATE ----------
    let state = {
        xp: 0,
        coins: 150,
        level: 1,
        streak: 0,
        lastResetDate: new Date().toISOString().slice(0,10),
        lastWeeklyResetDate: getLastMonday(),
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
        // Force UI update immediately
        renderHeader();
        renderDashboard();
        updateXPBar();
    }

    function getMultipliers() {
        let xpMult = 1.0;
        let coinMult = 1.0;
        state.avatar.equipped.forEach(itemId => {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (item && item.effect) {
                xpMult *= (item.effect.xpMult || 1);
                coinMult *= (item.effect.coinMult || 1);
            }
        });
        return { xpMult, coinMult };
    }

    function updateXPLevel() {
        const xpPerLevel = 500;
        const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
        if (newLevel > state.level) {
            const bonus = 100;
            state.coins += bonus;
            showReward(`Level Up! You reached level ${newLevel}`, 0, bonus);
        }
        state.level = newLevel;
        updateStreak();
        updateXPBar();
    }
    
    function updateXPBar() {
        const xpPerLevel = 500;
        const currentLevelXp = (state.level - 1) * xpPerLevel;
        const nextLevelXp = state.level * xpPerLevel;
        const progress = ((state.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
        const xpFill = document.getElementById('xpFill');
        if (xpFill) xpFill.style.width = `${Math.min(100, progress)}%`;
        
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
            const date = h.completedAt.slice(0,10);
            completionsByDate[date] = true;
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
            notes: task.notes || ''
        });
        
        showReward(`Completed: ${task.title}`, xpGain, coinGain);
        pushUndo({ type: 'completeTask', taskId, xpGain, coinGain });
        updateXPLevel();
        saveState();
        checkAchievements();
        renderAll(); // Force full UI refresh
    }

    function checkAndRegenerateTasks() {
        const today = getTodayStr();
        const todayDate = new Date(today);
        const lastResetDate = new Date(state.lastResetDate);
        
        if (todayDate > lastResetDate) {
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Daily' && t.completed) return false;
                return true;
            });
            
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
                        steps: taskTemplate.steps.map(text => ({ text, completed: false })),
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
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Weekly' && t.completed) return false;
                return true;
            });
            
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
                        steps: taskTemplate.steps.map(text => ({ text, completed: false })),
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
        }
        updateXPLevel();
        saveState();
        renderAll();
    }

    function checkAchievements() {
        let changed = false;
        ACHIEVEMENTS.forEach(ach => {
            if (state.unlockedAchievements.includes(ach.id)) return;
            
            let unlocked = false;
            switch(ach.id) {
                case 'first_blood':
                    if (state.completedHistory.length >= 1) unlocked = true;
                    break;
                case 'shadow_scholar':
                    const litTasks = state.completedHistory.filter(h => 
                        h.title?.toLowerCase().includes('literature') || 
                        h.title?.toLowerCase().includes('article') ||
                        h.title?.toLowerCase().includes('research')
                    );
                    if (litTasks.length >= 10) unlocked = true;
                    break;
                case 'crimson_streak':
                    if (state.streak >= 14) unlocked = true;
                    break;
                case 'akatsuki_commander':
                    if (state.level >= 10) unlocked = true;
                    break;
            }
            
            if (unlocked) {
                state.unlockedAchievements.push(ach.id);
                state.xp += ach.xpReward;
                showReward(`🏆 Achievement: ${ach.name} (+${ach.xpReward} XP)`, ach.xpReward, 0);
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
            } catch(e) { console.error(e); }
        }
        
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

    // RENDER FUNCTIONS
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
        const activeCount = state.activeTasks.filter(t => !t.completed).length;
        const completedToday = state.completedHistory.filter(h => h.completedAt.slice(0,10) === getTodayStr()).length;
        
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
        }
    }

    function renderActiveMissions() {
        const container = document.getElementById('activeMissionsList');
        if (!container) return;
        
        // Apply filters
        let filteredTasks = state.activeTasks.filter(t => !t.completed);
        const domainFilter = document.getElementById('filterDomain')?.value || '';
        const difficultyFilter = document.getElementById('filterDifficulty')?.value || '';
        
        if (domainFilter) filteredTasks = filteredTasks.filter(t => t.domain === domainFilter);
        if (difficultyFilter) filteredTasks = filteredTasks.filter(t => t.difficulty === difficultyFilter);
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="ak-card">✨ No active missions. Complete some tasks!</div>';
            return;
        }
        
        container.innerHTML = filteredTasks.map(task => `
            <div class="mission-item" data-task-id="${task.id}">
                <div class="mission-header">
                    <div class="mission-title">${escapeHtml(task.title)}</div>
                    <div class="mission-badge">
                        <span class="badge ${task.difficulty?.toLowerCase()}">${task.difficulty || 'Medium'}</span>
                        <span class="badge ${task.priority?.toLowerCase()}">${task.priority || 'Normal'}</span>
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
                            <label>${escapeHtml(step.text)}</label>
                        </li>
                    `).join('')}
                </ul>
                <div class="mission-actions">
                    <button class="view-task-details" data-task-id="${task.id}">📝 Details</button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners
        document.querySelectorAll('.step-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleStepToggle);
            cb.addEventListener('change', handleStepToggle);
        });
        
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
            checkAchievements();
            renderDashboard(); // Update dashboard immediately
            renderHeader(); // Update header immediately
        }
    }
    
    function handleDetailsClick(e) {
        const taskId = e.target.dataset.taskId;
        openTaskModal(taskId);
    }
    
    function openTaskModal(taskId) {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('taskModal');
        if (!modal) return;
        
        document.getElementById('modalTitle').innerText = task.title;
        document.getElementById('modalBody').innerHTML = `
            <p><strong>Domain:</strong> ${task.domain}</p>
            <p><strong>Difficulty:</strong> ${task.difficulty}</p>
            <p><strong>XP Reward:</strong> ${task.xp}</p>
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
        };
        
        const deleteBtn = document.getElementById('deleteTaskBtn');
        if (deleteBtn) {
            const newDeleteBtn = deleteBtn.cloneNode(true);
            deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);
            newDeleteBtn.onclick = () => {
                if (confirm(`Delete task "${task.title}"?`)) {
                    state.activeTasks = state.activeTasks.filter(t => t.id !== taskId);
                    saveState();
                    modal.style.display = 'none';
                    renderAll();
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
        
        const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
        const domainFilter = document.getElementById('bankDomainFilter')?.value || '';
        const difficultyFilter = document.getElementById('bankDifficultyFilter')?.value || '';
        
        let filtered = [...globalTaskBank];
        if (searchTerm) filtered = filtered.filter(t => t.title?.toLowerCase().includes(searchTerm));
        if (domainFilter) filtered = filtered.filter(t => t.domain === domainFilter);
        if (difficultyFilter) filtered = filtered.filter(t => t.difficulty === difficultyFilter);
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="ak-card">No tasks found. Check that JSON files loaded correctly.</div>';
            return;
        }
        
        container.innerHTML = filtered.slice(0, 30).map(t => `
            <div class="mission-item">
                <div class="mission-header">
                    <div class="mission-title">${escapeHtml(t.title)}</div>
                    <div class="mission-badge">
                        <span class="badge ${t.difficulty?.toLowerCase()}">${t.difficulty || 'Medium'}</span>
                    </div>
                </div>
                <div class="mission-meta">
                    <span>📁 ${t.domain || t.theme || 'General'}</span>
                    <span>⭐ ${t.xp || 30} XP</span>
                    ${t.sourceBank ? `<span>📦 ${t.sourceBank}</span>` : ''}
                </div>
                ${t.successCriteria ? `<div class="mission-meta">🎯 ${t.successCriteria.substring(0, 80)}...</div>` : ''}
                <div class="mission-actions">
                    <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain || t.theme || 'General'}" data-difficulty="${t.difficulty || 'Medium'}" data-xp="${t.xp || 30}" data-steps='${JSON.stringify(t.microSteps || t.steps || ["Plan task", "Execute work", "Review results"])}'>+ Add to Active</button>
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
            steps: stepsArray.map(text => ({ text, completed: false })),
            notes: '',
            startedAt: new Date().toISOString(),
            completed: false
        };
        state.activeTasks.push(newTask);
        saveState();
        renderAll();
        showReward(`Added: ${newTask.title}`, 0, 0);
    }
    
    function renderAvatar() {
        const nameInput = document.getElementById('avatarName');
        if (nameInput) {
            nameInput.value = state.avatar.name;
            nameInput.onchange = (e) => {
                state.avatar.name = e.target.value;
                const nameText = document.getElementById('avatarNameText');
                if (nameText) nameText.textContent = state.avatar.name.substring(0, 15);
                saveState();
            };
        }
        
        const nameText = document.getElementById('avatarNameText');
        if (nameText) nameText.textContent = state.avatar.name.substring(0, 15);
        
        const { xpMult, coinMult } = getMultipliers();
        const xpMultEl = document.getElementById('xpMult');
        const coinMultEl = document.getElementById('coinMult');
        if (xpMultEl) xpMultEl.innerText = xpMult.toFixed(2);
        if (coinMultEl) coinMultEl.innerText = coinMult.toFixed(2);
        
        const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
        const missionsCompleted = state.completedHistory.length;
        const totalXPEarnedEl = document.getElementById('totalXPEarned');
        const missionsCompletedEl = document.getElementById('missionsCompleted');
        if (totalXPEarnedEl) totalXPEarnedEl.innerText = totalXPEarned;
        if (missionsCompletedEl) missionsCompletedEl.innerText = missionsCompleted;
        
        const equippedContainer = document.getElementById('equippedList');
        if (equippedContainer) {
            if (state.avatar.equipped.length === 0) {
                equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Visit the Shop!</div>';
            } else {
                equippedContainer.innerHTML = state.avatar.equipped.map(itemId => {
                    const item = SHOP_ITEMS.find(i => i.id === itemId);
                    return `<div class="gear-item">${item ? item.name : itemId} 
                        <button class="unequip-btn" data-item="${itemId}">✖</button></div>`;
                }).join('');
                
                document.querySelectorAll('.unequip-btn').forEach(btn => {
                    btn.onclick = () => {
                        state.avatar.equipped = state.avatar.equipped.filter(i => i !== btn.dataset.item);
                        saveState();
                        renderAll();
                        showReward(`Unequipped item`, 0, 0);
                    };
                });
            }
        }
        
        const inventoryContainer = document.getElementById('inventoryList');
        if (inventoryContainer) {
            const ownedNotEquipped = state.avatar.inventory.filter(id => !state.avatar.equipped.includes(id));
            if (ownedNotEquipped.length === 0) {
                inventoryContainer.innerHTML = '<div class="gear-item">No items in inventory. Buy from Shop!</div>';
            } else {
                inventoryContainer.innerHTML = ownedNotEquipped.map(itemId => {
                    const item = SHOP_ITEMS.find(i => i.id === itemId);
                    return `<div class="gear-item">${item ? item.name : itemId} 
                        <button class="equip-btn" data-item="${itemId}">⚔️ Equip</button></div>`;
                }).join('');
                
                document.querySelectorAll('.equip-btn').forEach(btn => {
                    btn.onclick = () => {
                        const itemId = btn.dataset.item;
                        if (!state.avatar.equipped.includes(itemId)) {
                            state.avatar.equipped.push(itemId);
                            saveState();
                            renderAll();
                            showReward(`Equipped ${SHOP_ITEMS.find(i => i.id === itemId)?.name}`, 0, 0);
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
        
        container.innerHTML = SHOP_ITEMS.map(item => {
            const owned = state.avatar.inventory.includes(item.id);
            const equipped = state.avatar.equipped.includes(item.id);
            return `
                <div class="shop-item">
                    <h4>${item.name}</h4>
                    <p class="price">💰 ${item.cost} coins</p>
                    <p class="effect">${item.description}</p>
                    <p class="effect">${item.effect.xpMult > 1 ? `⚔️ +${Math.round((item.effect.xpMult - 1) * 100)}% XP` : ''} ${item.effect.coinMult > 1 ? `💰 +${Math.round((item.effect.coinMult - 1) * 100)}% Coins` : ''}</p>
                    ${owned ? `<button class="buy-btn" disabled ${equipped ? 'style="background:#444"' : ''}>${equipped ? '✓ Equipped' : '✓ Owned'}</button>` :
                      `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">Purchase (${item.cost}💰)</button>`}
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.buy-btn[data-id]').forEach(btn => {
            btn.onclick = () => {
                const itemId = btn.dataset.id;
                const cost = parseInt(btn.dataset.cost);
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                
                if (state.coins >= cost) {
                    state.coins -= cost;
                    state.avatar.inventory.push(itemId);
                    showReward(`Purchased: ${item.name}`, 0, -cost);
                    saveState();
                    renderAll();
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
        for (let day of last7Days) {
            const dayCompletions = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            html += `<div class="ak-card"><h3>📅 ${day}</h3><ul>`;
            if (dayCompletions.length === 0) {
                html += '<li>✨ No missions completed</li>';
            } else {
                dayCompletions.forEach(c => html += `<li>✅ ${escapeHtml(c.title)} (+${c.xpGained} XP, +${c.coinsGained || 0} coins)</li>`);
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
    }
    
    function renderAchievements() {
        const container = document.getElementById('achievementsList');
        if (!container) return;
        
        const achievements = ACHIEVEMENTS.map(ach => {
            const unlocked = state.unlockedAchievements.includes(ach.id);
            return `
                <div class="achievement-item ${unlocked ? 'unlocked' : 'locked'}">
                    <div class="achievement-icon">${unlocked ? '🏆' : '🔒'}</div>
                    <h4>${ach.name}</h4>
                    <p>${ach.description}</p>
                    <small>${ach.xpReward} XP</small>
                    ${unlocked ? `<small>✓ Unlocked</small>` : `<small>${ach.requirement}</small>`}
                </div>
            `;
        }).join('');
        container.innerHTML = achievements;
    }
    
    function generateReport() {
        const { xpMult, coinMult } = getMultipliers();
        const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
        
        let report = `═══════════════════════════════════════════\n`;
        report += `              🌙 AKATSUKI MISSION REPORT\n`;
        report += `═══════════════════════════════════════════\n\n`;
        report += `📅 GENERATED: ${new Date().toLocaleString()}\n`;
        report += `👤 SCHOLAR: ${state.avatar.name}\n`;
        report += `🏆 LEVEL: ${state.level} | XP: ${state.xp} | STREAK: ${state.streak} days\n`;
        report += `💰 COINS: ${state.coins} | MULTIPLIERS: ${xpMult.toFixed(2)}x XP\n\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📊 STATISTICS\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `Total Missions Completed: ${state.completedHistory.length}\n`;
        report += `Total XP Earned: ${totalXPEarned}\n`;
        report += `Current Streak: ${state.streak} days\n\n`;
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📜 MISSIONS COMPLETED (Last 7 Days)\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        
        last7Days.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `📅 ${day}:\n`;
                dayTasks.forEach(t => {
                    report += `   ✓ ${t.title} (+${t.xpGained} XP)\n`;
                });
                report += `\n`;
            }
        });
        
        report += `\n💪 "The shadows remember every step you take."\n`;
        
        const reportOutput = document.getElementById('reportOutput');
        if (reportOutput) {
            reportOutput.innerText = report;
            reportOutput.style.display = 'block';
            
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
            version: '1.0',
            exportDate: new Date().toISOString(),
            state: {
                xp: state.xp,
                coins: state.coins,
                level: state.level,
                streak: state.streak,
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
                    state.activeTasks = imported.state.activeTasks || [];
                    state.completedHistory = imported.state.completedHistory || [];
                    state.avatar = imported.state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
                    state.unlockedAchievements = imported.state.unlockedAchievements || [];
                    
                    saveState();
                    renderAll();
                    showReward('Data imported!', 0, 0);
                }
            } catch(err) {
                showReward('Error importing data', 0, 0);
            }
        };
        reader.readAsText(file);
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
        
        // Task Generator
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const goal = document.getElementById('genGoal')?.value;
                if (!goal) {
                    alert('Enter a goal first');
                    return;
                }
                
                const theme = document.getElementById('genTheme')?.value || 'Shadow Research Missions';
                const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
                const repeatability = document.getElementById('genRepeatability')?.value || 'One-time';
                const priority = document.getElementById('genPriority')?.value || 'Important';
                
                const xpValue = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : difficulty === 'Hard' ? 90 : 200;
                
                const steps = [
                    `Clarify scope: ${goal.substring(0,50)}`,
                    `Break down into sub-tasks`,
                    `Execute main work`,
                    `Review and document results`
                ];
                
                const generatedTask = {
                    id: Date.now() + '_' + Math.random(),
                    title: goal,
                    domain: theme,
                    difficulty: difficulty,
                    xp: xpValue,
                    repeatability: repeatability,
                    priority: priority,
                    steps: steps.map(text => ({ text, completed: false })),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false
                };
                
                const previewDiv = document.getElementById('generatedPreview');
                if (previewDiv) {
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
                            <ul>${steps.map(s => `<li>${escapeHtml(s)}</li>`).join('')}</ul>
                        </div>
                    `;
                }
                
                const addBtn = document.getElementById('addGeneratedBtn');
                if (addBtn) {
                    addBtn.style.display = 'inline-block';
                    const newAddBtn = addBtn.cloneNode(true);
                    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                    newAddBtn.onclick = () => {
                        state.activeTasks.push(generatedTask);
                        saveState();
                        if (previewDiv) previewDiv.innerHTML = '';
                        newAddBtn.style.display = 'none';
                        renderAll();
                        showReward(`Generated: ${generatedTask.title}`, 0, 0);
                    };
                }
            });
        }
        
        // Filters
        const domains = ['PhD', 'Skool', 'Curriculum', 'Documentation', 'Rituals'];
        const difficulties = ['Easy', 'Medium', 'Hard', 'Elite'];
        
        const filterDomain = document.getElementById('filterDomain');
        if (filterDomain) {
            filterDomain.innerHTML = '<option value="">All Domains</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
            filterDomain.addEventListener('change', () => renderActiveMissions());
        }
        
        const filterDifficulty = document.getElementById('filterDifficulty');
        if (filterDifficulty) {
            filterDifficulty.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
            filterDifficulty.addEventListener('change', () => renderActiveMissions());
        }
        
        const bankSearch = document.getElementById('bankSearch');
        if (bankSearch) bankSearch.addEventListener('input', () => renderTaskBank());
        
        const bankDomainFilter = document.getElementById('bankDomainFilter');
        if (bankDomainFilter) {
            bankDomainFilter.innerHTML = '<option value="">All Themes</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
            bankDomainFilter.addEventListener('change', () => renderTaskBank());
        }
        
        const bankDifficultyFilter = document.getElementById('bankDifficultyFilter');
        if (bankDifficultyFilter) {
            bankDifficultyFilter.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
            bankDifficultyFilter.addEventListener('change', () => renderTaskBank());
        }
    }
    
    // ---------- INITIALIZE ----------
    loadState();
    setupEventListeners();
    renderAll();
    
    console.log('🎯 Akatsuki Quest Ready!', { 
        tasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        level: state.level,
        bankSize: globalTaskBank.length
    });
}
