const tabsData = {};

function getRapidViewParamFromUrl(url) {
  const rapidViewParam = url.searchParams.get('rapidView');
  if (rapidViewParam) {
    return rapidViewParam;
  }

  const pathSegments = url.pathname.split('/');
  const boardIndex = pathSegments.indexOf('boards');
  if (boardIndex !== -1 && boardIndex < pathSegments.length - 1) {
    return pathSegments[boardIndex + 1];
  }

  return 'default';
}

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'openDataPage') {
    const jiraOriginalUrl = sender.tab.url;
    const urlObj = new URL(jiraOriginalUrl);
    const { protocol, hostname, port } = urlObj;
    const { rapidView } = message;
    const pluginPageURL = `index.html?protocol=${protocol}&host=${hostname}${port ? `&port=${port}` : ''}&rapidView=${rapidView}`;

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
      delete tabsData[sender.tab.id];
    }
  }
  return true;
});

chrome.action.onClicked.addListener((tab) => {
  const jiraUrlPatterns = [
    /^http:\/\/.*\/secure\/RapidBoard\.jspa\?.*$/,
    /^https:\/\/.*\/secure\/RapidBoard\.jspa\?.*$/,
    /^https:\/\/.*\/jira\/software\/projects\/.*\/boards\/.*$/,
    /^https:\/\/.*\/jira\/software\/c\/projects\/.*$/,
  ];

  const urlMatchesPattern = jiraUrlPatterns.some((pattern) => pattern.test(tab.url));

  if (urlMatchesPattern) {
    const url = new URL(tab.url);
    const rapidView = getRapidViewParamFromUrl(url);

    const pluginPageURL = `index.html?protocol=${url.protocol}&host=${url.hostname}${url.port ? `&port=${url.port}` : ''}&rapidView=${rapidView}`;

    chrome.tabs.create({ url: pluginPageURL }, (newTab) => {
      tabsData[newTab.id] = { jiraOriginalUrl: tab.url };
    });
  }
});

function updateIconState(tabId, changeInfo, tab) {
  const jiraUrlPatterns = [
    /^http:\/\/.*\/secure\/RapidBoard\.jspa\?.*$/,
    /^https:\/\/.*\/secure\/RapidBoard\.jspa\?.*$/,
    /^https:\/\/.*\/jira\/software\/projects\/.*\/boards\/.*$/,
    /^https:\/\/.*\/jira\/software\/c\/projects\/.*$/,
  ];

  const urlMatchesPattern = jiraUrlPatterns.some((pattern) => pattern.test(tab.url));

  if (urlMatchesPattern) {
    chrome.action.enable(tabId);
    chrome.action.setTitle({ tabId, title: 'Analyze Jira Metrics' });
  } else {
    chrome.action.disable(tabId);
    chrome.action.setTitle({ tabId, title: 'Plugin is not available on this page' });
  }
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  updateIconState(tabId, changeInfo, tab);
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    updateIconState(activeInfo.tabId, {}, tab);
  });
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      updateIconState(tab.id, {}, tab);
    });
  });
});
