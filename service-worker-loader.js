const DASHBOARD_MENU_ID = "aico-open-dashboard";

function registerContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: DASHBOARD_MENU_ID,
      title: "Open AICO Dashboard",
      contexts: ["action"],
    });
  });
}

chrome.runtime.onInstalled.addListener(registerContextMenu);
chrome.runtime.onStartup.addListener(registerContextMenu);

chrome.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId === DASHBOARD_MENU_ID) {
    chrome.tabs.create({ url: chrome.runtime.getURL("src/dashboard/index.html") });
  }
});
