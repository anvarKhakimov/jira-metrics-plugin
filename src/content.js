// eslint-disable-next-line no-console
console.log('JiraMetricsPlugin content script running.');

function getRapidViewParam() {
  const url = new URL(window.location.href);
  return url.searchParams.get('rapidView');
}

function addButton() {
  if (document.getElementById('trigger-jira-data-graph')) {
    return;
  }

  const buttonLocation = document.querySelector('#ghx-modes-tools');

  if (buttonLocation) {
    const button = document.createElement('button');
    button.innerText = 'Show Graph';
    button.id = 'trigger-jira-data-graph';
    button.className = 'aui-button';
    button.style.backgroundColor = '#deebff';
    button.addEventListener('click', () => {
      if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
        const rapidView = getRapidViewParam();
        const currentPageURL = window.location.href;
        chrome.runtime.sendMessage({
          type: 'openDataPage',
          rapidView,
          currentPageURL,
        });
      } else {
        // eslint-disable-next-line no-console
        console.error('chrome.runtime.sendMessage is not available.');
      }
    });

    buttonLocation.prepend(button);
  }
}

setInterval(addButton, 1000);
