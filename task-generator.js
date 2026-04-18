// modules/task-generator-enhanced.js
// Enhanced Task Generator with full customization

class EnhancedTaskGenerator {
  constructor(options = {}) {
    this.templates = options.templates || [];
    this.taskBanks = options.taskBanks || {};
    this.state = options.state || null;
    this.onTaskGenerated = options.onTaskGenerated || null;
    
    // Field definitions for customization
    this.fieldDefinitions = {
      title: { type: 'text', label: 'Mission Title', required: true },
      description: { type: 'textarea', label: 'Description', rows: 2 },
      difficulty: { 
        type: 'select', 
        label: 'Difficulty', 
        options: ['Easy', 'Medium', 'Hard', 'Elite'],
        default: 'Medium'
      },
      category: {
        type: 'select',
        label: 'Category',
        options: ['PhD', 'Skool', 'Curriculum', 'Research Assistantship', 'Documentation', 'Rituals', 'General'],
        default: 'General'
      },
      xp: { type: 'number', label: 'XP Reward', min: 5, max: 500, step: 5 },
      coins: { type: 'number', label: 'Coin Reward', min: 0, max: 250, step: 5 },
      priority: {
        type: 'select',
        label: 'Priority',
        options: ['Critical', 'Important', 'Maintenance', 'Optional'],
        default: 'Important'
      },
      energy: {
        type: 'select',
        label: 'Energy Level',
        options: ['Low Energy', 'Standard Focus', 'Deep Focus'],
        default: 'Standard Focus'
      },
      estimatedTime: { type: 'number', label: 'Est. Time (minutes)', min: 1, max: 480, step: 5 },
      deadline: { type: 'date', label: 'Deadline (optional)' },
      tags: { type: 'tags', label: 'Tags (comma separated)' },
      repeatability: {
        type: 'select',
        label: 'Repeatability',
        options: ['One-time', 'Daily', 'Weekly', 'Monthly'],
        default: 'One-time'
      }
    };
  }

