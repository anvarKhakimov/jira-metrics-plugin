const tabsData = {};

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'openDataPage') {
    const jiraOriginalUrl = sender.tab.url;
    const { rapidView } = message;
    const pluginPageURL = `index.html?rapidView=${rapidView}`;

    chrome.tabs.create({ url: pluginPageURL }, (tab) => {
      tabsData[tab.id] = { jiraOriginalUrl };
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getJiraOriginalUrlForTab') {
    const dataForTab = tabsData[sender.tab.id];
    if (dataForTab) {
      sendResponse(dataForTab);
      delete tabsData[sender.tab.id]; // Очистить временные данные после их передачи
    }
  }
  return true; // для асинхронного ответа
});
