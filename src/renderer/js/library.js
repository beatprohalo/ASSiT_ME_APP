// Library specific functionality
class Library {
  constructor(app) {
    this.app = app;
    this.currentView = 'grid'; // 'grid' or 'list'
    this.searchQuery = '';
    this.filters = {
      genre: '',
      mood: '',
      format: '',
      tags: []
    };
    this.sortBy = 'created_at';
    this.sortOrder = 'desc';
    
    this.setupEventListeners();
    this.setupFilters();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.applyFilters();
      });
    }

    // Filter controls
    const genreFilter = document.getElementById('genreFilter');
    const moodFilter = document.getElementById('moodFilter');
    
    if (genreFilter) {
      genreFilter.addEventListener('change', (e) => {
        this.filters.genre = e.target.value;
        this.applyFilters();
      });
    }
    
    if (moodFilter) {
      moodFilter.addEventListener('change', (e) => {
        this.filters.mood = e.target.value;
        this.applyFilters();
      });
    }

    // Track card interactions
    document.addEventListener('click', (e) => {
      if (e.target.closest('.track-card')) {
        const trackId = e.target.closest('.track-card').dataset.trackId;
        this.showTrackDetails(trackId);
      }
    });

    // Track action buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('.track-action-btn')) {
        e.stopPropagation();
        const action = e.target.closest('.track-action-btn').title;
        const trackId = e.target.closest('.track-card').dataset.trackId;
        this.handleTrackAction(action, trackId);
      }
    });
  }

  setupFilters() {
    this.populateGenreFilter();
    this.populateMoodFilter();
  }

  populateGenreFilter() {
    const genreFilter = document.getElementById('genreFilter');
    if (!genreFilter) return;

    const genres = [...new Set(this.app.tracks.map(track => track.genre).filter(Boolean))];
    genres.sort();

    genreFilter.innerHTML = `
      <option value="">All Genres</option>
      ${genres.map(genre => `<option value="${genre}">${genre}</option>`).join('')}
    `;
  }

  populateMoodFilter() {
    const moodFilter = document.getElementById('moodFilter');
    if (!moodFilter) return;

    const moods = [...new Set(this.app.tracks.map(track => track.mood).filter(Boolean))];
    moods.sort();

    moodFilter.innerHTML = `
      <option value="">All Moods</option>
      ${moods.map(mood => `<option value="${mood}">${mood}</option>`).join('')}
    `;
  }

  applyFilters() {
    let filteredTracks = [...this.app.tracks];

    // Apply search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filteredTracks = filteredTracks.filter(track => 
        (track.title && track.title.toLowerCase().includes(query)) ||
        (track.artist && track.artist.toLowerCase().includes(query)) ||
        (track.album && track.album.toLowerCase().includes(query)) ||
        (track.file_name && track.file_name.toLowerCase().includes(query))
      );
    }

    // Apply genre filter
    if (this.filters.genre) {
      filteredTracks = filteredTracks.filter(track => track.genre === this.filters.genre);
    }

    // Apply mood filter
    if (this.filters.mood) {
      filteredTracks = filteredTracks.filter(track => track.mood === this.filters.mood);
    }

    // Apply format filter
    if (this.filters.format) {
      filteredTracks = filteredTracks.filter(track => track.format === this.filters.format);
    }

    // Apply tags filter
    if (this.filters.tags.length > 0) {
      filteredTracks = filteredTracks.filter(track => {
        const trackTags = track.tags ? track.tags.split(',').map(tag => tag.trim()) : [];
        return this.filters.tags.some(filterTag => trackTags.includes(filterTag));
      });
    }

    // Apply sorting
    filteredTracks.sort((a, b) => {
      let aValue = a[this.sortBy];
      let bValue = b[this.sortBy];

      if (this.sortBy === 'created_at' || this.sortBy === 'updated_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    this.renderTracks(filteredTracks);
  }

  renderTracks(tracks) {
    const tracksGrid = document.getElementById('tracksGrid');
    if (!tracksGrid) return;

    if (tracks.length === 0) {
      tracksGrid.innerHTML = `
        <div class="empty-state">
          <p>No tracks found matching your criteria.</p>
        </div>
      `;
      return;
    }

    tracksGrid.innerHTML = tracks.map(track => `
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
            <button class="track-action-btn" title="More">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
          </div>
        </div>
        <div class="track-details">
          <div class="track-detail">
            <div class="track-detail-label">Duration</div>
            <div class="track-detail-value">${track.duration ? this.app.formatDuration(track.duration) : 'Unknown'}</div>
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
            <div class="progress-percentage">${this.app.calculateTrackProgress(track.id)}%</div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.app.calculateTrackProgress(track.id)}%"></div>
          </div>
        </div>
      </div>
    `).join('');
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

  showTrackDetails(trackId) {
    const track = this.app.tracks.find(t => t.id == trackId);
    if (!track) return;

    // TODO: Open track details modal
    console.log('Show track details:', track);
  }

  handleTrackAction(action, trackId) {
    const track = this.app.tracks.find(t => t.id == trackId);
    if (!track) return;

    switch (action) {
      case 'Play':
        this.playTrack(track);
        break;
      case 'Edit':
        this.editTrack(track);
        break;
      case 'More':
        this.showTrackMenu(track);
        break;
    }
  }

  playTrack(track) {
    // TODO: Implement track playback
    console.log('Playing track:', track);
    this.app.showToast(`Playing ${track.title || track.file_name}`, 'success');
  }

  editTrack(track) {
    // TODO: Open track edit modal
    console.log('Editing track:', track);
  }

  showTrackMenu(track) {
    // TODO: Show context menu for track
    console.log('Track menu for:', track);
  }

  setView(view) {
    this.currentView = view;
    // TODO: Update UI to reflect view change
  }

  setSorting(sortBy, order = 'desc') {
    this.sortBy = sortBy;
    this.sortOrder = order;
    this.applyFilters();
  }

  clearFilters() {
    this.searchQuery = '';
    this.filters = {
      genre: '',
      mood: '',
      format: '',
      tags: []
    };
    
    // Reset filter controls
    const searchInput = document.getElementById('searchInput');
    const genreFilter = document.getElementById('genreFilter');
    const moodFilter = document.getElementById('moodFilter');
    
    if (searchInput) searchInput.value = '';
    if (genreFilter) genreFilter.value = '';
    if (moodFilter) moodFilter.value = '';
    
    this.applyFilters();
  }
}

// Initialize library when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.library = new Library(window.app);
  }
});
