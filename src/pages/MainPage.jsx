import React from 'react';
import { AppBar, Tabs, Tab, Box, Typography } from '@mui/material';
import useJiraData from '../contexts/JiraDataContext';
import useChartData from '../hooks/useChartData';
import LeadTimeChart from '../components/LeadTimeChart/LeadTimeChart';
import TasksList from '../components/LeadTimeChart/TasksList';
import FullScreenLoader from '../components/FullScreenLoader';
import PredictabilityChart from '../components/PredictabilityChart/PredictabilityChart';
import TasksTable from '../components/TasksTable/TasksTable';
import ControlChart from '../components/ControlChart/ControlChart';
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
  const {
    isLoading,
    boardConfig,
    cfdData,
    allSwimlanes,
    activeSwimlanes,
    updateActiveSwimlanes,
    updateUserFilters,
  } = useJiraData();

  const {
    tasks,
    displayedTasks,
    selectedColumns,
    histogramData,
    setSelectedColumns,
    timeframeFrom,
    setTimeframeFrom,
    timeframeTo,
    setTimeframeTo,
    allFilters,
    activeFilters,
    toggleFilter,
    resolution,
    setResolution,
  } = useChartData(boardConfig, cfdData, updateUserFilters);

  const [value, setValue] = React.useState(0);

  const handleChange = async (event, newValue) => {
    setValue(newValue);

    // Отправляем событие в зависимости от выбранной вкладки
    switch (newValue) {
      case 0:
        await sendPageViewEvent('Lead Time Histogram', 'leadTime');
        break;
      case 1:
        await sendPageViewEvent('Predictability Chart', 'predictability');
        break;
      case 2:
        await sendPageViewEvent('Tasks Table', 'tasks');
        break;
      default:
        // Действие по умолчанию, если newValue не соответствует ни одному из случаев
        break;
    }
  };

  return (
    <div>
      <FullScreenLoader isLoading={isLoading} />
      <AppBar
        position="static"
        color="default"
        style={{ backgroundColor: isDebug ? '#fac7c7' : undefined }}
        elevation={0}
      >
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Lead Time Histogram" />
          <Tab label="Predictability Chart" />
          <Tab label="Tasks Table" />
          {/* <Tab label="Control Chart" /> */}
          {/* <Tab label="Tasks List" /> */}
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
        <LeadTimeChart
          histogramData={histogramData}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          timeframeFrom={timeframeFrom}
          setTimeframeFrom={setTimeframeFrom}
          timeframeTo={timeframeTo}
          setTimeframeTo={setTimeframeTo}
          allFilters={allFilters}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          allSwimlanes={allSwimlanes}
          activeSwimlanes={activeSwimlanes}
          updateActiveSwimlanes={updateActiveSwimlanes}
          resolution={resolution}
          setResolution={setResolution}
        />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <PredictabilityChart
          tasks={tasks}
          columns={cfdData ? cfdData.columns : []}
          selectedColumns={selectedColumns}
          setSelectedColumns={setSelectedColumns}
          timeframeFrom={timeframeFrom}
          setTimeframeFrom={setTimeframeFrom}
          timeframeTo={timeframeTo}
          setTimeframeTo={setTimeframeTo}
          allFilters={allFilters}
          activeFilters={activeFilters}
          toggleFilter={toggleFilter}
          allSwimlanes={allSwimlanes}
          activeSwimlanes={activeSwimlanes}
          updateActiveSwimlanes={updateActiveSwimlanes}
          resolution={resolution}
          setResolution={setResolution}
        />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <TasksTable
          displayedTasks={displayedTasks}
          cfdData={cfdData}
          selectedColumns={selectedColumns}
        />
      </TabPanel>
      <TabPanel value={value} index={3}>
        <ControlChart
          displayedTasks={displayedTasks}
          cfdData={cfdData}
          selectedColumns={selectedColumns}
          timeframeFrom={timeframeFrom}
          timeframeTo={timeframeTo}
        />
      </TabPanel>
      <TabPanel value={value} index={4}>
        <TasksList
          displayedTasks={displayedTasks}
          cfdData={cfdData}
          selectedColumns={selectedColumns}
        />
      </TabPanel>
    </div>
  );
}
