// Main application logic
class App {
  constructor() {
    this.currentView = 'dashboard';
    this.theme = localStorage.getItem('theme') || 'light';
    this.tracks = [];
    this.tasks = [];
    this.tags = [];
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    this.setupTheme();
    this.setupNavigation();
    await this.loadData();
  }

  setupEventListeners() {
    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Navigation
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.navigateToView(view);
      });
    });

    // Scan folder button
    const scanFolderBtn = document.getElementById('scanFolderBtn');
    if (scanFolderBtn) {
      scanFolderBtn.addEventListener('click', () => this.scanFolder());
    }

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.handleSearch(e.target.value);
      });
    }

    // Filter controls
    const genreFilter = document.getElementById('genreFilter');
    const moodFilter = document.getElementById('moodFilter');
    
    if (genreFilter) {
      genreFilter.addEventListener('change', () => this.applyFilters());
    }
    
    if (moodFilter) {
      moodFilter.addEventListener('change', () => this.applyFilters());
    }
  }

  setupTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', this.theme);
    this.setupTheme();
  }

  setupNavigation() {
    // Set initial active nav item
    const activeNavItem = document.querySelector(`[data-view="${this.currentView}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }

    // Set initial active view
    const activeView = document.getElementById(this.currentView);
    if (activeView) {
      activeView.classList.add('active');
    }
  }

  navigateToView(viewName) {
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.remove('active');
    });
    
    const activeNavItem = document.querySelector(`[data-view="${viewName}"]`);
    if (activeNavItem) {
      activeNavItem.classList.add('active');
    }

    // Update views
    document.querySelectorAll('.view').forEach(view => {
      view.classList.remove('active');
    });
    
    const targetView = document.getElementById(viewName);
    if (targetView) {
      targetView.classList.add('active');
    }

    this.currentView = viewName;

    // Load view-specific data
    this.loadViewData(viewName);
  }

  async loadData() {
    try {
      // Load tracks
      const tracksResponse = await window.electronAPI.getTracks();
      if (tracksResponse.success) {
        this.tracks = tracksResponse.data || [];
      }

      // Load tasks
      const tasksResponse = await window.electronAPI.getTasks();
      if (tasksResponse.success) {
        this.tasks = tasksResponse.data || [];
      }

      // Load tags
      const tagsResponse = await window.electronAPI.getTags();
      if (tagsResponse.success) {
        this.tags = tagsResponse.data || [];
      }

      this.updateDashboard();
      this.updateLibrary();
      this.updateTasks();
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error loading data', 'error');
    }
  }

  loadViewData(viewName) {
    switch (viewName) {
      case 'dashboard':
        this.updateDashboard();
        break;
      case 'library':
        this.updateLibrary();
        break;
      case 'creative':
        this.updateCreative();
        break;
      case 'tasks':
        this.updateTasks();
        break;
    }
  }

  updateDashboard() {
    // Update stats
    const totalTracks = this.tracks.length;
    const totalProjects = this.tracks.filter(track => track.format === 'project').length;
    const completedTasks = this.tasks.filter(task => task.completed).length;
    const pendingTasks = this.tasks.filter(task => !task.completed).length;

    document.getElementById('totalTracks').textContent = totalTracks;
    document.getElementById('totalProjects').textContent = totalProjects;
    document.getElementById('completedTasks').textContent = completedTasks;
    document.getElementById('pendingTasks').textContent = pendingTasks;

    // Update recent tracks
    this.updateRecentTracks();
    
    // Update upcoming tasks
    this.updateUpcomingTasks();
  }

  updateRecentTracks() {
    const recentTracksContainer = document.getElementById('recentTracks');
    if (!recentTracksContainer) return;

    const recentTracks = this.tracks.slice(0, 5);
    
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
            <span>${track.duration ? this.formatDuration(track.duration) : 'Unknown'}</span>
          </div>
        </div>
        <div class="recent-item-duration">${track.format?.toUpperCase()}</div>
      </div>
    `).join('');
  }

  updateUpcomingTasks() {
    const upcomingTasksContainer = document.getElementById('upcomingTasks');
    if (!upcomingTasksContainer) return;

    const upcomingTasks = this.tasks
      .filter(task => !task.completed)
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

  updateLibrary() {
    const tracksGrid = document.getElementById('tracksGrid');
    if (!tracksGrid) return;

    if (this.tracks.length === 0) {
      tracksGrid.innerHTML = `
        <div class="empty-state">
          <p>No tracks found. Scan a music folder to get started.</p>
        </div>
      `;
      return;
    }

    tracksGrid.innerHTML = this.tracks.map(track => `
      <div class="track-card" data-track-id="${track.id}">
        <div class="track-header">
          <div class="track-info">
            <div class="track-title">${track.title || track.file_name}</div>
            <div class="track-artist">${track.artist || 'Unknown Artist'}</div>
            <div class="track-format">${track.format?.toUpperCase()}</div>
          </div>
          <div class="track-actions">
            <button class="track-action-btn" title="Play">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5,3 19,12 5,21"></polygon>
              </svg>
            </button>
            <button class="track-action-btn" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        </div>
        <div class="track-details">
          <div class="track-detail">
            <div class="track-detail-label">Duration</div>
            <div class="track-detail-value">${track.duration ? this.formatDuration(track.duration) : 'Unknown'}</div>
          </div>
          <div class="track-detail">
            <div class="track-detail-label">Tempo</div>
            <div class="track-detail-value">${track.tempo ? `${track.tempo} BPM` : 'Unknown'}</div>
          </div>
          <div class="track-detail">
            <div class="track-detail-label">Key</div>
            <div class="track-detail-value">${track.key_signature || 'Unknown'}</div>
          </div>
          <div class="track-detail">
            <div class="track-detail-label">Genre</div>
            <div class="track-detail-value">${track.genre || 'Unknown'}</div>
          </div>
        </div>
        <div class="track-tags">
          ${this.renderTrackTags(track.tags)}
        </div>
        <div class="track-progress">
          <div class="progress-header">
            <div class="progress-title">Progress</div>
            <div class="progress-percentage">${this.calculateTrackProgress(track.id)}%</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.calculateTrackProgress(track.id)}%"></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  updateCreative() {
    // Initialize creative panel
    this.setupCreativePanel();
  }

  updateTasks() {
    const allTasksContainer = document.getElementById('allTasks');
    if (!allTasksContainer) return;

    if (this.tasks.length === 0) {
      allTasksContainer.innerHTML = `
        <div class="empty-state">
          <p>No tasks found.</p>
        </div>
      `;
      return;
    }

    allTasksContainer.innerHTML = this.tasks.map(task => `
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
            ${task.due_date ? this.formatDate(task.due_date) : 'No due date'}
          </div>
        </div>
        <div class="task-actions">
          <button class="task-action-btn primary" data-task-id="${task.id}">
            ${task.completed ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
          <button class="task-action-btn danger" data-task-id="${task.id}">
            Delete
          </button>
        </div>
      </div>
    `).join('');
  }

  setupCreativePanel() {
    // Setup idea generation
    const generateIdeaBtn = document.getElementById('generateIdeaBtn');
    if (generateIdeaBtn) {
      generateIdeaBtn.addEventListener('click', () => this.generateIdea());
    }

    // Setup voice input
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
      voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
    }
  }

  async scanFolder() {
    try {
      const result = await window.electronAPI.scanFolder();
      if (result.success) {
        this.showToast('Folder scanned successfully', 'success');
        await this.loadData();
      } else {
        this.showToast('Error scanning folder: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error scanning folder:', error);
      this.showToast('Error scanning folder', 'error');
    }
  }

  async generateIdea() {
    const prompt = document.getElementById('ideaPrompt').value;
    if (!prompt.trim()) {
      this.showToast('Please enter a prompt', 'warning');
      return;
    }

    try {
      const result = await window.electronAPI.generateIdea(prompt);
      if (result.success) {
        this.showToast('Idea generated successfully', 'success');
        // TODO: Display generated idea
      } else {
        this.showToast('Error generating idea', 'error');
      }
    } catch (error) {
      console.error('Error generating idea:', error);
      this.showToast('Error generating idea', 'error');
    }
  }

  async toggleVoiceInput() {
    const voiceBtn = document.getElementById('voiceInputBtn');
    if (voiceBtn.classList.contains('recording')) {
      // Stop recording
      voiceBtn.classList.remove('recording');
      voiceBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
          <line x1="12" y1="19" x2="12" y2="23"></line>
          <line x1="8" y1="23" x2="16" y2="23"></line>
        </svg>
        Start Voice Input
      `;
    } else {
      // Start recording
      voiceBtn.classList.add('recording');
      voiceBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="6" y="6" width="12" height="12" rx="2"></rect>
        </svg>
        Stop Recording
      `;
      
      try {
        const result = await window.electronAPI.startVoiceInput();
        if (result.success) {
          this.showToast('Voice input started', 'success');
        } else {
          this.showToast('Error starting voice input', 'error');
        }
      } catch (error) {
        console.error('Error starting voice input:', error);
        this.showToast('Error starting voice input', 'error');
      }
    }
  }

  handleSearch(query) {
    // TODO: Implement search functionality
    console.log('Searching for:', query);
  }

  applyFilters() {
    // TODO: Implement filter functionality
    console.log('Applying filters');
  }

  renderTrackTags(tags) {
    if (!tags) return '';
    
    const tagList = tags.split(',');
    return tagList.map(tag => `
      <div class="track-tag">
        <div class="track-tag-color" style="background-color: #3B82F6"></div>
        ${tag.trim()}
      </div>
    `).join('');
  }

  calculateTrackProgress(trackId) {
    const trackTasks = this.tasks.filter(task => task.track_id === trackId);
    if (trackTasks.length === 0) return 0;
    
    const completedTasks = trackTasks.filter(task => task.completed).length;
    return Math.round((completedTasks / trackTasks.length) * 100);
  }

  formatDuration(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString();
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

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast ${type} active`;
    toast.innerHTML = `
      <div class="toast-header">
        <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
        <button class="toast-close">&times;</button>
      </div>
      <div class="toast-message">${message}</div>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
    
    // Close button
    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new App();
});

// Expose electron API
window.electronAPI = {
  getTracks: () => window.electron.ipcRenderer.invoke('get-tracks'),
  getTasks: () => window.electron.ipcRenderer.invoke('get-tasks'),
  getTags: () => window.electron.ipcRenderer.invoke('get-tags'),
  scanFolder: () => window.electron.ipcRenderer.invoke('scan-folder'),
  generateIdea: (prompt) => window.electron.ipcRenderer.invoke('generate-idea', prompt),
  startVoiceInput: () => window.electron.ipcRenderer.invoke('start-voice-input')
};
