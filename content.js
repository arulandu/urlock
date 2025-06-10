// Listen for URL changes from client-side routing
let lastUrl = location.href;

// Create a MutationObserver to watch for URL changes
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    console.log('URL changed to:', location.href);
    // Notify the background script about the URL change
    chrome.runtime.sendMessage({ type: 'urlChanged', url: location.href });
  }
});

// Start observing the document with the configured parameters
observer.observe(document, { subtree: true, childList: true });

// Also listen for popstate events (browser back/forward)
window.addEventListener('popstate', () => {
  console.log('popstate event, new URL:', location.href);
  chrome.runtime.sendMessage({ type: 'urlChanged', url: location.href });
});

// Listen for pushState and replaceState
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;

history.pushState = function() {
  originalPushState.apply(this, arguments);
  console.log('pushState, new URL:', location.href);
  chrome.runtime.sendMessage({ type: 'urlChanged', url: location.href });
};

history.replaceState = function() {
  originalReplaceState.apply(this, arguments);
  console.log('replaceState, new URL:', location.href);
  chrome.runtime.sendMessage({ type: 'urlChanged', url: location.href });
}; 