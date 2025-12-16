// Background service worker for handling messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Messages are now handled by content script directly
  // This file can be kept for future use or removed
  return false;
});

