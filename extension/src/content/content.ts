// Content script injected into YouTube pages

function extractVideoDetails() {
  const url = window.location.href;
  const urlParams = new URLSearchParams(window.location.search);
  const videoId = urlParams.get("v");

  if (!videoId) {
    return null;
  }

  // Extract title
  let title = "";
  const titleEl = document.querySelector(
    "h1.ytd-watch-metadata yt-formatted-string, h1.title, #title h1, .ytp-title-link"
  );
  if (titleEl && titleEl.textContent) {
    title = titleEl.textContent.trim();
  } else {
    title = document.title.replace(" - YouTube", "").trim();
  }

  // Extract channel name
  let channel = "";
  const channelEl = document.querySelector(
    "#channel-name a, #owner #text a, ytd-channel-name a"
  );
  if (channelEl && channelEl.textContent) {
    channel = channelEl.textContent.trim();
  }

  // Extract duration
  let duration = "";
  const durationEl = document.querySelector(".ytp-time-duration");
  if (durationEl && durationEl.textContent) {
    duration = durationEl.textContent.trim();
  }

  // Extract description
  let description = "";
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc && metaDesc.getAttribute("content")) {
    description = metaDesc.getAttribute("content") || "";
  } else {
    const descEl = document.querySelector(
      "#description-inline-expander, #description-text, ytd-watch-metadata #description"
    );
    if (descEl && descEl.textContent) {
      description = descEl.textContent.trim();
    }
  }

  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return {
    videoId,
    title: title || "YouTube Video",
    channel: channel || "YouTube Channel",
    url,
    duration: duration || "0:00",
    thumbnail,
    description
  };
}

let lastVideoId = "";

function notifyIfVideoChanged() {
  const details = extractVideoDetails();
  if (details && details.videoId !== lastVideoId) {
    lastVideoId = details.videoId;
    try {
      chrome.runtime.sendMessage({
        type: "YOUTUBE_NAVIGATED",
        videoDetails: details
      });
    } catch (e) {
      // Extension context invalidated
    }
  }
}

// Watch for YouTube SPA navigation events
window.addEventListener("yt-navigate-finish", () => {
  setTimeout(notifyIfVideoChanged, 400);
});

// Periodic check for URL changes in case SPA event doesn't fire
setInterval(() => {
  notifyIfVideoChanged();
}, 1200);

// Listen to incoming messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "GET_VIDEO_INFO") {
    const details = extractVideoDetails();
    sendResponse({ success: !!details, videoDetails: details });
  } else if (request.action === "SEEK_TO") {
    const seconds = request.seconds;
    const videoEl = document.querySelector("video") as HTMLVideoElement | null;
    if (videoEl) {
      videoEl.currentTime = seconds;
      videoEl.play().catch(() => {});
      sendResponse({ success: true, currentTime: seconds });
    } else {
      sendResponse({ success: false, error: "Video element not found" });
    }
  }
  return true;
});
