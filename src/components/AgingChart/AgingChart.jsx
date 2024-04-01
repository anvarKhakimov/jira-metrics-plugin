// AgingChart.jsx

import React, { useEffect, useRef, useMemo } from 'react';
import Highcharts from 'highcharts';
import AnnotationsModule from 'highcharts/modules/annotations';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';

import useAgingData from '../../hooks/useAgingData';
import useWipData from '../../hooks/useWipData';
import usePercentileData from '../../hooks/usePercentileData';
import useTasksInLastColumn from '../../hooks/useTasksInLastColumn';
import useColumnPercentiles from '../../hooks/useColumnPercentiles';

import Filters from '../Filters/Filters';

AnnotationsModule(Highcharts);

function AgingChart() {
  const chartRef = useRef(null);
  const { timeframeFrom, timeframeTo, selectedColumns } = useGlobalSettings();
  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { tasks, displayedTasks } = useChartDataContext();
  const jiraDomain = new URL(jiraBaseUrl).origin;

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
        zIndex: 1,
        shapes,
      };
    });

  const agingData = useAgingData(cfdData, selectedColumns, tasks, timeframeFrom, timeframeTo);

  const wipData = useWipData(cfdData, selectedColumns, displayedTasks, timeframeFrom, timeframeTo);

  const tasksInLastColumn = useTasksInLastColumn(cfdData, selectedColumns, displayedTasks);

  const percentileData = usePercentileData(tasksInLastColumn);

  const columnPercentiles = useColumnPercentiles(cfdData, selectedColumns, tasksInLastColumn);

  console.log('columnPercentiles', columnPercentiles);

  // const columnPercentiles = [
  //   {
  //     column: 0,
  //     segments: [
  //       { from: 0, to: 30, color: 'rgba(0, 128, 0, 0.5)' }, // Зеленый с прозрачностью 50%
  //       { from: 30, to: 50, color: 'rgba(173, 255, 47, 0.5)' }, // Желто-зеленый с прозрачностью 50%
  //       { from: 50, to: 70, color: 'rgba(255, 165, 0, 0.5)' }, // Оранжевый с прозрачностью 50%
  //       { from: 70, to: 85, color: 'rgba(250, 128, 114, 0.5)' }, // Лососевый (salmon) с прозрачностью 50%
  //       { from: 85, to: 95, color: 'rgba(255, 0, 0, 0.5)' }, // Красный с прозрачностью 50%
  //       { from: 95, to: 100, color: 'rgba(139, 0, 0, 0.5)' }, // Темно-красный (darkred) с прозрачностью 50%
  //     ],
  //   },
  //   // Добавьте другие столбцы по аналогии
  // ];

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
      },
      annotations: generateAnnotationsFromPercentiles(columnPercentiles),
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
            lineColor: 'green',
            fillColor: 'green',
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
            //align: 'left',
            //verticalAlign: 'top',
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
      //     headerFormat: '<table><tr><th colspan="2">Cycle Time: {point.key}</th></tr>',
      //     pointFormat: '<tr><td style="color: {series.color}">{series.name} ' +
      //         '</td>' +
      //         '<td style="text-align: right"><b>{point.y} EUR</b></td></tr>',
      //   },
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
  }, [selectedColumns, agingData, wipData, percentileData, cfdData.columns]);

  return (
    <>
      <div ref={chartRef} style={{ width: '100%' }} />
      <br />
      <Filters showResolution={false} />
    </>
  );
}

export default AgingChart;
