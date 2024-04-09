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

import { isDebug, generateJiraIssuesUrl } from '../../utils/utils';

AnnotationsModule(Highcharts);

function AgingChart() {
  const chartRef = useRef(null);
  const { timeframeFrom, timeframeTo, selectedColumns, activeColumns } = useGlobalSettings();
  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { tasks, displayedTasks } = useChartDataContext();
  const jiraDomain = new URL(jiraBaseUrl).origin;

  const [percentileSelections, setPercentileSelections] = useState([30, 50, 70, 85, 95]);
  const [completionCriteria, setCompletionCriteria] = useState('all');

  const percentilesOptions = [30, 50, 70, 85, 95];

  const handlePercentileChange = (event) => {
    setPercentileSelections(event.target.value);
  };

  const handleCompletionCriteriaChange = (event) => {
    setCompletionCriteria(event.target.value);
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
    percentileSelections,
    completionCriteria
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
              return this.point.taskCount > 1
                ? `<span style="stroke: none; color: #ffffff">${this.point.taskCount}</span>`
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
          const tasks = this.point.tasks.map((task) => {
            const taskId = task.taskKey;
            const agingTime = task.agingTime;
            return `<a href="${jiraDomain}/browse/${taskId}" target="_blank">${taskId}</a>: ${agingTime} days`;
          });
          return `${tasks.join('<br/>')}`;
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
          <MenuItem value="all">All Columns</MenuItem>
          <MenuItem value="last">Last Column</MenuItem>
        </Select>
      </FormControl>
      {isDebug && tasksInLastColumn && (
        <>
          <br />
          <a
            href={generateJiraIssuesUrl(tasksInLastColumn, jiraDomain)}
            target="_blank"
            rel="noreferrer"
          >
            Tasks For Percentilies
          </a>
          <ColumnPercentilesDetails columnPercentiles={columnPercentiles} />
        </>
      )}
    </>
  );
}

export default AgingChart;
