import React, { createContext, useState, useContext, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useGlobalSettings } from './GlobalSettingsContext';
import { fetchBoardConfig, fetchCFDData } from '../services/jiraAPI';
import { debugError, debugLog } from '../utils/utils';

const JiraDataContext = createContext();

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export function JiraDataProvider({ children }) {
  const { settings, updateSettings, jiraBaseUrl, setJiraBaseUrl, rapidView, setRapidView } =
    useGlobalSettings();
  const [isLoading, setIsLoading] = useState(false);
  const [boardConfig, setBoardConfig] = useState(null);
  const [cfdData, setCFDData] = useState(null);
  const [filters, setFilters] = useState([]);
  const [allSwimlanes, setAllSwimlanes] = useState([]);
  const [activeSwimlanes, setActiveSwimlanes] = useState([]);

  const query = useQuery();
  const hostname = query.get('host');
  const port = query.get('port');
  const baseUrl = port ? `https://${hostname}:${port}` : `https://${hostname}`;
  const rapidViewParam = query.get('rapidView');

  useEffect(() => {
    if (hostname !== '' && rapidViewParam !== '') {
      setJiraBaseUrl(baseUrl);
      setRapidView(rapidViewParam);
    } else {
      // @todo дописать показ ошибки
      setIsLoading(true);
      debugError('Hostname or rapidView are empty.', { hostname, rapidViewParam });
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

  return <JiraDataContext.Provider value={contextValue}>{children}</JiraDataContext.Provider>;
}

export const useJiraDataContext = () => useContext(JiraDataContext);
