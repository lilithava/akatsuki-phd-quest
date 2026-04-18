// Initialize task generator
const taskGenerator = new AkatsukiTaskGenerator({
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
function populateThemeDropdown() {
  const themeSelect = document.getElementById('genTheme');
  if (!themeSelect) return;
  
  const themes = taskGenerator.getThemes();
  themeSelect.innerHTML = themes.map(theme => 
    `<option value="${theme.id}">${theme.icon || '📁'} ${theme.name}</option>`
  ).join('');
  
  // Add change listener
  themeSelect.addEventListener('change', () => {
    const subjects = taskGenerator.getSubjects(themeSelect.value);
    const subjectSelect = document.getElementById('genSubject');
    if (subjectSelect) {
      subjectSelect.innerHTML = '<option value="">Select Subject</option>' + 
        subjects.map(s => `<option value="${s}">${s}</option>`).join('');
      subjectSelect.disabled = subjects.length === 0;
    }
  });
  
  // Trigger initial load
  themeSelect.dispatchEvent(new Event('change'));
}

// Handle single task generation
function handleGenerateTask() {
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
  
  const task = taskGenerator.generateTask(goal, {
    theme, subject, sideTopic, difficulty, priority, energy, repeatability
  });
  
  displayGeneratedTask(task);
}

// Handle chain generation
function handleGenerateChain() {
  const goal = document.getElementById('genGoal')?.value;
  if (!goal) {
    alert('Enter a goal first');
    return;
  }
  
  const horizon = document.getElementById('genHorizon')?.value || 'week';
  const theme = document.getElementById('genTheme')?.value || 'Shadow Research Missions';
  
  const chain = taskGenerator.generateChain(goal, { horizon, theme });
  displayGeneratedChain(chain);
}

// Handle batch import
function handleBatchImport() {
  const batchText = document.getElementById('batchImport')?.value;
  if (!batchText) {
    alert('Paste tasks to import');
    return;
  }
  
  const imported = taskGenerator.importBatch(batchText);
  if (imported.length === 0) {
    alert('No valid tasks found. Format: Title | Domain | Difficulty | XP | Step1, Step2');
    return;
  }
  
  // Add to active tasks
  imported.forEach(task => {
    state.activeTasks.push(task);
  });
  
  saveState();
  renderAll();
  showReward(`Imported ${imported.length} tasks!`, 0, 0);
  document.getElementById('batchImport').value = '';
}
