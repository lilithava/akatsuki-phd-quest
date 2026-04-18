// modules/step-editor.js
// Step Editing Module - Inline editing, reordering, CRUD

class StepEditor {
  constructor(options = {}) {
    this.onStepChange = options.onStepChange || null;
    this.onTaskUpdate = options.onTaskUpdate || null;
    this.undoManager = options.undoManager || null;
    this.state = options.state || null;
    this.saveState = options.saveState || null;
    this.renderAll = options.renderAll || null;
  }

  /**
   * Create editable step list HTML
   */
  renderEditableSteps(taskId, steps, options = {}) {
    const { readOnly = false, showAddButton = true } = options;
    
    const stepsHtml = steps.map((step, idx) => `
      <li class="step-item editable-step" data-step-index="${idx}" data-task-id="${taskId}">
        <input type="checkbox" class="step-checkbox" ${step.completed ? 'checked' : ''}>
        <span class="step-text" data-step-index="${idx}">${this.escapeHtml(step.text)}</span>
        <div class="step-controls">
          <button class="step-edit-btn" data-step="${idx}" title="Edit step">✏️</button>
          <button class="step-delete-btn" data-step="${idx}" title="Delete step">🗑️</button>
          ${idx > 0 ? `<button class="step-move-up" data-step="${idx}" title="Move up">↑</button>` : ''}
          ${idx < steps.length - 1 ? `<button class="step-move-down" data-step="${idx}" title="Move down">↓</button>` : ''}
        </div>
      </li>
    `).join('');
    
    const addButton = showAddButton ? `
      <li class="step-item add-step-item">
        <button class="step-add-btn" data-task-id="${taskId}">+ Add Step</button>
      </li>
    ` : '';
    
    return `<ul class="step-list editable">${stepsHtml}${addButton}</ul>`;
  }

