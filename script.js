/**
 * Akatsuki PhD Quest - Main Application
 * Simplified Working Version
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM ready, starting app...');
    
    // Initialize the app after a short delay to ensure all elements exist
    setTimeout(initApp, 100);
});

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

// Daily recurring tasks
const DAILY_TASKS = [
    { title: "Morning Startup Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Critical", energy: "Low Energy",
      steps: ["Open mission board", "Review today's calendar", "Pick top 3 priorities", "Start first block"] },
    { title: "Daily Mission Log", domain: "Documentation", difficulty: "Easy", xp: 15, priority: "Important", energy: "Low Energy",
      steps: ["Write what you accomplished", "Note any blockers", "Record tomorrow's first task"] },
    { title: "Shutdown Ritual", domain: "Rituals", difficulty: "Easy", xp: 10, priority: "Important", energy: "Low Energy",
      steps: ["Review completed tasks", "Clear workspace", "Set tomorrow's first action"] }
];

// Helper functions
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

function showToast(message) {
    const toast = document.getElementById('rewardToast');
    if (toast) {
        toast.innerHTML = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
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
            state.activeTasks = state.activeTasks || [];
            state.completedHistory = state.completedHistory || [];
            state.unlockedAchievements = state.unlockedAchievements || [];
            state.avatar = state.avatar || { name: 'Shadow Scholar', equipped: [], inventory: [] };
        } catch(e) { console.error(e); }
    }
    
    if (!state.lastResetDate) state.lastResetDate = getTodayStr();
    if (!state.lastWeeklyResetDate) state.lastWeeklyResetDate = getLastMonday();
    
    // Add daily tasks if none exist
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

function getLastMonday() {
    const d = new Date();
    d.setHours(0,0,0,0);
    const day = d.getDay();
    const diff = (day === 0 ? 6 : day - 1);
    d.setDate(d.getDate() - diff);
    return d.toISOString().slice(0,10);
}

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
    if (xpFill) xpFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    
    const xpCurrent = document.getElementById('xpCurrent');
    const xpNext = document.getElementById('xpNext');
    const nextLevelSpan = document.getElementById('nextLevel');
    if (xpCurrent) xpCurrent.innerText = state.xp;
    if (xpNext) xpNext.innerText = nextLevelXp;
    if (nextLevelSpan) nextLevelSpan.innerText = state.level + 1;
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
    }
}

function renderActiveMissions() {
    const container = document.getElementById('activeMissionsList');
    if (!container) return;
    
    const activeTasks = state.activeTasks.filter(t => !t.completed);
    
    if (activeTasks.length === 0) {
        container.innerHTML = '<div class="ak-card">✨ No active missions. Add some from the Task Bank!</div>';
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
                <span>📁 ${task.domain}</span>
                <span>🔄 ${task.repeatability}</span>
                <span>⭐ ${task.xp} XP</span>
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
        cb.addEventListener('change', function(e) {
            e.stopPropagation();
            const li = this.closest('.step-item');
            const stepIndex = parseInt(li.dataset.stepIndex);
            const missionDiv = li.closest('.mission-item');
            const taskId = missionDiv.dataset.taskId;
            
            const task = state.activeTasks.find(t => t.id === taskId);
            if (task && task.steps[stepIndex]) {
                task.steps[stepIndex].completed = this.checked;
                if (this.checked) {
                    li.classList.add('completed');
                } else {
                    li.classList.remove('completed');
                }
                updateTaskCompletion(task);
                saveState();
                renderDashboard();
                renderHeader();
            }
        });
    });
    
    document.querySelectorAll('.view-task-details').forEach(btn => {
        btn.addEventListener('click', function() {
            const taskId = this.dataset.taskId;
            openTaskModal(taskId);
        });
    });
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
        <p><strong>Repeatability:</strong> ${task.repeatability}</p>
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
        showToast('Notes saved!');
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
                showToast(`Deleted: ${task.title}`);
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
    
    // Sample tasks for the bank
    const sampleTasks = [
        { title: "Write Literature Review Section", domain: "PhD", difficulty: "Hard", xp: 90, steps: ["Find 10 sources", "Read and annotate", "Write synthesis", "Add citations"] },
        { title: "Create Weekly Skool Post", domain: "Skool", difficulty: "Medium", xp: 35, steps: ["Choose topic", "Write hook", "Add 3 tips", "Post and engage"] },
        { title: "Design Lesson Plan", domain: "Curriculum", difficulty: "Medium", xp: 40, steps: ["Define outcomes", "Create activities", "Build assessment", "Review"] },
        { title: "Code Interview Transcript", domain: "Research Assistantship", difficulty: "Hard", xp: 80, steps: ["Open transcript", "Apply codes", "Write memo", "Save"] }
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
                <button class="add-from-bank" data-title="${escapeHtml(t.title)}" data-domain="${t.domain}" data-difficulty="${t.difficulty}" data-xp="${t.xp}" data-steps='${JSON.stringify(t.steps)}'>+ Add to Active</button>
            </div>
        </div>
    `).join('');
    
    document.querySelectorAll('.add-from-bank').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepsArray = JSON.parse(this.dataset.steps);
            const newTask = {
                id: Date.now() + '_' + Math.random(),
                title: this.dataset.title,
                domain: this.dataset.domain,
                difficulty: this.dataset.difficulty,
                xp: parseInt(this.dataset.xp),
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
            showToast(`Added: ${newTask.title}`);
        });
    });
}

function renderAvatar() {
    const nameInput = document.getElementById('avatarName');
    if (nameInput) {
        nameInput.value = state.avatar.name;
        nameInput.onchange = (e) => {
            state.avatar.name = e.target.value;
            saveState();
        };
    }
    
    const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
    const missionsCompleted = state.completedHistory.length;
    
    const totalXPEarnedEl = document.getElementById('totalXPEarned');
    const missionsCompletedEl = document.getElementById('missionsCompleted');
    if (totalXPEarnedEl) totalXPEarnedEl.innerText = totalXPEarned;
    if (missionsCompletedEl) missionsCompletedEl.innerText = missionsCompleted;
    
    const equippedContainer = document.getElementById('equippedList');
    if (equippedContainer) {
        if (!state.avatar.equipped || state.avatar.equipped.length === 0) {
            equippedContainer.innerHTML = '<div class="gear-item">No gear equipped. Visit the Shop!</div>';
        } else {
            equippedContainer.innerHTML = state.avatar.equipped.map(itemId => {
                return `<div class="gear-item">${itemId} 
                    <button class="unequip-btn" data-item="${itemId}">✖</button></div>`;
            }).join('');
            
            document.querySelectorAll('.unequip-btn').forEach(btn => {
                btn.onclick = () => {
                    state.avatar.equipped = state.avatar.equipped.filter(i => i !== btn.dataset.item);
                    saveState();
                    renderAvatar();
                    showToast('Item unequipped');
                };
            });
        }
    }
    
    const inventoryContainer = document.getElementById('inventoryList');
    if (inventoryContainer) {
        const ownedNotEquipped = (state.avatar.inventory || []).filter(id => !(state.avatar.equipped || []).includes(id));
        if (ownedNotEquipped.length === 0) {
            inventoryContainer.innerHTML = '<div class="gear-item">No items in inventory. Buy from Shop!</div>';
        } else {
            inventoryContainer.innerHTML = ownedNotEquipped.map(itemId => {
                return `<div class="gear-item">${itemId} 
                    <button class="equip-btn" data-item="${itemId}">⚔️ Equip</button></div>`;
            }).join('');
            
            document.querySelectorAll('.equip-btn').forEach(btn => {
                btn.onclick = () => {
                    const itemId = btn.dataset.item;
                    if (!state.avatar.equipped.includes(itemId)) {
                        state.avatar.equipped.push(itemId);
                        saveState();
                        renderAvatar();
                        showToast(`Equipped ${itemId}`);
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
    
    const shopItems = [
        { id: 'cloak_basic', name: 'Akatsuki Cloak', cost: 150, effect: '+5% XP', description: 'Classic black cloak with red clouds' },
        { id: 'mask_anbu', name: 'ANBU Mask', cost: 100, effect: '+3% XP', description: 'White ANBU-style mask' },
        { id: 'ring_akatsuki', name: 'Akatsuki Ring', cost: 80, effect: '+2% XP, +2% Coins', description: 'Glowing ring with secret meaning' }
    ];
    
    container.innerHTML = shopItems.map(item => {
        const owned = state.avatar.inventory?.includes(item.id);
        return `
            <div class="shop-item">
                <h4>${item.name}</h4>
                <p class="price">💰 ${item.cost} coins</p>
                <p class="effect">${item.description}</p>
                <p class="effect">${item.effect}</p>
                ${owned ? `<button class="buy-btn" disabled>✓ Owned</button>` :
                  `<button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">Purchase (${item.cost}💰)</button>`}
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('.buy-btn[data-id]').forEach(btn => {
        btn.onclick = () => {
            const itemId = btn.dataset.id;
            const cost = parseInt(btn.dataset.cost);
            
            if (state.coins >= cost) {
                state.coins -= cost;
                if (!state.avatar.inventory) state.avatar.inventory = [];
                state.avatar.inventory.push(itemId);
                showToast(`Purchased: ${itemId}`);
                saveState();
                renderShop();
                renderAvatar();
                renderHeader();
            } else {
                showToast(`Not enough coins! Need ${cost - state.coins} more`);
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
                if (c.notes) html += `<br><span style="font-size:0.8rem; color:#aaa;">📝 ${escapeHtml(c.notes.substring(0, 100))}</span>`;
                html += `</li>`;
            });
        }
        html += `</ul></div>`;
    }
    container.innerHTML = html;
}

function generateReport() {
    const totalXPEarned = state.completedHistory.reduce((sum, h) => sum + (h.xpGained || 0), 0);
    
    let report = `═══════════════════════════════════════════\n`;
    report += `              🌙 AKATSUKI MISSION REPORT\n`;
    report += `═══════════════════════════════════════════\n\n`;
    report += `📅 GENERATED: ${new Date().toLocaleString()}\n`;
    report += `👤 SCHOLAR: ${state.avatar.name}\n`;
    report += `🏆 LEVEL: ${state.level} | XP: ${state.xp} | STREAK: ${state.streak} days\n`;
    report += `💰 COINS: ${state.coins}\n\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📊 STATISTICS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `Total Missions Completed: ${state.completedHistory.length}\n`;
    report += `Total XP Earned: ${totalXPEarned}\n`;
    report += `Current Streak: ${state.streak} days\n\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    report += `📜 COMPLETED MISSIONS\n`;
    report += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (state.completedHistory.length === 0) {
        report += `No missions completed yet.\n\n`;
    } else {
        state.completedHistory.forEach((c, idx) => {
            report += `${idx + 1}. ${c.title}\n`;
            report += `   📅 Completed: ${new Date(c.completedAt).toLocaleString()}\n`;
            report += `   🎯 XP Gained: ${c.xpGained} | 💰 Coins: ${c.coinsGained || 0}\n`;
            if (c.notes) report += `   📝 Notes: ${c.notes}\n`;
            report += `\n`;
        });
    }
    
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
    
    // Undo/Redo (simple version)
    document.getElementById('undoBtn')?.addEventListener('click', () => {
        showToast('Undo feature coming soon');
    });
    document.getElementById('redoBtn')?.addEventListener('click', () => {
        showToast('Redo feature coming soon');
    });
    
    // Reset buttons
    document.getElementById('forceResetBtn')?.addEventListener('click', () => {
        state.lastResetDate = getTodayStr();
        saveState();
        renderAll();
        showToast('Daily reset completed!');
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
    
    document.getElementById('batchImportExecute')?.addEventListener('click', () => {
        const textarea = document.getElementById('batchImport');
        if (!textarea) return;
        
        const lines = textarea.value.split('\n');
        let imported = 0;
        
        for (const line of lines) {
            if (!line.trim()) continue;
            const parts = line.split('|').map(p => p.trim());
            if (parts.length >= 2) {
                const steps = (parts[4] || 'Plan task,Execute work,Review results').split(',').map(s => ({ text: s.trim(), completed: false }));
                state.activeTasks.push({
                    id: Date.now() + '_' + Math.random(),
                    title: parts[0],
                    domain: parts[1] || 'General',
                    difficulty: parts[2] || 'Medium',
                    xp: parseInt(parts[3]) || 30,
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
            showToast(`Imported ${imported} tasks!`);
            textarea.value = '';
        } else {
            showToast('No valid tasks found. Format: Title | Domain | Difficulty | XP | Step1, Step2');
        }
    });
    
    // Data export/import
    document.getElementById('exportDataBtn')?.addEventListener('click', () => {
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
        showToast('Data exported!');
    });
    
    document.getElementById('importDataBtn')?.addEventListener('click', () => {
        document.getElementById('importDataInput')?.click();
    });
    
    document.getElementById('importDataInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const imported = JSON.parse(event.target.result);
                if (imported.state) {
                    state = { ...state, ...imported.state };
                    saveState();
                    renderAll();
                    showToast('Data imported successfully!');
                } else {
                    showToast('Invalid save file format');
                }
            } catch(err) {
                showToast('Error importing data');
            }
        };
        reader.readAsText(file);
    });
    
    // Task Generator - Single Task
    const generateSingleBtn = document.getElementById('generateSingleBtn');
    if (generateSingleBtn) {
        generateSingleBtn.addEventListener('click', () => {
            const goal = document.getElementById('genGoal')?.value;
            if (!goal) {
                showToast('Enter a goal first');
                return;
            }
            
            const difficulty = document.getElementById('genDifficulty')?.value || 'Medium';
            const priority = document.getElementById('genPriority')?.value || 'Important';
            const xpValue = difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : 80;
            
            const newTask = {
                id: Date.now() + '_' + Math.random(),
                title: goal,
                domain: document.getElementById('genTheme')?.value || 'General',
                difficulty: difficulty,
                xp: xpValue,
                repeatability: document.getElementById('genRepeatability')?.value || 'One-time',
                priority: priority,
                steps: [
                    { text: `Clarify scope: ${goal.substring(0, 50)}`, completed: false },
                    { text: 'Break down into sub-tasks', completed: false },
                    { text: 'Execute main work', completed: false },
                    { text: 'Review and document results', completed: false }
                ],
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
                                <span class="badge ${priority.toLowerCase()}">${priority}</span>
                            </div>
                        </div>
                        <div class="mission-meta">
                            <span>⭐ ${xpValue} XP</span>
                        </div>
                        <ul><li>Clarify scope</li><li>Break down into sub-tasks</li><li>Execute main work</li><li>Review results</li></ul>
                    </div>
                `;
            }
            
            const addBtn = document.getElementById('addGeneratedBtn');
            if (addBtn) {
                addBtn.style.display = 'inline-block';
                const newAddBtn = addBtn.cloneNode(true);
                addBtn.parentNode.replaceChild(newAddBtn, addBtn);
                newAddBtn.onclick = () => {
                    state.activeTasks.push(newTask);
                    saveState();
                    if (previewDiv) previewDiv.innerHTML = '';
                    newAddBtn.style.display = 'none';
                    renderAll();
                    showToast(`Generated: ${newTask.title}`);
                    document.querySelector('.ak-tab-btn[data-tab="active"]')?.click();
                };
            }
        });
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

function initApp() {
    console.log('Initializing Akatsuki Quest...');
    
    loadState();
    setupEventListeners();
    renderAll();
    
    console.log('🎯 Akatsuki Quest Ready!', { 
        tasks: state.activeTasks.filter(t => !t.completed).length,
        coins: state.coins,
        level: state.level
    });
}
