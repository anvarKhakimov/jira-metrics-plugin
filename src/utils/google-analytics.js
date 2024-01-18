import { isDebug, debugLog, debugError } from './utils';

const GA_ENDPOINT = 'https://www.google-analytics.com/mp/collect';
const GA_DEBUG_ENDPOINT = 'https://www.google-analytics.com/debug/mp/collect';
const MEASUREMENT_ID = 'G-MX7ZNTVL5R';
const API_SECRET = 'cPSWiKZkS7qTfRMlnZu6SQ';
const DEFAULT_ENGAGEMENT_TIME_IN_MSEC = 100;
const SESSION_EXPIRATION_IN_MIN = 30;

export async function getOrCreateClientId() {
  try {
    const clientIdKey = 'jiraMetricsPluginClientId';
    const result = await chrome.storage.sync.get(clientIdKey);
    const clientId = result[clientIdKey];

    if (!clientId) {
      const uuid = crypto.randomUUID();
      await chrome.storage.sync.set({ [clientIdKey]: uuid });
    }

    return clientId;
  } catch (error) {
    debugError('Error in getOrCreateClientId:', error); // Вывод ошибок в консоль
    throw error; // Переброс ошибки для дальнейшей обработки, если это необходимо
  }
}

function getSessionData() {
  const sessionData = sessionStorage.getItem('sessionData');
  return sessionData ? JSON.parse(sessionData) : null;
}

function setSessionData(sessionData) {
  sessionStorage.setItem('sessionData', JSON.stringify(sessionData));
}

export async function getOrCreateSessionId() {
  let sessionData = getSessionData();
  const currentTimeInMs = Date.now();

  if (sessionData && sessionData.timestamp) {
    const durationInMin = (currentTimeInMs - sessionData.timestamp) / 60000;

    if (durationInMin > SESSION_EXPIRATION_IN_MIN) {
      sessionData = null;
    } else {
      sessionData.timestamp = currentTimeInMs;
      setSessionData(sessionData);
    }
  }

  if (!sessionData) {
    sessionData = {
      session_id: currentTimeInMs.toString(),
      timestamp: currentTimeInMs,
    };
    setSessionData(sessionData);
  }

  return sessionData.session_id;
}

export async function sendAnalyticsEvent(eventName, eventParams) {
  debugLog('sendAnalyticsEvent', eventName, eventParams);

  const updatedEventParams = { ...eventParams }; // Создаем копию eventParams

  if (!updatedEventParams.session_id) {
    updatedEventParams.session_id = await getOrCreateSessionId();
  }
  if (!updatedEventParams.engagement_time_msec) {
    updatedEventParams.engagement_time_msec = DEFAULT_ENGAGEMENT_TIME_IN_MSEC;
  }

  try {
    await fetch(
      `${
        isDebug ? GA_DEBUG_ENDPOINT : GA_ENDPOINT
      }?measurement_id=${MEASUREMENT_ID}&api_secret=${API_SECRET}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: await getOrCreateClientId(),
          events: [
            {
              name: eventName,
              params: {
                ...updatedEventParams,
              },
            },
          ],
        }),
      }
    );
  } catch (error) {
    debugError('Google Analytics request failed with an exception:', error);
  }
}

export async function sendPageViewEvent(
  pageTitle,
  pageLocation,
  additionalParams = {}
) {
  return sendAnalyticsEvent('page_view', {
    page_title: pageTitle,
    page_location: pageLocation,
    ...additionalParams,
  });
}
