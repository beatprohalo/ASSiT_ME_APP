// Creative panel specific functionality
class Creative {
  constructor(app) {
    this.app = app;
    this.isRecording = false;
    this.generatedIdeas = [];
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Idea generation
    const generateIdeaBtn = document.getElementById('generateIdeaBtn');
    if (generateIdeaBtn) {
      generateIdeaBtn.addEventListener('click', () => this.generateIdea());
    }

    // Voice input
    const voiceInputBtn = document.getElementById('voiceInputBtn');
    if (voiceInputBtn) {
      voiceInputBtn.addEventListener('click', () => this.toggleVoiceInput());
    }

    // Idea prompt input
    const ideaPrompt = document.getElementById('ideaPrompt');
    if (ideaPrompt) {
      ideaPrompt.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
          this.generateIdea();
        }
      });
    }
  }

  async generateIdea() {
    const prompt = document.getElementById('ideaPrompt').value;
    if (!prompt.trim()) {
      this.app.showToast('Please enter a prompt', 'warning');
      return;
    }

    const generateBtn = document.getElementById('generateIdeaBtn');
    const originalText = generateBtn.innerHTML;
    
    // Show loading state
    generateBtn.innerHTML = `
      <div class="spinner"></div>
      Generating...
    `;
    generateBtn.disabled = true;

    try {
      const result = await window.electronAPI.generateIdea(prompt);
      
      if (result.success) {
        const idea = {
          id: Date.now(),
          prompt: prompt,
          content: result.idea,
          timestamp: new Date().toISOString(),
          tags: this.extractTags(result.idea)
        };
        
        this.generatedIdeas.unshift(idea);
        this.updateIdeasList();
        this.clearPrompt();
        
        this.app.showToast('Idea generated successfully', 'success');
      } else {
        this.app.showToast('Error generating idea', 'error');
      }
    } catch (error) {
      console.error('Error generating idea:', error);
      this.app.showToast('Error generating idea', 'error');
    } finally {
      // Reset button state
      generateBtn.innerHTML = originalText;
      generateBtn.disabled = false;
    }
  }

  async toggleVoiceInput() {
    const voiceBtn = document.getElementById('voiceInputBtn');
    
    if (this.isRecording) {
      // Stop recording
      this.isRecording = false;
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
      
      this.app.showToast('Voice input stopped', 'info');
    } else {
      // Start recording
      this.isRecording = true;
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
          this.app.showToast('Voice input started - speak your idea', 'success');
          
          // Simulate voice input processing (replace with actual implementation)
          setTimeout(() => {
            this.processVoiceInput("Dark R&B loop at 100 BPM with heavy bass");
          }, 3000);
        } else {
          this.app.showToast('Error starting voice input', 'error');
          this.toggleVoiceInput(); // Reset state
        }
      } catch (error) {
        console.error('Error starting voice input:', error);
        this.app.showToast('Error starting voice input', 'error');
        this.toggleVoiceInput(); // Reset state
      }
    }
  }

  processVoiceInput(transcript) {
    // Update the prompt with voice input
    const ideaPrompt = document.getElementById('ideaPrompt');
    if (ideaPrompt) {
      ideaPrompt.value = transcript;
    }
    
    this.app.showToast('Voice input processed', 'success');
    this.toggleVoiceInput(); // Stop recording
  }

  updateIdeasList() {
    const ideasList = document.querySelector('.ideas-list');
    if (!ideasList) return;

    if (this.generatedIdeas.length === 0) {
      ideasList.innerHTML = `
        <div class="empty-state">
          <p>No ideas generated yet.</p>
        </div>
      `;
      return;
    }

    ideasList.innerHTML = this.generatedIdeas.map(idea => `
      <div class="idea-item" data-idea-id="${idea.id}">
        <div class="idea-header">
          <div class="idea-title">Generated Idea</div>
          <div class="idea-timestamp">${this.formatTimestamp(idea.timestamp)}</div>
        </div>
        <div class="idea-content">${idea.content}</div>
        <div class="idea-tags">
          ${idea.tags.map(tag => `
            <div class="idea-tag">${tag}</div>
          `).join('')}
        </div>
        <div class="idea-actions">
          <button class="idea-action-btn primary" data-idea-id="${idea.id}">
            Use This Idea
          </button>
          <button class="idea-action-btn" data-idea-id="${idea.id}">
            Save
          </button>
          <button class="idea-action-btn" data-idea-id="${idea.id}">
            Share
          </button>
        </div>
      </div>
    `).join('');

    // Add event listeners for idea actions
    this.setupIdeaActions();
  }

  setupIdeaActions() {
    document.addEventListener('click', (e) => {
      if (e.target.closest('.idea-action-btn')) {
        const action = e.target.textContent.trim();
        const ideaId = e.target.dataset.ideaId;
        this.handleIdeaAction(action, ideaId);
      }
    });
  }

  handleIdeaAction(action, ideaId) {
    const idea = this.generatedIdeas.find(i => i.id == ideaId);
    if (!idea) return;

    switch (action) {
      case 'Use This Idea':
        this.useIdea(idea);
        break;
      case 'Save':
        this.saveIdea(idea);
        break;
      case 'Share':
        this.shareIdea(idea);
        break;
    }
  }

  useIdea(idea) {
    // Copy idea content to prompt for further editing
    const ideaPrompt = document.getElementById('ideaPrompt');
    if (ideaPrompt) {
      ideaPrompt.value = idea.content;
    }
    
    this.app.showToast('Idea loaded into prompt', 'success');
  }

  saveIdea(idea) {
    // TODO: Save idea to database
    console.log('Saving idea:', idea);
    this.app.showToast('Idea saved', 'success');
  }

  shareIdea(idea) {
    // TODO: Implement sharing functionality
    console.log('Sharing idea:', idea);
    this.app.showToast('Idea shared', 'success');
  }

  extractTags(content) {
    // Simple tag extraction based on common music terms
    const musicTerms = [
      'BPM', 'tempo', 'key', 'scale', 'chord', 'progression',
      'bass', 'drums', 'synth', 'piano', 'guitar', 'vocal',
      'dark', 'bright', 'moody', 'energetic', 'chill', 'aggressive',
      'R&B', 'hip hop', 'electronic', 'ambient', 'jazz', 'rock',
      'loop', 'beat', 'melody', 'harmony', 'rhythm'
    ];
    
    const tags = [];
    const contentLower = content.toLowerCase();
    
    musicTerms.forEach(term => {
      if (contentLower.includes(term.toLowerCase())) {
        tags.push(term);
      }
    });
    
    return tags.slice(0, 5); // Limit to 5 tags
  }

  formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  }

  clearPrompt() {
    const ideaPrompt = document.getElementById('ideaPrompt');
    if (ideaPrompt) {
      ideaPrompt.value = '';
    }
  }

  // Quick idea generation with predefined prompts
  generateQuickIdea(type) {
    const quickPrompts = {
      'dark': 'Dark atmospheric beat with heavy bass and moody synths',
      'upbeat': 'Upbeat energetic track with driving drums and bright melodies',
      'chill': 'Chill laid-back vibe with soft pads and gentle rhythm',
      'aggressive': 'Aggressive hard-hitting beat with distorted elements',
      'ambient': 'Ambient soundscape with evolving textures and minimal rhythm'
    };
    
    const prompt = quickPrompts[type];
    if (prompt) {
      const ideaPrompt = document.getElementById('ideaPrompt');
      if (ideaPrompt) {
        ideaPrompt.value = prompt;
        this.generateIdea();
      }
    }
  }
}

// Initialize creative panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (window.app) {
    window.creative = new Creative(window.app);
  }
});
