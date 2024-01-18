import React, { useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MainPage from './pages/MainPage';
import { JiraDataProvider } from './contexts/JiraDataContext';
import {
  getOrCreateSessionId,
  sendAnalyticsEvent,
} from './utils/google-analytics';

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
      <JiraDataProvider>
        <MainPage />
      </JiraDataProvider>
    </ThemeProvider>
  );
}

export default App;
