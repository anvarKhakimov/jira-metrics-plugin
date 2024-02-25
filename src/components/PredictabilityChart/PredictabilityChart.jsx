import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from 'recharts';
import { useJiraDataContext } from '../../contexts/JiraDataContext';
import { useChartDataContext } from '../../contexts/ChartDataContext';
import { prepareFilteredTasks, prepareHistogramArray } from '../../utils/utils';
import Filters from '../Filters/Filters';

const calculatePercentile = (arr, percentile) => {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100.0) * sorted.length) - 1;
  return sorted[index];
};

function linearRegression(data) {
  const n = data.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  data.forEach((point, index) => {
    sumX += index;
    sumY += point;
    sumXY += index * point;
    sumXX += index * index;
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

function addTrendData(chartData) {
  const trendValues = chartData.map((item) => item.predictability);
  const { slope, intercept } = linearRegression(trendValues);

  return chartData.map((item, index) => ({
    ...item,
    trend: parseFloat((intercept + slope * index).toFixed(1)),
  }));
}

function PredictabilityChart() {
  const { cfdData } = useJiraDataContext();
  const { tasks, selectedColumns, resolution } = useChartDataContext();
  const [details, setDetails] = useState({});
  const [showCalculations, setShowCalculations] = useState(false);
  const columns = cfdData ? cfdData.columns : [];

  const handleCheckboxChange = (event) => {
    setShowCalculations(event.target.checked);
  };

  const data = useMemo(() => {
    const chartData = [];
    const detailsByMonth = {}; // Для хранения деталей по месяцам
    const currentDate = new Date();

    for (let i = 0; i < 6; i += 1) {
      const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const nextMonthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 1);

      const dataTimeframeFrom = monthDate.toISOString().split('T')[0];
      const dataTimeframeTo = nextMonthDate.toISOString().split('T')[0];

      // Создание filteredTasks
      const filteredTasks = prepareFilteredTasks(
        tasks,
        columns,
        selectedColumns,
        dataTimeframeFrom,
        dataTimeframeTo
      );

      // Создание histogramArray с использованием filteredTasks
      const histogramArray = prepareHistogramArray(filteredTasks, resolution);

      const leadTimes = histogramArray.flatMap((item) => Array(item.count).fill(item.leadTime));
      const taskIds = histogramArray.map((item) => item.tasks).flat(); // Собираем ID задач
      const p95 = calculatePercentile(leadTimes, 95);
      const p50 = calculatePercentile(leadTimes, 50);

      const monthKey = monthDate.toLocaleString('default', {
        month: 'long',
        year: 'numeric',
      });
      chartData.push({
        name: monthKey,
        predictability: p95 / p50,
      });

      // Сохраняем детали для каждого месяца
      detailsByMonth[monthKey] = {
        leadTimes,
        taskIds,
        p95,
        p50,
        taskCount: taskIds.length,
      };
    }

    setDetails(detailsByMonth); // Обновляем состояние с деталями

    // Отфильтровываем месяцы без данных (где p95 или p50 равны NaN или Infinity)
    const filteredChartData = chartData.filter(
      (item) => Number.isFinite(item.predictability) && !Number.isNaN(item.predictability)
    );

    return addTrendData(
      filteredChartData.reverse().map((item) => ({
        ...item,
        predictability: parseFloat(item.predictability.toFixed(1)),
      }))
    );
  }, [tasks, columns, selectedColumns, resolution]);

  return (
    <div>
      <h3>Predictability Chart (95% / 50%)</h3>

      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis
            width={40}
            label={{
              value: 'Ratio to median (95% / 50%)',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '10px', textAnchor: 'middle' },
            }}
          />
          <Tooltip />
          <Line type="monotone" dataKey="predictability" stroke="#8884d8">
            <LabelList dataKey="predictability" position="top" />
          </Line>
          <Line
            type="monotone"
            dataKey="trend"
            stroke="#82ca9d"
            strokeDasharray="5 5"
            strokeOpacity={0.7}
          />
        </LineChart>
      </ResponsiveContainer>

      <br />

      <Filters showTimeframe={false} />

      <br />

      <label htmlFor="showCalculations">
        <input
          id="showCalculations"
          type="checkbox"
          checked={showCalculations}
          onChange={handleCheckboxChange}
        />
        Show calculation details
      </label>

      {showCalculations && (
        <div className="chart-details">
          {Object.entries(details).map(([month, detail]) => (
            <div key={month}>
              <h3>Детали для {month}</h3>
              <p>95-й процентиль: {detail.p95}</p>
              <p>50-й процентиль: {detail.p50}</p>
              <p>Количество задач: {detail.taskCount}</p>
              <p>Задачи: {detail.taskIds.join(', ')}</p>
              <p>Лидтаймы: {detail.leadTimes.join(', ')}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PredictabilityChart;
