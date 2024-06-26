import React, { useState } from 'react';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Histogram from './Histogram';
import ReportTable from './ReportTable';
import Filters from '../Filters/Filters';
import { sendAnalyticsEvent } from '../../utils/google-analytics';
import StatisticsTable from './StatisticsTable'; // Добавьте этот импорт

function ThroughputChart() {
  const [showTable, setShowTable] = useState(false);
  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { throughputData } = useChartDataContext();

  console.log('throughputData', throughputData);

  const handleTableChange = (event) => {
    setShowTable(event.target.checked);

    sendAnalyticsEvent('throughput_report_interacted', {
      action: 'Toggle',
      label: 'Throughput Report Toggled',
    });
  };

  return (
    <div>
      <Histogram
        histogramData={throughputData}
        xAxisLabel="Throughput"
        yAxisLabel="Number of Tasks"
      />
      <br />
      <Filters />
      <br />
      <StatisticsTable throughputData={throughputData} />
      <br />
      <label htmlFor="showTable">
        <input id="showTable" type="checkbox" checked={showTable} onChange={handleTableChange} />
        Show report as table
      </label>
      {showTable && <ReportTable histogramData={throughputData} jiraBaseUrl={jiraBaseUrl} />}
    </div>
  );
}

export default ThroughputChart;
