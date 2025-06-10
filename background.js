// URL pattern matching and redirection
class URLPatternMatcher {
  constructor() {
    this.patterns = [];
    this.globalRedirectUrl = '';
    this.initialize();
  }

  async initialize() {
    // Load patterns from storage
    await this.loadPatterns();

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        if (changes.patterns) {
          this.patterns = changes.patterns.newValue;
        }
        if (changes.globalRedirectUrl) {
          this.globalRedirectUrl = changes.globalRedirectUrl.newValue;
        }
      }
    });

    // Listen for navigation events
    chrome.webNavigation.onBeforeNavigate.addListener(
      (details) => {
        console.log('onBeforeNavigate', details);
        this.handleNavigation(details);
      },
      { url: [{ schemes: ['http', 'https'] }] }
    );

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        const status = tab.status
        const url = tab.url
      if (status === 'loading' && url) {
        console.log('tab updated', tab);
        this.handleNavigation({ url, tabId });
      }
    });
  }

  async loadPatterns() {
    try {
      const result = await chrome.storage.sync.get(['patterns', 'globalRedirectUrl']);
      this.patterns = result.patterns || [];
      this.globalRedirectUrl = result.globalRedirectUrl || '';
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  }

  handleNavigation(details) {
    if (!details.url) return;

    try {
      const url = new URL(details.url);
      const matchingPattern = this.findMatchingPattern(url);

      if (matchingPattern) {
        if (this.globalRedirectUrl) {
          console.log('Redirecting to global URL:', this.globalRedirectUrl);
          chrome.tabs.update(details.tabId, { url: this.globalRedirectUrl });
        } else {
          console.warn('No global redirect URL set.');
        }
      }
    } catch (error) {
      // Handle error if needed
    }
  }

  findMatchingPattern(url) {
    return this.patterns.find(pattern => {
      if (!pattern.enabled) return false;
      return this.matchesPattern(url, pattern.pattern);
    });
  }

  matchesPattern(url, pattern) {
    // Convert pattern to regex
    const regexPattern = this.patternToRegex(pattern);
    return regexPattern.test(url.hostname + url.pathname);
  }

  patternToRegex(pattern) {
    // Escape special regex characters except * and ?
    const escapedPattern = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    
    // Convert * wildcards to regex pattern
    const regexPattern = escapedPattern
      .replace(/\*/g, '.*')  // * matches any characters
      .replace(/\?/g, '.');  // ? matches any single character

    return new RegExp(`^${regexPattern}$`);
  }
}

// Initialize the URL pattern matcher
new URLPatternMatcher(); 