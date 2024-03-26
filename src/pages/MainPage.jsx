import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AppBar, Tabs, Tab, Box, Typography } from '@mui/material';
import { useJiraDataContext } from '../contexts/JiraDataContext';
import { ChartDataProvider } from '../contexts/ChartDataContext';
import LeadTimeChart from '../components/LeadTimeChart/LeadTimeChart';
import FullScreenLoader from '../components/FullScreenLoader';
import PredictabilityChart from '../components/PredictabilityChart/PredictabilityChart';
import TasksTable from '../components/TasksTable/TasksTable';
import CumulativeDiagram from '../components/CumulativeDiagram/CumulativeDiagram';
import AgingChart from '../components/AgingChart/AgingChart';
import { sendPageViewEvent } from '../utils/google-analytics';
import { isDebug } from '../utils/utils';

function TabPanel(props) {
  const { children, value, index } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
    >
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export default function MainPage() {
  const { isLoading, boardConfig, cfdData, updateUserFilters } = useJiraDataContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabNames = ['leadtime', 'agingChart', 'cfd', 'predictability', 'tasks'];
  const tabParam = searchParams.get('tab');
  const [value, setValue] = useState(Math.max(tabNames.indexOf(tabParam), 0));

  useEffect(() => {
    // Создаем новый объект URLSearchParams для перестройки параметров с tab на первом месте
    const newSearchParams = new URLSearchParams();
    newSearchParams.set('tab', tabNames[value]); // Добавляем параметр tab первым
    searchParams.forEach((val, key) => {
      if (key !== 'tab') newSearchParams.set(key, val); // Добавляем остальные параметры
    });
    setSearchParams(newSearchParams, { replace: true });
  }, [value, searchParams, setSearchParams]);

  const handleChange = async (event, newValue) => {
    setValue(newValue);

    switch (newValue) {
      case 0:
        await sendPageViewEvent('Lead Time Histogram', 'leadTime');
        break;
      case 1:
        await sendPageViewEvent('Aging Chart', 'agingChart');
        break;
      case 2:
        await sendPageViewEvent('Cumulative Flow Diagram', 'cfd');
        break;
      case 3:
        await sendPageViewEvent('Predictability Chart', 'predictability');
        break;
      case 4:
        await sendPageViewEvent('Tasks Table', 'tasks');
        break;
      default:
        break;
    }
  };

  if (!cfdData || !cfdData.columns) {
    return <FullScreenLoader isLoading />;
  }

  return (
    <ChartDataProvider
      boardConfig={boardConfig}
      cfdData={cfdData}
      updateUserFilters={updateUserFilters}
    >
      <FullScreenLoader isLoading={isLoading} />
      <AppBar
        position="static"
        color="default"
        style={{ backgroundColor: isDebug ? '#fac7c7' : undefined }}
        elevation={0}
      >
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Lead Time" />
          <Tab label="Aging Chart" />
          <Tab label="CFD" />
          <Tab label="Predictability" />
          <Tab label="Tasks Table" />
        </Tabs>
      </AppBar>
      {boardConfig && boardConfig.name && (
        <Box my={2}>
          <Typography variant="h5" align="left">
            {boardConfig.name}
          </Typography>
        </Box>
      )}
      <TabPanel value={value} index={0}>
        <LeadTimeChart />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <AgingChart />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <CumulativeDiagram />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <PredictabilityChart />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <TasksTable />
      </TabPanel>
    </ChartDataProvider>
  );
}
