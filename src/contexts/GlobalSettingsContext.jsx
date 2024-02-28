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
};

export function GlobalSettingsProvider({ children }) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [rapidView, setRapidView] = useState('');

  const [dateFormat, setDateFormat] = useState(initialSettings.dateFormat);
  const [selectedTimeframe, setSelectedTimeframe] = useState(initialSettings.selectedTimeframe);
  const [timeframeFrom, setTimeframeFrom] = useState(initialSettings.timeframeFrom);
  const [timeframeTo, setTimeframeTo] = useState(initialSettings.timeframeTo);

  const loadSettings = (jiraDomain, rapidView) => {
    const storageKey = getStorageKey(jiraDomain, rapidView);
    const savedSettings = JSON.parse(localStorage.getItem(storageKey) || '{}');
    setDateFormat(savedSettings.dateFormat || initialSettings.dateFormat);
    setSelectedTimeframe(savedSettings.selectedTimeframe || initialSettings.selectedTimeframe);
    setTimeframeFrom(savedSettings.timeframeFrom || initialSettings.timeframeFrom);
    setTimeframeTo(savedSettings.timeframeTo || initialSettings.timeframeTo);
  };

  const saveSettings = (jiraDomain, rapidView) => {
    const storageKey = getStorageKey(jiraDomain, rapidView);
    const settingsToSave = {
      dateFormat,
      selectedTimeframe,
      timeframeFrom,
      timeframeTo,
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
  }, [dateFormat, selectedTimeframe, timeframeFrom, timeframeTo]);

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
    ]
  );

  return (
    <GlobalSettingsContext.Provider value={contextValue}>{children}</GlobalSettingsContext.Provider>
  );
}
