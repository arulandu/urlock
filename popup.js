// Pattern management
class PatternManager {
  constructor() {
    this.patterns = [];
    this.globalRedirectUrl = '';
    this.currentPatternId = null;
    this.initializeEventListeners();
    this.loadPatterns();
  }

  initializeEventListeners() {
    // Add Pattern button
    document.getElementById('addPatternBtn').addEventListener('click', () => this.showModal());

    // Modal form
    document.getElementById('patternForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.savePattern();
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => this.hideModal());

    // Import/Export buttons
    document.getElementById('exportBtn').addEventListener('click', () => this.exportPatterns());
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', (e) => this.importPatterns(e));
  }

  async loadPatterns() {
    try {
      const result = await chrome.storage.sync.get(['patterns', 'globalRedirectUrl']);
      this.patterns = result.patterns || [];
      this.globalRedirectUrl = result.globalRedirectUrl || '';
      this.renderPatterns();
    } catch (error) {
      this.showError('Failed to load patterns');
    }
  }

  async savePatterns() {
    try {
      await chrome.storage.sync.set({ 
        patterns: this.patterns,
        globalRedirectUrl: this.globalRedirectUrl
      });
    } catch (error) {
      this.showError('Failed to save patterns');
    }
  }

  showModal(patternId = null) {
    this.currentPatternId = patternId;
    const modal = document.getElementById('patternModal');
    const form = document.getElementById('patternForm');
    const title = document.getElementById('modalTitle');

    if (patternId) {
      const pattern = this.patterns.find(p => p.id === patternId);
      if (pattern) {
        form.pattern.value = pattern.pattern;
        form.enabled.checked = pattern.enabled;
        title.textContent = 'Edit Pattern';
      }
    } else {
      form.reset();
      title.textContent = 'Add Pattern';
    }

    // Always show the current global redirect URL
    form.redirectUrl.value = this.globalRedirectUrl;

    modal.classList.add('show');
  }

  hideModal() {
    const modal = document.getElementById('patternModal');
    modal.classList.remove('show');
    this.currentPatternId = null;
  }

  async savePattern() {
    const form = document.getElementById('patternForm');
    const pattern = form.pattern.value.trim();
    const redirectUrl = form.redirectUrl.value.trim();
    const enabled = form.enabled.checked;

    if (!this.validatePattern(pattern, redirectUrl)) {
      return;
    }

    // Update global redirect URL
    this.globalRedirectUrl = redirectUrl;

    const patternData = {
      id: this.currentPatternId || crypto.randomUUID(),
      pattern,
      enabled,
      createdAt: this.currentPatternId ? this.patterns.find(p => p.id === this.currentPatternId).createdAt : Date.now(),
      updatedAt: Date.now()
    };

    if (this.currentPatternId) {
      const index = this.patterns.findIndex(p => p.id === this.currentPatternId);
      if (index !== -1) {
        this.patterns[index] = patternData;
      }
    } else {
      this.patterns.push(patternData);
    }

    await this.savePatterns();
    this.renderPatterns();
    this.hideModal();
  }

  validatePattern(pattern, redirectUrl) {
    try {
      new URL(redirectUrl);
    } catch {
      this.showError('Invalid redirect URL');
      return false;
    }

    if (!pattern) {
      this.showError('Pattern cannot be empty');
      return false;
    }

    return true;
  }

  async deletePattern(patternId) {
    if (confirm('Are you sure you want to delete this pattern?')) {
      this.patterns = this.patterns.filter(p => p.id !== patternId);
      await this.savePatterns();
      this.renderPatterns();
    }
  }

  async togglePattern(patternId) {
    const pattern = this.patterns.find(p => p.id === patternId);
    if (pattern) {
      pattern.enabled = !pattern.enabled;
      pattern.updatedAt = Date.now();
      await this.savePatterns();
      this.renderPatterns();
    }
  }

  renderPatterns() {
    const patternList = document.getElementById('patternList');
    patternList.innerHTML = '';

    this.patterns.forEach((pattern, index) => {
      const patternItem = document.createElement('div');
      patternItem.className = `pattern-item ${pattern.enabled ? '' : 'disabled'}`;
      patternItem.innerHTML = `
        <div class="pattern-info">
          <div class="pattern-url" title="${pattern.pattern}">${pattern.pattern}</div>
        </div>
        <div class="pattern-actions">
          <button class="icon-btn" title="${pattern.enabled ? 'Disable' : 'Enable'}">
            <span class="material-icons">${pattern.enabled ? 'toggle_on' : 'toggle_off'}</span>
          </button>
          <button class="icon-btn" title="Edit">
            <span class="material-icons">edit</span>
          </button>
          <button class="icon-btn" title="Delete">
            <span class="material-icons">delete</span>
          </button>
        </div>
      `;

      // Add event listeners
      const toggleBtn = patternItem.querySelector('.icon-btn:nth-child(1)');
      const editBtn = patternItem.querySelector('.icon-btn:nth-child(2)');
      const deleteBtn = patternItem.querySelector('.icon-btn:nth-child(3)');

      toggleBtn.addEventListener('click', () => {
        this.patterns[index].enabled = !this.patterns[index].enabled;
        this.savePatterns();
        this.renderPatterns();
      });

      editBtn.addEventListener('click', () => {
        this.showModal(pattern.id);
      });

      deleteBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete this pattern?')) {
          this.patterns.splice(index, 1);
          this.savePatterns();
          this.renderPatterns();
        }
      });

      patternList.appendChild(patternItem);
    });
  }

  exportPatterns() {
    const data = {
      version: '1.0',
      patterns: this.patterns,
      globalRedirectUrl: this.globalRedirectUrl,
      exportedAt: Date.now()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urlock-patterns.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async importPatterns(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.patterns || !Array.isArray(data.patterns)) {
        throw new Error('Invalid import file format');
      }

      // Validate each pattern
      for (const pattern of data.patterns) {
        if (!this.validatePattern(pattern.pattern, data.globalRedirectUrl)) {
          throw new Error('Invalid pattern data in import file');
        }
      }

      this.patterns = data.patterns;
      this.globalRedirectUrl = data.globalRedirectUrl || '';
      await this.savePatterns();
      this.renderPatterns();
      this.showSuccess('Patterns imported successfully');
    } catch (error) {
      this.showError('Failed to import patterns: ' + error.message);
    }

    // Reset file input
    event.target.value = '';
  }

  showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').appendChild(errorDiv);
    setTimeout(() => errorDiv.remove(), 3000);
  }

  showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.querySelector('.container').appendChild(successDiv);
    setTimeout(() => successDiv.remove(), 3000);
  }
}

// Initialize the pattern manager when the popup loads
document.addEventListener('DOMContentLoaded', () => {
  new PatternManager();
}); 