// Akatsuki PhD Quest - Complete Working Version
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

function initApp() {
    // ---------- STATE ----------
    let state = {
        xp: 0,
        coins: 150, // Starting coins to buy something
        level: 1,
        streak: 0,
        lastResetDate: new Date().toISOString().slice(0,10),
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
                        typeof s === 'string' ? { text: s, completed: false } : s
                    )
                }));
                state.completedHistory = state.completedHistory || [];
                state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
            } catch(e) { console.error(e); }
        }
        
        // Add sample task if empty
        if (state.activeTasks.length === 0) {
            state.activeTasks.push({
                id: 'sample_' + Date.now(),
                title: 'Write daily mission log',
                domain: 'Documentation',
                difficulty: 'Easy',
                xp: 15,
                repeatability: 'Daily',
                priority: 'Important',
                steps: [
                    { text: 'Open log template', completed: false },
                    { text: 'Write what you did today', completed: false },
                    { text: 'Save the log', completed: false }
                ],
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            });
        }
        
        updateXPLevel();
        saveState();
    }

    function saveState() {
        localStorage.setItem('akatsuki_state', JSON.stringify(state));
        renderAll();
    }

    function showReward(message, xpGain, coinGain) {
        const toast = document.getElementById('rewardToast');
        toast.innerHTML = `✨ +${xpGain} XP  💰 +${coinGain} Coins<br>${message}`;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
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
        document.getElementById('level').innerText = state.level;
        document.getElementById('xp').innerText = state.xp;
        document.getElementById('coins').innerText = state.coins;
        document.getElementById('streak').innerText = state.streak;
    }

    function renderDashboard() {
        const activeCount = state.activeTasks.filter(t => !t.completed).length;
        const completedToday = state.completedHistory.filter(h => 
            h.completedAt.slice(0,10) === new Date().toISOString().slice(0,10)
        ).length;
        
        document.getElementById('activeCount').innerText = activeCount;
        document.getElementById('completedToday').innerText = completedToday;
        document.getElementById('totalXP').innerText = state.xp;
        
        const hasImportant = state.activeTasks.some(t => t.completed && (t.priority === 'Critical' || t.priority === 'Important'));
        const hasRitual = state.activeTasks.some(t => t.completed && t.domain === 'Rituals');
        const hasDoc = state.activeTasks.some(t => t.completed && t.domain === 'Documentation');
        
        document.getElementById('winTheDay').innerHTML = (hasImportant && hasRitual && hasDoc) ? '✅' : '❌';
        document.getElementById('impCount').innerText = hasImportant ? 1 : 0;
        document.getElementById('ritualCount').innerText = hasRitual ? 1 : 0;
        document.getElementById('docCount').innerText = hasDoc ? 1 : 0;
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
                    <small style="color:#aaa">${task.difficulty} | ${task.domain} | ${task.xp} XP</small>
                </div>
                <div class="mission-meta">Repeat: ${task.repeatability || 'One-time'} | Priority: ${task.priority || 'Normal'}</div>
                <ul class="step-list" data-task-id="${task.id}">
                    ${task.steps.map((step, idx) => `
                        <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                            <label>${escapeHtml(step.text)}</label>
                        </li>
                    `).join('')}
                </ul>
                <button class="view-task-details" data-task-id="${task.id}">📝 Details / Notes</button>
            `;
            container.appendChild(div);
        });
        
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
    
    function handleDetailsClick(e) {
        const taskId = e.target.dataset.taskId;
        openTaskModal(taskId);
    }
    
    function openTaskModal(taskId) {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (!task) return;
        
        const modal = document.getElementById('taskModal');
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
        document.querySelector('.close').onclick = () => modal.style.display = 'none';
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
                allTasks.push(...data.tasks);
            }
        }
        
        const searchTerm = document.getElementById('bankSearch')?.value.toLowerCase() || '';
        const filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
        
        if (filtered.length === 0) {
            container.innerHTML = '<div class="ak-card">No tasks found.</div>';
            return;
        }
        
        container.innerHTML = filtered.slice(0, 20).map(t => `
            <div class="mission-item">
                <div class="mission-title"><strong>${escapeHtml(t.title)}</strong></div>
                <div class="mission-meta">${t.difficulty || 'Medium'} | ${t.domain || 'General'} | ${t.xp || 30} XP</div>
                <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain || 'General'}" data-difficulty="${t.difficulty || 'Medium'}" data-xp="${t.xp || 30}">+ Add to Active</button>
            </div>
        `).join('');
        
        document.querySelectorAll('.add-from-bank').forEach(btn => {
            btn.removeEventListener('click', handleAddFromBank);
            btn.addEventListener('click', handleAddFromBank);
        });
    }
    
    function handleAddFromBank(e) {
        const btn = e.target;
        const newTask = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
            title: btn.dataset.title,
            domain: btn.dataset.domain,
            difficulty: btn.dataset.difficulty,
            xp: parseInt(btn.dataset.xp),
            repeatability: 'One-time',
            priority: 'Normal',
            steps: [
                { text: 'Plan this task', completed: false },
                { text: 'Execute the main work', completed: false },
                { text: 'Review and document', completed: false }
            ],
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
        document.getElementById('xpMult').innerText = xpMult.toFixed(2);
        document.getElementById('coinMult').innerText = coinMult.toFixed(2);
        
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
            html += `<div class="ak-card"><h3>${day}</h3><ul>`;
            if (dayCompletions.length === 0) {
                html += '<li>No completions</li>';
            } else {
                dayCompletions.forEach(c => html += `<li>${escapeHtml(c.title)} (+${c.xpGained} XP, +${c.coinsGained || 0} coins)</li>`);
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
    }
    
    function generateReport() {
        let report = `═══════════════════════════════════\n`;
        report += `     AKATSUKI WEEKLY REPORT\n`;
        report += `═══════════════════════════════════\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `Level: ${state.level} | XP: ${state.xp} | Coins: ${state.coins} | Streak: ${state.streak}\n`;
        const { xpMult, coinMult } = getMultipliers();
        report += `Multipliers: ${xpMult.toFixed(2)}x XP, ${coinMult.toFixed(2)}x Coins\n`;
        report += `\n📜 COMPLETED MISSIONS THIS WEEK:\n`;
        
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
        report += `📊 TOTALS: ${totalXp} XP | ${totalCoins} coins\n`;
        report += `═══════════════════════════════════\n`;
        
        const reportOutput = document.getElementById('reportOutput');
        if (reportOutput) reportOutput.innerText = report;
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
        document.querySelectorAll('.ak-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                document.querySelectorAll('.ak-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                document.querySelectorAll('.ak-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        document.getElementById('undoBtn')?.addEventListener('click', () => { undo(); renderAll(); });
        document.getElementById('redoBtn')?.addEventListener('click', () => { redo(); renderAll(); });
        document.getElementById('forceResetBtn')?.addEventListener('click', () => {
            state.lastResetDate = new Date().toISOString().slice(0,10);
            saveState();
        });
        document.getElementById('clearAllBtn')?.addEventListener('click', () => {
            if (confirm('Wipe all progress? Cannot undo.')) {
                localStorage.clear();
                location.reload();
            }
        });
        document.getElementById('exportReportBtn')?.addEventListener('click', generateReport);
        document.getElementById('generateReportBtn')?.addEventListener('click', generateReport);
        
        document.getElementById('genQuickBtn')?.addEventListener('click', () => {
            document.querySelector('.ak-tab-btn[data-tab="generator"]')?.click();
        });
        
        document.getElementById('generateBtn')?.addEventListener('click', () => {
            const goal = document.getElementById('genGoal')?.value;
            if (!goal) {
                alert('Enter a goal first');
                return;
            }
            const domain = document.getElementById('genDomain')?.value || 'General';
            const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
            const xpVal = difficulty === 'Easy' ? 20 : (difficulty === 'Medium' ? 40 : 80);
            
            const newTask = {
                id: 'gen_' + Date.now(),
                title: goal,
                domain: domain,
                difficulty: difficulty,
                xp: xpVal,
                repeatability: 'One-time',
                priority: 'Important',
                steps: [
                    { text: `Clarify scope: ${goal.substring(0,50)}`, completed: false },
                    { text: 'Break down into 3 sub-tasks', completed: false },
                    { text: 'Execute first sub-task', completed: false },
                    { text: 'Review and document results', completed: false }
                ],
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            };
            
            const previewDiv = document.getElementById('generatedPreview');
            if (previewDiv) {
                previewDiv.innerHTML = `<div class="mission-item"><strong>${escapeHtml(goal)}</strong><br>${difficulty} · ${domain} · ${xpVal} XP</div>`;
            }
            
            const addBtn = document.getElementById('addGeneratedBtn');
            if (addBtn) {
                addBtn.style.display = 'inline-block';
                const newAddBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                newAddBtn.onclick = () => {
                    state.activeTasks.push(newTask);
                    pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask, xpGain: 0 });
                    saveState();
                    if (previewDiv) previewDiv.innerHTML = '';
                    newAddBtn.style.display = 'none';
                    document.querySelector('.ak-tab-btn[data-tab="active"]')?.click();
                    showReward(`Generated: ${newTask.title}`, 0, 0);
                };
            }
        });
        
        document.getElementById('bankSearch')?.addEventListener('input', () => renderTaskBank());
    }
    
    // ---------- INITIALIZE ----------
    loadState();
    setupEventListeners();
    renderAll();
    
    console.log('Akatsuki Quest initialized!', { activeTasks: state.activeTasks.length, coins: state.coins, equipped: state.avatar.equipped });
}
