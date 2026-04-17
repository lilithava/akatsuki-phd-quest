let xp = 0;
let level = 1;
const xpPerLevel = 150;
let tasks = [];

// Load saved progress
function loadProgress() {
  xp = parseInt(localStorage.getItem('xp')) || 0;
  level = parseInt(localStorage.getItem('level')) || 1;
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  updateLevel();
}

// Save progress
function saveProgress() {
  localStorage.setItem('xp', xp);
  localStorage.setItem('level', level);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Update level display
function updateLevel() {
  document.getElementById('level-display').textContent = `Level: ${level} | XP: ${xp}`;
}

// Load tasks from JSON ONLY if no saved tasks exist
function loadTasksFromJSON() {
  // If tasks already exist in localStorage, DO NOT load JSON again
  if (localStorage.getItem('tasks')) {
    renderTasks();
    return;
  }

  // First-time load from JSON
  fetch('game-data.json')
    .then(res => res.json())
    .then(data => {
      tasks = data.tasks; // load ALL tasks
      saveProgress();     // save immediately so they persist
      renderTasks();
    });
}

// Render tasks
function renderTasks() {
  const list = document.getElementById('task-list');
  list.innerHTML = '';

  tasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${task.title} (${task.xp} XP)</span>
      <button onclick="completeTask(${index})">✅</button>
      <button onclick="deleteTask(${index})">🗑️</button>
    `;
    list.appendChild(li);
  });
}

// Complete task
function completeTask(index) {
  xp += tasks[index].xp;
  level = Math.floor(xp / xpPerLevel) + 1;

  tasks.splice(index, 1);

  saveProgress();
  updateLevel();
  renderTasks();
}

// Delete task
function deleteTask(index) {
  tasks.splice(index, 1);
  saveProgress();
  renderTasks();
}

// Add custom task
function addCustomTask() {
  const title = prompt("Enter your custom task:");
  if (!title) return;

  const newTask = { title, xp: 10 };
  tasks.push(newTask);

  saveProgress();
  renderTasks();
}

document.getElementById('add-task-btn').addEventListener('click', addCustomTask);

// Initialize
window.onload = () => {
  loadProgress();
  loadTasksFromJSON();
};
