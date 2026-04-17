let xp = 0;
let level = 1;
const xpPerLevel = 150;
let tasks = [];

function updateLevel() {
  level = Math.floor(xp / xpPerLevel) + 1;
  document.getElementById('level-display').textContent = `Level: ${level} | XP: ${xp}`;
}

function loadTasks() {
  fetch('game-data.json')
    .then(res => res.json())
    .then(data => {
      tasks = data.tasks.slice(0, 10); // load first 10 tasks
      renderTasks();
    });
}

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

function completeTask(index) {
  xp += tasks[index].xp;
  updateLevel();
  tasks[index].completed = true;
  tasks.splice(index, 1);
  renderTasks();
  saveProgress();
}

function deleteTask(index) {
  tasks.splice(index, 1);
  renderTasks();
  saveProgress();
}

function addCustomTask() {
  const title = prompt("Enter your custom task:");
  if (!title) return;
  const newTask = { title, xp: 10 };
  tasks.push(newTask);
  renderTasks();
  saveProgress();
}

function saveProgress() {
  localStorage.setItem('xp', xp);
  localStorage.setItem('level', level);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadProgress() {
  xp = parseInt(localStorage.getItem('xp')) || 0;
  level = parseInt(localStorage.getItem('level')) || 1;
  tasks = JSON.parse(localStorage.getItem('tasks')) || [];
  updateLevel();
  renderTasks();
}

document.getElementById('add-task-btn').addEventListener('click', addCustomTask);

window.onload = () => {
  loadProgress();
  if (tasks.length === 0) loadTasks();
};
