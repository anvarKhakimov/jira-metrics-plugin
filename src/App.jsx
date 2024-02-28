import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { GlobalSettingsProvider } from './contexts/GlobalSettingsContext';
import { JiraDataProvider } from './contexts/JiraDataContext';
import MainPage from './pages/MainPage';
import { getOrCreateSessionId, sendAnalyticsEvent } from './utils/google-analytics';

import './styles/App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  useEffect(() => {
    sendAnalyticsEvent('plugin_interacted', {
      action: 'Open',
      label: 'Plugin Opened',
    });

    window.addEventListener('click', getOrCreateSessionId);

    return () => {
      window.removeEventListener('click', getOrCreateSessionId);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <GlobalSettingsProvider>
        <JiraDataProvider>
          <MainPage />
        </JiraDataProvider>
      </GlobalSettingsProvider>
    </ThemeProvider>
  );
}

export default App;
