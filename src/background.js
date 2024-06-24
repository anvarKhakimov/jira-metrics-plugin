const tabsData = {};

const jiraUrlPatterns = [
  /^https?:\/\/.*\/secure\/RapidBoard\.jspa\?.*$/,
  /^https:\/\/.*\/jira\/software\/projects\/.*\/boards\/.*$/,
  /^https:\/\/.*\/jira\/software\/c\/projects\/.*$/,
];

function getJiraHost(url) {
  const urlObj = new URL(url);
  const serverIndex = urlObj.pathname.indexOf('/secure/RapidBoard.jspa');
  return serverIndex !== -1
    ? url.substring(0, url.indexOf(urlObj.pathname) + serverIndex)
    : `${urlObj.protocol}//${urlObj.hostname}`;
}

function getRapidViewParamFromUrl(url) {
  const rapidViewParam = url.searchParams.get('rapidView');
  if (rapidViewParam) return rapidViewParam;

  const pathSegments = url.pathname.split('/');
  const boardIndex = pathSegments.indexOf('boards');
  return boardIndex !== -1 && boardIndex < pathSegments.length - 1
    ? pathSegments[boardIndex + 1]
    : 'default';
}

function createPluginPage(jiraOriginalUrl, rapidView) {
  const jiraHost = getJiraHost(jiraOriginalUrl);
  const pluginPageURL = `index.html?host=${encodeURIComponent(jiraHost)}&rapidView=${rapidView}`;

  chrome.tabs.create({ url: pluginPageURL }, (tab) => {
    tabsData[tab.id] = { jiraOriginalUrl };
  });
}

function isJiraUrl(url) {
  return jiraUrlPatterns.some((pattern) => pattern.test(url));
}

function updateIconState(tabId, tab) {
  const isJira = isJiraUrl(tab.url);
  chrome.action[isJira ? 'enable' : 'disable'](tabId);
  chrome.action.setTitle({
    tabId,
    title: isJira ? 'Analyze Jira Metrics' : 'Plugin is not available on this page',
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'openDataPage') {
    createPluginPage(sender.tab.url, message.rapidView);
  } else if (message.type === 'getJiraOriginalUrlForTab') {
    const dataForTab = tabsData[sender.tab.id];
    if (dataForTab) {
      sendResponse(dataForTab);
      delete tabsData[sender.tab.id];
    }
  }
  return true;
});

chrome.action.onClicked.addListener((tab) => {
  if (isJiraUrl(tab.url)) {
    const url = new URL(tab.url);
    const rapidView = getRapidViewParamFromUrl(url);
    createPluginPage(url.href, rapidView);
  }
});

chrome.tabs.onUpdated.addListener((tabId, _, tab) => updateIconState(tabId, tab));

chrome.tabs.onActivated.addListener(({ tabId }) => {
  chrome.tabs.get(tabId, (tab) => updateIconState(tabId, tab));
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => updateIconState(tab.id, tab));
  });
});
