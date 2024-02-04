import React from 'react';
import { AppBar, Tabs, Tab, Box, Typography } from '@mui/material';
import { useJiraDataContext } from '../contexts/JiraDataContext';
import { ChartDataProvider } from '../contexts/ChartDataContext';
import LeadTimeChart from '../components/LeadTimeChart/LeadTimeChart';
import FullScreenLoader from '../components/FullScreenLoader';
import PredictabilityChart from '../components/PredictabilityChart/PredictabilityChart';
import TasksTable from '../components/TasksTable/TasksTable';
import CumulativeDiagram from '../components/CumulativeDiagram/CumulativeDiagram';
import ControlChart2 from '../components/ControlChart/ControlChart2'
import { sendPageViewEvent } from '../utils/google-analytics';
import { isDebug } from '../utils/utils';

function TabPanel(props) {
  const { children, value, index } = props;

  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box p={3}>{children}</Box>}
    </div>
  );
}

export default function MainPage() {
  const { isLoading, boardConfig, cfdData, updateUserFilters } = useJiraDataContext();

  const [value, setValue] = React.useState(0);

  const handleChange = async (event, newValue) => {
    setValue(newValue);

    // Отправляем событие в зависимости от выбранной вкладки
    switch (newValue) {
      case 0:
        await sendPageViewEvent('Lead Time Histogram', 'leadTime');
        break;
      case 1:
        await sendPageViewEvent('Cumulative Flow Diagram', 'cfd');
        break;
      case 2:
        await sendPageViewEvent('Predictability Chart', 'predictability');
        break;
      case 3:
        await sendPageViewEvent('Tasks Table', 'tasks');
        break;
      default:
        // Действие по умолчанию, если newValue не соответствует ни одному из случаев
        break;
    }
  };

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
          <Tab label="CFD" />
          <Tab label="Predictability" />
          <Tab label="Tasks Table" />
          <Tab label="Control Chart" />
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
        <CumulativeDiagram />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <PredictabilityChart />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <TasksTable />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <ControlChart2 />
      </TabPanel>
    </ChartDataProvider>
  );
}
