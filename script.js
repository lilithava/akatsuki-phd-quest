let xp = 0;
let level = 1;
let streak = 0;
const xpPerLevel = 150;
let tasks = {};
const sections = ["phd","skool","doc","daily","weekly","monthly"];

function updateUI() {
  document.getElementById('level-display').textContent = 
    `Level: ${level} | XP: ${xp} | 🔥 Streak: ${streak} days`;
  document.getElementById('xp-fill').style.width = `${(xp % xpPerLevel) / xpPerLevel * 100}%`;
}

function loadTasks() {
  fetch('game-data.json')
    .then(res => res.json())
    .then(data => {
      tasks = data.sections;
      renderSections();
    });
}

function renderSections() {
  sections.forEach(sec => {
    const container = document.getElementById(sec);
    container.innerHTML = `<h2>${tasks[sec].title}</h2>`;
    tasks[sec].items.forEach((task, i) => {
      const div = document.createElement('div');
      div.className = 'task';
      div.innerHTML = `
        <span>${task.title} (${task.xp} XP)</span>
        <button onclick="completeTask('${sec}',${i})">✅</button>
      `;
      container.appendChild(div);
    });
  });
}

function completeTask(section, index) {
  xp += tasks[section].items[index].xp;
  level = Math.floor(xp / xpPerLevel) + 1;
  tasks[section].items.splice(index, 1);
  saveProgress();
  updateUI();
  renderSections();
}

function saveProgress() {
  localStorage.setItem('xp', xp);
  localStorage.setItem('level', level);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadProgress() {
  xp = parseInt(localStorage.getItem('xp')) || 0;
  level = parseInt(localStorage.getItem('level')) || 1;
  tasks = JSON.parse(localStorage.getItem('tasks')) || {};
  updateUI();
}

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-content').forEach(sec => sec.classList.remove('active'));
    document.getElementById(btn.dataset.target).classList.add('active');
  });
});

window.onload = () => {
  loadProgress();
  loadTasks();
};
