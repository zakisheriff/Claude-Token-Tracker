chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["tokenEstimate", "usagePayload"], (result) => {
    if (!result.tokenEstimate) {
      chrome.storage.local.set({
        tokenEstimate: { tokens: 0, updatedAt: null },
      });
    }
    if (!result.usagePayload) {
      chrome.storage.local.set({ usagePayload: null });
    }
  });
});
