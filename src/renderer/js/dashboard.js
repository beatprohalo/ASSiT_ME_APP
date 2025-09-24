// Dashboard specific functionality
class Dashboard {
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

    // Track item interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.recent-item')) {
        const trackId = e.target.closest('.recent-item').dataset.trackId;
        this.app.navigateToView('library');
        // TODO: Highlight specific track in library
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
        this.app.updateDashboard();
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

  updateStats() {
    const totalTracks = this.app.tracks.length;
    const totalProjects = this.app.tracks.filter(track => track.format === 'project').length;
    const completedTasks = this.app.tasks.filter(task => task.completed).length;
    const pendingTasks = this.app.tasks.filter(task => !task.completed).length;

    // Update stat numbers with animation
    this.animateNumber('totalTracks', totalTracks);
    this.animateNumber('totalProjects', totalProjects);
    this.animateNumber('completedTasks', completedTasks);
    this.animateNumber('pendingTasks', pendingTasks);
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

  updateRecentTracks() {
    const recentTracksContainer = document.getElementById('recentTracks');
    if (!recentTracksContainer) return;

    const recentTracks = this.app.tracks
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
    
    if (recentTracks.length === 0) {
      recentTracksContainer.innerHTML = `
        <div class="empty-state">
          <p>No tracks found. Scan a music folder to get started.</p>
        </div>
      `;
      return;
    }

    recentTracksContainer.innerHTML = recentTracks.map(track => `
      <div class="recent-item" data-track-id="${track.id}">
        <div class="recent-item-info">
          <div class="recent-item-title">${track.title || track.file_name}</div>
          <div class="recent-item-details">
            <span>${track.artist || 'Unknown Artist'}</span>
            <span>•</span>
            <span>${track.duration ? this.app.formatDuration(track.duration) : 'Unknown'}</span>
          </div>
        </div>
        <div class="recent-item-duration">${track.format?.toUpperCase()}</div>
      </div>
    `).join('');
  }

  updateUpcomingTasks() {
    const upcomingTasksContainer = document.getElementById('upcomingTasks');
    if (!upcomingTasksContainer) return;

    const upcomingTasks = this.app.tasks
      .filter(task => !task.completed)
      .sort((a, b) => {
        // Sort by due date, then by priority
        if (a.due_date && b.due_date) {
          return new Date(a.due_date) - new Date(b.due_date);
        }
        if (a.due_date && !b.due_date) return -1;
        if (!a.due_date && b.due_date) return 1;
        return (b.priority || 1) - (a.priority || 1);
      })
      .slice(0, 5);
    
    if (upcomingTasks.length === 0) {
      upcomingTasksContainer.innerHTML = `
        <div class="empty-state">
          <p>No upcoming tasks.</p>
        </div>
      `;
      return;
    }

    upcomingTasksContainer.innerHTML = upcomingTasks.map(task => `
      <div class="task-item" data-task-id="${task.id}">
        <div class="task-checkbox ${task.completed ? 'checked' : ''}" data-task-id="${task.id}"></div>
        <div class="task-info">
          <div class="task-title">${task.title}</div>
          <div class="task-track">${task.track_name || 'General'}</div>
        </div>
        <div class="task-priority ${task.priority || 'low'}"></div>
      </div>
    `).join('');
  }

  // Quick actions for dashboard
  quickScanFolder() {
    this.app.scanFolder();
  }

  quickCreateTask() {
    // TODO: Open task creation modal
    console.log('Quick create task');
  }

  quickGenerateIdea() {
    this.app.navigateToView('creative');
    // TODO: Focus on idea generation input
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.dashboard = new Dashboard(window.app);
  }
});
