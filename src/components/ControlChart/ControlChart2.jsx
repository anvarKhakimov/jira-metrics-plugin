import React, { useMemo } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsMore from 'highcharts/highcharts-more';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Filters from '../Filters/Filters';

function ControlChart2() {
  const { cfdData } = useJiraDataContext();
  const { displayedTasks, selectedColumns, timeframeFrom, timeframeTo } = useChartDataContext();

  const timeframeFromTimestamp = new Date(timeframeFrom).getTime();

  HighchartsMore(Highcharts);

  const transformedData = useMemo(
    () =>
      Object.entries(displayedTasks).map(([taskId, taskData]) => {
        const relevantStarts = Object.entries(taskData.starts)
          .filter(([columnId]) => selectedColumns.includes(cfdData.columns[columnId].name))
          .map(([, dates]) => Math.max(...dates));

        const latestStart = Math.max(...relevantStarts);
        const leadTimeInDays = Math.ceil(taskData.leadTime / (1000 * 60 * 60 * 24));

        return {
          x: latestStart,
          y: leadTimeInDays,
          name: taskId,
        };
      }),
    [displayedTasks, selectedColumns, cfdData.columns]
  );

  console.log('transformedData', transformedData);

  const Y_AXIS_THRESHOLD = 2;

  const { groups, groupIds } = useMemo(() => {
    const groups = [];
    const groupIds = new Set(); // Для хранения идентификаторов задач в группах, где количество задач больше 1

    transformedData.forEach((task) => {
      let foundGroup = false;
      for (const group of groups) {
        if (Math.abs(group.y - task.y) <= Y_AXIS_THRESHOLD) {
          group.tasks.push(task.name);
          group.count += 1;
          if (group.count > 1) {
            // Добавляем все задачи группы в groupIds, если в группе больше 1 задачи
            group.tasks.forEach((taskId) => groupIds.add(taskId));
          }
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) {
        groups.push({
          x: task.x,
          y: task.y,
          tasks: [task.name],
          count: 1,
        });
      }
    });

    return { groups, groupIds };
  }, [transformedData, Y_AXIS_THRESHOLD]);

  console.log('Исходные данные (groups):', groups);

  console.log('Исходные данные (transformedData):', transformedData);
  console.log('Идентификаторы группированных задач (groupIds):', groupIds);

  const filteredTransformedData = useMemo(() => {
    const result = transformedData.filter((task) => !groupIds.has(task.name));
    console.log('Отфильтрованные данные (filteredTransformedData):', result);
    return result;
  }, [transformedData, groupIds]);

  const clusterSeriesData = groups
    .filter((group) => group.count > 1)
    .map((group) => ({
      x: group.x,
      y: group.y,
      name: `Tasks: ${group.tasks.join(', ')}`,
      marker: {
        radius: 5 + Math.sqrt(group.count), // Радиус зависит от количества задач в группе
      },
    }));

  console.log('groupedTasks', clusterSeriesData);

  // Сначала сортируем данные по дате начала
  const sortedData = useMemo(() => transformedData.sort((a, b) => a.x - b.x), [transformedData]);

  // Расчет скользящего среднего
  const rollingAverageData = useMemo(() => {
    const windowSize = Math.max(5, Math.floor(sortedData.length * 0.2) | 1); // Используем 20% от общего числа задач
    const halfWindow = Math.floor(windowSize / 2);

    return sortedData.map((point, index, array) => {
      let sum = 0;
      let count = 0;

      for (
        let i = Math.max(0, index - halfWindow);
        i <= Math.min(array.length - 1, index + halfWindow);
        i++
      ) {
        sum += array[i].y; // Суммируем время выполнения в днях
        count += 1;
      }

      return {
        x: point.x, // Используем ту же дату начала
        y: sum / count, // Среднее значение времени выполнения
        name: point.name, // Идентификатор задачи
      };
    });
  }, [sortedData]);

  // Расчет стандартного отклонения для скользящего среднего
  const calculateStandardDeviation = (data, mean) => {
    const squareDiffs = data.map((value) => {
      const diff = value - mean;
      return diff * diff;
    });
    const avgSquareDiff = squareDiffs.reduce((sum, value) => sum + value, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  };

  // Вычисление стандартного отклонения для каждой точки
  const standardDeviationData = rollingAverageData.map((point, index, array) => {
    const windowSize = Math.max(5, Math.floor(array.length * 0.2) | 1);
    const halfWindow = Math.floor(windowSize / 2);
    const start = Math.max(0, index - halfWindow);
    const end = Math.min(array.length - 1, index + halfWindow);
    const windowData = array.slice(start, end + 1).map((p) => p.y);
    const mean = windowData.reduce((sum, value) => sum + value, 0) / windowData.length;
    const standardDeviation = calculateStandardDeviation(windowData, mean);

    return {
      x: point.x,
      low: mean - standardDeviation,
      high: mean + standardDeviation,
    };
  });

  const options = {
    chart: {
      type: 'scatter',
      zoomType: 'x', // Включает возможность зума по горизонтальной оси
      panning: true, // Позволяет передвигать график после зума
      panKey: 'shift',
    },
    title: {
      text: 'Control Chart',
      align: 'left',
    },
    xAxis: {
      title: {
        text: 'Issue Transition Date',
      },
      type: 'datetime',
      min: timeframeFromTimestamp,
      crosshair: {
        snap: false, // Отключаем привязку для crosshair на оси X
        width: 1, // Тонкая линия для crosshair
        color: 'gray', // Цвет линии crosshair
      },
    },
    yAxis: {
      title: {
        text: 'Lead Time',
      },
      tickInterval: 50,
    },
    plotOptions: {
      series: {
        point: {
          events: {
            click() {
              const { chart } = this.series;
              chart.tooltip.options.enabled = true; // Включаем подсказку
              chart.tooltip.refresh(this); // Показываем подсказку для текущей точки
              chart.tooltip.options.enabled = false; // Сразу же отключаем подсказку, чтобы она не появлялась при наведении
            },
          },
        },
      },
    },

    tooltip: {
      enabled: false, // Отключаем автоматическое появление подсказок
      shared: true,
      formatter() {
        // Форматирование вывода информации в подсказке
        return `Задача: ${this.point.name}`;
      },
    },
    series: [
      {
        name: 'Issues',
        data: filteredTransformedData,
        marker: {
          radius: 4,
        },
      },
      {
        name: 'Cluster',
        type: 'scatter',
        data: clusterSeriesData,
        tooltip: {
          pointFormat: '{point.name}',
        },
        marker: {
          symbol: 'circle',
        },
        linkedTo: ':previous',
      },
      {
        type: 'line',
        name: 'Rolling Average',
        data: rollingAverageData.map((task) => [task.x, task.y]),
        color: 'blue',
        marker: {
          enabled: false,
        },
        enableMouseTracking: false,
      },
      {
        name: 'Standard Deviation',
        type: 'arearange',
        data: standardDeviationData,
        lineWidth: 0,
        // linkedTo: ':previous', // Связываем с предыдущей серией (Rolling Average)
        color: Highcharts.getOptions().colors[0],
        fillOpacity: 0.3,
        zIndex: 0,
        marker: {
          enabled: false,
        },
        enableMouseTracking: false,
      },
    ],
    credits: {
      enabled: false,
    },
  };

  return (
    <div>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '500px' } }}
      />
      <br />
      <Filters showResolution={false} />
    </div>
  );
}

export default ControlChart2;
