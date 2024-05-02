import React from 'react';
import { useJiraDataContext } from '../contexts/JiraDataContext';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';

export default function ExportDataButton() {
  const { boardConfig, cfdData, allSwimlanes } = useJiraDataContext();
  const {
    jiraBaseUrl,
    rapidView,
    dateFormat,
    selectedTimeframe,
    timeframeFrom,
    timeframeTo,
    resolution,
    selectedColumns,
    allColumns,
    activeColumns,
    filters,
    activeSwimlanes,
    percentileSelections,
    completionCriteria,
  } = useGlobalSettings();

  const handleExport = () => {
    const dataToExport = {
      // boardConfig,
      cfdData,
      allSwimlanes,
      jiraBaseUrl,
      rapidView,
      dateFormat,
      selectedTimeframe,
      timeframeFrom,
      timeframeTo,
      resolution,
      selectedColumns,
      allColumns,
      activeColumns,
      filters,
      activeSwimlanes,
      percentileSelections,
      completionCriteria,
    };
    const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport))}`;
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute('href', dataStr);
    downloadAnchorNode.setAttribute('download', 'jira-plugin-data.json');
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <button type="button" onClick={handleExport}>
      Экспортировать данные
    </button>
  );
}
