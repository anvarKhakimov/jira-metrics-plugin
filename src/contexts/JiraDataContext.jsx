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
  const {
    jiraBaseUrl,
    setJiraBaseUrl,
    rapidView,
    setRapidView,
    setAllColumns,
    filters,
    setFilters,
    activeSwimlanes,
    setActiveSwimlanes,
    dataSourceOrigin,
  } = useGlobalSettings();

  const [isLoading, setIsLoading] = useState(false);
  const [boardConfig, setBoardConfig] = useState(null);
  const [cfdData, setCFDData] = useState(null);
  const [allSwimlanes, setAllSwimlanes] = useState([]);

  const query = useQuery();
  const host = query.get('host');
  const rapidViewParam = query.get('rapidView');

  useEffect(() => {
    if (host && rapidViewParam) {
      setJiraBaseUrl(host);
      setRapidView(rapidViewParam);
    } else {
      setIsLoading(true);
      debugError('Host or rapidView are empty.', { host, rapidViewParam });
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

      if (dataSourceOrigin === 'file') {
        debugLog('Board config: Cannot load because the data source is set by file.');
        return;
      }

      setIsLoading(true);

      const boardData = await fetchBoardConfig(jiraBaseUrl, rapidView);
      debugLog('Board config loaded', boardData);
      setBoardConfig(boardData);
      debugLog('Set boardConfig', boardData);

      const newAllSwimlanes = boardData.currentViewConfig.swimlanes || [];
      setAllSwimlanes(newAllSwimlanes);

      setActiveSwimlanes((currentActiveSwimlanes) => {
        if (!currentActiveSwimlanes || currentActiveSwimlanes.length === 0) {
          return newAllSwimlanes.map((s) => s.id);
        }
        return currentActiveSwimlanes;
      });
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

    if (dataSourceOrigin === 'file') {
      debugLog('CFD: Cannot load because the data source is set by file.');
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

    setAllColumns(cfdDataLoaded.columns);

    setIsLoading(false);
  }, [boardConfig, filters, activeSwimlanes]);

  useEffect(() => {
    debugLog('loadCFDData post filters & swimlanes update', {
      filters,
      activeSwimlanes,
    });
    loadCFDData(); // Перезагрузка данных CFD с новыми фильтрами
  }, [loadCFDData, filters, activeSwimlanes]);

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
      setBoardConfig,
      setCFDData,
      setAllSwimlanes,
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
