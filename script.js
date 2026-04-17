// Akatsuki PhD Quest - Complete Working Version
document.addEventListener('DOMContentLoaded', () => {
    let attempts = 0;
    const waitForData = setInterval(() => {
        if (window.AK_DATA && window.AK_DATA.rules) {
            clearInterval(waitForData);
            initApp();
        } else if (attempts > 50) {
            clearInterval(waitForData);
            console.warn('Data load timeout, using defaults');
            initApp();
        }
        attempts++;
    }, 100);
});

// Shop items definition
const SHOP_ITEMS = [
    { id: 'cloak_basic', name: 'Akatsuki Cloak', category: 'Cloak', cost: 150, effect: { xpMult: 1.05, coinMult: 1.0 }, description: '+5% XP' },
    { id: 'mask_anbu', name: 'ANBU Mask', category: 'Mask', cost: 100, effect: { xpMult: 1.03, coinMult: 1.0 }, description: '+3% XP' },
    { id: 'ring_akatsuki', name: 'Akatsuki Ring', category: 'Accessory', cost: 80, effect: { xpMult: 1.02, coinMult: 1.02 }, description: '+2% XP & Coins' },
    { id: 'raven_companion', name: 'Raven Companion', category: 'Companion', cost: 200, effect: { xpMult: 1.1, coinMult: 1.0 }, description: '+10% XP' },
    { id: 'crimson_aura', name: 'Crimson Aura', category: 'Aura', cost: 120, effect: { xpMult: 1.0, coinMult: 1.1 }, description: '+10% Coins' },
    { id: 'shadow_wolf', name: 'Shadow Wolf', category: 'Companion', cost: 350, effect: { xpMult: 1.15, coinMult: 1.05 }, description: '+15% XP, +5% Coins' },
    { id: 'elite_cloak', name: 'Elite Akatsuki Cloak', category: 'Cloak', cost: 400, effect: { xpMult: 1.12, coinMult: 1.08 }, description: '+12% XP, +8% Coins' },
    { id: 'focus_charm', name: 'Focus Charm', category: 'Accessory', cost: 60, effect: { xpMult: 1.0, coinMult: 1.0 }, description: 'Cosmetic only' }
];

// Daily recurring tasks that auto-generate
const DAILY_TASKS = [
    { title: "Morning Startup Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Critical",
      steps: ["Open mission board", "Review today's calendar", "Pick top 3 priorities", "Start first block"] },
    { title: "Daily Mission Log", domain: "Documentation", difficulty: "Easy", xp: 15, priority: "Important",
      steps: ["Write what you accomplished", "Note any blockers", "Record tomorrow's first task"] },
    { title: "Shutdown Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Important",
      steps: ["Review completed tasks", "Clear workspace", "Set tomorrow's first action"] }
];

// Weekly recurring tasks
const WEEKLY_TASKS = [
    { title: "Weekly Review & Reset", domain: "Documentation", difficulty: "Medium", xp: 45, priority: "Critical",
      steps: ["Review last week's wins", "Identify patterns/blockers", "Set next week's top 3 missions", "Update documentation"] },
    { title: "Weekly Challenge Check-in", domain: "Skool", difficulty: "Medium", xp: 35, priority: "Important",
      steps: ["Post accountability thread", "Respond to member updates", "Celebrate member wins"] }
];

