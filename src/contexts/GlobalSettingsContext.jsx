import React, { createContext, useContext, useState, useEffect } from 'react';

const GlobalSettingsContext = createContext();

export const useGlobalSettings = () => useContext(GlobalSettingsContext);

const getStorageKey = (jiraDomain, rapidView) => `settings-${jiraDomain}-${rapidView}`;

export function GlobalSettingsProvider({ children }) {
  const [jiraBaseUrl, setJiraBaseUrl] = useState('');
  const [rapidView, setRapidView] = useState('');
  const [settings, setSettings] = useState({});

  useEffect(() => {
    if (jiraBaseUrl && rapidView) {
      const jiraDomain = new URL(jiraBaseUrl).hostname;
      const storageKey = getStorageKey(jiraDomain, rapidView);
      const savedSettings = localStorage.getItem(storageKey);
      setSettings(savedSettings ? JSON.parse(savedSettings) : {});
    }
  }, [jiraBaseUrl, rapidView]);

  // useEffect(() => {
  //   if (jiraBaseUrl && rapidView) {
  //     const jiraDomain = new URL(jiraBaseUrl).hostname;
  //     const storageKey = getStorageKey(jiraDomain, rapidView);
  //     localStorage.setItem(storageKey, JSON.stringify(settings));
  //   }
  // }, [settings, jiraBaseUrl, rapidView]);

  const updateSettings = (newSettings) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }));
  };

  const contextValue = {
    settings,
    jiraBaseUrl,
    rapidView,
    updateSettings,
    setJiraBaseUrl,
    setRapidView,
  };

  return (
    <GlobalSettingsContext.Provider value={contextValue}>{children}</GlobalSettingsContext.Provider>
  );
}
