import React, { useState } from 'react';

import useJiraData from '../../contexts/JiraDataContext';
import Histogram from './Histogram';
import Filters from '../Filters/Filters';
import ReportTable from './ReportTable';
import StatisticsTable from './StatisticsTable';
import { sendAnalyticsEvent } from '../../utils/google-analytics';

function LeadTimeChart({
  histogramData,
  selectedColumns,
  setSelectedColumns,
  timeframeFrom,
  setTimeframeFrom,
  timeframeTo,
  setTimeframeTo,
  allFilters,
  activeFilters,
  toggleFilter,
  allSwimlanes,
  activeSwimlanes,
  updateActiveSwimlanes,
  resolution,
  setResolution,
}) {
  const [showTable, setShowTable] = useState(false);

  const { cfdData, jiraBaseUrl } = useJiraData();

  const handleTableChange = (event) => {
    setShowTable(event.target.checked);

    sendAnalyticsEvent('histogram_report_interacted', {
      action: 'Toggle',
      label: 'Histogram Report Toggled',
    });
  };

  if (!cfdData || !cfdData.columns) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <Histogram histogramData={histogramData} />

      <br />

      <Filters
        selectedColumns={selectedColumns}
        setSelectedColumns={setSelectedColumns}
        columns={cfdData.columns}
        timeframeFrom={timeframeFrom}
        setTimeframeFrom={setTimeframeFrom}
        timeframeTo={timeframeTo}
        setTimeframeTo={setTimeframeTo}
        allFilters={allFilters}
        activeFilters={activeFilters}
        toggleFilter={toggleFilter}
        setResolution={setResolution}
        resolution={resolution}
        allSwimlanes={allSwimlanes}
        activeSwimlanes={activeSwimlanes}
        updateActiveSwimlanes={updateActiveSwimlanes}
      />

      <br />

      <StatisticsTable histogramData={histogramData} />

      <br />

      <label htmlFor="showTable">
        <input
          id="showTable"
          type="checkbox"
          checked={showTable}
          onChange={handleTableChange}
        />
        Show report as table
      </label>

      {showTable && (
        <ReportTable histogramData={histogramData} jiraBaseUrl={jiraBaseUrl} />
      )}
    </div>
  );
}

export default LeadTimeChart;
