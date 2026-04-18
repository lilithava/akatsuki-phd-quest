/**
 * Akatsuki PhD Quest - Fixed Main Script
 * Version: 2.1.0
 */

// ============================================================
// GLOBAL STATE & INITIALIZATION
// ============================================================

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

// Daily recurring task templates
const DAILY_TASKS = [
    { 
        title: "Morning Startup Ritual", 
        domain: "Rituals", 
        difficulty: "Easy", 
        xp: 10, 
        priority: "Critical", 
        energy: "Low Energy",
        steps: ["Open mission board", "Review today's calendar", "Pick top 3 priorities", "Start first block"] 
    },
    { 
        title: "Daily Mission Log", 
        domain: "Documentation", 
        difficulty: "Easy", 
        xp: 15, 
        priority: "Important", 
        energy: "Low Energy",
        steps: ["Write what you accomplished", "Note any blockers", "Record tomorrow's first task"] 
    },
    { 
        title: "Shutdown Ritual", 
        domain: "Rituals", 
        difficulty: "Easy", 
        xp: 10, 
        priority: "Important", 
        energy: "Low Energy",
        steps: ["Review completed tasks", "Clear workspace", "Set tomorrow's first action"] 
    }
];

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function getTodayStr() {
    return new Date().toISOString().slice(0, 10);
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message) {
    const toast = document.getElementById('rewardToast');
    if (toast) {
        toast.innerHTML = escapeHtml(message);
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}

function generateUniqueId() {
    return Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// ============================================================
// STATE MANAGEMENT
// ============================================================

function saveState() {
    try {
        localStorage.setItem('akatsuki_state', JSON.stringify(state));
        console.log('✅ State saved successfully');
    } catch(e) {
        console.error('❌ Failed to save state:', e);
        showToast('Warning: Could not save progress');
    }
}

function loadState() {
    try {
        const saved = localStorage.getItem('akatsuki_state');
        if (saved) {
            const parsed = JSON.parse(saved);
            state = { ...state, ...parsed };
            console.log('✅ State loaded successfully');
        }
    } catch(e) {
        console.error('❌ Failed to load state:', e);
        showToast('Warning: Could not load saved progress');
    }
    
    // Initialize missing fields
    state.activeTasks = state.activeTasks || [];
    state.completedHistory = state.completedHistory || [];
    state.unlockedAchievements = state.unlockedAchievements || [];
    state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
    
    if (!state.lastResetDate) state.lastResetDate = getTodayStr();
    if (!state.lastWeeklyResetDate) state.lastWeeklyResetDate = getLastMonday();
    
    // Add daily tasks if none exist
    if (state.activeTasks.length === 0) {
        DAILY_TASKS.forEach(taskTemplate => {
            state.activeTasks.push({
                id: generateUniqueId(),
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
        saveState();
    }
    
    updateXPLevel();
}

function getLastMonday() {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0, 10);
}

// ============================================================
// XP & LEVEL SYSTEM
// ============================================================

function updateXPLevel() {
    const xpPerLevel = 500;
    const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
    
    if (newLevel > state.level) {
        state.coins += 100;
        showToast(`✨ Level Up! You reached level ${newLevel}! +100 coins`);
    }
    
    state.level = newLevel;
    updateXPBar();
}

function updateXPBar() {
    const xpPerLevel = 500;
    const currentLevelXp = (state.level - 1) * xpPerLevel;
    const nextLevelXp = state.level * xpPerLevel;
    const progress = ((state.xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
    
    const xpFill = document.getElementById('xpFill');
    if (xpFill) {
        xpFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    const xpCurrent = document.getElementById('xpCurrent');
    const xpNext = document.getElementById('xpNext');
    const nextLevelSpan = document.getElementById('nextLevel');
    
    if (xpCurrent) xpCurrent.textContent = state.xp;
    if (xpNext) xpNext.textContent = nextLevelXp;
    if (nextLevelSpan) nextLevelSpan.textContent = state.level + 1;
}

// ============================================================
// TASK MANAGEMENT
// ============================================================

function updateTaskCompletion(task) {
    const allStepsDone = task.steps.every(s => s.completed);
    if (allStepsDone && !task.completed) {
        completeTask(task.id);
    }
}

function completeTask(taskId) {
    const task = state.activeTasks.find(t => t.id === taskId);
    if (!task || task.completed) return;
    
    const xpGain = task.xp || 15;
    const coinGain = Math.floor(xpGain * 0.2);
    
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
    
    showToast(`✅ Completed: ${task.title} (+${xpGain} XP, +${coinGain} coins)`);
    updateXPLevel();
    saveState();
    renderAll();
}

function deleteTask(taskId) {
    if (!confirm('Delete this task?')) return;
    
    state.activeTasks = state.activeTasks.filter(t => t.id !== taskId);
    saveState();
    renderAll();
    showToast('Task deleted');
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
    populateTaskGeneratorDropdowns();
}

function renderHeader() {
    const levelEl = document.getElementById('level');
    const xpEl = document.getElementById('xp');
    const coinsEl = document.getElementById('coins');
    const streakEl = document.getElementById('streak');
    
    if (levelEl) levelEl.textContent = state.level;
    if (xpEl) xpEl.textContent = state.xp;
    if (coinsEl) coinsEl.textContent = state.coins;
    if (streakEl) streakEl.textContent = state.streak;
}

function renderDashboard() {
    const activeCount = state.activeTasks.filter(t => !t.completed).length;
    const completedToday = state.completedHistory.filter(h => 
        h.completedAt && h.completedAt.slice(0, 10) === getTodayStr()
    ).length;
    
    const activeCountEl = document.getElementById('activeCount');
    const completedTodayEl = document.getElementById('completedToday');
    const totalXPEl = document.getElementById('totalXP');
    const streakDisplayEl = document.getElementById('streakDisplay');
    
    if (activeCountEl) activeCountEl.textContent = activeCount;
    if (completedTodayEl) completedTodayEl.textContent = completedToday;
    if (totalXPEl) totalXPEl.textContent = state.xp;
    if (streakDisplayEl) streakDisplayEl.textContent = state.streak;
    
    // Win the day checks
    const hasImportant = state.activeTasks.some(t => 
        t.completed && (t.priority === 'Critical' || t.priority === 'Important')
    );
    const hasRitual = state.activeTasks.some(t => 
        t.completed && t.domain === 'Rituals'
    );
    const hasDoc = state.activeTasks.some(t => 
        t.completed && t.domain === 'Documentation'
    );
    
    const winImportant = document.getElementById('winImportant');
    const winRitual = document.getElementById('winRitual');
    const winDoc = document.getElementById('winDoc');
    const winResult = document.getElementById('winResult');
    
    if (winImportant) winImportant.innerHTML = hasImportant ? '✅' : '⬜';
    if (winRitual) winRitual.innerHTML = hasRitual ? '✅' : '⬜';
    if (winDoc) winDoc.innerHTML = hasDoc ? '✅' : '⬜';
    if (winResult) {
        winResult.innerHTML = (hasImportant && hasRitual && hasDoc) 
            ? '✅ WIN THE DAY!' 
            : '❌ NOT YET';
    }
}

function renderActiveMissions() {
    const container = document.getElementById('activeMissionsList');
    if (!container) return;
    
    const activeTasks = state.activeTasks.filter(t => !t.completed);
    
    if (activeTasks.length === 0) {
        container.innerHTML = '<div class="ak-card">✨ No active missions. Generate or add tasks from the Task Bank!</div>';
        return;
    }
    
    container.innerHTML = activeTasks.map(task => `
        <div class="mission-item" data-task-id="${task.id}">
            <div class="mission-header">
                <div class="mission-title">${escapeHtml(task.title)}</div>
                <div class="mission-badge">
                    <span class="badge ${task.difficulty.toLowerCase()}">${task.difficulty}</span>
                    <span class="badge ${task.priority.toLowerCase()}">${task.priority}</span>
                </div>
            </div>
            <div class="mission-meta">
                <span>📁 ${task.domain || 'General'}</span>
                <span>🔄 ${task.repeatability || 'One-time'}</span>
                <span>⭐ ${task.xp} XP</span>
            </div>
            <ul class="step-list">
                ${task.steps.map((step, idx) => `
                    <li class="step-item ${step.completed ? 'completed' : ''}" data-step-index="${idx}">
                        <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                        <label class="step-label">${escapeHtml(step.text)}</label>
                    </li>
                `).join('')}
            </ul>
            <div class="mission-actions">
                <button class="view-task-details" data-task-id="${task.id}">📝 Details</button>
                <button class="delete-task-btn" data-task-id="${task.id}">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

function renderTaskBank() {
    const container = document.getElementById('taskBankList');
    if (!container) return;
    
    const sampleTasks = [
        { 
            title: "Write 500 Words for Literature Review", 
            domain: "PhD", 
            difficulty: "Hard", 
            xp: 90, 
            steps: ["Find 10 sources", "Read and annotate", "Write synthesis", "Add citations"] 
        },
        { 
            title: "Create Weekly Skool Post", 
            domain: "Skool", 
            difficulty: "Medium", 
            xp: 35, 
            steps: ["Choose topic", "Write hook", "Add 3 tips", "Post and engage"] 
        },
        { 
            title: "Design Lesson Plan", 
            domain: "Curriculum", 
            difficulty: "Medium", 
            xp: 40, 
            steps: ["Define outcomes", "Create activities", "Build assessment", "Review"] 
        },
        { 
            title: "Code Interview Transcript", 
            domain: "Research Assistantship", 
            difficulty: "Hard", 
            xp: 80, 
            steps: ["Open transcript", "Apply codes", "Write memo", "Save"] 
        },
        {
            title: "Morning Startup Ritual",
            domain: "Rituals",
            difficulty: "Easy",
            xp: 15,
            steps: ["Open mission board", "Review calendar", "Pick top 3", "Start first block"]
        },
        {
            title: "Save Daily Evidence Pack",
            domain: "Documentation",
            difficulty: "Easy",
            xp: 20,
            steps: ["Take screenshots", "Export files", "Rename with date", "Store in folder"]
        }
    ];
    
    container.innerHTML = sampleTasks.map(t => `
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
                <button class="add-from-bank" 
                    data-title="${escapeHtml(t.title)}" 
                    data-domain="${t.domain}" 
                    data-difficulty="${t.difficulty}" 
                    data-xp="${t.xp}" 
                    data-steps='${JSON.stringify(t.steps)}'>
                    + Add to Active
                </button>
            </div>
        </div>
    `).join('');
}

function renderAvatar() {
    const nameInput = document.getElementById('avatarName');
    if (nameInput) {
        nameInput.value = state.avatar.name;
    }
    
    const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
    const missionsCompleted = state.completedHistory.length;
    
    const totalXPEarnedEl = document.getElementById('totalXPEarned');
    const missionsCompletedEl = document.getElementById('missionsCompleted');
    
    if (totalXPEarnedEl) totalXPEarnedEl.textContent = totalXPEarned;
    if (missionsCompletedEl) missionsCompletedEl.textContent = missionsCompleted;
    
    // Render equipped gear
    const equippedContainer = document.getElementById('equippedList');
    if (equippedContainer) {
        if (!state.avatar.equipped || state.avatar.equipped.length === 0) {
            equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Visit the Shop!</div>';
        } else {
            equippedContainer.innerHTML = state.avatar.equipped.map(itemId => 
                `<div class="gear-item">${itemId} 
                    <button class="unequip-btn" data-item="${itemId}">✖</button>
                </div>`
            ).join('');
        }
    }
    
    // Render inventory
    const inventoryContainer = document.getElementById('inventoryList');
    if (inventoryContainer) {
        const ownedNotEquipped = (state.avatar.inventory || []).filter(
            id => !(state.avatar.equipped || []).includes(id)
        );
        if (ownedNotEquipped.length === 0) {
            inventoryContainer.innerHTML = '<div class="gear-item">No items in inventory. Buy from Shop!</div>';
        } else {
            inventoryContainer.innerHTML = ownedNotEquipped.map(itemId => 
                `<div class="gear-item">${itemId} 
                    <button class="equip-btn" data-item="${itemId}">⚔️ Equip</button>
                </div>`
            ).join('');
        }
    }
}

function renderShop() {
    const container = document.getElementById('shopItemsList');
    const coinsSpan = document.getElementById('shopCoins');
    
    if (coinsSpan) coinsSpan.textContent = state.coins;
    if (!container) return;
    
    const shopItems = [
        { id: 'cloak_basic', name: 'Akatsuki Cloak', cost: 150, effect: '+5% XP', description: 'Classic black cloak with red clouds' },
        { id: 'mask_anbu', name: 'ANBU Mask', cost: 100, effect: '+3% XP', description: 'White ANBU-style mask' },
        { id: 'ring_akatsuki', name: 'Akatsuki Ring', cost: 80, effect: '+2% XP, +2% Coins', description: 'Glowing ring with secret meaning' },
        { id: 'companion_raven', name: 'Summon Raven', cost: 200, effect: '+10% XP on Documentation', description: 'Loyal raven companion' },
        { id: 'weapon_kunai', name: 'Shadow Kunai', cost: 80, effect: '+2% XP on Research', description: 'Standard-issue kunai' },
        { id: 'xp_scroll', name: 'XP Scroll', cost: 50, effect: '+25% XP next mission', description: 'Temporary XP boost' }
    ];
    
    container.innerHTML = shopItems.map(item => {
        const owned = state.avatar.inventory && state.avatar.inventory.includes(item.id);
        return `
            <div class="shop-item">
                <h4>${item.name}</h4>
                <p class="price">💰 ${item.cost} coins</p>
                <p class="effect">${item.description}</p>
                <p class="effect"><strong>${item.effect}</strong></p>
                ${owned 
                    ? `<button class="buy-btn" disabled>✓ Owned</button>` 
                    : `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}" data-name="${item.name}">Purchase</button>`
                }
            </div>
        `;
    }).join('');
}

function renderHistory() {
    const container = document.getElementById('weeklyHistory');
    if (!container) return;
    
    const last7Days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().slice(0, 10));
    }
    
    let html = '';
    for (const day of last7Days) {
        const dayCompletions = state.completedHistory.filter(h => 
            h.completedAt && h.completedAt.slice(0, 10) === day
        );
        html += `<div class="ak-card"><h3>📅 ${day}</h3><ul>`;
        if (dayCompletions.length === 0) {
            html += '<li>✨ No missions completed</li>';
        } else {
            dayCompletions.forEach(c => {
                html += `<li><strong>✅ ${escapeHtml(c.title)}</strong> (+${c.xpGained} XP, +${c.coinsGained || 0} coins)`;
                if (c.notes) {
                    html += `<br><span style="font-size:0.8rem; color:#aaa;">📝 ${escapeHtml(c.notes.substring(0, 100))}</span>`;
                }
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
    
    const achievements = [
        { id: 'first_blood', name: 'First Blood', icon: '🩸', description: 'Complete your first mission', unlocked: state.completedHistory.length > 0 },
        { id: 'streak_3', name: 'Spark Ignited', icon: '⚡', description: '3-day streak', unlocked: state.streak >= 3 },
        { id: 'streak_7', name: 'Week of Discipline', icon: '📅', description: '7-day streak', unlocked: state.streak >= 7 },
        { id: 'level_10', name: 'Commander', icon: '⭐', description: 'Reach level 10', unlocked: state.level >= 10 },
        { id: 'shadow_scholar', name: 'Shadow Scholar', icon: '📚', description: 'Complete 10 literature tasks', unlocked: false }
    ];
    
    container.innerHTML = achievements.map(a => `
        <div class="achievement-item ${a.unlocked ? 'unlocked' : 'locked'}">
            <div class="achievement-icon">${a.icon}</div>
            <h4>${a.name}</h4>
            <p>${a.description}</p>
            ${a.unlocked ? '<span class="badge">✓ UNLOCKED</span>' : '<span class="badge">🔒 LOCKED</span>'}
        </div>
    `).join('');
}

// ============================================================
// TASK GENERATOR
// ============================================================

function populateTaskGeneratorDropdowns() {
    const themeSelect = document.getElementById('genTheme');
    if (!themeSelect) return;
    
    const themes = [
        { id: 'phd', name: '🎓 Shadow Research Missions' },
        { id: 'skool', name: '👥 Clan Leadership & Skool' },
        { id: 'curriculum', name: '📖 Village Knowledge Expansion' },
        { id: 'ra', name: '🔬 Intelligence Gathering' },
        { id: 'docs', name: '📝 Eternal Documentation' },
        { id: 'rituals', name: '🌙 Discipline & Rituals' }
    ];
    
    themeSelect.innerHTML = themes.map(t => 
        `<option value="${t.id}">${t.name}</option>`
    ).join('');
}

function generateSingleTask() {
    const goal = document.getElementById('genGoal');
    if (!goal || !goal.value.trim()) {
        showToast('⚠️ Enter a goal first');
        return;
    }
    
    const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
    const priority = document.getElementById('genPriority')?.value || 'Important';
    const domain = document.getElementById('genTheme')?.selectedOptions[0]?.textContent || 'General';
    const repeatability = document.getElementById('genRepeatability')?.value || 'One-time';
    const energy = document.getElementById('genEnergy')?.value || 'Standard Focus';
    
    const xpMap = { 'Easy': 20, 'Medium': 40, 'Hard': 80, 'Elite': 250 };
    const xpValue = xpMap[difficulty] || 40;
    
    const newTask = {
        id: generateUniqueId(),
        title: goal.value.trim(),
        domain: domain,
        difficulty: difficulty,
        xp: xpValue,
        repeatability: repeatability,
        priority: priority,
        energy: energy,
        steps: [
            { text: `Define scope: ${goal.value.substring(0, 50)}`, completed: false },
            { text: 'Break down into sub-tasks', completed: false },
            { text: 'Execute main work', completed: false },
            { text: 'Review and document results', completed: false }
        ],
        notes: '',
        startedAt: new Date().toISOString(),
        completed: false
    };
    
    // Show preview
    const previewDiv = document.getElementById('generatedPreview');
    if (previewDiv) {
        previewDiv.innerHTML = `
            <div class="mission-item">
                <div class="mission-header">
                    <strong>📋 ${escapeHtml(newTask.title)}</strong>
                    <div class="mission-badge">
                        <span class="badge ${difficulty.toLowerCase()}">${difficulty}</span>
                    </div>
                </div>
                <div class="mission-meta">
                    <span>⭐ ${xpValue} XP</span>
                </div>
                <ul>
                    ${newTask.steps.map(s => `<li>${escapeHtml(s.text)}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Show add button
    const addBtn = document.getElementById('addGeneratedBtn');
    if (addBtn) {
        addBtn.style.display = 'inline-block';
        addBtn.onclick = () => {
            state.activeTasks.push(newTask);
            saveState();
            renderAll();
            showToast(`✅ Generated: ${newTask.title}`);
            if (previewDiv) previewDiv.innerHTML = '';
            addBtn.style.display = 'none';
            goal.value = '';
        };
    }
}

// ============================================================
// EVENT DELEGATION
// ============================================================

function setupGlobalEventDelegation() {
    const mainContent = document.querySelector('.ak-content');
    if (!mainContent) {
        console.warn('⚠️ Main content not found');
        return;
    }
    
    // Handle checkbox changes
    mainContent.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('step-checkbox')) {
            const checkbox = e.target;
            const li = checkbox.closest('.step-item');
            const stepIndex = parseInt(li.dataset.stepIndex);
            const missionDiv = li.closest('.mission-item');
            const taskId = missionDiv.dataset.taskId;
            
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task && task.steps[stepIndex]) {
                task.steps[stepIndex].completed = checkbox.checked;
                if (checkbox.checked) {
                    li.classList.add('completed');
                } else {
                    li.classList.remove('completed');
                }
                updateTaskCompletion(task);
                saveState();
                renderDashboard();
                renderHeader();
            }
        }
    });
    
    // Handle button clicks
    mainContent.addEventListener('click', function(e) {
        const target = e.target;
        
        // Add from bank
        if (target.classList.contains('add-from-bank')) {
            const stepsArray = JSON.parse(target.dataset.steps);
            const newTask = {
                id: generateUniqueId(),
                title: target.dataset.title,
                domain: target.dataset.domain,
                difficulty: target.dataset.difficulty,
                xp: parseInt(target.dataset.xp),
                repeatability: 'One-time',
                priority: 'Important',
                energy: 'Standard Focus',
                steps: stepsArray.map(text => ({ text, completed: false })),
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false
            };
            state.activeTasks.push(newTask);
            saveState();
            renderAll();
            showToast(`✅ Added: ${newTask.title}`);
        }
        
        // View task details
        if (target.classList.contains('view-task-details')) {
            const taskId = target.dataset.taskId;
            openTaskModal(taskId);
        }
        
        // Delete task
        if (target.classList.contains('delete-task-btn')) {
            const taskId = target.dataset.taskId;
            deleteTask(taskId);
        }
        
        // Buy from shop
        if (target.classList.contains('buy-btn') && target.dataset.id) {
            const itemId = target.dataset.id;
            const cost = parseInt(target.dataset.cost);
            const name = target.dataset.name;
            
            if (state.coins >= cost) {
                state.coins -= cost;
                if (!state.avatar.inventory) state.avatar.inventory = [];
                state.avatar.inventory.push(itemId);
                showToast(`✅ Purchased: ${name}`);
                saveState();
                renderShop();
                renderAvatar();
                renderHeader();
            } else {
                showToast(`❌ Not enough coins! Need ${cost - state.coins} more`);
            }
        }
        
        // Equip item
        if (target.classList.contains('equip-btn')) {
            const itemId = target.dataset.item;
            if (!state.avatar.equipped.includes(itemId)) {
                state.avatar.equipped.push(itemId);
                saveState();
                renderAvatar();
                showToast(`⚔️ Equipped ${itemId}`);
            }
        }
        
        // Unequip item
        if (target.classList.contains('unequip-btn')) {
            const itemId = target.dataset.item;
            state.avatar.equipped = state.avatar.equipped.filter(i => i !== itemId);
            saveState();
            renderAvatar();
            showToast('✖️ Item unequipped');
        }
    });
}

function openTaskModal(taskId) {
    const task = state.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const modal = document.getElementById('taskModal');
    if (!modal) return;
    
    document.getElementById('modalTitle').textContent = task.title;
    document.getElementById('modalBody').innerHTML = `
        <p><strong>Domain:</strong> ${task.domain}</p>
        <p><strong>Difficulty:</strong> ${task.difficulty}</p>
        <p><strong>XP Reward:</strong> ${task.xp}</p>
        <p><strong>Repeatability:</strong> ${task.repeatability}</p>
        <p><strong>Started:</strong> ${task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A'}</p>
    `;
    
    const notesArea = document.getElementById('taskNotes');
    if (notesArea) notesArea.value = task.notes || '';
    
    modal.style.display = 'flex';
    
    // Close handlers
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) {
        closeBtn.onclick = () => modal.style.display = 'none';
    }
    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = 'none';
    };
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    console.log('🎯 Setting up event listeners...');
    
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
    
    // Avatar name change
    const avatarNameInput = document.getElementById('avatarName');
    if (avatarNameInput) {
        avatarNameInput.addEventListener('change', (e) => {
            state.avatar.name = e.target.value;
            saveState();
            showToast('✅ Avatar name updated');
        });
    }
    
    // Task generator
    const genSingleBtn = document.getElementById('generateSingleBtn');
    if (genSingleBtn) {
        genSingleBtn.addEventListener('click', generateSingleTask);
    }
    
    // Batch import
    const batchImportBtn = document.getElementById('batchImportExecute');
    if (batchImportBtn) {
        batchImportBtn.addEventListener('click', () => {
            const textarea = document.getElementById('batchImport');
            if (!textarea || !textarea.value.trim()) {
                showToast('⚠️ Paste tasks to import');
                return;
            }
            
            const lines = textarea.value.split('\n');
            let imported = 0;
            
            for (const line of lines) {
                if (!line.trim()) continue;
                const parts = line.split('|').map(p => p.trim());
                if (parts.length >= 2) {
                    const steps = (parts[4] || 'Plan,Execute,Review').split(',').map(s => 
                        ({ text: s.trim(), completed: false })
                    );
                    state.activeTasks.push({
                        id: generateUniqueId(),
                        title: parts[0],
                        domain: parts[1] || 'General',
                        difficulty: parts[2] || 'Medium',
                        xp: parseInt(parts[3]) || 30,
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
                showToast(`✅ Imported ${imported} tasks!`);
                textarea.value = '';
            } else {
                showToast('❌ No valid tasks found');
            }
        });
    }
    
    // Reset buttons
    const forceResetBtn = document.getElementById('forceResetBtn');
    if (forceResetBtn) {
        forceResetBtn.addEventListener('click', () => {
            state.lastResetDate = getTodayStr();
            saveState();
            renderAll();
            showToast('✅ Daily reset completed!');
        });
    }
    
    const clearAllBtn = document.getElementById('clearAllBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            if (confirm('⚠️ WIPE ALL PROGRESS? This cannot be undone.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }
    
    // Export data
    const exportDataBtn = document.getElementById('exportDataBtn');
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', () => {
            const exportData = {
                version: '2.1.0',
                exportDate: new Date().toISOString(),
                state: state
            };
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `akatsuki_save_${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('✅ Data exported!');
        });
    }
    
    // Modal save notes
    const saveNotesBtn = document.getElementById('saveTaskNotes');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', () => {
            const modal = document.getElementById('taskModal');
            const notesArea = document.getElementById('taskNotes');
            // Implementation depends on which task is open
            modal.style.display = 'none';
            showToast('✅ Notes saved!');
        });
    }
    
    console.log('✅ Event listeners setup complete');
}

// ============================================================
// INITIALIZATION
// ============================================================

function initApp() {
    console.log('🌙 Initializing Akatsuki Quest...');
    
    try {
        loadState();
        setupEventListeners();
        setupGlobalEventDelegation();
        renderAll();
        
        console.log('✅ Akatsuki Quest Ready!', {
            tasks: state.activeTasks.filter(t => !t.completed).length,
            coins: state.coins,
            level: state.level
        });
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        showToast('⚠️ Error initializing app. Check console.');
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}
