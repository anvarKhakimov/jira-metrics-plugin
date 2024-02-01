import React, { useState } from 'react';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Histogram from './Histogram';
import Filters from '../Filters/Filters';
import ReportTable from './ReportTable';
import StatisticsTable from './StatisticsTable';
import { sendAnalyticsEvent } from '../../utils/google-analytics';

function LeadTimeChart() {
  const [showTable, setShowTable] = useState(false);

  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { histogramData } = useChartDataContext();

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
      <Filters />
      <br />
      <StatisticsTable histogramData={histogramData} />
      <br />
      <label htmlFor="showTable">
        <input id="showTable" type="checkbox" checked={showTable} onChange={handleTableChange} />
        Show report as table
      </label>
      {showTable && <ReportTable histogramData={histogramData} jiraBaseUrl={jiraBaseUrl} />}
    </div>
  );
}

export default LeadTimeChart;
