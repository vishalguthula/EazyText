import { VideoDetails } from "../../types";

export async function getCurrentYouTubeVideo(): Promise<VideoDetails | null> {
  return new Promise((resolve) => {
    if (typeof chrome === "undefined" || !chrome.tabs) {
      resolve(null);
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].id) {
        resolve(null);
        return;
      }

      const activeTab = tabs[0];
      if (!activeTab.url || !activeTab.url.includes("youtube.com/watch") || activeTab.id === undefined) {
        resolve(null);
        return;
      }

      chrome.tabs.sendMessage(activeTab.id, { action: "GET_VIDEO_INFO" }, (response) => {
        if (chrome.runtime.lastError || !response || !response.success) {
          // Fallback to URL parsing if content script hasn't responded yet
          try {
            const urlObj = new URL(activeTab.url || "");
            const videoId = urlObj.searchParams.get("v");
            if (videoId) {
              resolve({
                videoId,
                title: activeTab.title ? activeTab.title.replace(" - YouTube", "") : "YouTube Video",
                channel: "YouTube Channel",
                url: activeTab.url || "",
                duration: "0:00",
                thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        } else {
          resolve(response.videoDetails);
        }
      });
    });
  });
}

export function seekYouTubePlayer(seconds: number): void {
  if (typeof chrome === "undefined" || !chrome.tabs) return;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0] && tabs[0].id !== undefined) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "SEEK_TO", seconds }).catch(() => {});
    }
  });
}

