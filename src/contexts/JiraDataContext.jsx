import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { fetchBoardConfig, fetchCFDData } from '../services/jiraAPI';
import { debugLog } from '../utils/utils';

const JiraDataContext = createContext();

export function JiraDataProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [rapidView, setRapidView] = useState('');
  const [boardConfig, setBoardConfig] = useState(null);
  const [cfdData, setCFDData] = useState(null);
  const [filters, setFilters] = useState([]);
  const [allSwimlanes, setAllSwimlanes] = useState([]);
  const [activeSwimlanes, setActiveSwimlanes] = useState([]);

  useEffect(() => {
    debugLog('Retrieving from sessionStorage');
    const storedData = JSON.parse(sessionStorage.getItem('jira-data-graph'));

    if (storedData) {
      debugLog('Data retrieved from sessionStorage: ', storedData);
      debugLog('SessionStorage jiraOriginalUrl:', storedData.jiraOriginalUrl);
      debugLog('SessionStorage rapidView:', storedData.rapidView);
      if (storedData.jiraOriginalUrl)
        setJiraBaseUrl(storedData.jiraOriginalUrl);
      if (storedData.rapidView) setRapidView(storedData.rapidView);
      debugLog('Stored jiraOriginalUrl & rapidView in state');
    } else {
      debugLog('Requesting from background.js if no sessionStorage data');
      chrome.runtime.sendMessage(
        { type: 'getJiraOriginalUrlForTab' },
        (response) => {
          debugLog('Response from background.js:', response);
          if (response && response.jiraOriginalUrl) {
            const url = new URL(response.jiraOriginalUrl);
            const rapidViewParam = url.searchParams.get('rapidView');
            sessionStorage.setItem(
              'jira-data-graph',
              JSON.stringify({
                jiraOriginalUrl: response.jiraOriginalUrl,
                rapidView: rapidViewParam,
              })
            );

            setJiraBaseUrl(response.jiraOriginalUrl);
            if (rapidViewParam) {
              setRapidView(rapidViewParam);
            }
          }
        }
      );
    }
  }, []);

  useEffect(() => {
    async function loadBoardConfig() {
      debugLog('Initiating loadBoardConfig', { jiraBaseUrl, rapidView });
      if (!jiraBaseUrl || !rapidView) {
        debugLog('Data insufficient for board config load', {
          jiraBaseUrl,
          rapidView,
        });
        return;
      }

      setIsLoading(true);

      const boardData = await fetchBoardConfig(jiraBaseUrl, rapidView);
      debugLog('Board config loaded', boardData);
      setBoardConfig(boardData);
      debugLog('Set boardConfig', boardData);

      const newAllSwimlanes = boardData.swimlanesConfig.swimlanes || [];
      setAllSwimlanes(newAllSwimlanes);
      setActiveSwimlanes(newAllSwimlanes.map((s) => s.id));
    }

    loadBoardConfig();
  }, [jiraBaseUrl, rapidView]);

  // Загрузка данных CFD
  const loadCFDData = useCallback(async () => {
    debugLog('Initiating loadCFDData', {
      jiraBaseUrl,
      rapidView,
      boardConfig,
      filters,
      activeSwimlanes,
    });
    if (!jiraBaseUrl || !rapidView || !boardConfig || !activeSwimlanes.length) {
      debugLog('Data insufficient for CFD load', {
        jiraBaseUrl,
        rapidView,
        boardConfig,
        activeSwimlanes,
      });
      return;
    }

    setIsLoading(true);

    const cfdDataLoaded = await fetchCFDData(
      jiraBaseUrl,
      boardConfig,
      rapidView,
      activeSwimlanes,
      filters
    );
    debugLog('CFD data loaded', cfdDataLoaded);
    setCFDData(cfdDataLoaded);
    debugLog('Set cfdData');

    setIsLoading(false);
  }, [boardConfig, filters, activeSwimlanes]);

  useEffect(() => {
    debugLog('loadCFDData post filters & swimlanes update', {
      filters,
      activeSwimlanes,
    });
    loadCFDData(); // Перезагрузка данных CFD с новыми фильтрами
  }, [filters, activeSwimlanes]);

  const updateActiveSwimlanes = (activeSwimlaneIds) => {
    debugLog('updateActiveSwimlanes', { activeSwimlaneIds });
    setActiveSwimlanes(activeSwimlaneIds);
  };

  const updateUserFilters = useCallback((newFilters) => {
    debugLog('Updating filters', newFilters);
    setFilters(newFilters);
    debugLog('Filters updated');
  }, []);

  const contextValue = useMemo(
    () => ({
      isLoading,
      jiraBaseUrl,
      rapidView,
      boardConfig,
      cfdData,
      filters,
      allSwimlanes,
      activeSwimlanes,
      updateActiveSwimlanes,
      loadCFDData,
      updateUserFilters,
    }),
    [
      isLoading,
      jiraBaseUrl,
      rapidView,
      boardConfig,
      cfdData,
      filters,
      allSwimlanes,
      activeSwimlanes,
    ]
  );

  return (
    <JiraDataContext.Provider value={contextValue}>
      {children}
    </JiraDataContext.Provider>
  );
}

export const useJiraDataContext = () => useContext(JiraDataContext);
