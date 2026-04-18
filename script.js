// Akatsuki PhD Quest - Complete Working System
// Full script.js - Replace your entire file with this

// Shop items with actual XP/coin multipliers
const SHOP_ITEMS = [
    { id: 'cloak_basic', name: 'Akatsuki Cloak', category: 'Cloak', cost: 150, effect: { xpMult: 1.05, coinMult: 1.0 }, description: 'Classic black cloak with red clouds', svgLayer: 'cloak' },
    { id: 'mask_anbu', name: 'ANBU Mask', category: 'Mask', cost: 100, effect: { xpMult: 1.03, coinMult: 1.0 }, description: 'White ANBU-style mask', svgLayer: 'mask' },
    { id: 'ring_akatsuki', name: 'Akatsuki Ring', category: 'Accessory', cost: 80, effect: { xpMult: 1.02, coinMult: 1.02 }, description: 'Glowing ring with secret meaning', svgLayer: 'ring' },
    { id: 'raven_companion', name: 'Raven Companion', category: 'Companion', cost: 200, effect: { xpMult: 1.1, coinMult: 1.0 }, description: 'Loyal messenger perched on shoulder', svgLayer: 'raven' },
    { id: 'crimson_aura', name: 'Crimson Aura', category: 'Aura', cost: 120, effect: { xpMult: 1.0, coinMult: 1.1 }, description: 'Burning red energy aura', svgLayer: 'aura' },
    { id: 'shadow_wolf', name: 'Shadow Wolf', category: 'Companion', cost: 350, effect: { xpMult: 1.15, coinMult: 1.05 }, description: 'Spectral wolf guardian', svgLayer: 'wolf' },
    { id: 'elite_cloak', name: 'Elite Akatsuki Cloak', category: 'Cloak', cost: 400, effect: { xpMult: 1.12, coinMult: 1.08 }, description: 'Glowing crimson cloud cloak', svgLayer: 'elite_cloak' },
    { id: 'focus_charm', name: 'Focus Charm', category: 'Accessory', cost: 60, effect: { xpMult: 1.0, coinMult: 1.0 }, description: 'Charm that sharpens the mind', svgLayer: 'charm' },
    { id: 'oni_mask', name: 'Oni Mask', category: 'Mask', cost: 250, effect: { xpMult: 1.08, coinMult: 1.0 }, description: 'Red demon mask with horns', svgLayer: 'oni' },
    { id: 'scroll_satchel', name: 'Scroll Satchel', category: 'Accessory', cost: 120, effect: { xpMult: 1.0, coinMult: 1.05 }, description: 'Satchel filled with ancient scrolls', svgLayer: 'satchel' }
];

// Achievements system
const ACHIEVEMENTS = [
    { id: 'first_blood', name: 'First Blood', description: 'Complete your first mission', requirement: 'Complete 1 mission', xpReward: 50 },
    { id: 'scroll_keeper', name: 'Scroll Keeper', description: 'Log documentation 7 days in a row', requirement: '7 day documentation streak', xpReward: 100 },
    { id: 'shadow_scholar', name: 'Shadow Scholar', description: 'Complete 10 literature review tasks', requirement: '10 literature tasks', xpReward: 150 },
    { id: 'data_hunter', name: 'Data Hunter', description: 'Finish 5 data collection missions', requirement: '5 data missions', xpReward: 100 },
    { id: 'clan_builder', name: 'Clan Builder', description: 'Publish 10 community posts', requirement: '10 community posts', xpReward: 100 },
    { id: 'master_architect', name: 'Master Architect', description: 'Finish 5 curriculum modules', requirement: '5 curriculum modules', xpReward: 150 },
    { id: 'signal_interceptor', name: 'Signal Interceptor', description: 'Complete 10 RA coding tasks', requirement: '10 coding tasks', xpReward: 100 },
    { id: 'no_loose_ends', name: 'No Loose Ends', description: 'Perform 7 shutdown rituals', requirement: '7 shutdown rituals', xpReward: 80 },
    { id: 'boss_slayer', name: 'Boss Slayer', description: 'Clear first elite mission', requirement: 'Complete an Elite mission', xpReward: 200 },
    { id: 'resurrection_protocol', name: 'Resurrection Protocol', description: 'Recover from a missed week', requirement: 'Complete recovery after break', xpReward: 75 },
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
      steps: ["Review completed tasks", "Clear workspace", "Set tomorrow's first action"] },
    { title: "Deep Work Session", domain: "PhD", difficulty: "Medium", xp: 35, priority: "Critical", energy: "Deep Focus",
      steps: ["Set 90-minute timer", "Eliminate distractions", "Focus on one priority task", "Take short break", "Review progress"] }
];

// Weekly recurring tasks
const WEEKLY_TASKS = [
    { title: "Weekly Review & Reset", domain: "Documentation", difficulty: "Medium", xp: 45, priority: "Critical", energy: "Standard Focus",
      steps: ["Review last week's wins", "Identify patterns/blockers", "Set next week's top 3 missions", "Update documentation"] },
    { title: "Weekly Challenge Check-in", domain: "Skool", difficulty: "Medium", xp: 35, priority: "Important", energy: "Standard Focus",
      steps: ["Post accountability thread", "Respond to member updates", "Celebrate member wins"] },
    { title: "Research Progress Review", domain: "PhD", difficulty: "Hard", xp: 80, priority: "Critical", energy: "Deep Focus",
      steps: ["Review weekly research output", "Update literature matrix", "Plan next week's research", "Schedule advisor check-in"] }
];

// Theme hierarchy from idea.docx
const THEMES = {
    "Shadow Research Missions": {
        subjects: ["Research Question Development", "Literature Review", "Theory Building", "Methodology", "Data Collection", "Data Analysis", "Academic Writing", "Revision & Submission", "Advisor Communication", "Academic Identity Building"],
        sideTopics: {
            "Literature Review": ["source finding", "source screening", "annotation", "synthesis", "citation capture", "matrix building"],
            "Academic Writing": ["outlines", "section drafting", "transitions", "argument strengthening", "claims/evidence balance"],
            "Methodology": ["design choice", "sampling", "instruments", "protocols", "ethics alignment"]
        }
    },
    "Village Knowledge Expansion": {
        subjects: ["Course Planning", "Learning Outcomes", "Lesson Architecture", "Activities & Practice", "Assessments", "Rubrics", "Slides & Visuals", "Iteration Cycles", "Learner Feedback", "Course Packaging"],
        sideTopics: {
            "Learning Outcomes": ["verbs", "mastery levels", "outcome alignment"],
            "Assessments": ["mastery checks", "checkpoints", "performance tasks"]
        }
    },
    "Clan Leadership & Skool Community": {
        subjects: ["Member Onboarding", "Content Creation", "Engagement Systems", "Moderation", "Weekly Challenges", "Lesson Building", "Retention & Value", "Growth Tasks", "Community Documentation", "Offer Refinement"],
        sideTopics: {
            "Content Creation": ["post drafting", "clip repurposing", "prompts", "resource posts"],
            "Engagement Systems": ["questions", "polls", "accountability loops", "recognition rituals"]
        }
    },
    "Intelligence Gathering": {
        subjects: ["Interview Prep", "Interview Execution", "Transcription & Cleaning", "Coding", "Memos", "Thematic Analysis", "Report Writing", "PI Alignment", "Admin Support", "Follow-Up"],
        sideTopics: {
            "Coding": ["codebook application", "open coding", "consistency checks"],
            "Thematic Analysis": ["clustering", "theme naming", "supporting evidence"]
        }
    },
    "Eternal Documentation Scrolls": {
        subjects: ["Daily Logs", "Weekly Reviews", "Monthly Summaries", "Evidence Capture", "File Organization", "Version Control", "Progress Tracking", "Archive Maintenance", "Naming Standards", "Dashboard Inputs"],
        sideTopics: {
            "Daily Logs": ["task notes", "decisions", "blockers", "wins"],
            "Evidence Capture": ["screenshots", "exports", "links", "artifacts"]
        }
    },
    "Discipline & Rituals": {
        subjects: ["Morning Startup", "Deep Work Entry", "Focus Protection", "Midday Reset", "Shutdown Routine", "Weekly Reset", "Energy Management", "Anti-Procrastination", "Environment Reset", "Character Building"],
        sideTopics: {
            "Morning Startup": ["top-3 selection", "calendar check", "mission board review"],
            "Anti-Procrastination": ["5-minute start", "friction removal", "tiny re-entry"]
        }
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    let attempts = 0;
    const waitForData = setInterval(() => {
        if (window.AK_DATA && window.AK_DATA.rules) {
            clearInterval(waitForData);
            initApp();
        } else if (attempts > 30) {
            clearInterval(waitForData);
            console.warn('Data load timeout, using defaults');
            initApp();
        }
        attempts++;
    }, 100);
});

