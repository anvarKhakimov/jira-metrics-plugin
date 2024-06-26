// AgingChart.jsx

import React, { useEffect, useRef, useState, useMemo } from 'react';
import Highcharts from 'highcharts';
import AnnotationsModule from 'highcharts/modules/annotations';
import {
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  OutlinedInput,
  Checkbox,
  ListItemText,
  FormGroup,
  FormControlLabel,
} from '@mui/material';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';

import useAgingData from '../../hooks/useAgingData';
import useWipData from '../../hooks/useWipData';
import usePercentileData from '../../hooks/usePercentileData';
import useTasksInLastColumn from '../../hooks/useTasksInLastColumn';
import useColumnPercentiles from '../../hooks/useColumnPercentiles';

import Filters from '../Filters/Filters';
import ColumnPercentilesDetails from './ColumnPercentilesDetails';

import { generateJiraIssuesUrl } from '../../utils/utils';

AnnotationsModule(Highcharts);

function AgingChart() {
  const chartRef = useRef(null);
  const {
    timeframeFrom,
    timeframeTo,
    selectedColumns,
    activeColumns,
    percentileSelections,
    setPercentileSelections,
    completionCriteria,
    setCompletionCriteria,
  } = useGlobalSettings();
  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { tasks, displayedTasks } = useChartDataContext();
  const jiraDomain = new URL(jiraBaseUrl).origin;

  const [showCalculationDetails, setShowCalculationDetails] = useState(false);

  const percentilesOptions = [30, 50, 70, 85, 95];

  const handlePercentileChange = (event) => {
    setPercentileSelections(event.target.value);
  };

  const handleCompletionCriteriaChange = (event) => {
    setCompletionCriteria(event.target.value);
  };

  const handleShowCalculationDetailsChange = (event) => {
    setShowCalculationDetails(event.target.checked);
  };

  const generateAnnotationsFromPercentiles = (columnPercentiles) =>
    columnPercentiles.map((column, index) => {
      const shapes = column.segments.map((segment) => ({
        type: 'path',
        points: [
          {
            x: index - 0.5, // Начало колонки
            y: segment.from,
            xAxis: 0,
            yAxis: 0,
          },
          {
            x: index - 0.5, // Конец колонки
            y: segment.to,
            xAxis: 0,
            yAxis: 0,
          },
          {
            x: index + 0.5,
            y: segment.to,
            xAxis: 0,
            yAxis: 0,
          },
          {
            x: index + 0.5,
            y: segment.from,
            xAxis: 0,
            yAxis: 0,
          },
        ],
        stroke: 0,
        fill: segment.color, // Заливка зоны цветом сегмента
      }));

      return {
        draggable: false,
        zIndex: 0,
        shapes,
      };
    });

  const agingData = useAgingData(
    cfdData,
    activeColumns,
    tasks,
    timeframeFrom,
    timeframeTo,
    completionCriteria
  );

  const wipData = useWipData(cfdData, activeColumns, tasks, completionCriteria);

  const tasksInLastColumn = useTasksInLastColumn(activeColumns, displayedTasks, completionCriteria);

  const percentileData = usePercentileData(
    tasksInLastColumn,
    completionCriteria,
    selectedColumns,
    cfdData
  );

  const columnPercentiles = useColumnPercentiles(
    cfdData,
    activeColumns,
    tasksInLastColumn,
    completionCriteria,
    percentileSelections
  );

  const annotations = useMemo(() => {
    if (percentileSelections.length === 0) {
      return [];
    }
    const annotationsResults = generateAnnotationsFromPercentiles(columnPercentiles);

    return annotationsResults;
  }, [percentileSelections, columnPercentiles]);

  useEffect(() => {
    const chartOptions = {
      chart: {
        type: 'scatter',
        height: 600,
      },
      title: {
        text: 'Aging Chart',
        align: 'left',
      },
      xAxis: {
        categories: cfdData.columns
          .filter((col) => selectedColumns.includes(col.name))
          .map((col) => col.name),
        gridLineWidth: 1,
      },
      yAxis: {
        title: {
          text: 'Cycle Time (days)',
        },
        plotLines: percentileData,
        gridLineColor: '#f1f1f1',
      },
      annotations,
      legend: {
        enabled: false,
      },
      credits: {
        enabled: false,
      },
      series: [
        {
          type: 'scatter',
          name: 'Tasks',
          data: agingData.flatMap((column) => column.data),
          marker: {
            symbol: 'circle',
            lineWidth: 1,
            lineColor: '#90C065',
            fillColor: '#90C065',
          },
          dataLabels: {
            enabled: true,
            inside: true,
            verticalAlign: 'middle',
            align: 'center',
            style: {
              fontWeight: 'normal',
              color: 'fff',
            },
            formatter() {
              const { taskCount } = this.point;
              return taskCount > 1
                ? `<span style="stroke: none; color: #ffffff">${taskCount}</span>`
                : '';
            },
          },
        },
        {
          type: 'scatter',
          name: 'WIP',
          data: wipData,
          marker: {
            enabled: false,
          },
          dataLabels: {
            enabled: true,
            format: '{point.label}',
            y: -500,
          },
          enableMouseTracking: false,
        },
      ],
      tooltip: {
        useHTML: true,
        stickOnContact: true,
        shadow: true,
        style: {
          fontSize: '13px',
          borderColor: '#cccccc',
          borderRadius: '1px',
          padding: '30px',
          width: '300px',
        },
        formatter() {
          const tasksList = this.point.tasks.map(
            ({ taskKey, agingTime }) =>
              `<a href="${jiraDomain}/browse/${taskKey}" target="_blank">${taskKey}</a>: ${agingTime} days`
          );
          return `${tasksList.join('<br/>')}`;
        },
      },
      plotOptions: {
        scatter: {
          marker: {
            radius: 5,
            states: {
              hover: {
                enabled: true,
                lineColor: 'rgb(100,100,100)',
              },
            },
          },
          states: {
            hover: {
              marker: {
                enabled: false,
              },
            },
          },
          tooltip: {
            headerFormat: '<b>{series.name}</b><br>',
            pointFormat: '{point.x}, {point.y}',
          },
        },
      },
    };

    Highcharts.chart(chartRef.current, chartOptions);
  }, [selectedColumns, agingData, wipData, percentileData, cfdData.columns, annotations]);

  return (
    <>
      <div ref={chartRef} style={{ width: '100%' }} />
      <br />
      <Filters showResolution={false} />
      <br />
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="pace-percentiles-select-label">Pace Percentiles</InputLabel>
        <Select
          labelId="pace-percentiles-select-label"
          id="pace-percentiles-select"
          multiple
          value={percentileSelections}
          onChange={handlePercentileChange}
          input={<OutlinedInput label="Pace Percentiles" />}
          renderValue={(selected) => selected.join(', ')}
        >
          {percentilesOptions.map((percentile) => (
            <MenuItem key={percentile} value={percentile}>
              <Checkbox checked={percentileSelections.indexOf(percentile) > -1} />
              <ListItemText primary={`${percentile}%`} />
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl sx={{ m: 1, width: 300 }}>
        <InputLabel id="completion-criteria-select-label">Completion Criteria</InputLabel>
        <Select
          labelId="completion-criteria-select-label"
          id="completion-criteria-select"
          value={completionCriteria}
          onChange={handleCompletionCriteriaChange}
          input={<OutlinedInput label="Completion Criteria" />}
        >
          <MenuItem value="last">Last Column</MenuItem>
          <MenuItem value="all">All Columns</MenuItem>
        </Select>
      </FormControl>
      <FormGroup>
        <FormControlLabel
          control={
            <Checkbox
              checked={showCalculationDetails}
              onChange={handleShowCalculationDetailsChange}
              name="showCalculationDetails"
            />
          }
          label="Show calculation details"
        />
      </FormGroup>
      {showCalculationDetails && (
        <>
          <h3>General</h3>
          <a
            href={generateJiraIssuesUrl(tasksInLastColumn, jiraDomain)}
            target="_blank"
            rel="noreferrer"
          >
            Percentile Tasks Overview
          </a>
          <ul>
            {percentileData.map((percentile) => (
              <li key={percentile.label.text}>
                {percentile.label.text}: {percentile.value} days
              </li>
            ))}
          </ul>
          <ColumnPercentilesDetails columnPercentiles={columnPercentiles} />
        </>
      )}
    </>
  );
}

export default AgingChart;
