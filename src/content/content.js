// eslint-disable-next-line no-console
console.log('JiraMetricsPlugin content script running.');

function getRapidViewParam() {
  const url = new URL(window.location.href);

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

function addButton() {
  if (document.getElementById('trigger-jira-data-graph')) {
    return;
  }

  const buttonLocation = document.querySelector('#ghx-modes-tools');

  if (buttonLocation) {
    const button = document.createElement('button');
    button.innerHTML = 'Analyze Metrics';
    button.id = 'trigger-jira-data-graph';
    button.className = 'jmp-button';
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

function addSidebarButton() {
  if (document.querySelector('a[data-label="Analyze Metrics"]')) {
    return;
  }

  const reportsLink = document.querySelector('a[data-label="Reports"]');

  if (reportsLink) {
    const sidebarLocation = reportsLink.closest('li');

    if (sidebarLocation) {
      const listElem = document.createElement('li');
      listElem.innerHTML = `<a class="aui-nav-item" data-label="Analyze Metrics" href="#" aria-describedby="aui-tooltip">
        <span aria-hidden="true" class="aui-icon aui-icon-small aui-iconfont-graph-bar"></span>
        <span class="aui-nav-item-label" title="Analyze Metrics">Analyze Metrics</span></a>`;

      sidebarLocation.after(listElem);

      listElem.querySelector('a').addEventListener('click', () => {
        if (chrome.runtime && typeof chrome.runtime.sendMessage === 'function') {
          const rapidView = getRapidViewParam();
          const currentPageURL = window.location.href;
          chrome.runtime.sendMessage({
            type: 'openDataPage',
            rapidView,
            currentPageURL,
          });
        } else {
          console.error('chrome.runtime.sendMessage is not available.');
        }
      });
    }
  }
}

function addCloudButton() {
  if (document.getElementById('trigger-jira-data-graph')) {
    return;
  }

  const buttonLocation = document.querySelector(
    '[data-testid="software-board.header.title.container"]'
  );

  if (buttonLocation) {
    const button = document.createElement('button');
    button.innerHTML = 'Analyze Metrics';
    button.id = 'trigger-jira-data-graph';
    button.className = 'jmp-button';

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
        console.error('chrome.runtime.sendMessage is not available.');
      }
    });

    buttonLocation.appendChild(button);
  }
}

setInterval(addButton, 1000);
setInterval(addSidebarButton, 1000);
setInterval(addCloudButton, 1000);
