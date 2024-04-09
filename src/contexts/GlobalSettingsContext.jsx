// contexts/GlobalSettingsContext.jsx
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const GlobalSettingsContext = createContext();

export const useGlobalSettings = () => useContext(GlobalSettingsContext);

const getStorageKey = (jiraDomain, rapidView) => `settings-${jiraDomain}-${rapidView}`;

const today = new Date();
const defTimeframeFrom = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
const defTimeframeTo = new Date(today.getFullYear(), today.getMonth(), today.getDate());

const initialSettings = {
  dateFormat: 'default',
  selectedTimeframe: 'past_month',
  timeframeFrom: defTimeframeFrom.toISOString().split('T')[0],
  timeframeTo: defTimeframeTo.toISOString().split('T')[0],
  resolution: 'day',
  selectedColumns: [],
  filters: [],
  activeSwimlanes: [],
};

export function GlobalSettingsProvider({ children }) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [rapidView, setRapidView] = useState('');

  const [dateFormat, setDateFormat] = useState(initialSettings.dateFormat);
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialSettings.selectedTimeframe);
  const [timeframeFrom, setTimeframeFrom] = useState(initialSettings.timeframeFrom);
  const [timeframeTo, setTimeframeTo] = useState(initialSettings.timeframeTo);
  const [resolution, setResolution] = useState(initialSettings.resolution);
  const [selectedColumns, setSelectedColumns] = useState(initialSettings.selectedColumns); // @TODO rename active
  const [allColumns, setAllColumns] = useState([]);
  const [activeColumns, setActiveColumns] = useState([]);
  const [filters, setFilters] = useState(initialSettings.filters);
  const [activeSwimlanes, setActiveSwimlanes] = useState(initialSettings.activeSwimlanes);

  const loadSettings = (jiraDomain, rapidView) => {
    const storageKey = getStorageKey(jiraDomain, rapidView);
    const savedSettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
    setDateFormat(savedSettings.dateFormat || initialSettings.dateFormat);
    setSelectedTimeframe(savedSettings.selectedTimeframe || initialSettings.selectedTimeframe);
    setTimeframeFrom(savedSettings.timeframeFrom || initialSettings.timeframeFrom);
    setTimeframeTo(savedSettings.timeframeTo || initialSettings.timeframeTo);
    setResolution(savedSettings.resolution || initialSettings.resolution);
    setSelectedColumns(savedSettings.selectedColumns || initialSettings.selectedColumns);
    setFilters(savedSettings.filters || initialSettings.filters);
    setActiveSwimlanes(savedSettings.activeSwimlanes || initialSettings.activeSwimlanes);
  };

  const saveSettings = (jiraDomain, rapidView) => {
    const storageKey = getStorageKey(jiraDomain, rapidView);
    const settingsToSave = {
      dateFormat,
      selectedTimeframe,
      timeframeFrom,
      timeframeTo,
      resolution,
      selectedColumns,
      filters,
      activeSwimlanes,
    };
    localStorage.setItem(storageKey, JSON.stringify(settingsToSave));
  };

  useEffect(() => {
    if (jiraBaseUrl && rapidView) {
      const jiraDomain = new URL(jiraBaseUrl).hostname;
      loadSettings(jiraDomain, rapidView);
    }
  }, [jiraBaseUrl, rapidView]);

  useEffect(() => {
    if (jiraBaseUrl && rapidView) {
      const jiraDomain = new URL(jiraBaseUrl).hostname;
      saveSettings(jiraDomain, rapidView);
    }
  }, [
    dateFormat,
    selectedTimeframe,
    timeframeFrom,
    timeframeTo,
    resolution,
    selectedColumns,
    filters,
    activeSwimlanes,
  ]);

  useEffect(() => {
    // Функция для обновления активных колонок
    const updateActiveColumns = () => {
      // Проверка, не пустой ли массив allColumns
      if (allColumns && allColumns.length > 0) {
        // Создание массива активных колонок с индексами на основе порядка в allColumns
        const newActiveColumns = allColumns
          .filter((column) => selectedColumns.includes(column.name))
          .map((column) => ({ name: column.name, index: allColumns.indexOf(column) }));

        setActiveColumns(newActiveColumns); // Обновление состояния активных колонок
      }
    };

    // Вызов функции обновления активных колонок
    updateActiveColumns();
  }, [selectedColumns, allColumns]);

  const contextValue = useMemo(
    () => ({
      dateFormat,
      setDateFormat,
      selectedTimeframe,
      setSelectedTimeframe,
      timeframeFrom,
      setTimeframeFrom,
      timeframeTo,
      setTimeframeTo,
      jiraBaseUrl,
      setJiraBaseUrl,
      rapidView,
      setRapidView,
      resolution,
      setResolution,
      selectedColumns,
      setSelectedColumns,
      allColumns,
      setAllColumns,
      activeColumns,
      setActiveColumns,
      filters,
      setFilters,
      activeSwimlanes,
      setActiveSwimlanes,
    }),
    [
      dateFormat,
      setDateFormat,
      selectedTimeframe,
      setSelectedTimeframe,
      timeframeFrom,
      setTimeframeFrom,
      timeframeTo,
      setTimeframeTo,
      jiraBaseUrl,
      setJiraBaseUrl,
      rapidView,
      setRapidView,
      resolution,
      setResolution,
      selectedColumns,
      setSelectedColumns,
      allColumns,
      setAllColumns,
      activeColumns,
      setActiveColumns,
      filters,
      setFilters,
      activeSwimlanes,
      setActiveSwimlanes,
    ]
  );

  return (
    <GlobalSettingsContext.Provider value={contextValue}>{children}</GlobalSettingsContext.Provider>
  );
}