  /**
   * Generate task suggestion based on goal
   */
  generateSuggestion(goal, context = {}) {
    const goalLower = goal.toLowerCase();
    let suggestedCategory = 'General';
    let suggestedDifficulty = 'Medium';
    let suggestedXp = 40;
    
    // Keyword-based suggestions
    if (goalLower.includes('literature') || goalLower.includes('paper') || goalLower.includes('article')) {
      suggestedCategory = 'PhD';
      suggestedDifficulty = 'Hard';
      suggestedXp = 80;
    } else if (goalLower.includes('skool') || goalLower.includes('post') || goalLower.includes('community')) {
      suggestedCategory = 'Skool';
      suggestedDifficulty = 'Medium';
      suggestedXp = 35;
    } else if (goalLower.includes('lesson') || goalLower.includes('curriculum') || goalLower.includes('course')) {
      suggestedCategory = 'Curriculum';
      suggestedDifficulty = 'Medium';
      suggestedXp = 45;
    } else if (goalLower.includes('data') || goalLower.includes('code') || goalLower.includes('transcript')) {
      suggestedCategory = 'Research Assistantship';
      suggestedDifficulty = 'Hard';
      suggestedXp = 80;
    } else if (goalLower.includes('ritual') || goalLower.includes('morning') || goalLower.includes('shutdown')) {
      suggestedCategory = 'Rituals';
      suggestedDifficulty = 'Easy';
      suggestedXp = 15;
    } else if (goalLower.includes('log') || goalLower.includes('doc')) {
      suggestedCategory = 'Documentation';
      suggestedDifficulty = 'Easy';
      suggestedXp = 15;
    }
    
    // Generate smart steps
    const steps = this.generateSteps(goal, suggestedCategory);
    
    return {
      title: goal,
      description: `Complete: ${goal}`,
      difficulty: suggestedDifficulty,
      category: suggestedCategory,
      xp: suggestedXp,
      coins: Math.floor(suggestedXp * 0.2),
      priority: 'Important',
      energy: 'Standard Focus',
      estimatedTime: this.getEstimatedTime(suggestedDifficulty),
      deadline: null,
      tags: [suggestedCategory.toLowerCase()],
      repeatability: 'One-time',
      steps: steps,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Generate intelligent steps based on goal and category
   */
  generateSteps(goal, category) {
    const stepsByCategory = {
      'PhD': [
        `Define scope: ${goal.substring(0, 50)}`,
        'Gather required materials and references',
        'Execute core work (writing/analysis/reading)',
        'Review and refine output',
        'Save and document progress'
      ],
      'Skool': [
        `Plan content: ${goal.substring(0, 50)}`,
        'Draft engaging hook and main points',
        'Add call-to-action or discussion prompt',
        'Review and edit',
        'Publish and respond to first comment'
      ],
      'Curriculum': [
        `Define learning outcomes for: ${goal.substring(0, 50)}`,
        'Design core teaching content',
        'Create practice activities',
        'Build assessment',
        'Review and iterate'
      ],
      'Research Assistantship': [
        `Prepare for: ${goal.substring(0, 50)}`,
        'Set up materials and protocols',
        'Execute data collection/analysis',
        'Document findings',
        'Share with PI or team'
      ],
      'Rituals': [
        `Prepare for ${goal}`,
        'Set timer and remove distractions',
        'Execute ritual steps',
        'Log completion',
        'Plan next ritual'
      ],
      'Documentation': [
        `Document: ${goal.substring(0, 50)}`,
        'Capture key information',
        'Organize and format',
        'Save with proper naming',
        'Link to relevant projects'
      ],
      'General': [
        `Plan: ${goal.substring(0, 50)}`,
        'Break down into subtasks',
        'Execute core work',
        'Review progress',
        'Log completion'
      ]
    };
    
    const steps = stepsByCategory[category] || stepsByCategory.General;
    return steps.map(step => ({ text: step, completed: false }));
  }

  /**
   * Get estimated time based on difficulty
   */
  getEstimatedTime(difficulty) {
    const times = { 'Easy': 15, 'Medium': 45, 'Hard': 120, 'Elite': 240 };
    return times[difficulty] || 45;
  }

  /**
   * Create task object from form data
   */
  createTaskFromForm(formData) {
    return {
      id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      title: formData.title,
      description: formData.description || '',
      difficulty: formData.difficulty,
      domain: formData.category,
      xp: parseInt(formData.xp) || 40,
      coins: parseInt(formData.coins) || 8,
      priority: formData.priority,
      energy: formData.energy,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : null,
      deadline: formData.deadline || null,
      tags: formData.tags ? formData.tags.split(',').map(t => t.trim()) : [],
      repeatability: formData.repeatability,
      steps: formData.steps || [],
      notes: '',
      startedAt: new Date().toISOString(),
      completed: false
    };
  }

  /**
   * Render full task generator UI
   */
  renderGeneratorUI(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = `
      <div class="generator-enhanced">
        <div class="generator-input-section">
          <label>🎯 Goal / Mission Intent</label>
          <textarea id="genGoalEnhanced" rows="2" placeholder="What do you want to accomplish?"></textarea>
          <button id="suggestTaskBtn" class="primary">✨ Generate Suggestion</button>
        </div>
        
        <div class="generator-fields" style="display: none;">
          <h3>📝 Customize Your Mission</h3>
          
          <div class="form-row">
            <div class="form-group">
              <label>Mission Title</label>
              <input type="text" id="genTitle" placeholder="Enter mission title">
            </div>
            <div class="form-group">
              <label>Category</label>
              <select id="genCategory"></select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Difficulty</label>
              <select id="genDifficultyEnhanced"></select>
            </div>
            <div class="form-group">
              <label>Priority</label>
              <select id="genPriorityEnhanced"></select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>XP Reward</label>
              <input type="number" id="genXp" min="5" max="500" step="5">
            </div>
            <div class="form-group">
              <label>Coin Reward</label>
              <input type="number" id="genCoins" min="0" max="250" step="5">
            </div>
            <div class="form-group">
              <label>Est. Time (minutes)</label>
              <input type="number" id="genTime" min="1" max="480" step="5">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Energy Level</label>
              <select id="genEnergyEnhanced"></select>
            </div>
            <div class="form-group">
              <label>Repeatability</label>
              <select id="genRepeatabilityEnhanced"></select>
            </div>
            <div class="form-group">
              <label>Deadline</label>
              <input type="date" id="genDeadline">
            </div>
          </div>
          
          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" id="genTags" placeholder="e.g., writing, research, urgent">
          </div>
          
          <div class="form-group">
            <label>Description</label>
            <textarea id="genDescription" rows="2"></textarea>
          </div>
          
          <div class="form-group">
            <label>Steps</label>
            <div id="stepsEditorContainer"></div>
            <button id="addStepBtn" type="button">+ Add Step</button>
          </div>
          
          <div class="generator-actions">
            <button id="createTaskBtn" class="primary">➕ Create Mission</button>
            <button id="cancelGeneratorBtn">Cancel</button>
          </div>
        </div>
      </div>
    `;
    
    this.populateSelects();
    this.setupGeneratorEvents(container);
  }

  /**
   * Populate select dropdowns
   */
  populateSelects() {
    const categorySelect = document.getElementById('genCategory');
    if (categorySelect) {
      categorySelect.innerHTML = this.fieldDefinitions.category.options.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
    
    const difficultySelect = document.getElementById('genDifficultyEnhanced');
    if (difficultySelect) {
      difficultySelect.innerHTML = this.fieldDefinitions.difficulty.options.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
    
    const prioritySelect = document.getElementById('genPriorityEnhanced');
    if (prioritySelect) {
      prioritySelect.innerHTML = this.fieldDefinitions.priority.options.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
    
    const energySelect = document.getElementById('genEnergyEnhanced');
    if (energySelect) {
      energySelect.innerHTML = this.fieldDefinitions.energy.options.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
    
    const repeatSelect = document.getElementById('genRepeatabilityEnhanced');
    if (repeatSelect) {
      repeatSelect.innerHTML = this.fieldDefinitions.repeatability.options.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('');
    }
  }

  /**
   * Setup generator event handlers
   */
  setupGeneratorEvents(container) {
    const suggestBtn = document.getElementById('suggestTaskBtn');
    const goalInput = document.getElementById('genGoalEnhanced');
    const fieldsDiv = container.querySelector('.generator-fields');
    const createBtn = document.getElementById('createTaskBtn');
    const cancelBtn = document.getElementById('cancelGeneratorBtn');
    const addStepBtn = document.getElementById('addStepBtn');
    
    let currentSteps = [];
    
    suggestBtn.onclick = () => {
      const goal = goalInput.value.trim();
      if (!goal) {
        this.showToast('Enter a goal first');
        return;
      }
      
      const suggestion = this.generateSuggestion(goal);
      
      // Populate form
      document.getElementById('genTitle').value = suggestion.title;
      document.getElementById('genCategory').value = suggestion.category;
      document.getElementById('genDifficultyEnhanced').value = suggestion.difficulty;
      document.getElementById('genPriorityEnhanced').value = suggestion.priority;
      document.getElementById('genXp').value = suggestion.xp;
      document.getElementById('genCoins').value = suggestion.coins;
      document.getElementById('genTime').value = suggestion.estimatedTime;
      document.getElementById('genEnergyEnhanced').value = suggestion.energy;
      document.getElementById('genRepeatabilityEnhanced').value = suggestion.repeatability;
      document.getElementById('genTags').value = suggestion.tags.join(', ');
      document.getElementById('genDescription').value = suggestion.description;
      
      currentSteps = [...suggestion.steps];
      this.renderStepsEditor(currentSteps);
      
      fieldsDiv.style.display = 'block';
      this.showToast('Suggestion generated! Customize as needed.');
    };
    
    const renderStepsEditor = () => {
      const container = document.getElementById('stepsEditorContainer');
      if (!container) return;
      
      container.innerHTML = currentSteps.map((step, idx) => `
        <div class="step-editor-row" data-step-index="${idx}">
          <input type="text" class="step-editor-input" value="${this.escapeHtml(step.text)}">
          <button class="step-editor-delete" data-step="${idx}">✖</button>
          ${idx > 0 ? `<button class="step-editor-up" data-step="${idx}">↑</button>` : ''}
          ${idx < currentSteps.length - 1 ? `<button class="step-editor-down" data-step="${idx}">↓</button>` : ''}
        </div>
      `).join('');
      
      // Attach step editing events
      container.querySelectorAll('.step-editor-input').forEach((input, idx) => {
        input.onchange = () => {
          currentSteps[idx].text = input.value;
        };
      });
      
      container.querySelectorAll('.step-editor-delete').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.step);
          currentSteps.splice(idx, 1);
          renderStepsEditor();
        };
      });
      
      container.querySelectorAll('.step-editor-up').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.step);
          if (idx > 0) {
            [currentSteps[idx-1], currentSteps[idx]] = [currentSteps[idx], currentSteps[idx-1]];
            renderStepsEditor();
          }
        };
      });
      
