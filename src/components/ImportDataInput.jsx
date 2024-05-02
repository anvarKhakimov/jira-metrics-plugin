import React, { useContext } from 'react';
import { useJiraDataContext } from '../contexts/JiraDataContext';
import { useGlobalSettings } from '../contexts/GlobalSettingsContext';

export default function ImportDataInput() {
  const { setBoardConfig, setCFDData, setAllSwimlanes } = useJiraDataContext();
  const {
    setDateFormat,
    setSelectedTimeframe,
    setTimeframeFrom,
    setTimeframeTo,
    setJiraBaseUrl,
    setRapidView,
    setResolution,
    setSelectedColumns,
    setAllColumns,
    setActiveColumns,
    setFilters,
    setActiveSwimlanes,
    setPercentileSelections,
    setCompletionCriteria,
    setDataSourceOrigin,
  } = useGlobalSettings();

  const handleImport = (event) => {
    const fileReader = new FileReader();
    fileReader.readAsText(event.target.files[0], 'UTF-8');
    fileReader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        // Здесь можно добавить дополнительную валидацию данных
        // setBoardConfig(importedData.boardConfig);
        setDataSourceOrigin('file');
        setCFDData(importedData.cfdData);
        setAllSwimlanes(importedData.allSwimlanes);
        setDateFormat(importedData.dateFormat);
        setSelectedTimeframe(importedData.selectedTimeframe);
        setTimeframeFrom(importedData.timeframeFrom);
        setTimeframeTo(importedData.timeframeTo);
        setJiraBaseUrl(importedData.jiraBaseUrl);
        setRapidView(importedData.rapidView);
        setResolution(importedData.resolution);
        setSelectedColumns(importedData.selectedColumns);
        setAllColumns(importedData.allColumns);
        setActiveColumns(importedData.activeColumns);
        setFilters(importedData.filters);
        setActiveSwimlanes(importedData.activeSwimlanes);
        setPercentileSelections(importedData.percentileSelections);
        setCompletionCriteria(importedData.completionCriteria);
      } catch (error) {
        console.error('Ошибка при импорте данных: ', error);
        // Обработка ошибок и уведомление пользователя
      }
    };
  };

  return <input type="file" onChange={handleImport} />;
}