function initApp() {
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
    }

    // Get multipliers from equipped gear
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

    // XP and Level management
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
        
        // Update XP bar
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

    // Task management
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
    }

    // Check and regenerate daily/weekly tasks
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
                        id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random()}`,
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
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Weekly' && t.completed) return false;
                return true;
            });
            
            WEEKLY_TASKS.forEach(taskTemplate => {
                const existingWeekly = state.activeTasks.find(t => t.title === taskTemplate.title && t.repeatability === 'Weekly' && !t.completed);
                if (!existingWeekly) {
                    state.activeTasks.push({
                        id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random()}`,
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

    // Undo/Redo system
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

    // Achievement checking
    function checkAchievements() {
        let changed = false;
        
        ACHIEVEMENTS.forEach(ach => {
            if (state.unlockedAchievements.includes(ach.id)) return;
            
            let unlocked = false;
            switch(ach.id) {
                case 'first_blood':
                    if (state.completedHistory.length >= 1) unlocked = true;
                    break;
                case 'scroll_keeper':
                    const docCompletions = state.completedHistory.filter(h => h.title?.toLowerCase().includes('log') || h.title?.toLowerCase().includes('documentation'));
                    if (docCompletions.length >= 7) unlocked = true;
                    break;
                case 'shadow_scholar':
                    const litTasks = state.completedHistory.filter(h => h.title?.toLowerCase().includes('literature') || h.title?.toLowerCase().includes('article') || h.title?.toLowerCase().includes('research'));
                    if (litTasks.length >= 10) unlocked = true;
                    break;
                case 'boss_slayer':
                    const eliteTasks = state.completedHistory.filter(h => h.xpGained >= 150);
                    if (eliteTasks.length >= 1) unlocked = true;
                    break;
                case 'crimson_streak':
                    if (state.streak >= 14) unlocked = true;
                    break;
                case 'akatsuki_commander':
                    if (state.level >= 10) unlocked = true;
                    break;
                case 'no_loose_ends':
                    const rituals = state.completedHistory.filter(h => h.title?.toLowerCase().includes('shutdown') || h.title?.toLowerCase().includes('ritual'));
                    if (rituals.length >= 7) unlocked = true;
                    break;
            }
            
            if (unlocked) {
                state.unlockedAchievements.push(ach.id);
                state.xp += ach.xpReward;
                showReward(`🏆 Achievement Unlocked: ${ach.name} (+${ach.xpReward} XP)`, ach.xpReward, 0);
                changed = true;
            }
        });
        
        if (changed) {
            updateXPLevel();
            saveState();
            renderAchievements();
        }
    }

    // Save/Load state
    function saveState() {
        localStorage.setItem('akatsuki_state', JSON.stringify(state));
        renderAll();
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
        
        if (state.activeTasks.length === 0 || state.activeTasks.filter(t => !t.completed).length === 0) {
            addDefaultTasks();
        }
        
        updateXPLevel();
        saveState();
    }

    function addDefaultTasks() {
        DAILY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random()}`,
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
        });
        
        WEEKLY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}_${Math.random()}`,
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
        });
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
        const completedToday = state.completedHistory.filter(h => 
            h.completedAt.slice(0,10) === getTodayStr()
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
            winResult.innerHTML = (hasImportant && hasRitual && hasDoc) ? '✅ WIN THE DAY ACHIEVED!' : '❌ NOT YET';
            winResult.style.color = (hasImportant && hasRitual && hasDoc) ? '#00cc66' : '#888';
        }
    }

    function renderActiveMissions() {
        const container = document.getElementById('activeMissionsList');
        if (!container) return;
        
        let filteredTasks = state.activeTasks.filter(t => !t.completed);
        
        const domainFilter = document.getElementById('filterDomain')?.value || '';
        const difficultyFilter = document.getElementById('filterDifficulty')?.value || '';
        const priorityFilter = document.getElementById('filterPriority')?.value || '';
        const energyFilter = document.getElementById('filterEnergy')?.value || '';
        const repeatFilter = document.getElementById('filterRepeatability')?.value || '';
        
        if (domainFilter) filteredTasks = filteredTasks.filter(t => t.domain === domainFilter);
        if (difficultyFilter) filteredTasks = filteredTasks.filter(t => t.difficulty === difficultyFilter);
        if (priorityFilter) filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
        if (energyFilter) filteredTasks = filteredTasks.filter(t => t.energy === energyFilter);
        if (repeatFilter) filteredTasks = filteredTasks.filter(t => t.repeatability === repeatFilter);
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="ak-card">✨ No active missions. Add some from the Task Bank or Generator!</div>';
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
                    <span>⚡ ${task.energy || 'Standard Focus'}</span>
                    <span>⭐ ${task.xp || 30} XP</span>
                </div>
                <ul class="step-list">
                    ${task.steps.map((step, idx) => `
                        <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                            <label class="step-label" contenteditable="true">${escapeHtml(step.text)}</label>
                            <button class="edit-step-btn" data-step-idx="${idx}">✏️</button>
                        </li>
                    `).join('')}
                </ul>
                <div class="mission-actions">
                    <button class="add-step-btn">+ Add Step</button>
                    <button class="edit-task-btn">✏️ Edit Task</button>
                    <button class="view-task-details">📝 Details</button>
                </div>
            </div>
        `).join('');
        
        attachMissionEventListeners();
    }
    
    function attachMissionEventListeners() {
        document.querySelectorAll('.step-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleStepToggle);
            cb.addEventListener('change', handleStepToggle);
        });
        
        document.querySelectorAll('.step-label').forEach(label => {
            label.removeEventListener('blur', handleStepEdit);
            label.addEventListener('blur', handleStepEdit);
        });
        
        document.querySelectorAll('.edit-step-btn').forEach(btn => {
            btn.removeEventListener('click', handleEditStepClick);
            btn.addEventListener('click', handleEditStepClick);
        });
        
        document.querySelectorAll('.add-step-btn').forEach(btn => {
            btn.removeEventListener('click', handleAddStep);
            btn.addEventListener('click', handleAddStep);
        });
        
        document.querySelectorAll('.edit-task-btn').forEach(btn => {
            btn.removeEventListener('click', handleEditTask);
            btn.addEventListener('click', handleEditTask);
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
        }
    }
    
    function handleStepEdit(e) {
        const label = e.target;
        const newText = label.innerText.trim();
        if (!newText) return;
        
        const li = label.closest('.step-item');
        const stepIndex = parseInt(li.dataset.stepIndex);
        const missionDiv = li.closest('.mission-item');
        const taskId = missionDiv.dataset.taskId;
        
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex] && task.steps[stepIndex].text !== newText) {
            task.steps[stepIndex].text = newText;
            saveState();
        }
    }
    
    function handleEditStepClick(e) {
        const btn = e.target;
        const li = btn.closest('.step-item');
        const label = li.querySelector('.step-label');
        label.focus();
    }
    
    function handleAddStep(e) {
        const btn = e.target;
        const missionDiv = btn.closest('.mission-item');
        const taskId = missionDiv.dataset.taskId;
        const newStepText = prompt('Enter new step:');
        if (newStepText && newStepText.trim()) {
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task) {
                task.steps.push({ text: newStepText.trim(), completed: false });
                pushUndo({ type: 'addStep', taskId, stepIndex: task.steps.length - 1 });
                saveState();
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
        
        const newRepeat = prompt('Repeatability (One-time/Daily/Weekly):', task.repeatability);
        if (newRepeat && ['One-time','Daily','Weekly'].includes(newRepeat)) task.repeatability = newRepeat;
        
        saveState();
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
            <p><strong>Domain:</strong> ${task.domain}</p>
            <p><strong>Difficulty:</strong> ${task.difficulty}</p>
            <p><strong>XP Reward:</strong> ${task.xp}</p>
            <p><strong>Repeatability:</strong> ${task.repeatability || 'One-time'}</p>
            <p><strong>Priority:</strong> ${task.priority || 'Normal'}</p>
            <p><strong>Energy:</strong> ${task.energy || 'Standard Focus'}</p>
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
                    showReward(`Deleted: ${task.title}`, 0, 0);
                }
            };
        }
        
        modal.style.display = 'flex';
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    
    function renderTaskBank() {
        const container = document.getElementById('taskBankList');
        if (!container) return;
        
        let allTasks = [];
        const banks = ['phd', 'skool', 'curriculum', 'ra', 'docs', 'rituals'];
        for (let bank of banks) {
            const data = window.AK_DATA[bank];
            if (data && data.tasks) {
                allTasks.push(...data.tasks.map(t => ({ ...t, sourceBank: bank })));
            }
        }
        
        const templateTasks = [...DAILY_TASKS, ...WEEKLY_TASKS];
        allTasks.push(...templateTasks.map(t => ({ ...t, id: t.title, fromTemplate: true })));
        
        const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
        const domainFilter = document.getElementById('bankDomainFilter')?.value || '';
        const difficultyFilter = document.getElementById('bankDifficultyFilter')?.value || '';
        
        let filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
        if (domainFilter) filtered = filtered.filter(t => t.domain === domainFilter);
        if (difficultyFilter) filtered = filtered.filter(t => t.difficulty === difficultyFilter);
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="ak-card">No tasks found. Use the Generator to create new tasks!</div>';
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
                    <span>📁 ${t.domain || 'General'}</span>
                    <span>⭐ ${t.xp || 30} XP</span>
                </div>
                <div class="mission-actions">
                    <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain || 'General'}" data-difficulty="${t.difficulty || 'Medium'}" data-xp="${t.xp || 30}" data-steps='${JSON.stringify(t.microSteps || t.steps || ["Plan task", "Execute work", "Review results"])}'>+ Add to Active</button>
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
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: btn.dataset.title,
            domain: btn.dataset.domain,
            difficulty: btn.dataset.difficulty,
            xp: parseInt(btn.dataset.xp),
            repeatability: 'One-time',
            priority: 'Important',
            energy: 'Standard Focus',
            steps: stepsArray.map((text, idx) => ({ text: text, completed: false })),
            notes: '',
            startedAt: new Date().toISOString(),
            completed: false
        };
        state.activeTasks.push(newTask);
        pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask, xpGain: 0 });
        saveState();
        showReward(`Added: ${newTask.title}`, 0, 0);
    }
    
    function renderAvatar() {
        const nameInput = document.getElementById('avatarName');
        if (nameInput) {
            nameInput.value = state.avatar.name;
            nameInput.onchange = (e) => {
                state.avatar.name = e.target.value;
                saveState();
                renderAvatarSVG();
            };
        }
        
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
        
        renderAvatarSVG();
        
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
                            showReward(`Equipped ${SHOP_ITEMS.find(i => i.id === itemId)?.name}`, 0, 0);
                        }
                    };
                });
            }
        }
    }
    
    function renderAvatarSVG() {
        const svg = document.getElementById('avatarSvg');
        if (!svg) return;
        
        svg.innerHTML = '';
        
        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', '100');
        bgCircle.setAttribute('cy', '100');
        bgCircle.setAttribute('r', '90');
        bgCircle.setAttribute('fill', '#1a1a2e');
        bgCircle.setAttribute('stroke', '#d62828');
        bgCircle.setAttribute('stroke-width', '3');
        svg.appendChild(bgCircle);
        
        // Face
        const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        face.setAttribute('cx', '100');
        face.setAttribute('cy', '95');
        face.setAttribute('r', '45');
        face.setAttribute('fill', '#e8c4a0');
        svg.appendChild(face);
        
        // Eyes
        const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        leftEye.setAttribute('cx', '80');
        leftEye.setAttribute('cy', '85');
        leftEye.setAttribute('rx', '8');
        leftEye.setAttribute('ry', '10');
        leftEye.setAttribute('fill', '#2a2a2e');
        svg.appendChild(leftEye);
        
        const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        rightEye.setAttribute('cx', '120');
        rightEye.setAttribute('cy', '85');
        rightEye.setAttribute('rx', '8');
        rightEye.setAttribute('ry', '10');
        rightEye.setAttribute('fill', '#2a2a2e');
        svg.appendChild(rightEye);
        
        // Mouth
        const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mouth.setAttribute('d', 'M 85 110 Q 100 120 115 110');
        mouth.setAttribute('fill', 'none');
        mouth.setAttribute('stroke', '#2a2a2e');
        mouth.setAttribute('stroke-width', '2');
        svg.appendChild(mouth);
        
        // Add equipped gear visual indicators
        state.avatar.equipped.forEach(itemId => {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (item) {
                if (item.category === 'Cloak') {
                    const cloak = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    cloak.setAttribute('d', 'M 40 60 Q 100 50 160 60 L 170 170 Q 100 190 30 170 Z');
                    cloak.setAttribute('fill', 'rgba(214,40,40,0.3)');
                    cloak.setAttribute('stroke', '#d62828');
                    cloak.setAttribute('stroke-width', '1');
                    svg.appendChild(cloak);
                } else if (item.category === 'Mask') {
                    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    mask.setAttribute('d', 'M 65 70 Q 100 60 135 70 L 130 110 Q 100 120 70 110 Z');
                    mask.setAttribute('fill', 'rgba(255,255,255,0.2)');
                    mask.setAttribute('stroke', '#aaa');
                    mask.setAttribute('stroke-width', '1');
                    svg.appendChild(mask);
                } else if (item.category === 'Companion') {
                    const companion = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    companion.setAttribute('cx', '160');
                    companion.setAttribute('cy', '60');
                    companion.setAttribute('r', '12');
                    companion.setAttribute('fill', '#d62828');
                    svg.appendChild(companion);
                } else if (item.category === 'Aura') {
                    const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    aura.setAttribute('cx', '100');
                    aura.setAttribute('cy', '100');
                    aura.setAttribute('r', '95');
                    aura.setAttribute('fill', 'none');
                    aura.setAttribute('stroke', '#d62828');
                    aura.setAttribute('stroke-width', '2');
                    aura.setAttribute('stroke-dasharray', '5,5');
                    svg.appendChild(aura);
                }
            }
        });
        
        // Name text
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', '100');
        nameText.setAttribute('y', '185');
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('fill', '#e6e6e6');
        nameText.setAttribute('font-size', '12');
        nameText.textContent = state.avatar.name.substring(0, 15);
        svg.appendChild(nameText);
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
                } else {
                    showReward(`Not enough coins! Need ${cost - state.coins} more coins`, 0, 0);
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
                html += '<li class="text-dim">✨ No missions completed</li>';
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
                    ${unlocked ? `<small class="unlocked-date">✓ Unlocked</small>` : `<small>${ach.requirement}</small>`}
                </div>
            `;
        }).join('');
        
        container.innerHTML = achievements;
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
        report += `Next Level: ${state.level * 500 - state.xp} XP needed\n\n`;
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📜 MISSIONS COMPLETED (Last 7 Days)\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        
        let weeklyXp = 0;
        let weeklyCoins = 0;
        
        last7Days.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `📅 ${day}:\n`;
                dayTasks.forEach(t => {
                    report += `   ✓ ${t.title}\n`;
                    report += `     +${t.xpGained} XP, +${t.coinsGained || 0} coins\n`;
                    weeklyXp += t.xpGained;
                    weeklyCoins += t.coinsGained || 0;
                });
                report += `\n`;
            }
        });
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📈 WEEKLY TOTALS: ${weeklyXp} XP | ${weeklyCoins} coins\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        report += `⚔️ EQUIPPED GEAR:\n`;
        if (state.avatar.equipped.length === 0) {
            report += `   None equipped\n`;
        } else {
            state.avatar.equipped.forEach(itemId => {
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                report += `   • ${item ? item.name : itemId}\n`;
            });
        }
        
        report += `\n💪 "The shadows remember every step you take."\n`;
        report += `═══════════════════════════════════════════\n`;
        
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
                
                const newTask = {
                    id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
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
                };
                state.activeTasks.push(newTask);
                imported++;
            }
        }
        
        if (imported > 0) {
            saveState();
            showReward(`Imported ${imported} tasks!`, 0, 0);
            textarea.value = '';
        } else {
            showReward(`No valid tasks found. Use format: Title | Domain | Difficulty | XP | Step1, Step2`, 0, 0);
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
        showReward('Data exported successfully!', 0, 0);
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
                    showReward('Data imported successfully!', 0, 0);
                    location.reload();
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
        const energies = ['Low Energy', 'Standard Focus', 'Deep Focus'];
        const repeatabilities = ['One-time', 'Daily', 'Weekly'];
        
        const domainSelect = document.getElementById('filterDomain');
        const bankDomainSelect = document.getElementById('bankDomainFilter');
        if (domainSelect) {
            domainSelect.innerHTML = '<option value="">All Domains</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        if (bankDomainSelect) {
            bankDomainSelect.innerHTML = '<option value="">All Themes</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const diffSelect = document.getElementById('filterDifficulty');
        if (diffSelect) {
            diffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const bankDiffSelect = document.getElementById('bankDifficultyFilter');
        if (bankDiffSelect) {
            bankDiffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const prioritySelect = document.getElementById('filterPriority');
        if (prioritySelect) {
            prioritySelect.innerHTML = '<option value="">All Priorities</option>' + priorities.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        
        const energySelect = document.getElementById('filterEnergy');
        if (energySelect) {
            energySelect.innerHTML = '<option value="">All Energy Levels</option>' + energies.map(e => `<option value="${e}">${e}</option>`).join('');
        }
        
        const repeatSelect = document.getElementById('filterRepeatability');
        if (repeatSelect) {
            repeatSelect.innerHTML = '<option value="">All Repeatability</option>' + repeatabilities.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        
        document.querySelectorAll('#filterDomain, #filterDifficulty, #filterPriority, #filterEnergy, #filterRepeatability, #bankSearch, #bankDomainFilter, #bankDifficultyFilter').forEach(el => {
            if (el) el.addEventListener('change', () => renderAll());
        });
    }
    
    function setupGenerator() {
        const themeSelect = document.getElementById('genTheme');
        const subjectSelect = document.getElementById('genSubject');
        const sideTopicSelect = document.getElementById('genSideTopic');
        
        if (themeSelect) {
            themeSelect.innerHTML = Object.keys(THEMES).map(t => `<option value="${t}">${t}</option>`).join('');
            themeSelect.addEventListener('change', () => {
                const theme = themeSelect.value;
                const subjects = THEMES[theme]?.subjects || [];
                if (subjectSelect) {
                    subjectSelect.innerHTML = subjects.map(s => `<option value="${s}">${s}</option>`).join('');
                    subjectSelect.disabled = subjects.length === 0;
                }
            });
            themeSelect.dispatchEvent(new Event('change'));
        }
        
        if (subjectSelect) {
            subjectSelect.addEventListener('change', () => {
                const theme = themeSelect?.value;
                const subject = subjectSelect.value;
                const sideTopics = THEMES[theme]?.sideTopics?.[subject] || [];
                if (sideTopicSelect) {
                    sideTopicSelect.innerHTML = sideTopics.map(st => `<option value="${st}">${st}</option>`).join('');
                    sideTopicSelect.disabled = sideTopics.length === 0;
                }
            });
        }
        
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const goal = document.getElementById('genGoal')?.value;
                if (!goal) {
                    alert('Enter a goal first');
                    return;
                }
                
                const theme = themeSelect?.value || 'Shadow Research Missions';
                const subject = subjectSelect?.value || 'General';
                const sideTopic = sideTopicSelect?.value || '';
                const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
                const repeatability = document.getElementById('genRepeatability')?.value || 'One-time';
                const priority = document.getElementById('genPriority')?.value || 'Important';
                const energy = document.getElementById('genEnergy')?.value || 'Standard Focus';
                const context = document.getElementById('genContext')?.value || 'Online';
                
                const xpValue = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : difficulty === 'Hard' ? 90 : 200;
                
                let steps = [];
                if (theme.includes('Research')) {
                    steps = [
                        `Define research scope for: ${goal.substring(0,50)}`,
                        `Conduct literature search and gather sources`,
                        `Read and annotate key articles`,
                        `Synthesize findings and identify gaps`,
                        `Write research summary and next steps`
                    ];
                } else if (theme.includes('Curriculum')) {
                    steps = [
                        `Define learning outcomes for ${goal.substring(0,50)}`,
                        `Design lesson flow and activities`,
                        `Create assessments and rubrics`,
                        `Build supporting materials`,
                        `Review and iterate based on feedback`
                    ];
                } else if (theme.includes('Skool')) {
                    steps = [
                        `Plan community engagement for ${goal.substring(0,50)}`,
                        `Create compelling content or challenge`,
                        `Publish and promote to members`,
                        `Respond and engage with participants`,
                        `Track metrics and document wins`
                    ];
                } else {
                    steps = [
                        `Clarify scope and objective: ${goal.substring(0,50)}`,
                        `Break down into manageable sub-tasks`,
                        `Execute first phase of work`,
                        `Review progress and adjust plan`,
                        `Complete and document results`
                    ];
                }
                
                const generatedTask = {
                    id: 'gen_' + Date.now(),
                    title: goal,
                    domain: theme,
                    subject: subject,
                    sideTopic: sideTopic,
                    difficulty: difficulty,
                    xp: xpValue,
                    repeatability: repeatability,
                    priority: priority,
                    energy: energy,
                    context: context,
                    steps: steps.map((text, idx) => ({ text, completed: false })),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false
                };
                
                const previewDiv = document.getElementById('generatedPreview');
                if (previewDiv) {
                    let stepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                    steps.forEach(s => stepsHtml += `<li>${escapeHtml(s)}</li>`);
                    stepsHtml += '</ul>';
                    previewDiv.innerHTML = `
                        <div class="mission-item">
                            <div class="mission-header">
                                <strong>📋 ${escapeHtml(goal)}</strong>
                                <div class="mission-badge">
                                    <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                                    <span class="badge ${priority.toLowerCase()}">${priority}</span>
                                </div>
                            </div>
                            <div class="mission-meta">
                                <span>📁 ${theme}</span>
                                <span>🔄 ${repeatability}</span>
                                <span>⭐ ${xpValue} XP</span>
                            </div>
                            ${stepsHtml}
                            <div class="mission-actions">
                                <button id="editGeneratedBtn">✏️ Edit Steps</button>
                            </div>
                        </div>
                    `;
                    
                    const editBtn = document.getElementById('editGeneratedBtn');
                    if (editBtn) {
                        editBtn.onclick = () => {
                            const newSteps = [];
                            steps.forEach((step, idx) => {
                                const newStep = prompt(`Edit step ${idx + 1}:`, step);
                                if (newStep) newSteps.push(newStep);
                                else newSteps.push(step);
                            });
                            if (newSteps.length) {
                                generatedTask.steps = newSteps.map((text, idx) => ({ text, completed: false }));
                                steps = newSteps;
                                let newStepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                                newSteps.forEach(s => newStepsHtml += `<li>${escapeHtml(s)}</li>`);
                                newStepsHtml += '</ul>';
                                previewDiv.innerHTML = `
                                    <div class="mission-item">
                                        <div class="mission-header">
                                            <strong>📋 ${escapeHtml(goal)}</strong>
                                            <div class="mission-badge">
                                                <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                                                <span class="badge ${priority.toLowerCase()}">${priority}</span>
                                            </div>
                                        </div>
                                        <div class="mission-meta">
                                            <span>📁 ${theme}</span>
                                            <span>🔄 ${repeatability}</span>
                                            <span>⭐ ${xpValue} XP</span>
                                        </div>
                                        ${newStepsHtml}
                                        <div class="mission-actions">
                                            <button id="editGeneratedBtn">✏️ Edit Steps</button>
                                        </div>
                                    </div>
                                `;
                                const newEditBtn = document.getElementById('editGeneratedBtn');
                                if (newEditBtn) newEditBtn.onclick = arguments.callee;
                            }
                        };
                    }
                }
                
                const addBtn = document.getElementById('addGeneratedBtn');
                if (addBtn) {
                    addBtn.style.display = 'inline-block';
                    const newAddBtn = addBtn.cloneNode(true);
                    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                    newAddBtn.onclick = () => {
                        state.activeTasks.push(generatedTask);
                        pushUndo({ type: 'addTask', taskId: generatedTask.id, task: generatedTask, xpGain: 0 });
                        saveState();
                        if (previewDiv) previewDiv.innerHTML = '';
                        newAddBtn.style.display = 'none';
                        document.querySelector('.ak-tab-btn[data-tab="active"]')?.click();
                        showReward(`Generated: ${generatedTask.title}`, 0, 0);
                    };
                }
            });
        }
    }
    
    function setupEventListeners() {
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
        
        document.getElementById('undoBtn')?.addEventListener('click', () => { undo(); renderAll(); });
        document.getElementById('redoBtn')?.addEventListener('click', () => { redo(); renderAll(); });
        
        document.getElementById('forceResetBtn')?.addEventListener('click', () => {
            state.lastResetDate = getTodayStr();
            checkAndRegenerateTasks();
            saveState();
            showReward('Daily reset completed!', 0, 0);
        });
        
        document.getElementById('forceWeeklyResetBtn')?.addEventListener('click', () => {
            state.lastWeeklyResetDate = getLastMonday();
            checkAndRegenerateTasks();
            saveState();
            showReward('Weekly reset completed!', 0, 0);
        });
        
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            if (confirm('⚠️ WIPE ALL PROGRESS? This cannot be undone.')) {
                localStorage.clear();
                location.reload();
            }
        });
        
        document.getElementById('exportReportBtn')?.addEventListener('click', generateReport);
        document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
        
        document.getElementById('genQuickBtn')?.addEventListener('click', () => {
            document.querySelector('.ak-tab-btn[data-tab="generator"]')?.click();
        });
        
        document.getElementById('batchImportBtn')?.addEventListener('click', () => {
            document.querySelector('.ak-tab-btn[data-tab="generator"]')?.click();
            document.getElementById('batchImport')?.focus();
        });
        
        document.getElementById('batchImportExecute')?.addEventListener('click', batchImport);
        
        document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
        document.getElementById('importDataBtn')?.addEventListener('click', () => {
            document.getElementById('importDataInput')?.click();
        });
        document.getElementById('importDataInput')?.addEventListener('change', (e) => {
            if (e.target.files[0]) importData(e.target.files[0]);
        });
        
        document.getElementById('bankSearch')?.addEventListener('input', () => renderTaskBank());
        
        setupGenerator();
    }
    
    // ---------- INITIALIZE ----------
    loadState();
    setupFilters();
    setupEventListeners();
    renderAll();
    
    console.log('🎯 Akatsuki Quest Initialized!', { 
        activeTasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        level: state.level,
        achievements: state.unlockedAchievements.length
    });
    // Complete script.js - Part 1 (continued from previous message)

    function renderActiveMissions() {
        const container = document.getElementById('activeMissionsList');
        if (!container) return;
        
        let filteredTasks = state.activeTasks.filter(t => !t.completed);
        
        // Apply filters
        const domainFilter = document.getElementById('filterDomain')?.value || '';
        const difficultyFilter = document.getElementById('filterDifficulty')?.value || '';
        const priorityFilter = document.getElementById('filterPriority')?.value || '';
        const energyFilter = document.getElementById('filterEnergy')?.value || '';
        const repeatFilter = document.getElementById('filterRepeatability')?.value || '';
        
        if (domainFilter) filteredTasks = filteredTasks.filter(t => t.domain === domainFilter);
        if (difficultyFilter) filteredTasks = filteredTasks.filter(t => t.difficulty === difficultyFilter);
        if (priorityFilter) filteredTasks = filteredTasks.filter(t => t.priority === priorityFilter);
        if (energyFilter) filteredTasks = filteredTasks.filter(t => t.energy === energyFilter);
        if (repeatFilter) filteredTasks = filteredTasks.filter(t => t.repeatability === repeatFilter);
        
        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="ak-card">✨ No active missions. Add some from the Task Bank or Generator!</div>';
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
                    <span>⚡ ${task.energy || 'Standard Focus'}</span>
                    <span>⭐ ${task.xp || 30} XP</span>
                    ${task.estimatedTime ? `<span>⏱️ ${task.estimatedTime} min</span>` : ''}
                </div>
                <ul class="step-list">
                    ${task.steps.map((step, idx) => `
                        <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                            <label class="step-label" contenteditable="true">${escapeHtml(step.text)}</label>
                            <button class="edit-step-btn" data-step-idx="${idx}">✏️</button>
                        </li>
                    `).join('')}
                </ul>
                <div class="mission-actions">
                    <button class="add-step-btn">+ Add Step</button>
                    <button class="edit-task-btn">✏️ Edit Task</button>
                    <button class="view-task-details">📝 Details</button>
                </div>
            </div>
        `).join('');
        
        // Attach event listeners
        attachMissionEventListeners();
    }
    
    function attachMissionEventListeners() {
        // Step checkboxes
        document.querySelectorAll('.step-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleStepToggle);
            cb.addEventListener('change', handleStepToggle);
        });
        
        // Step labels (contenteditable)
        document.querySelectorAll('.step-label').forEach(label => {
            label.removeEventListener('blur', handleStepEdit);
            label.addEventListener('blur', handleStepEdit);
        });
        
        // Edit step buttons
        document.querySelectorAll('.edit-step-btn').forEach(btn => {
            btn.removeEventListener('click', handleEditStepClick);
            btn.addEventListener('click', handleEditStepClick);
        });
        
        // Add step buttons
        document.querySelectorAll('.add-step-btn').forEach(btn => {
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
            checkAchievements();
        }
    }
    
    function handleStepEdit(e) {
        const label = e.target;
        const newText = label.innerText.trim();
        if (!newText) return;
        
        const li = label.closest('.step-item');
        const stepIndex = parseInt(li.dataset.stepIndex);
        const missionDiv = li.closest('.mission-item');
        const taskId = missionDiv.dataset.taskId;
        
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex] && task.steps[stepIndex].text !== newText) {
            task.steps[stepIndex].text = newText;
            saveState();
        }
    }
    
    function handleEditStepClick(e) {
        const btn = e.target;
        const li = btn.closest('.step-item');
        const stepIndex = parseInt(li.dataset.stepIndex);
        const label = li.querySelector('.step-label');
        label.focus();
    }
    
    function handleAddStep(e) {
        const btn = e.target;
        const missionDiv = btn.closest('.mission-item');
        const taskId = missionDiv.dataset.taskId;
        const newStepText = prompt('Enter new step:');
        if (newStepText && newStepText.trim()) {
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task) {
                task.steps.push({ text: newStepText.trim(), completed: false });
                pushUndo({ type: 'addStep', taskId, stepIndex: task.steps.length - 1 });
                saveState();
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
        
        const newRepeat = prompt('Repeatability (One-time/Daily/Weekly):', task.repeatability);
        if (newRepeat && ['One-time','Daily','Weekly'].includes(newRepeat)) task.repeatability = newRepeat;
        
        saveState();
        showReward(`Task updated: ${task.title}`, 0, 0);
    }
    
    function renderTaskBank() {
        const container = document.getElementById('taskBankList');
        if (!container) return;
        
        let allTasks = [];
        const banks = ['phd', 'skool', 'curriculum', 'ra', 'docs', 'rituals'];
        for (let bank of banks) {
            const data = window.AK_DATA[bank];
            if (data && data.tasks) {
                allTasks.push(...data.tasks.map(t => ({ ...t, sourceBank: bank })));
            }
        }
        
        const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
        const domainFilter = document.getElementById('bankDomainFilter')?.value || '';
        const difficultyFilter = document.getElementById('bankDifficultyFilter')?.value || '';
        
        let filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
        if (domainFilter) filtered = filtered.filter(t => t.domain === domainFilter || t.theme === domainFilter);
        if (difficultyFilter) filtered = filtered.filter(t => t.difficulty === difficultyFilter);
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="ak-card">No tasks found. Use the Generator to create new tasks!</div>';
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
                    ${t.estimatedTime ? `<span>⏱️ ${t.estimatedTime} min</span>` : ''}
                </div>
                ${t.successCriteria ? `<div class="mission-meta">🎯 Success: ${t.successCriteria.substring(0, 100)}...</div>` : ''}
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
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: btn.dataset.title,
            domain: btn.dataset.domain,
            difficulty: btn.dataset.difficulty,
            xp: parseInt(btn.dataset.xp),
            repeatability: 'One-time',
            priority: 'Important',
            energy: 'Standard Focus',
            steps: stepsArray.map((text, idx) => ({ text: text, completed: false })),
            notes: '',
            startedAt: new Date().toISOString(),
            completed: false
        };
        state.activeTasks.push(newTask);
        pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask, xpGain: 0 });
        saveState();
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
                renderAvatarSVG();
            };
        }
        
        // Update multipliers display
        const { xpMult, coinMult } = getMultipliers();
        const xpMultEl = document.getElementById('xpMult');
        const coinMultEl = document.getElementById('coinMult');
        if (xpMultEl) xpMultEl.innerText = xpMult.toFixed(2);
        if (coinMultEl) coinMultEl.innerText = coinMult.toFixed(2);
        
        // Total stats
        const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
        const missionsCompleted = state.completedHistory.length;
        document.getElementById('totalXPEarned').innerText = totalXPEarned;
        document.getElementById('missionsCompleted').innerText = missionsCompleted;
        
        // Render avatar SVG with layers
        renderAvatarSVG();
        
        // Equipped gear
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
                        showReward(`Unequipped item`, 0, 0);
                    };
                });
            }
        }
        
        // Inventory
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
                            showReward(`Equipped ${SHOP_ITEMS.find(i => i.id === itemId)?.name}`, 0, 0);
                        }
                    };
                });
            }
        }
    }
    
    function renderAvatarSVG() {
        const svg = document.getElementById('avatarSvg');
        if (!svg) return;
        
        // Clear existing content
        svg.innerHTML = '';
        
        // Background circle
        const bgCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        bgCircle.setAttribute('cx', '100');
        bgCircle.setAttribute('cy', '100');
        bgCircle.setAttribute('r', '90');
        bgCircle.setAttribute('fill', '#1a1a2e');
        bgCircle.setAttribute('stroke', '#d62828');
        bgCircle.setAttribute('stroke-width', '3');
        svg.appendChild(bgCircle);
        
        // Face/Skin
        const face = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        face.setAttribute('cx', '100');
        face.setAttribute('cy', '95');
        face.setAttribute('r', '45');
        face.setAttribute('fill', '#e8c4a0');
        svg.appendChild(face);
        
        // Eyes
        const leftEye = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        leftEye.setAttribute('cx', '80');
        leftEye.setAttribute('cy', '85');
        leftEye.setAttribute('rx', '8');
        leftEye.setAttribute('ry', '10');
        leftEye.setAttribute('fill', '#2a2a2e');
        svg.appendChild(leftEye);
        
        const rightEye = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        rightEye.setAttribute('cx', '120');
        rightEye.setAttribute('cy', '85');
        rightEye.setAttribute('rx', '8');
        rightEye.setAttribute('ry', '10');
        rightEye.setAttribute('fill', '#2a2a2e');
        svg.appendChild(rightEye);
        
        // Mouth
        const mouth = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mouth.setAttribute('d', 'M 85 110 Q 100 120 115 110');
        mouth.setAttribute('fill', 'none');
        mouth.setAttribute('stroke', '#2a2a2e');
        mouth.setAttribute('stroke-width', '2');
        svg.appendChild(mouth);
        
        // Add equipped gear layers
        state.avatar.equipped.forEach(itemId => {
            const item = SHOP_ITEMS.find(i => i.id === itemId);
            if (item && item.svgLayer) {
                // In a full implementation, you'd load SVG layers
                // For now, add visual indicators
                if (item.category === 'Cloak') {
                    const cloak = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    cloak.setAttribute('d', 'M 40 60 Q 100 50 160 60 L 170 170 Q 100 190 30 170 Z');
                    cloak.setAttribute('fill', 'rgba(214,40,40,0.3)');
                    cloak.setAttribute('stroke', '#d62828');
                    cloak.setAttribute('stroke-width', '1');
                    svg.appendChild(cloak);
                } else if (item.category === 'Mask') {
                    const mask = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                    mask.setAttribute('d', 'M 65 70 Q 100 60 135 70 L 130 110 Q 100 120 70 110 Z');
                    mask.setAttribute('fill', 'rgba(255,255,255,0.2)');
                    mask.setAttribute('stroke', '#aaa');
                    mask.setAttribute('stroke-width', '1');
                    svg.appendChild(mask);
                } else if (item.category === 'Companion') {
                    const companion = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    companion.setAttribute('cx', '160');
                    companion.setAttribute('cy', '60');
                    companion.setAttribute('r', '12');
                    companion.setAttribute('fill', '#d62828');
                    svg.appendChild(companion);
                } else if (item.category === 'Aura') {
                    const aura = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    aura.setAttribute('cx', '100');
                    aura.setAttribute('cy', '100');
                    aura.setAttribute('r', '95');
                    aura.setAttribute('fill', 'none');
                    aura.setAttribute('stroke', '#d62828');
                    aura.setAttribute('stroke-width', '2');
                    aura.setAttribute('stroke-dasharray', '5,5');
                    svg.appendChild(aura);
                }
            }
        });
        
        // Name text
        const nameText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        nameText.setAttribute('x', '100');
        nameText.setAttribute('y', '185');
        nameText.setAttribute('text-anchor', 'middle');
        nameText.setAttribute('fill', '#e6e6e6');
        nameText.setAttribute('font-size', '12');
        nameText.textContent = state.avatar.name.substring(0, 15);
        svg.appendChild(nameText);
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
                } else {
                    showReward(`Not enough coins! Need ${cost - state.coins} more coins`, 0, 0);
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
                html += '<li class="text-dim">✨ No missions completed</li>';
            } else {
                dayCompletions.forEach(c => html += `<li>✅ ${escapeHtml(c.title)} (+${c.xpGained} XP, +${c.coinsGained || 0} coins)</li>`);
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
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
        report += `Next Level: ${state.level * 500 - state.xp} XP needed\n\n`;
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📜 MISSIONS COMPLETED (Last 7 Days)\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        
        let weeklyXp = 0;
        let weeklyCoins = 0;
        
        last7Days.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `📅 ${day}:\n`;
                dayTasks.forEach(t => {
                    report += `   ✓ ${t.title}\n`;
                    report += `     +${t.xpGained} XP, +${t.coinsGained || 0} coins\n`;
                    weeklyXp += t.xpGained;
                    weeklyCoins += t.coinsGained || 0;
                });
                report += `\n`;
            }
        });
        
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
        report += `📈 WEEKLY TOTALS: ${weeklyXp} XP | ${weeklyCoins} coins\n`;
        report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
        report += `⚔️ EQUIPPED GEAR:\n`;
        if (state.avatar.equipped.length === 0) {
            report += `   None equipped\n`;
        } else {
            state.avatar.equipped.forEach(itemId => {
                const item = SHOP_ITEMS.find(i => i.id === itemId);
                report += `   • ${item ? item.name : itemId}\n`;
            });
        }
        
        report += `\n💪 "The shadows remember every step you take."\n`;
        report += `═══════════════════════════════════════════\n`;
        
        const reportOutput = document.getElementById('reportOutput');
        if (reportOutput) {
            reportOutput.innerText = report;
            reportOutput.style.display = 'block';
            
            // Also offer download
            const blob = new Blob([report], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `akatsuki_report_${new Date().toISOString().slice(0,10)}.txt`;
            a.click();
            URL.revokeObjectURL(url);
        }
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
                    ${unlocked ? `<small class="unlocked-date">✓ Unlocked</small>` : `<small>${ach.requirement}</small>`}
                </div>
            `;
        }).join('');
        
        container.innerHTML = achievements;
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
                case 'scroll_keeper':
                    const docCompletions = state.completedHistory.filter(h => h.title?.toLowerCase().includes('log') || h.title?.toLowerCase().includes('documentation'));
                    if (docCompletions.length >= 7) unlocked = true;
                    break;
                case 'shadow_scholar':
                    const litTasks = state.completedHistory.filter(h => h.title?.toLowerCase().includes('literature') || h.title?.toLowerCase().includes('article'));
                    if (litTasks.length >= 10) unlocked = true;
                    break;
                case 'boss_slayer':
                    const eliteTasks = state.completedHistory.filter(h => h.title?.toLowerCase().includes('boss') || h.xpGained >= 150);
                    if (eliteTasks.length >= 1) unlocked = true;
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
                showReward(`🏆 Achievement Unlocked: ${ach.name} (+${ach.xpReward} XP)`, ach.xpReward, 0);
                changed = true;
            }
        });
        
        if (changed) {
            updateXPLevel();
            saveState();
            renderAchievements();
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
            
            // Format: Title | Domain | Difficulty | XP | Step1, Step2, Step3
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 2) {
                const title = parts[0];
                const domain = parts[1] || 'General';
                const difficulty = parts[2] || 'Medium';
                const xp = parseInt(parts[3]) || 30;
                const stepsText = parts[4] || 'Plan task,Execute work,Review results';
                const steps = stepsText.split(',').map(s => ({ text: s.trim(), completed: false }));
                
                const newTask = {
                    id: 'import_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
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
                };
                state.activeTasks.push(newTask);
                imported++;
            }
        }
        
        if (imported > 0) {
            saveState();
            showReward(`Imported ${imported} tasks!`, 0, 0);
            textarea.value = '';
        } else {
            showReward(`No valid tasks found. Use format: Title | Domain | Difficulty | XP | Step1, Step2`, 0, 0);
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
        showReward('Data exported successfully!', 0, 0);
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
                    state.lastResetDate = imported.state.lastResetDate || new Date().toISOString().slice(0,10);
                    state.lastWeeklyResetDate = imported.state.lastWeeklyResetDate || getLastMonday();
                    state.activeTasks = imported.state.activeTasks || [];
                    state.completedHistory = imported.state.completedHistory || [];
                    state.avatar = imported.state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
                    state.unlockedAchievements = imported.state.unlockedAchievements || [];
                    
                    saveState();
                    showReward('Data imported successfully!', 0, 0);
                    location.reload();
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
        // Populate filter dropdowns
        const domains = ['PhD', 'Skool', 'Curriculum', 'Research Assistantship', 'Documentation', 'Rituals', 'General'];
        const difficulties = ['Easy', 'Medium', 'Hard', 'Elite'];
        const priorities = ['Critical', 'Important', 'Maintenance', 'Optional'];
        const energies = ['Low Energy', 'Standard Focus', 'Deep Focus'];
        const repeatabilities = ['One-time', 'Daily', 'Weekly'];
        
        const domainSelect = document.getElementById('filterDomain');
        const bankDomainSelect = document.getElementById('bankDomainFilter');
        if (domainSelect) {
            domainSelect.innerHTML = '<option value="">All Domains</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        if (bankDomainSelect) {
            bankDomainSelect.innerHTML = '<option value="">All Themes</option>' + domains.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const diffSelect = document.getElementById('filterDifficulty');
        if (diffSelect) {
            diffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const bankDiffSelect = document.getElementById('bankDifficultyFilter');
        if (bankDiffSelect) {
            bankDiffSelect.innerHTML = '<option value="">All Difficulties</option>' + difficulties.map(d => `<option value="${d}">${d}</option>`).join('');
        }
        
        const prioritySelect = document.getElementById('filterPriority');
        if (prioritySelect) {
            prioritySelect.innerHTML = '<option value="">All Priorities</option>' + priorities.map(p => `<option value="${p}">${p}</option>`).join('');
        }
        
        const energySelect = document.getElementById('filterEnergy');
        if (energySelect) {
            energySelect.innerHTML = '<option value="">All Energy Levels</option>' + energies.map(e => `<option value="${e}">${e}</option>`).join('');
        }
        
        const repeatSelect = document.getElementById('filterRepeatability');
        if (repeatSelect) {
            repeatSelect.innerHTML = '<option value="">All Repeatability</option>' + repeatabilities.map(r => `<option value="${r}">${r}</option>`).join('');
        }
        
        // Add event listeners for filters
        document.querySelectorAll('#filterDomain, #filterDifficulty, #filterPriority, #filterEnergy, #filterRepeatability, #bankSearch, #bankDomainFilter, #bankDifficultyFilter').forEach(el => {
            if (el) el.addEventListener('change', () => renderAll());
        });
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
            state.lastResetDate = new Date().toISOString().slice(0,10);
            checkAndRegenerateTasks();
            saveState();
            showReward('Daily reset completed!', 0, 0);
        });
        
        document.getElementById('forceWeeklyResetBtn')?.addEventListener('click', () => {
            state.lastWeeklyResetDate = getLastMonday();
            checkAndRegenerateTasks();
            saveState();
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
            document.getElementById('batchImport')?.focus();
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
        setupGenerator();
        
        // Bank search
        document.getElementById('bankSearch')?.addEventListener('input', () => renderTaskBank());
    }
    
    function setupGenerator() {
        // Populate theme/subject/side-topic dropdowns
        const themeSelect = document.getElementById('genTheme');
        if (themeSelect) {
            const themes = ['Shadow Research Missions', 'Village Knowledge Expansion', 'Clan Leadership & Skool Community', 'Intelligence Gathering', 'Eternal Documentation Scrolls', 'Discipline & Rituals'];
            themeSelect.innerHTML = themes.map(t => `<option value="${t}">${t}</option>`).join('');
        }
        
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const goal = document.getElementById('genGoal')?.value;
                if (!goal) {
                    alert('Enter a goal first');
                    return;
                }
                
                const theme = document.getElementById('genTheme')?.value || 'Shadow Research Missions';
                const subject = document.getElementById('genSubject')?.value || 'General';
                const sideTopic = document.getElementById('genSideTopic')?.value || '';
                const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
                const repeatability = document.getElementById('genRepeatability')?.value || 'One-time';
                const priority = document.getElementById('genPriority')?.value || 'Important';
                const energy = document.getElementById('genEnergy')?.value || 'Standard Focus';
                const context = document.getElementById('genContext')?.value || 'Online';
                
                const xpValue = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : difficulty === 'Hard' ? 90 : 200;
                
                // Generate intelligent steps based on theme and goal
                let steps = [];
                if (theme.includes('Research')) {
                    steps = [
                        `Define research scope for: ${goal.substring(0,50)}`,
                        `Conduct literature search and gather sources`,
                        `Read and annotate key articles`,
                        `Synthesize findings and identify gaps`,
                        `Write research summary and next steps`
                    ];
                } else if (theme.includes('Curriculum')) {
                    steps = [
                        `Define learning outcomes for ${goal.substring(0,50)}`,
                        `Design lesson flow and activities`,
                        `Create assessments and rubrics`,
                        `Build supporting materials`,
                        `Review and iterate based on feedback`
                    ];
                } else if (theme.includes('Skool')) {
                    steps = [
                        `Plan community engagement for ${goal.substring(0,50)}`,
                        `Create compelling content or challenge`,
                        `Publish and promote to members`,
                        `Respond and engage with participants`,
                        `Track metrics and document wins`
                    ];
                } else if (theme.includes('Documentation')) {
                    steps = [
                        `Set up documentation structure for ${goal.substring(0,50)}`,
                        `Capture evidence and artifacts`,
                        `Organize and format content`,
                        `Review for completeness and clarity`,
                        `Archive and link to dashboard`
                    ];
                } else if (theme.includes('Rituals')) {
                    steps = [
                        `Define ritual purpose and outcome for ${goal.substring(0,50)}`,
                        `Create step-by-step ritual flow`,
                        `Set up environment and triggers`,
                        `Test and refine the ritual`,
                        `Commit to consistent practice`
                    ];
                } else {
                    steps = [
                        `Clarify scope and objective: ${goal.substring(0,50)}`,
                        `Break down into manageable sub-tasks`,
                        `Execute first phase of work`,
                        `Review progress and adjust plan`,
                        `Complete and document results`
                    ];
                }
                
                const generatedTask = {
                    id: 'gen_' + Date.now(),
                    title: goal,
                    domain: theme,
                    subject: subject,
                    sideTopic: sideTopic,
                    difficulty: difficulty,
                    xp: xpValue,
                    repeatability: repeatability,
                    priority: priority,
                    energy: energy,
                    context: context,
                    steps: steps.map((text, idx) => ({ text, completed: false })),
                    notes: '',
                    startedAt: new Date().toISOString(),
                    completed: false,
                    estimatedTime: difficulty === 'Easy' ? 30 : difficulty === 'Medium' ? 60 : 120
                };
                
                const previewDiv = document.getElementById('generatedPreview');
                if (previewDiv) {
                    let stepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                    steps.forEach(s => stepsHtml += `<li>${escapeHtml(s)}</li>`);
                    stepsHtml += '</ul>';
                    previewDiv.innerHTML = `
                        <div class="mission-item">
                            <div class="mission-header">
                                <strong>📋 ${escapeHtml(goal)}</strong>
                                <div class="mission-badge">
                                    <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                                    <span class="badge ${priority.toLowerCase()}">${priority}</span>
                                </div>
                            </div>
                            <div class="mission-meta">
                                <span>📁 ${theme}</span>
                                <span>🔄 ${repeatability}</span>
                                <span>⭐ ${xpValue} XP</span>
                            </div>
                            ${stepsHtml}
                            <div class="mission-actions">
                                <button id="editGeneratedBtn">✏️ Edit Steps</button>
                            </div>
                        </div>
                    `;
                    
                    const editBtn = document.getElementById('editGeneratedBtn');
                    if (editBtn) {
                        editBtn.onclick = () => {
                            const newSteps = [];
                            steps.forEach((step, idx) => {
                                const newStep = prompt(`Edit step ${idx + 1}:`, step);
                                if (newStep) newSteps.push(newStep);
                                else newSteps.push(step);
                            });
                            if (newSteps.length) {
                                generatedTask.steps = newSteps.map((text, idx) => ({ text, completed: false }));
                                steps = newSteps;
                                let newStepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                                newSteps.forEach(s => newStepsHtml += `<li>${escapeHtml(s)}</li>`);
                                newStepsHtml += '</ul>';
                                previewDiv.innerHTML = `
                                    <div class="mission-item">
                                        <div class="mission-header">
                                            <strong>📋 ${escapeHtml(goal)}</strong>
                                            <div class="mission-badge">
                                                <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                                                <span class="badge ${priority.toLowerCase()}">${priority}</span>
                                            </div>
                                        </div>
                                        <div class="mission-meta">
                                            <span>📁 ${theme}</span>
                                            <span>🔄 ${repeatability}</span>
                                            <span>⭐ ${xpValue} XP</span>
                                        </div>
                                        ${newStepsHtml}
                                        <div class="mission-actions">
                                            <button id="editGeneratedBtn">✏️ Edit Steps</button>
                                        </div>
                                    </div>
                                `;
                                const newEditBtn = document.getElementById('editGeneratedBtn');
                                if (newEditBtn) newEditBtn.onclick = arguments.callee;
                            }
                        };
                    }
                }
                
                const addBtn = document.getElementById('addGeneratedBtn');
                if (addBtn) {
                    addBtn.style.display = 'inline-block';
                    const newAddBtn = addBtn.cloneNode(true);
                    addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                    newAddBtn.onclick = () => {
                        state.activeTasks.push(generatedTask);
                        pushUndo({ type: 'addTask', taskId: generatedTask.id, task: generatedTask, xpGain: 0 });
                        saveState();
                        if (previewDiv) previewDiv.innerHTML = '';
                        newAddBtn.style.display = 'none';
                        document.querySelector('.ak-tab-btn[data-tab="active"]')?.click();
                        showReward(`Generated: ${generatedTask.title}`, 0, 0);
                    };
                }
            });
        }
    }
    
    // ---------- INITIALIZE ----------
    loadState();
    setupFilters();
    setupEventListeners();
    renderAll();
    
    console.log('🎯 Akatsuki Quest Initialized!', { 
        activeTasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        level: state.level,
        achievements: state.unlockedAchievements.length
    });
}

// Helper functions
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

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
}
