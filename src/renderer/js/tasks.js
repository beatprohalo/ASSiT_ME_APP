// Tasks specific functionality
class Tasks {
  constructor(app) {
    this.app = app;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Task checkbox interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('task-checkbox')) {
        const taskId = e.target.dataset.taskId;
        this.toggleTask(taskId);
      }
    });

    // Task action buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.task-action-btn')) {
        const action = e.target.textContent.trim();
        const taskId = e.target.dataset.taskId;
        this.handleTaskAction(action, taskId);
      }
    });

    // Task creation
    document.addEventListener('click', (e) => {
      if (e.target.id === 'createTaskBtn') {
        this.showCreateTaskModal();
      }
    });
  }

  async toggleTask(taskId) {
    try {
      const task = this.app.tasks.find(t => t.id == taskId);
      if (!task) return;

      const newCompleted = !task.completed;
      const result = await window.electronAPI.updateTask(taskId, newCompleted);
      
      if (result.success) {
        task.completed = newCompleted;
        this.updateTasksList();
        this.updateTaskStats();
        this.app.showToast(
          `Task ${newCompleted ? 'completed' : 'marked incomplete'}`,
          'success'
        );
      } else {
        this.app.showToast('Error updating task', 'error');
      }
    } catch (error) {
      console.error('Error toggling task:', error);
      this.app.showToast('Error updating task', 'error');
    }
  }

  handleTaskAction(action, taskId) {
    const task = this.app.tasks.find(t => t.id == taskId);
    if (!task) return;

    switch (action) {
      case 'Mark Complete':
      case 'Mark Incomplete':
        this.toggleTask(taskId);
        break;
      case 'Delete':
        this.deleteTask(taskId);
        break;
      case 'Edit':
        this.editTask(task);
        break;
    }
  }

  async deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const result = await window.electronAPI.deleteTask(taskId);
      if (result.success) {
        this.app.tasks = this.app.tasks.filter(t => t.id != taskId);
        this.updateTasksList();
        this.updateTaskStats();
        this.app.showToast('Task deleted', 'success');
      } else {
        this.app.showToast('Error deleting task', 'error');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      this.app.showToast('Error deleting task', 'error');
    }
  }

  editTask(task) {
    // TODO: Open task edit modal
    console.log('Editing task:', task);
  }

  updateTasksList() {
    const allTasksContainer = document.getElementById('allTasks');
    if (!allTasksContainer) return;

    if (this.app.tasks.length === 0) {
      allTasksContainer.innerHTML = `
        <div class="empty-state">
          <p>No tasks found.</p>
        </div>
      `;
      return;
    }

    // Sort tasks by priority and due date
    const sortedTasks = [...this.app.tasks].sort((a, b) => {
      // First by completion status (incomplete first)
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      
      // Then by due date (overdue first, then due soon, then no due date)
      if (a.due_date && b.due_date) {
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      
      // Finally by priority (high first)
      return (b.priority || 1) - (a.priority || 1);
    });

    allTasksContainer.innerHTML = sortedTasks.map(task => `
      <div class="task-item ${task.completed ? 'completed' : ''}" data-task-id="${task.id}">
        <div class="task-header">
          <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
          <div class="task-info">
            <div class="task-title">${task.title}</div>
            <div class="task-description">${task.description || ''}</div>
            <div class="task-track">${task.track_name || 'General'}</div>
          </div>
        </div>
        <div class="task-meta">
          <div class="task-priority ${task.priority || 'low'}">
            <div class="task-priority-dot"></div>
            ${task.priority || 'low'}
          </div>
          <div class="task-due-date ${this.getDueDateClass(task.due_date)}">
            ${task.due_date ? this.app.formatDate(task.due_date) : 'No due date'}
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn primary" data-task-id="${task.id}">
            ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button class="task-action-btn" data-task-id="${task.id}">
            Edit
          </button>
          <button class="task-action-btn danger" data-task-id="${task.id}">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  updateTaskStats() {
    const totalTasks = this.app.tasks.length;
    const completedTasks = this.app.tasks.filter(task => task.completed).length;
    const overdueTasks = this.app.tasks.filter(task => 
      !task.completed && task.due_date && new Date(task.due_date) < new Date()
    ).length;

    // Update stat numbers with animation
    this.animateNumber('totalTasks', totalTasks);
    this.animateNumber('completedTasksCount', completedTasks);
    this.animateNumber('overdueTasks', overdueTasks);
  }

  animateNumber(elementId, targetValue) {
    const element = document.getElementById(elementId);
    if (!element) return;

    const currentValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - currentValue) / 20;
    let current = currentValue;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= targetValue) || (increment < 0 && current <= targetValue)) {
        current = targetValue;
        clearInterval(timer);
      }
      element.textContent = Math.round(current);
    }, 50);
  }

  getDueDateClass(dueDate) {
    if (!dueDate) return '';
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'overdue';
    if (diffDays <= 3) return 'due-soon';
    return '';
  }

  showCreateTaskModal() {
    // TODO: Implement task creation modal
    console.log('Show create task modal');
  }

  // Quick task creation for common tasks
  createQuickTask(trackId, taskType) {
    const quickTasks = {
      'mix': { title: 'Mix Track', priority: 'high' },
      'master': { title: 'Master Track', priority: 'high' },
      'tag': { title: 'Add Tags', priority: 'medium' },
      'register': { title: 'Register Copyright', priority: 'medium' },
      'upload': { title: 'Upload to Platform', priority: 'low' }
    };
    
    const task = quickTasks[taskType];
    if (task) {
      // TODO: Create task with predefined values
      console.log('Creating quick task:', task);
    }
  }

  // Bulk task operations
  completeAllTasks() {
    const incompleteTasks = this.app.tasks.filter(task => !task.completed);
    if (incompleteTasks.length === 0) {
      this.app.showToast('No incomplete tasks to complete', 'info');
      return;
    }
    
    if (confirm(`Complete all ${incompleteTasks.length} incomplete tasks?`)) {
      // TODO: Implement bulk completion
      console.log('Completing all tasks');
    }
  }

  deleteCompletedTasks() {
    const completedTasks = this.app.tasks.filter(task => task.completed);
    if (completedTasks.length === 0) {
      this.app.showToast('No completed tasks to delete', 'info');
      return;
    }
    
    if (confirm(`Delete all ${completedTasks.length} completed tasks?`)) {
      // TODO: Implement bulk deletion
      console.log('Deleting completed tasks');
    }
  }
}

// Initialize tasks when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.tasks = new Tasks(window.app);
  }
});
