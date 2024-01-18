import { debugError } from '../utils/utils';

const makeApiUrl = (baseUrl, path, params = new URLSearchParams()) => {
  const url = new URL(path, baseUrl);
  params.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url.toString();
};

const getCFDParams = (boardConfig, activeSwimlanes) => {
  if (!boardConfig || !boardConfig.rapidListConfig) {
    debugError(
      'Board config is not loaded or has incorrect structure',
      boardConfig
    );
    return '';
  }

  const swimlaneIds = activeSwimlanes
    .map((swimlaneId) => `swimlaneId=${swimlaneId}`)
    .join('&');
  const columnIds = boardConfig.rapidListConfig.mappedColumns
    .map((column) => `columnId=${column.id}`)
    .join('&');
  return `${swimlaneIds}&${columnIds}`;
};

export const fetchBoardConfig = async (baseUrl, rapidViewId) => {
  try {
    const params = new URLSearchParams({ rapidViewId });
    const url = makeApiUrl(
      baseUrl,
      `/rest/greenhopper/1.0/rapidviewconfig/editmodel.json`,
      params
    );
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    debugError('Error fetching board config:', error);
    return {};
  }
};

export const fetchCFDData = async (
  baseUrl,
  boardConfig,
  rapidViewId,
  activeSwimlanes,
  filters = []
) => {
  try {
    const additionalParams = getCFDParams(boardConfig, activeSwimlanes);
    const params = new URLSearchParams(additionalParams);
    filters.forEach((filter) => {
      params.append(`quickFilterId`, filter);
    });
    params.append('rapidViewId', rapidViewId);
    const url = makeApiUrl(
      baseUrl,
      `/rest/greenhopper/1.0/rapid/charts/cumulativeflowdiagram.json`,
      params
    );

    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    debugError('Error fetching CFD data:', error);
    return {};
  }
};
