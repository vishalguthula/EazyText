// Background service worker for EasyText Chrome Extension

// Enable side panel toggle on extension toolbar icon click
chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((err) => {
      console.error("Side panel setup error:", err);
    });
  }
});

// Relay video updates between content script and side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "YOUTUBE_NAVIGATED") {
    // Notify sidepanel if open
    chrome.runtime.sendMessage({
      type: "VIDEO_CHANGED",
      videoDetails: message.videoDetails
    }).catch(() => {
      // Sidepanel might not be open yet, ignore
    });
  }
  return true;
});

