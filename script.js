// Wait for data to load, then init app
window.addEventListener('DOMContentLoaded', async () => {
    // Wait a bit for data-loader to finish (simple polling)
    while (!window.AK_DATA || !window.AK_DATA.rules) {
        await new Promise(r => setTimeout(r, 100));
    }
    initApp();
});

function initApp() {
    // -------- State ----------
    let state = {
        xp: 0,
        coins: 0,
        level: 1,
        streak: 0,
        lastResetDate: null,
        activeTasks: [],      // each task: { ...original, steps: [{text,completed}], notes, startedAt, finishedAt? }
        completedHistory: [],  // { taskId, title, completedAt, xpGained, notes }
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
                // Ensure each active task has steps as objects
                state.activeTasks = state.activeTasks.map(t => ({
                    ...t,
                    steps: t.steps.map(s => typeof s === 'string' ? { text: s, completed: false } : s)
                }));
            } catch(e) {}
        }
        // Set default lastResetDate if missing
        if (!state.lastResetDate) state.lastResetDate = getTodayStr();
        // Check daily/weekly reset
        checkAndResetRepeatables();
        updateXPLevel();
    }

    function saveState() {
        localStorage.setItem('akatsuki_state', JSON.stringify(state));
        // Also push to undo stack (we'll push actions manually)
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
        // Apply inverse of action
        if (action.type === 'toggleStep') {
            const task = state.activeTasks.find(t => t.id === action.taskId);
            if (task && task.steps[action.stepIndex]) {
                task.steps[action.stepIndex].completed = action.oldState;
                if (action.oldState === false) {
                    // Remove any finish time? Keep simple
                }
                updateTaskCompletion(task);
            }
        } else if (action.type === 'addTask') {
            state.activeTasks = state.activeTasks.filter(t => t.id !== action.taskId);
            state.xp -= action.xpGain || 0;
            state.coins -= action.coinsGain || 0;
        } else if (action.type === 'completeTask') {
            const task = state.activeTasks.find(t => t.id === action.taskId);
            if (task) {
                task.completed = false;
                task.finishedAt = null;
                state.xp -= action.xpGain;
                state.coins -= action.coinsGain;
                // remove from completedHistory
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
        // Re-apply action
        if (action.type === 'toggleStep') {
            const task = state.activeTasks.find(t => t.id === action.taskId);
            if (task && task.steps[action.stepIndex]) {
                task.steps[action.stepIndex].completed = !action.oldState;
                updateTaskCompletion(task);
            }
        } else if (action.type === 'addTask') {
            state.activeTasks.push(action.task);
            state.xp += action.xpGain || 0;
            state.coins += action.coinsGain || 0;
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
        renderAll();
    }

    function updateTaskCompletion(task) {
        const allStepsDone = task.steps.every(s => s.completed);
        if (allStepsDone && !task.completed) {
            // Auto-complete task
            completeTask(task.id);
        } else if (!allStepsDone && task.completed) {
            // revert completion (should not happen via steps, but handle)
            task.completed = false;
            task.finishedAt = null;
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
        renderAll();
    }

    function updateXPLevel() {
        const xpPerLevel = window.AK_DATA.rules?.xpRules?.xpPerLevel || 500;
        const newLevel = Math.floor(state.xp / xpPerLevel) + 1;
        if (newLevel > state.level) {
            // level up bonus
            state.coins += 100;
        }
        state.level = newLevel;
        // update streak based on last reset day? simplified: streak is incremented daily if at least one task completed that day
        // We'll compute streak based on completedHistory dates
        updateStreak();
    }

    function updateStreak() {
        // Count consecutive days with at least one completion
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

    function getTodayStr() {
        return new Date().toISOString().slice(0,10);
    }

    function checkAndResetRepeatables() {
        const today = getTodayStr();
        const todayDate = new Date(today);
        const lastDate = state.lastResetDate ? new Date(state.lastResetDate) : null;
        if (!lastDate || lastDate >= todayDate) return;

        // Determine if we crossed midnight or a week boundary
        const dayDiff = Math.floor((todayDate - lastDate) / (1000*3600*24));
        if (dayDiff >= 1) {
            // Reset daily tasks
            state.activeTasks = state.activeTasks.filter(t => {
                if (t.repeatability === 'Daily') {
                    // keep but reset steps and completed flag
                    t.completed = false;
                    t.finishedAt = null;
                    t.steps = t.steps.map(s => ({ ...s, completed: false }));
                    return true;
                }
                return true; // keep others
            });
            // For weekly reset (Monday)
            const lastMonday = getMonday(lastDate);
            const thisMonday = getMonday(todayDate);
            if (thisMonday > lastMonday) {
                state.activeTasks = state.activeTasks.filter(t => {
                    if (t.repeatability === 'Weekly') {
                        t.completed = false;
                        t.finishedAt = null;
                        t.steps = t.steps.map(s => ({ ...s, completed: false }));
                        return true;
                    }
                    return true;
                });
            }
            state.lastResetDate = today;
            saveState();
        }
    }

    function getMonday(date) {
        const d = new Date(date);
        d.setHours(0,0,0,0);
        const day = d.getDay();
        const diff = (day === 0 ? 6 : day-1);
        d.setDate(d.getDate() - diff);
        return d;
    }

    // -------- Task Generator ----------
    function generateTasksFromGoal(goal, domain, difficulty, horizon) {
        // Use mission-templates.json to create steps
        const templates = window.AK_DATA.templates?.templates || [];
        const relevant = templates.find(t => t.domain === domain) || templates[0];
        const steps = (relevant?.microSteps || [
            "Clarify the scope of this goal",
            "Break down into 3 sub-tasks",
            "Execute first sub-task",
            "Review and adjust",
            "Complete and document"
        ]).map(stepText => ({ text: stepText, completed: false }));
        const newTask = {
            id: 'gen_' + Date.now() + '_' + Math.random(),
            title: goal,
            domain: domain,
            difficulty: difficulty,
            xp: (difficulty === 'Easy' ? 20 : difficulty === 'Medium' ? 40 : 80),
            repeatability: horizon === 'today' ? 'Daily' : 'One-time',
            steps: steps,
            notes: '',
            startedAt: new Date().toISOString(),
            completed: false,
            priority: 'Important',
            energy: 'Standard Focus'
        };
        return [newTask];
    }

    // -------- Render functions ----------
    function renderAll() {
        renderDashboard();
        renderActiveMissions();
        renderTaskBank();
        renderHistory();
    }

    function renderDashboard() {
        document.getElementById('xp').innerText = state.xp;
        document.getElementById('coins').innerText = state.coins;
        document.getElementById('level').innerText = state.level;
        document.getElementById('streak').innerText = state.streak;
        const activeCount = state.activeTasks.filter(t => !t.completed).length;
        document.getElementById('activeCount').innerText = activeCount;
        const completedToday = state.completedHistory.filter(h => h.completedAt.slice(0,10) === getTodayStr()).length;
        document.getElementById('completedToday').innerText = completedToday;
        document.getElementById('totalXP').innerText = state.xp;
        // Win the day: at least one critical/important, one ritual, one documentation
        const hasImportant = state.activeTasks.some(t => t.completed && (t.priority === 'Critical' || t.priority === 'Important'));
        const hasRitual = state.activeTasks.some(t => t.completed && t.domain === 'Rituals');
        const hasDoc = state.activeTasks.some(t => t.completed && t.domain === 'Documentation');
        const win = hasImportant && hasRitual && hasDoc;
        document.getElementById('winTheDay').innerHTML = win ? '✅' : '❌';
        document.getElementById('impCount').innerText = hasImportant ? 1 : 0;
        document.getElementById('ritualCount').innerText = hasRitual ? 1 : 0;
        document.getElementById('docCount').innerText = hasDoc ? 1 : 0;
    }

    function renderActiveMissions() {
        const container = document.getElementById('activeMissionsList');
        container.innerHTML = '';
        state.activeTasks.forEach(task => {
            const div = document.createElement('div');
            div.className = 'mission-item';
            div.innerHTML = `
                <div class="mission-title">
                    <span>${task.title}</span>
                    <small>${task.difficulty} | ${task.domain}</small>
                </div>
                <div class="mission-meta">Repeat: ${task.repeatability} | Priority: ${task.priority}</div>
                <ul class="step-list">
                    ${task.steps.map((step, idx) => `
                        <li class="step-item ${step.completed ? 'completed' : ''}" data-task="${task.id}" data-step="${idx}">
                            <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
                            <label>${step.text}</label>
                        </li>
                    `).join('')}
                </ul>
                <button class="view-task-details" data-id="${task.id}">Details / Notes</button>
            `;
            container.appendChild(div);
            // attach checkbox listeners
            div.querySelectorAll('.step-checkbox').forEach(cb => {
                cb.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const li = cb.closest('.step-item');
                    const taskId = li.dataset.task;
                    const stepIdx = parseInt(li.dataset.step);
                    const taskObj = state.activeTasks.find(t => t.id === taskId);
                    if (taskObj) {
                        const oldState = taskObj.steps[stepIdx].completed;
                        taskObj.steps[stepIdx].completed = cb.checked;
                        if (cb.checked) li.classList.add('completed');
                        else li.classList.remove('completed');
                        pushUndo({ type: 'toggleStep', taskId, stepIndex: stepIdx, oldState });
                        updateTaskCompletion(taskObj);
                        saveState();
                        renderAll();
                    }
                });
            });
            div.querySelectorAll('.view-task-details').forEach(btn => {
                btn.addEventListener('click', () => openTaskModal(task.id));
            });
        });
    }

    function openTaskModal(taskId) {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (!task) return;
        const modal = document.getElementById('taskModal');
        document.getElementById('modalTitle').innerText = task.title;
        document.getElementById('modalBody').innerHTML = `
            <p><strong>Domain:</strong> ${task.domain}</p>
            <p><strong>Difficulty:</strong> ${task.difficulty}</p>
            <p><strong>Repeatability:</strong> ${task.repeatability}</p>
            <p><strong>Started:</strong> ${task.startedAt ? new Date(task.startedAt).toLocaleString() : 'N/A'}</p>
            <p><strong>Finished:</strong> ${task.finishedAt ? new Date(task.finishedAt).toLocaleString() : 'In progress'}</p>
        `;
        document.getElementById('taskNotes').value = task.notes || '';
        document.getElementById('saveTaskNotes').onclick = () => {
            task.notes = document.getElementById('taskNotes').value;
            saveState();
            modal.style.display = 'none';
        };
        modal.style.display = 'flex';
        document.querySelector('.close').onclick = () => modal.style.display = 'none';
    }

    function renderTaskBank() {
        const container = document.getElementById('taskBankList');
        // Combine all banks
        const banks = ['phd','skool','curriculum','ra','docs','rituals','bosses','recovery','mini'];
        let allTasks = [];
        for (let bank of banks) {
            const data = window.AK_DATA[bank];
            if (data && data.tasks) allTasks.push(...data.tasks);
            if (data && data.missions) allTasks.push(...data.missions);
            if (data && data.quests) allTasks.push(...data.quests);
        }
        // Deduplicate by id
        const unique = new Map();
        allTasks.forEach(t => { if(t.id) unique.set(t.id, t); });
        allTasks = Array.from(unique.values());
        const searchTerm = document.getElementById('bankSearch').value.toLowerCase();
        const filtered = allTasks.filter(t => t.title?.toLowerCase().includes(searchTerm));
        container.innerHTML = filtered.map(t => `
            <div class="mission-item">
                <div class="mission-title">${t.title}</div>
                <div class="mission-meta">${t.difficulty || 'Medium'} | ${t.domain || 'General'}</div>
                <button class="add-from-bank" data-id="${t.id}">+ Add to Active</button>
            </div>
        `).join('');
        document.querySelectorAll('.add-from-bank').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.dataset.id;
                const original = allTasks.find(t => t.id === id);
                if (original) {
                    const newTask = JSON.parse(JSON.stringify(original));
                    newTask.id = Date.now() + '_' + Math.random();
                    newTask.startedAt = new Date().toISOString();
                    newTask.completed = false;
                    newTask.steps = (newTask.steps || []).map(s => typeof s === 'string' ? { text: s, completed: false } : s);
                    state.activeTasks.push(newTask);
                    pushUndo({ type: 'addTask', taskId: newTask.id, task: newTask, xpGain: 0 });
                    saveState();
                    renderAll();
                }
            });
        });
    }

    function renderHistory() {
        const container = document.getElementById('weeklyHistory');
        const last7Days = [];
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            last7Days.push(d.toISOString().slice(0,10));
        }
        let html = '';
        for (let day of last7Days) {
            const dayCompletions = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            html += `<div class="ak-card"><h3>${day}</h3><ul>${dayCompletions.map(c => `<li>${c.title} (+${c.xpGained} XP)</li>`).join('')}</ul></div>`;
        }
        container.innerHTML = html;
    }

    function generateReport() {
        let report = `AKATSUKI WEEKLY REPORT\n`;
        report += `Generated: ${new Date().toLocaleString()}\n`;
        report += `Level: ${state.level} | XP: ${state.xp} | Coins: ${state.coins} | Streak: ${state.streak}\n`;
        report += `\nCompleted this week:\n`;
        const last7 = [];
        for (let i=0;i<7;i++) {
            let d = new Date(); d.setDate(d.getDate()-i);
            last7.push(d.toISOString().slice(0,10));
        }
        last7.forEach(day => {
            const dayTasks = state.completedHistory.filter(h => h.completedAt.slice(0,10) === day);
            if (dayTasks.length) {
                report += `\n${day}:\n`;
                dayTasks.forEach(t => report += `  - ${t.title} (${t.xpGained} XP)\n`);
            }
        });
        document.getElementById('reportOutput').innerText = report;
    }

    // ---- Event listeners & initialization ----
    function setupTabs() {
        document.querySelectorAll('.ak-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabId = btn.dataset.tab;
                document.querySelectorAll('.ak-tab').forEach(tab => tab.classList.remove('active'));
                document.getElementById(tabId).classList.add('active');
                document.querySelectorAll('.ak-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    function setupGenerator() {
        const domainSelect = document.getElementById('genDomain');
        const diffSelect = document.getElementById('genDifficulty');
        // populate domains from rules
        if (window.AK_DATA.rules?.domains) {
            window.AK_DATA.rules.domains.forEach(d => {
                const opt = document.createElement('option');
                opt.value = d.id;
                opt.innerText = d.label;
                domainSelect.appendChild(opt);
            });
        }
        ['Easy','Medium','Hard'].forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.innerText = d;
            diffSelect.appendChild(opt);
        });
        document.getElementById('generateBtn').addEventListener('click', () => {
            const goal = document.getElementById('genGoal').value;
            const domain = domainSelect.value;
            const difficulty = diffSelect.value;
            const horizon = document.getElementById('genHorizon').value;
            if (!goal) return alert('Enter a goal');
            const generated = generateTasksFromGoal(goal, domain, difficulty, horizon);
            const previewDiv = document.getElementById('generatedPreview');
            previewDiv.innerHTML = `<ul>${generated.map(t => `<li>${t.title} (${t.difficulty})</li>`).join('')}</ul>`;
            document.getElementById('addGeneratedBtn').style.display = 'inline-block';
            document.getElementById('addGeneratedBtn').onclick = () => {
                generated.forEach(t => {
                    state.activeTasks.push(t);
                    pushUndo({ type: 'addTask', taskId: t.id, task: t, xpGain: 0 });
                });
                saveState();
                renderAll();
                document.getElementById('generatedPreview').innerHTML = '';
                document.getElementById('addGeneratedBtn').style.display = 'none';
            };
        });
    }

    function setupSettings() {
        document.getElementById('forceResetBtn').addEventListener('click', () => {
            state.lastResetDate = getTodayStr();
            checkAndResetRepeatables();
            renderAll();
        });
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            if (confirm('Wipe all progress? Cannot undo.')) {
                localStorage.clear();
                location.reload();
            }
        });
        document.getElementById('exportReportBtn').addEventListener('click', generateReport);
        document.getElementById('generateReportBtn').addEventListener('click', generateReport);
        document.getElementById('undoBtn').addEventListener('click', undo);
        document.getElementById('redoBtn').addEventListener('click', redo);
        document.getElementById('genQuickBtn').addEventListener('click', () => {
            document.querySelector('.ak-tab-btn[data-tab="generator"]').click();
        });
    }

    function addSampleTasksIfEmpty() {
        if (state.activeTasks.length === 0) {
            // add a few example tasks from bank
            const sample = {
                id: 'sample1',
                title: 'Write daily mission log',
                domain: 'Documentation',
                difficulty: 'Easy',
                xp: 15,
                repeatability: 'Daily',
                steps: [{ text: 'Open log template', completed: false }, { text: 'Write what you did', completed: false }],
                notes: '',
                startedAt: new Date().toISOString(),
                completed: false,
                priority: 'Important'
            };
            state.activeTasks.push(sample);
            saveState();
        }
    }

    loadState();
    setupTabs();
    setupGenerator();
    setupSettings();
    addSampleTasksIfEmpty();
    renderAll();
}
