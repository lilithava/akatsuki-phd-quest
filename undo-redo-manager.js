// modules/undo-redo-manager.js
// Akatsuki Undo/Redo System - Command Pattern

class UndoRedoManager {
  constructor(maxHistory = 50) {
    this.undoStack = [];
    this.redoStack = [];
    this.maxHistory = maxHistory;
    this.isExecuting = false;
  }

  execute(command) {
    if (this.isExecuting) return;
    this.isExecuting = true;
    try {
      if (command.execute) command.execute();
      this.undoStack.push(command);
      this.redoStack = [];
      while (this.undoStack.length > this.maxHistory) {
        this.undoStack.shift();
      }
      this._notifyChange();
    } finally {
      this.isExecuting = false;
    }
  }

  undo() {
    const command = this.undoStack.pop();
    if (!command) {
      this._showToast('Nothing to undo');
      return false;
    }
    this.isExecuting = true;
    try {
      if (command.undo) command.undo();
      this.redoStack.push(command);
      this._notifyChange();
      this._showToast(`Undo: ${command.description || 'Action undone'}`);
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  redo() {
    const command = this.redoStack.pop();
    if (!command) {
      this._showToast('Nothing to redo');
      return false;
    }
    this.isExecuting = true;
    try {
      if (command.execute) command.execute();
      this.undoStack.push(command);
      this._notifyChange();
      this._showToast(`Redo: ${command.description || 'Action redone'}`);
      return true;
    } finally {
      this.isExecuting = false;
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this._notifyChange();
  }

  canUndo() { return this.undoStack.length > 0; }
  canRedo() { return this.redoStack.length > 0; }
  getUndoDescription() {
    return this.undoStack.length > 0 ? this.undoStack[this.undoStack.length - 1].description : null;
  }

  _notifyChange() {
    if (window.onHistoryChange) {
      window.onHistoryChange({
        canUndo: this.canUndo(),
        canRedo: this.canRedo(),
        undoDescription: this.getUndoDescription()
      });
    }
  }

  _showToast(msg) {
    const toast = document.getElementById('rewardToast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }
  }
}

const TaskCommands = {
  addTask(task, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Add task: ${task.title}`,
      execute: () => {
        state.activeTasks.push(task);
        if (saveState) saveState();
        if (renderAll) renderAll();
      },
      undo: () => {
        state.activeTasks = state.activeTasks.filter(t => t.id !== task.id);
        if (saveState) saveState();
        if (renderAll) renderAll();
      }
    };
  },

  deleteTask(taskId, taskData, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Delete task: ${taskData?.title || taskId}`,
      execute: () => {
        state.activeTasks = state.activeTasks.filter(t => t.id !== taskId);
        if (saveState) saveState();
        if (renderAll) renderAll();
      },
      undo: () => {
        if (taskData) {
          state.activeTasks.push(taskData);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      }
    };
  },

  toggleStep(taskId, stepIndex, oldCompleted, options = {}) {
    const { state, saveState, renderAll, completeTask } = options;
    return {
      description: `Toggle step ${stepIndex + 1}`,
      execute: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex]) {
          task.steps[stepIndex].completed = !oldCompleted;
          if (saveState) saveState();
          if (renderAll) renderAll();
          const allDone = task.steps.every(s => s.completed);
          if (allDone && !task.completed && completeTask) {
            completeTask(taskId);
          }
        }
      },
      undo: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex]) {
          task.steps[stepIndex].completed = oldCompleted;
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      }
    };
  },

  editStep(taskId, stepIndex, oldText, newText, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Edit step: "${oldText.substring(0, 20)}..."`,
      execute: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex]) task.steps[stepIndex].text = newText;
        if (saveState) saveState();
        if (renderAll) renderAll();
      },
      undo: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex]) task.steps[stepIndex].text = oldText;
        if (saveState) saveState();
        if (renderAll) renderAll();
      }
    };
  },

  addStep(taskId, stepIndex, stepText, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Add step: "${stepText.substring(0, 20)}..."`,
      execute: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
          const newStep = { text: stepText, completed: false };
          if (stepIndex !== undefined) task.steps.splice(stepIndex, 0, newStep);
          else task.steps.push(newStep);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      },
      undo: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
          if (stepIndex !== undefined) task.steps.splice(stepIndex, 1);
          else task.steps.pop();
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      }
    };
  },

  deleteStep(taskId, stepIndex, stepData, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Delete step`,
      execute: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && task.steps[stepIndex]) {
          task.steps.splice(stepIndex, 1);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      },
      undo: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task && stepData) {
          task.steps.splice(stepIndex, 0, stepData);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      }
    };
  },

  reorderSteps(taskId, oldOrder, newOrder, options = {}) {
    const { state, saveState, renderAll } = options;
    return {
      description: `Reorder steps`,
      execute: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
          const steps = [...task.steps];
          task.steps = newOrder.map(idx => steps[idx]);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      },
      undo: () => {
        const task = state.activeTasks.find(t => t.id === taskId);
        if (task) {
          const steps = [...task.steps];
          task.steps = oldOrder.map(idx => steps[idx]);
          if (saveState) saveState();
          if (renderAll) renderAll();
        }
      }
    };
  }
};

if (typeof window !== 'undefined') {
  window.UndoRedoManager = UndoRedoManager;
  window.TaskCommands = TaskCommands;
}
