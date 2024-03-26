// AgingChart.jsx

import React, { useEffect, useRef, useMemo } from 'react';
import Highcharts from 'highcharts';
import { useGlobalSettings } from '../../contexts/GlobalSettingsContext';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Filters from '../Filters/Filters';
import {
  convertTimeToResolution,
  prepareHistogramArray,
  calculateXPercentile,
} from '../../utils/utils';

const calculatePercentile = (arr, percentile) => {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100.0) * sorted.length) - 1;
  return sorted[index];
};

function AgingChart() {
  const chartRef = useRef(null);
  const { timeframeFrom, timeframeTo, selectedColumns } = useGlobalSettings();
  const { cfdData, jiraBaseUrl } = useJiraDataContext();
  const { displayedTasks } = useChartDataContext();
  const jiraDomain = new URL(jiraBaseUrl).origin;

  const agingData = useMemo(
    () =>
      cfdData.columns
        .filter((col) => selectedColumns.includes(col.name))
        .map((col, colIndex) => {
          const taskDots = Object.values(displayedTasks)
            .filter((task) => {
              const currentColumnIndex = cfdData.columns.findIndex((c) => c.name === col.name);
              const startTimes = task.starts[currentColumnIndex] || [];
              const endTimes = task.ends[currentColumnIndex] || [];

              // Находим последнюю метку времени начала для текущей колонки
              const lastStartTime = startTimes.length > 0 ? Math.max(...startTimes) : null;

              // Проверяем, находится ли задача в текущей колонке
              const isInCurrentColumn =
                lastStartTime !== null &&
                (endTimes.length === 0 || lastStartTime >= endTimes[endTimes.length - 1]);

              // Проверяем, попадает ли последняя метка времени начала в выбранный диапазон времени
              const lastStartDate = lastStartTime
                ? new Date(lastStartTime).toISOString().split('T')[0]
                : null;
              const isInTimeframe =
                isInCurrentColumn && lastStartDate >= timeframeFrom && lastStartDate <= timeframeTo;

              return isInTimeframe;
            })
            .map((task) => {
              const agingTime = convertTimeToResolution(task.leadTime);
              return {
                x: colIndex,
                y: agingTime,
                taskKey: task.key,
                agingTime,
              };
            });

          // Группировка точек с одинаковым Cycle Time в рамках колонки
          const groupedTaskDots = taskDots.reduce((acc, dot) => {
            const existingGroup = acc.find((group) => Math.abs(group.y - dot.y) <= 5); //@TODO придумать как группировать в зависимости от размера оси Y
            if (existingGroup) {
              existingGroup.taskCount++;
              existingGroup.tasks.push({ taskKey: dot.taskKey, agingTime: dot.agingTime });
            } else {
              acc.push({
                ...dot,
                taskCount: 1,
                tasks: [{ taskKey: dot.taskKey, agingTime: dot.agingTime }],
              });
            }
            return acc;
          }, []);

          return {
            name: col.name,
            data: groupedTaskDots,
          };
        }),
    [selectedColumns, displayedTasks, timeframeFrom, timeframeTo, cfdData.columns]
  );

  const wipData = useMemo(
    () =>
      cfdData.columns
        .filter((col) => selectedColumns.includes(col.name))
        .map((col, colIndex) => {
          const taskDots = Object.values(displayedTasks).filter((task) => {
            const currentColumnIndex = cfdData.columns.findIndex((c) => c.name === col.name);
            const startTimes = task.starts[currentColumnIndex] || [];
            const endTimes = task.ends[currentColumnIndex] || [];

            // Находим последнюю метку времени начала для текущей колонки
            const lastStartTime = startTimes.length > 0 ? Math.max(...startTimes) : null;

            // Проверяем, находится ли задача в текущей колонке
            const isInCurrentColumn =
              lastStartTime !== null &&
              (endTimes.length === 0 || lastStartTime >= endTimes[endTimes.length - 1]);

            // Проверяем, попадает ли последняя метка времени начала в выбранный диапазон времени
            const lastStartDate = lastStartTime
              ? new Date(lastStartTime).toISOString().split('T')[0]
              : null;
            const isInTimeframe =
              isInCurrentColumn && lastStartDate >= timeframeFrom && lastStartDate <= timeframeTo;

            return isInTimeframe;
          });

          return {
            x: colIndex,
            y: 0,
            label: `WIP: ${taskDots.length}`,
          };
        }),
    [selectedColumns, displayedTasks, timeframeFrom, timeframeTo, cfdData.columns]
  );

  const percentileData = useMemo(() => {
    const histogramData = prepareHistogramArray(displayedTasks);
    // Вычисляем максимальное значение дня на основе данных гистограммы
    const maxDay =
      histogramData.length > 0 ? Math.max(...histogramData.map((data) => data.leadTime)) : 0;

    // Создаем полный набор данных гистограммы, включая дни без задач
    const completeHistogramData = Array.from({ length: maxDay + 1 }, (_, day) => ({
      days: day + 1,
      count: histogramData.find((data) => data.leadTime === day + 1)?.count || 0,
    }));

    const percentiles = [30, 50, 70, 85, 95];
    const percentileValues = percentiles.map((percentile) =>
      calculateXPercentile(completeHistogramData, percentile)
    );

    return percentiles.map((percentile, index) => ({
      label: {
        text: `${percentile}% ${percentileValues[index]}d`,
        align: 'right',
        x: 0,
        style: {
          color: getPercentileColor(percentile),
        },
      },
      color: getPercentileColor(percentile),
      dashStyle: 'Dot',
      width: 2,
      value: percentileValues[index],
      zIndex: 3,
    }));
  }, [displayedTasks]);

  useEffect(() => {
    const chartOptions = {
      chart: {
        type: 'scatter',
        zoomType: 'xy',
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

  // Helper function to assign colors to percentiles
  function getPercentileColor(percentile) {
    if (percentile === 30) return 'green';
    if (percentile === 50) return 'yellowgreen';
    if (percentile === 70) return 'orange';
    if (percentile === 85) return 'salmon';
    if (percentile === 95) return 'red';
  }

  const percentileInfo = useMemo(() => {
    const histogramData = prepareHistogramArray(displayedTasks);
    // Вычисляем максимальное значение дня на основе данных гистограммы
    const maxDay =
      histogramData.length > 0 ? Math.max(...histogramData.map((data) => data.leadTime)) : 0;

    // Создаем полный набор данных гистограммы, включая дни без задач
    const completeHistogramData = Array.from({ length: maxDay + 1 }, (_, day) => ({
      days: day + 1,
      count: histogramData.find((data) => data.leadTime === day + 1)?.count || 0,
    }));
    const percentiles = [50, 70, 85, 95];
    const percentileValues = percentiles.map((percentile) =>
      calculateXPercentile(completeHistogramData, percentile)
    );

    const allTasks = histogramData.flatMap((item) => item.tasks);
    const allLeadTimes = allTasks.map((task) => {
      const taskDetails = displayedTasks[task];
      return convertTimeToResolution(taskDetails.leadTime, 'day');
    });

    return {
      percentiles: percentiles.map((percentile, index) => ({
        percentile,
        value: percentileValues[index],
      })),
      allTasks,
      allLeadTimes,
    };
  }, [displayedTasks]);

  return (
    <>
      <div ref={chartRef} style={{ width: '100%' }}></div>
      <br />
      <Filters showResolution={false} />
      <br />
      <div>
        {/* <h3>Percentile Information</h3>
        {percentileInfo.percentiles.map((info) => (
          <div key={info.percentile}>
            <h4>
              {info.percentile}th Percentile: {info.value} days
            </h4>
          </div>
        ))} */}
        <h4>All Lead Times:</h4>
        <p>[{percentileInfo.allLeadTimes.join(', ')}]</p>
        <h4>All Tasks:</h4>
        <ul>
          {percentileInfo.allTasks.map((taskKey) => (
            <li key={taskKey}>{taskKey}</li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default AgingChart;