function initApp() {
    // ---------- STATE ----------
    let state = {
        xp: 0,
        coins: 150, // Start with 150 coins
        level: 1,
        streak: 0,
        lastResetDate: new Date().toISOString().slice(0,10),
        lastWeeklyResetDate: getLastMonday(),
        activeTasks: [],
        completedHistory: [],
        undoStack: [],
        redoStack: [],
        avatar: {
            name: 'Shadow Scholar',
            equipped: [],
            inventory: []
        }
    };

    function getLastMonday() {
        const d = new Date();
        d.setHours(0,0,0,0);
        const day = d.getDay();
        const diff = (day === 0 ? 6 : day - 1);
        d.setDate(d.getDate() - diff);
        return d.toISOString().slice(0,10);
    }

    // Load from localStorage
    function loadState() {
        const saved = localStorage.getItem('akatsuki_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
                state.activeTasks = (state.activeTasks || []).map(t => ({
                    ...t,
                    steps: (t.steps || []).map(s => 
                        typeof s === 'string' ? { text: s, completed: false, editable: true } : s
                    )
                }));
                state.completedHistory = state.completedHistory || [];
                state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
            } catch(e) { console.error(e); }
        }
        
        // Check for daily/weekly resets and regenerate tasks
        checkAndRegenerateTasks();
        
        // Ensure we have active tasks
        if (state.activeTasks.length === 0 || state.activeTasks.filter(t => !t.completed).length === 0) {
            addDefaultTasks();
        }
        
        updateXPLevel();
        saveState();
    }

    function checkAndRegenerateTasks() {
        const today = new Date().toISOString().slice(0,10);
        const todayDate = new Date(today);
        const lastResetDate = new Date(state.lastResetDate);
        
        // Daily reset check
        if (todayDate > lastResetDate) {
            // Remove old completed daily tasks and regenerate
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Daily' && t.completed) {
                    return false; // Remove completed daily tasks
                }
                return true;
            });
            
            // Add fresh daily tasks
            DAILY_TASKS.forEach(taskTemplate => {
                const existingDaily = state.activeTasks.find(t => t.title === taskTemplate.title && t.repeatability === 'Daily');
                if (!existingDaily || existingDaily.completed) {
                    state.activeTasks.push({
                        id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
                        title: taskTemplate.title,
                        domain: taskTemplate.domain,
                        difficulty: taskTemplate.difficulty,
                        xp: taskTemplate.xp,
                        repeatability: 'Daily',
                        priority: taskTemplate.priority,
                        steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false, editable: true })),
                        notes: '',
                        startedAt: new Date().toISOString(),
                        completed: false
                    });
                }
            });
            
            state.lastResetDate = today;
        }
        
        // Weekly reset check (Monday)
        const thisMonday = getLastMonday();
        if (thisMonday > state.lastWeeklyResetDate) {
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Weekly' && t.completed) {
                    return false;
                }
                return true;
            });
            
            WEEKLY_TASKS.forEach(taskTemplate => {
                const existingWeekly = state.activeTasks.find(t => t.title === taskTemplate.title && t.repeatability === 'Weekly');
                if (!existingWeekly || existingWeekly.completed) {
                    state.activeTasks.push({
                        id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
                        title: taskTemplate.title,
                        domain: taskTemplate.domain,
                        difficulty: taskTemplate.difficulty,
                        xp: taskTemplate.xp,
                        repeatability: 'Weekly',
                        priority: taskTemplate.priority,
                        steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false, editable: true })),
                        notes: '',
                        startedAt: new Date().toISOString(),
                        completed: false
                    });
                }
            });
            
            state.lastWeeklyResetDate = thisMonday;
        }
    }

    function addDefaultTasks() {
        // Add daily tasks
        DAILY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
                title: taskTemplate.title,
                domain: taskTemplate.domain,
                difficulty: taskTemplate.difficulty,
                xp: taskTemplate.xp,
                repeatability: 'Daily',
                priority: taskTemplate.priority,
                steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false, editable: true })),
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            });
        });
        
        // Add weekly tasks
        WEEKLY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: `${taskTemplate.title.toLowerCase().replace(/\s/g, '_')}_${Date.now()}`,
                title: taskTemplate.title,
                domain: taskTemplate.domain,
                difficulty: taskTemplate.difficulty,
                xp: taskTemplate.xp,
                repeatability: 'Weekly',
                priority: taskTemplate.priority,
                steps: taskTemplate.steps.map((text, idx) => ({ text, completed: false, editable: true })),
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            });
        });
    }

    function saveState() {
        localStorage.setItem('akatsuki_state', JSON.stringify(state));
        renderAll();
    }

    function showReward(message, xpGain, coinGain) {
        const toast = document.getElementById('rewardToast');
        if (toast) {
            toast.innerHTML = `✨ +${xpGain} XP  💰 +${coinGain} Coins<br>${message}`;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
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
    }

    function updateStreak() {
        const completionsByDate = {};
        state.completedHistory.forEach(h => {
            const date = h.completedAt.slice(0,10);
            completionsByDate[date] = true;
        });
        let streak = 0;
        let today = new Date().toISOString().slice(0,10);
        let check = today;
        while (completionsByDate[check]) {
            streak++;
            let d = new Date(check);
            d.setDate(d.getDate() - 1);
            check = d.toISOString().slice(0,10);
        }
        state.streak = streak;
    }

    // ---------- RENDER FUNCTIONS ----------
    function renderAll() {
        renderHeader();
        renderDashboard();
        renderActiveMissions();
        renderTaskBank();
        renderHistory();
        renderAvatar();
        renderShop();
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
            h.completedAt.slice(0,10) === new Date().toISOString().slice(0,10)
        ).length;
        
        const activeCountEl = document.getElementById('activeCount');
        const completedTodayEl = document.getElementById('completedToday');
        const totalXPEl = document.getElementById('totalXP');
        if (activeCountEl) activeCountEl.innerText = activeCount;
        if (completedTodayEl) completedTodayEl.innerText = completedToday;
        if (totalXPEl) totalXPEl.innerText = state.xp;
        
        const hasImportant = state.activeTasks.some(t => t.completed && (t.priority === 'Critical' || t.priority === 'Important'));
        const hasRitual = state.activeTasks.some(t => t.completed && t.domain === 'Rituals');
        const hasDoc = state.activeTasks.some(t => t.completed && t.domain === 'Documentation');
        
        const winTheDayEl = document.getElementById('winTheDay');
        const impCountEl = document.getElementById('impCount');
        const ritualCountEl = document.getElementById('ritualCount');
        const docCountEl = document.getElementById('docCount');
        
        if (winTheDayEl) winTheDayEl.innerHTML = (hasImportant && hasRitual && hasDoc) ? '✅' : '❌';
        if (impCountEl) impCountEl.innerText = hasImportant ? 1 : 0;
        if (ritualCountEl) ritualCountEl.innerText = hasRitual ? 1 : 0;
        if (docCountEl) docCountEl.innerText = hasDoc ? 1 : 0;
    }

    function renderActiveMissions() {
        const container = document.getElementById('activeMissionsList');
        if (!container) return;
        container.innerHTML = '';
        
        const activeTasks = state.activeTasks.filter(t => !t.completed);
        
        if (activeTasks.length === 0) {
            container.innerHTML = '<div class="ak-card">✨ No active missions. Add some from the Task Bank or Generator!</div>';
            return;
        }
        
        activeTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'mission-item';
            div.innerHTML = `
                <div class="mission-title">
                    <strong>${escapeHtml(task.title)}</strong>
                    <small style="color:#aaa">${task.difficulty} | ${task.domain} | ${task.xp} XP | 🔄 ${task.repeatability || 'One-time'}</small>
                </div>
                <div class="mission-meta">Priority: ${task.priority || 'Normal'}</div>
                <ul class="step-list" data-task-id="${task.id}">
                    ${task.steps.map((step, idx) => `
                        <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                            <label contenteditable="${step.editable !== false}" class="step-label">${escapeHtml(step.text)}</label>
                            ${step.editable !== false ? '<button class="edit-step-btn" data-step-idx="'+idx+'">✏️</button>' : ''}
                        </li>
                    `).join('')}
                </ul>
                <button class="add-step-btn" data-task-id="${task.id}">+ Add Step</button>
                <button class="view-task-details" data-task-id="${task.id}">📝 Details / Notes</button>
            `;
            container.appendChild(div);
        });
        
        // Attach checkbox listeners
        document.querySelectorAll('.step-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleStepToggle);
            cb.addEventListener('change', handleStepToggle);
        });
        
        // Attach edit step listeners
        document.querySelectorAll('.edit-step-btn').forEach(btn => {
            btn.removeEventListener('click', handleEditStep);
            btn.addEventListener('click', handleEditStep);
        });
        
        // Attach add step listeners
        document.querySelectorAll('.add-step-btn').forEach(btn => {
            btn.removeEventListener('click', handleAddStep);
            btn.addEventListener('click', handleAddStep);
        });
        
        // Attach details button listeners
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
        const taskId = missionDiv.querySelector('.step-list').dataset.taskId;
        
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
        }
    }
    
    function handleEditStep(e) {
        const btn = e.target;
        const li = btn.closest('.step-item');
        const stepIndex = parseInt(li.dataset.stepIndex);
        const label = li.querySelector('.step-label');
        const currentText = label.innerText;
        const newText = prompt('Edit step text:', currentText);
        if (newText && newText.trim()) {
            const missionDiv = li.closest('.mission-item');
            const taskId = missionDiv.querySelector('.step-list').dataset.taskId;
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task && task.steps[stepIndex]) {
                task.steps[stepIndex].text = newText.trim();
                label.innerText = newText.trim();
                saveState();
            }
        }
    }
    
    function handleAddStep(e) {
        const btn = e.target;
        const missionDiv = btn.closest('.mission-item');
        const taskId = missionDiv.querySelector('.step-list').dataset.taskId;
        const newStepText = prompt('Enter new step:');
        if (newStepText && newStepText.trim()) {
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task) {
                task.steps.push({ text: newStepText.trim(), completed: false, editable: true });
                saveState();
            }
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
        
        modal.style.display = 'flex';
        const closeBtn = modal.querySelector('.close');
        if (closeBtn) closeBtn.onclick = () => modal.style.display = 'none';
        window.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    }
    
    function renderTaskBank() {
        const container = document.getElementById('taskBankList');
        if (!container) return;
        
        // Collect all tasks from loaded banks
        let allTasks = [];
        const banks = ['phd', 'skool', 'curriculum', 'ra', 'docs', 'rituals'];
        for (let bank of banks) {
            const data = window.AK_DATA[bank];
            if (data && data.tasks) {
                allTasks.push(...data.tasks);
            }
        }
        
        // Also add the daily/weekly templates as bank items
        const templateTasks = [...DAILY_TASKS, ...WEEKLY_TASKS];
        allTasks.push(...templateTasks.map(t => ({ ...t, id: t.title, fromTemplate: true })));
        
        const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
        const filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="ak-card">No tasks found. Add some from the Generator!</div>';
            return;
        }
        
        container.innerHTML = filtered.slice(0, 30).map(t => `
            <div class="mission-item">
                <div class="mission-title"><strong>${escapeHtml(t.title)}</strong></div>
                <div class="mission-meta">${t.difficulty || 'Medium'} | ${t.domain || 'General'} | ${t.xp || 30} XP</div>
                <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain || 'General'}" data-difficulty="${t.difficulty || 'Medium'}" data-xp="${t.xp || 30}" data-steps='${JSON.stringify(t.steps || ["Plan task", "Execute work", "Review results"])}'>+ Add to Active</button>
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
        } catch(e) { stepsArray = ["Plan this task", "Execute the main work", "Review and document"]; }
        
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: btn.dataset.title,
            domain: btn.dataset.domain,
            difficulty: btn.dataset.difficulty,
            xp: parseInt(btn.dataset.xp),
            repeatability: 'One-time',
            priority: 'Normal',
            steps: stepsArray.map((text, idx) => ({ text: text, completed: false, editable: true })),
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
        
        const equippedContainer = document.getElementById('equippedList');
        if (equippedContainer) {
            if (state.avatar.equipped.length === 0) {
                equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Buy items from the Shop!</div>';
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
                    ${owned ? `<button class="buy-btn" disabled ${equipped ? 'style="background:#444"' : ''}>${equipped ? 'Equipped' : 'Owned'}</button>` :
                      `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">Purchase</button>`}
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
                    state.avatar.equipped.push(itemId);
                    showReward(`Purchased: ${item.name}`, 0, -cost);
                    saveState();
                } else {
                    showReward(`Not enough coins! Need ${cost} coins`, 0, 0);
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
                html += '<li>✨ No completions</li>';
            } else {
                dayCompletions.forEach(c => html += `<li>✅ ${escapeHtml(c.title)} (+${c.xpGained} XP, +${c.coinsGained || 0} coins)</li>`);
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
    }
    
    function generateReport() {
        let report = `═══════════════════════════════════\n`;
        report += `     🌙 AKATSUKI WEEKLY REPORT\n`;
        report += `═══════════════════════════════════\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `👤 Scholar: ${state.avatar.name}\n`;
        report += `📊 Level: ${state.level} | XP: ${state.xp} | 💰 Coins: ${state.coins} | 🔥 Streak: ${state.streak}\n`;
        const { xpMult, coinMult } = getMultipliers();
        report += `✨ Multipliers: ${xpMult.toFixed(2)}x XP, ${coinMult.toFixed(2)}x Coins\n`;
        report += `\n📜 COMPLETED MISSIONS THIS WEEK:\n`;
        report += `─────────────────────────────────\n`;
        
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        
        let totalXp = 0;
        let totalCoins = 0;
        last7Days.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `\n📅 ${day}:\n`;
                dayTasks.forEach(t => {
                    report += `   ✓ ${t.title}\n`;
                    report += `     +${t.xpGained} XP, +${t.coinsGained || 0} coins\n`;
                    totalXp += t.xpGained;
                    totalCoins += t.coinsGained || 0;
                });
            }
        });
        
        report += `\n═══════════════════════════════════\n`;
        report += `📊 WEEK TOTALS: ${totalXp} XP | ${totalCoins} coins\n`;
        report += `═══════════════════════════════════\n`;
        report += `\n🎯 Next Level: ${(state.level * 500 - state.xp)} XP needed\n`;
        report += `💪 Keep your streak going! You're at ${state.streak} days.\n`;
        
        const reportOutput = document.getElementById('reportOutput');
        if (reportOutput) {
            reportOutput.innerText = report;
            reportOutput.style.display = 'block';
        }
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
    
    // ---------- SETUP EVENT LISTENERS ----------
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
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => { undo(); renderAll(); });
        if (redoBtn) redoBtn.addEventListener('click', () => { redo(); renderAll(); });
        
        // Settings
        const forceResetBtn = document.getElementById('forceResetBtn');
        if (forceResetBtn) {
            forceResetBtn.addEventListener('click', () => {
                state.lastResetDate = new Date().toISOString().slice(0,10);
                checkAndRegenerateTasks();
                saveState();
                showReward('Daily reset completed!', 0, 0);
            });
        }
        
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('⚠️ Wipe all progress? This cannot be undone.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
        
        // Report buttons
        const exportReportBtn = document.getElementById('exportReportBtn');
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (exportReportBtn) exportReportBtn.addEventListener('click', generateReport);
        if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);
        
        // Quick generate
        const genQuickBtn = document.getElementById('genQuickBtn');
        if (genQuickBtn) {
            genQuickBtn.addEventListener('click', () => {
                const generatorTab = document.querySelector('.ak-tab-btn[data-tab="generator"]');
                if (generatorTab) generatorTab.click();
            });
        }
        
        // Task Generator - Enhanced with editable steps
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.addEventListener('click', () => {
                const goal = document.getElementById('genGoal')?.value;
                if (!goal) {
                    alert('Enter a goal first');
                    return;
                }
                const domain = document.getElementById('genDomain')?.value || 'General';
                const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
                const xpVal = difficulty === 'Easy' ? 20 : (difficulty === 'Medium' ? 40 : 80);
                
                // Generate intelligent steps based on goal and domain
                let steps = [];
                if (domain === 'PhD') {
                    steps = [
                        `Review literature on: ${goal.substring(0,40)}`,
                        `Develop theoretical framework for ${goal.substring(0,30)}`,
                        `Collect and analyze relevant data`,
                        `Write findings and discussion`,
                        `Revise and submit for feedback`
                    ];
                } else if (domain === 'Skool') {
                    steps = [
                        `Plan ${goal} content structure`,
                        `Create engaging post/lesson materials`,
                        `Publish and promote to community`,
                        `Respond to member engagement`,
                        `Track metrics and gather feedback`
                    ];
                } else if (domain === 'Curriculum') {
                    steps = [
                        `Define learning outcomes for ${goal.substring(0,40)}`,
                        `Design lesson flow and activities`,
                        `Create assessments and rubrics`,
                        `Build supporting materials and slides`,
                        `Test and iterate based on feedback`
                    ];
                } else if (domain === 'Documentation') {
                    steps = [
                        `Set up documentation structure for ${goal.substring(0,40)}`,
                        `Capture initial notes and evidence`,
                        `Organize and format content`,
                        `Review for completeness`,
                        `Archive and link to dashboard`
                    ];
                } else {
                    steps = [
                        `Clarify scope: ${goal.substring(0,50)}`,
                        `Break down into manageable sub-tasks`,
                        `Execute first phase of work`,
                        `Review progress and adjust plan`,
                        `Complete and document results`
                    ];
                }
                
                const generatedTask = {
                    id: 'gen_' + Date.now(),
                    title: goal,
                    domain: domain,
                    difficulty: difficulty,
                    xp: xpVal,
                    repeatability: 'One-time',
                    priority: 'Important',
                    steps: steps.map((text, idx) => ({ text, completed: false, editable: true })),
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
                            <strong>📋 ${escapeHtml(goal)}</strong><br>
                            <span style="color:#aaa">${difficulty} · ${domain} · ${xpVal} XP</span>
                            ${stepsHtml}
                            <button id="editGeneratedBtn" style="margin-top:10px;">✏️ Edit Steps</button>
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
                                generatedTask.steps = newSteps.map((text, idx) => ({ text, completed: false, editable: true }));
                                steps = newSteps;
                                let newStepsHtml = '<ul style="margin-top:10px; padding-left:20px;">';
                                newSteps.forEach(s => newStepsHtml += `<li>${escapeHtml(s)}</li>`);
                                newStepsHtml += '</ul>';
                                previewDiv.innerHTML = `
                                    <div class="mission-item">
                                        <strong>📋 ${escapeHtml(goal)}</strong><br>
                                        <span style="color:#aaa">${difficulty} · ${domain} · ${xpVal} XP</span>
                                        ${newStepsHtml}
                                        <button id="editGeneratedBtn" style="margin-top:10px;">✏️ Edit Steps</button>
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
        
        // Bank search
        const bankSearch = document.getElementById('bankSearch');
        if (bankSearch) {
            bankSearch.addEventListener('input', () => renderTaskBank());
        }
    }
    
    // ---------- INITIALIZE ----------
    loadState();
    setupEventListeners();
    renderAll();
    
    console.log('Akatsuki Quest initialized!', { 
        activeTasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        equipped: state.avatar.equipped,
        level: state.level
    });
}