  /**
   * Create inline editor for step
   */
  createStepEditor(taskId, stepIndex, currentText) {
    const editorDiv = document.createElement('div');
    editorDiv.className = 'step-inline-editor';
    editorDiv.innerHTML = `
      <input type="text" class="step-edit-input" value="${this.escapeHtml(currentText)}" autofocus>
      <div class="step-edit-actions">
        <button class="step-save-btn">Save</button>
        <button class="step-cancel-btn">Cancel</button>
      </div>
    `;
    
    const input = editorDiv.querySelector('.step-edit-input');
    const saveBtn = editorDiv.querySelector('.step-save-btn');
    const cancelBtn = editorDiv.querySelector('.step-cancel-btn');
    
    saveBtn.onclick = () => {
      const newText = input.value.trim();
      if (newText && newText !== currentText) {
        this.editStepText(taskId, stepIndex, currentText, newText);
      }
      editorDiv.remove();
    };
    
    cancelBtn.onclick = () => editorDiv.remove();
    
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') saveBtn.click();
      if (e.key === 'Escape') cancelBtn.click();
    });
    
    return editorDiv;
  }

  /**
   * Create add step dialog
   */
  createAddStepDialog(taskId, insertAtIndex = null) {
    const dialog = document.createElement('div');
    dialog.className = 'step-add-dialog';
    dialog.innerHTML = `
      <div class="step-add-content">
        <h4>Add New Step</h4>
        <textarea class="step-add-textarea" rows="2" placeholder="Describe the step..."></textarea>
        <div class="step-add-actions">
          <button class="step-add-confirm">Add</button>
          <button class="step-add-cancel">Cancel</button>
        </div>
      </div>
    `;
    
    const textarea = dialog.querySelector('.step-add-textarea');
    const confirmBtn = dialog.querySelector('.step-add-confirm');
    const cancelBtn = dialog.querySelector('.step-add-cancel');
    
    confirmBtn.onclick = () => {
      const stepText = textarea.value.trim();
      if (stepText) {
        this.addStep(taskId, stepText, insertAtIndex);
      }
      dialog.remove();
    };
    
    cancelBtn.onclick = () => dialog.remove();
    
    textarea.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && e.ctrlKey) confirmBtn.click();
    });
    
    return dialog;
  }

  /**
   * Edit step text with undo support
   */
  editStepText(taskId, stepIndex, oldText, newText) {
    if (!this.state) return;
    
    const task = this.state.activeTasks.find(t => t.id === taskId);
    if (!task || !task.steps[stepIndex]) return;
    
    if (this.undoManager) {
      const command = TaskCommands.editStep(taskId, stepIndex, oldText, newText, {
        state: this.state,
        saveState: this.saveState,
        renderAll: this.renderAll
      });
      this.undoManager.execute(command);
    } else {
      // Direct update
      task.steps[stepIndex].text = newText;
      if (this.saveState) this.saveState();
      if (this.renderAll) this.renderAll();
    }
    
    if (this.onStepChange) this.onStepChange(taskId, stepIndex, newText);
  }

  /**
   * Add step with undo support
   */
  addStep(taskId, stepText, insertAtIndex = null) {
    if (!this.state) return;
    
    const task = this.state.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    if (this.undoManager) {
      const command = TaskCommands.addStep(taskId, insertAtIndex, stepText, {
        state: this.state,
        saveState: this.saveState,
        renderAll: this.renderAll
      });
      this.undoManager.execute(command);
    } else {
      // Direct update
      const newStep = { text: stepText, completed: false };
      if (insertAtIndex !== null) {
        task.steps.splice(insertAtIndex, 0, newStep);
      } else {
        task.steps.push(newStep);
      }
      if (this.saveState) this.saveState();
      if (this.renderAll) this.renderAll();
    }
  }

  /**
   * Delete step with undo support
   */
  deleteStep(taskId, stepIndex) {
    if (!this.state) return;
    
    const task = this.state.activeTasks.find(t => t.id === taskId);
    if (!task || !task.steps[stepIndex]) return;
    
    const stepData = { ...task.steps[stepIndex] };
    
    if (this.undoManager) {
      const command = TaskCommands.deleteStep(taskId, stepIndex, stepData, {
        state: this.state,
        saveState: this.saveState,
        renderAll: this.renderAll
      });
      this.undoManager.execute(command);
    } else {
      // Direct update
      task.steps.splice(stepIndex, 1);
      if (this.saveState) this.saveState();
      if (this.renderAll) this.renderAll();
    }
  }

  /**
   * Move step up/down with undo support
   */
  moveStep(taskId, stepIndex, direction) {
    if (!this.state) return;
    
    const task = this.state.activeTasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= task.steps.length) return;
    
    // Capture old order for undo
    const oldOrder = task.steps.map((_, i) => i);
    const newOrder = [...oldOrder];
    [newOrder[stepIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[stepIndex]];
    
    if (this.undoManager) {
      const command = TaskCommands.reorderSteps(taskId, oldOrder, newOrder, {
        state: this.state,
        saveState: this.saveState,
        renderAll: this.renderAll
      });
      this.undoManager.execute(command);
    } else {
      // Direct update
      const steps = [...task.steps];
      [steps[stepIndex], steps[newIndex]] = [steps[newIndex], steps[stepIndex]];
      task.steps = steps;
      if (this.saveState) this.saveState();
      if (this.renderAll) this.renderAll();
    }
  }

  /**
   * Setup event delegation for step editing
   */
  setupEventDelegation(container) {
    if (!container) return;
    
    // Edit step
    container.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.step-edit-btn');
      if (editBtn) {
        e.preventDefault();
        const stepItem = editBtn.closest('.step-item');
        const stepIndex = parseInt(stepItem.dataset.stepIndex);
        const taskId = stepItem.dataset.taskId;
        const task = this.state?.activeTasks.find(t => t.id === taskId);
        
        if (task && task.steps[stepIndex]) {
          const stepText = task.steps[stepIndex].text;
          const editor = this.createStepEditor(taskId, stepIndex, stepText);
          const textSpan = stepItem.querySelector('.step-text');
          textSpan.style.display = 'none';
          textSpan.parentNode.insertBefore(editor, textSpan.nextSibling);
          
          // Clean up on editor removal
          const observer = new MutationObserver((mutations) => {
            if (!editor.isConnected) {
              textSpan.style.display = '';
              observer.disconnect();
            }
          });
          observer.observe(container, { childList: true, subtree: true });
        }
      }
      
      // Delete step
      const deleteBtn = e.target.closest('.step-delete-btn');
      if (deleteBtn) {
        e.preventDefault();
        if (confirm('Delete this step?')) {
          const stepItem = deleteBtn.closest('.step-item');
          const stepIndex = parseInt(stepItem.dataset.stepIndex);
          const taskId = stepItem.dataset.taskId;
          this.deleteStep(taskId, stepIndex);
        }
      }
      
      // Move up
      const moveUpBtn = e.target.closest('.step-move-up');
      if (moveUpBtn) {
        e.preventDefault();
        const stepItem = moveUpBtn.closest('.step-item');
        const stepIndex = parseInt(stepItem.dataset.stepIndex);
        const taskId = stepItem.dataset.taskId;
        this.moveStep(taskId, stepIndex, 'up');
      }
      
      // Move down
      const moveDownBtn = e.target.closest('.step-move-down');
      if (moveDownBtn) {
        e.preventDefault();
        const stepItem = moveDownBtn.closest('.step-item');
        const stepIndex = parseInt(stepItem.dataset.stepIndex);
        const taskId = stepItem.dataset.taskId;
        this.moveStep(taskId, stepIndex, 'down');
      }
      
      // Add step
      const addBtn = e.target.closest('.step-add-btn');
      if (addBtn) {
        e.preventDefault();
        const taskId = addBtn.dataset.taskId;
        const dialog = this.createAddStepDialog(taskId);
        addBtn.parentNode.parentNode.insertBefore(dialog, addBtn.parentNode.nextSibling);
      }
    });
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

// Export
if (typeof window !== 'undefined') {
  window.StepEditor = StepEditor;
}
