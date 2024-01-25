/* eslint-disable react/no-this-in-sfc */
import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { schemePaired } from 'd3-scale-chromatic';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import Filters from '../Filters/Filters';

const formatDate = (timestamp) => {
  const date = new Date(timestamp);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Месяцы начинаются с 0
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

function CumulativeDiagram() {
  const [colors, setColors] = useState([]);
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);

  const { cfdData } = useJiraDataContext();

  const { displayedTasks, timeframeFrom, timeframeTo } = useChartDataContext();

  const handleChartClick = (data) => {
    if (data && data.tasksDetails) {
      const date = new Date(data.date);
      const { tasksDetails } = data;
      setSelectedDateDetails({ date, tasksDetails });
    }
  };

  useEffect(() => {
    const generatedColors = cfdData.columns.map(
      (_, index) => schemePaired[index % schemePaired.length]
    );
    setColors(generatedColors);
  }, [cfdData.columns]);

  const generateDateSeries = (start, end) => {
    const dates = [];
    const currentDate = new Date(start);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1); // увеличиваем на день
    }

    return dates;
  };

  const findEarliestStartDate = () => {
    let earliest = null;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    Object.values(displayedTasks).forEach((task) => {
      Object.values(task.starts).forEach((phaseStarts) => {
        phaseStarts.forEach((startTimestamp) => {
          const startDate = new Date(parseInt(startTimestamp, 10));
          if (startDate >= oneYearAgo && (!earliest || startDate < earliest)) {
            earliest = startDate;
          }
        });
      });
    });

    if (!earliest) {
      throw new Error('Начальная дата (startdate) отсутствует во всех задачах');
    }

    return earliest;
  };

  const earliestStartDate = findEarliestStartDate();
  const adjustedTimeframeFrom =
    new Date(timeframeFrom) > earliestStartDate ? new Date(timeframeFrom) : earliestStartDate;
  // const adjustedTimeframeFrom = new Date(timeframeFrom);
  const timeframeDates = generateDateSeries(adjustedTimeframeFrom, new Date(timeframeTo));

  const generateChartData = () => {
    const chartData = timeframeDates.map((date) => {
      const dataPoint = { date: date.getTime(), tasksDetails: {} };

      cfdData.columns.forEach((column) => {
        // Инициализация счетчика задач для каждой колонки
        dataPoint[column.name] = 0;
        // Правильное место для инициализации массива задач для каждого статуса
        dataPoint.tasksDetails[column.name] = [];

        Object.keys(displayedTasks).forEach((taskId) => {
          const task = displayedTasks[taskId];

          cfdData.columns.forEach((innerColumn, index) => {
            if (column.name !== innerColumn.name) return; // Пропускаем, если не совпадают названия колонок

            // Проверка, находится ли задача в текущей колонке на данную дату
            const phaseStarts = task.starts[index];
            const phaseEnds = task.ends[index];
            if (phaseStarts) {
              phaseStarts.forEach((startTimestamp, timestampIndex) => {
                const startDate = new Date(parseInt(startTimestamp, 10));
                const endDate =
                  phaseEnds && phaseEnds[timestampIndex]
                    ? new Date(parseInt(phaseEnds[timestampIndex], 10))
                    : new Date(); // Если нет времени окончания, считаем, что задача еще в колонке

                if (date >= startDate && date <= endDate) {
                  dataPoint[column.name] += 1;
                  dataPoint.tasksDetails[column.name].push(taskId);
                }
              });
            }
          });
        });
      });

      return dataPoint;
    });

    return chartData;
  };

  const chartData = generateChartData();

  // Опции для Highcharts
  const options = {
    chart: {
      type: 'area',
      events: {
        click(event) {
          // Получение координаты X клика относительно оси X
          const xValue = this.xAxis[0].toValue(event.chartX);

          // Преобразование координаты X в дату
          const clickedDate = new Date(xValue);

          // Найти ближайший объект данных в chartData по дате
          const closestDataPoint = chartData.reduce((prev, curr) =>
            Math.abs(curr.date - clickedDate) < Math.abs(prev.date - clickedDate) ? curr : prev
          );

          // Получение taskDetails из ближайшей точки данных
          const tasksDetails = closestDataPoint ? closestDataPoint.tasksDetails : null;

          // Вызов handleChartClick с найденными данными
          handleChartClick({
            date: new Date(closestDataPoint.date),
            tasksDetails,
          });
        },
      },
    },
    title: {
      text: 'Cumulative Flow Diagram',
      align: 'left',
    },
    xAxis: {
      type: 'datetime',
      labels: {
        formatter() {
          return formatDate(this.value);
        },
      },
    },
    yAxis: {
      title: {
        text: 'Number of Issues',
      },
    },
    tooltip: {
      shared: true,
      crosshairs: true,
      formatter() {
        let tooltip = `<b>${formatDate(this.x)}</b><br/>`;
        this.points.forEach((point) => {
          tooltip += `<span style="color:${point.series.color}">●</span> ${point.series.name}: <b>${point.y}</b><br/>`;
        });
        return tooltip;
      },
    },
    series: cfdData.columns.map((column, index) => ({
      name: column.name,
      data: chartData.map((point) => ({
        x: point.date,
        y: point[column.name],
        tasksDetails: point.tasksDetails,
      })),
      color: colors[index % colors.length],
    })),
    plotOptions: {
      area: {
        stacking: 'normal',
        marker: {
          enabled: false,
        },
      },
      series: {
        point: {
          events: {
            click() {
              const date = new Date(this.x);
              const { tasksDetails } = this;
              handleChartClick({ date, tasksDetails });
            },
          },
        },
      },
    },
    credits: {
      enabled: false,
    },
  };

  return (
    <>
      <HighchartsReact
        highcharts={Highcharts}
        options={options}
        containerProps={{ style: { height: '600px' } }}
      />
      <br />

      <Filters showResolution={false} />
      <br />
      {selectedDateDetails && (
        <div>
          <h3>Issues for {selectedDateDetails.date.toLocaleDateString()}:</h3>
          {Object.entries(selectedDateDetails.tasksDetails).map(([status, tasks]) => (
            <div key={status}>
              <h4>{status}</h4>
              <ul>
                {tasks.map((taskId) => (
                  <li key={taskId}>{taskId}</li> // Используем taskId в качестве ключа
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export default CumulativeDiagram;