      container.querySelectorAll('.step-editor-down').forEach(btn => {
        btn.onclick = () => {
          const idx = parseInt(btn.dataset.step);
          if (idx < currentSteps.length - 1) {
            [currentSteps[idx], currentSteps[idx+1]] = [currentSteps[idx+1], currentSteps[idx]];
            renderStepsEditor();
          }
        };
      });
    };
    
    addStepBtn.onclick = () => {
      currentSteps.push({ text: 'New step', completed: false });
      this.renderStepsEditor(currentSteps);
    };
    
    createBtn.onclick = () => {
      const formData = {
        title: document.getElementById('genTitle').value,
        description: document.getElementById('genDescription').value,
        difficulty: document.getElementById('genDifficultyEnhanced').value,
        category: document.getElementById('genCategory').value,
        xp: document.getElementById('genXp').value,
        coins: document.getElementById('genCoins').value,
        priority: document.getElementById('genPriorityEnhanced').value,
        energy: document.getElementById('genEnergyEnhanced').value,
        estimatedTime: document.getElementById('genTime').value,
        deadline: document.getElementById('genDeadline').value,
        tags: document.getElementById('genTags').value,
        repeatability: document.getElementById('genRepeatabilityEnhanced').value,
        steps: currentSteps
      };
      
      if (!formData.title) {
        this.showToast('Please enter a mission title');
        return;
      }
      
      const newTask = this.createTaskFromForm(formData);
      
      if (this.onTaskGenerated) {
        this.onTaskGenerated(newTask);
      }
      
      fieldsDiv.style.display = 'none';
      goalInput.value = '';
      this.showToast(`Mission created: ${newTask.title}`);
    };
    
    cancelBtn.onclick = () => {
      fieldsDiv.style.display = 'none';
      goalInput.value = '';
    };
  }

  renderStepsEditor(steps) {
    const container = document.getElementById('stepsEditorContainer');
    if (!container) return;
    
    container.innerHTML = steps.map((step, idx) => `
      <div class="step-editor-row" data-step-index="${idx}">
        <input type="text" class="step-editor-input" value="${this.escapeHtml(step.text)}">
        <button class="step-editor-delete" data-step="${idx}">✖</button>
        ${idx > 0 ? `<button class="step-editor-up" data-step="${idx}">↑</button>` : ''}
        ${idx < steps.length - 1 ? `<button class="step-editor-down" data-step="${idx}">↓</button>` : ''}
      </div>
    `).join('');
    
    // Attach events
    container.querySelectorAll('.step-editor-input').forEach((input, idx) => {
      input.onchange = () => { steps[idx].text = input.value; };
    });
    container.querySelectorAll('.step-editor-delete').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.step);
        steps.splice(idx, 1);
        this.renderStepsEditor(steps);
      };
    });
    container.querySelectorAll('.step-editor-up').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.step);
        if (idx > 0) {
          [steps[idx-1], steps[idx]] = [steps[idx], steps[idx-1]];
          this.renderStepsEditor(steps);
        }
      };
    });
    container.querySelectorAll('.step-editor-down').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.step);
        if (idx < steps.length - 1) {
          [steps[idx], steps[idx+1]] = [steps[idx+1], steps[idx]];
          this.renderStepsEditor(steps);
        }
      };
    });
  }

  showToast(msg) {
    const toast = document.getElementById('rewardToast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, (m) => {
      if (m === '&') return '&amp;';
      if (m === '<') return '&lt;';
      if (m === '>') return '&gt;';
      return m;
    });
  }
}

if (typeof window !== 'undefined') {
  window.EnhancedTaskGenerator = EnhancedTaskGenerator;
}
