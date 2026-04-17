// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
    // Poll for data to be loaded (max 5 seconds)
    let attempts = 0;
    const waitForData = setInterval(() => {
        if (window.AK_DATA && window.AK_DATA.rules) {
            clearInterval(waitForData);
            initApp();
        } else if (attempts > 50) { // 5 seconds timeout
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
        coins: 0,
        level: 1,
        streak: 0,
        lastResetDate: new Date().toISOString().slice(0,10),
        activeTasks: [],
        completedHistory: [],
        undoStack: [],
        redoStack: []
    };

    // Load from localStorage
    function loadState() {
        const saved = localStorage.getItem('akatsuki_state');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                state = { ...state, ...parsed };
                // Ensure steps are proper objects
                state.activeTasks = state.activeTasks.map(t => ({
                    ...t,
                    steps: (t.steps || []).map(s => 
                        typeof s === 'string' ? { text: s, completed: false } : s
                    )
                }));
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
                state.coins -= action.coinsGain;
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
                state.coins += action.coinsGain;
                state.completedHistory.push({
                    taskId: action.taskId,
                    title: task.title,
                    completedAt: task.finishedAt,
                    xpGained: action.xpGain,
                    notes: task.notes || ''
                });
            }
        }
        updateXPLevel();
        saveState();
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
        
        const xpGain = task.xp || 30;
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
            notes: task.notes || ''
        });
        
        pushUndo({ type: 'completeTask', taskId, xpGain, coinGain });
        updateXPLevel();
        saveState();
    }

    function updateXPLevel() {
        const xpPerLevel = 500;
        const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
        if (newLevel > state.level) {
            state.coins += 100; // level up bonus
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
        
        // Win the day logic
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
            container.innerHTML = '<div class="ak-card">No active missions. Add some from the Task Bank!</div>';
            return;
        }
        
        activeTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'mission-item';
            div.innerHTML = `
                <div class="mission-title">
                    <strong>${escapeHtml(task.title)}</strong>
                    <small style="color:#aaa">${task.difficulty} | ${task.domain}</small>
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
        
        // Attach event listeners to checkboxes
        document.querySelectorAll('.step-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleStepToggle);
            cb.addEventListener('change', handleStepToggle);
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
        
        // Collect all tasks from loaded banks
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
            container.innerHTML = '<div class="ak-card">No tasks found. Check that JSON files loaded correctly.</div>';
            return;
        }
        
        container.innerHTML = filtered.map(t => `
            <div class="mission-item">
                <div class="mission-title"><strong>${escapeHtml(t.title)}</strong></div>
                <div class="mission-meta">${t.difficulty || 'Medium'} | ${t.domain || 'General'}</div>
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
                dayCompletions.forEach(c => html += `<li>${escapeHtml(c.title)} (+${c.xpGained} XP)</li>`);
            }
            html += `</ul></div>`;
        }
        container.innerHTML = html;
    }
    
    function generateReport() {
        let report = `AKATSUKI WEEKLY REPORT\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `Level: ${state.level} | XP: ${state.xp} | Coins: ${state.coins} | Streak: ${state.streak}\n`;
        report += `\nCompleted this week:\n`;
        
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        
        last7Days.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `\n${day}:\n`;
                dayTasks.forEach(t => report += `  - ${t.title} (${t.xpGained} XP)\n`);
            }
        });
        
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
        // Tab switching
        document.querySelectorAll('.ak-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                document.querySelectorAll('.ak-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                document.querySelectorAll('.ak-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
        
        // Undo/Redo
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        if (undoBtn) undoBtn.addEventListener('click', () => { undo(); renderAll(); });
        if (redoBtn) redoBtn.addEventListener('click', () => { redo(); renderAll(); });
        
        // Settings buttons
        const forceResetBtn = document.getElementById('forceResetBtn');
        if (forceResetBtn) {
            forceResetBtn.addEventListener('click', () => {
                state.lastResetDate = new Date().toISOString().slice(0,10);
                saveState();
            });
        }
        
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                if (confirm('Wipe all progress? Cannot undo.')) {
                    localStorage.clear();
                    location.reload();
                }
            });
        }
        
        // Export report
        const exportBtn = document.getElementById('exportReportBtn');
        if (exportBtn) exportBtn.addEventListener('click', generateReport);
        
        const generateReportBtn = document.getElementById('generateReportBtn');
        if (generateReportBtn) generateReportBtn.addEventListener('click', generateReport);
        
        // Quick generate button
        const genQuickBtn = document.getElementById('genQuickBtn');
        if (genQuickBtn) {
            genQuickBtn.addEventListener('click', () => {
                const generatorTab = document.querySelector('.ak-tab-btn[data-tab="generator"]');
                if (generatorTab) generatorTab.click();
            });
        }
        
        // Task generator
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
                
                const newTask = {
                    id: 'gen_' + Date.now(),
                    title: goal,
                    domain: domain,
                    difficulty: difficulty,
                    xp: difficulty === 'Easy' ? 20 : (difficulty === 'Medium' ? 40 : 80),
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
                    previewDiv.innerHTML = `<div class="mission-item"><strong>${escapeHtml(goal)}</strong><br>${difficulty} · ${domain}</div>`;
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
                        // Switch to active missions tab
                        const activeTabBtn = document.querySelector('.ak-tab-btn[data-tab="active"]');
                        if (activeTabBtn) activeTabBtn.click();
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
    
    console.log('Akatsuki Quest initialized!', { activeTasks: state.activeTasks.length });
}
