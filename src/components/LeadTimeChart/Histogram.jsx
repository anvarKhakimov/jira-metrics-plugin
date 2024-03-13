import React, { useState, useEffect } from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar, ReferenceLine } from 'recharts';
import CustomTooltip from './CustomTooltip';

function Histogram({ histogramData }) {
  // Вычисляем максимальное значение дня на основе данных гистограммы
  const maxDay =
    histogramData.length > 0 ? Math.max(...histogramData.map((data) => data.leadTime)) : 0;

  // Создаем полный набор данных гистограммы, включая дни без задач
  const completeHistogramData = Array.from({ length: maxDay + 1 }, (_, day) => ({
    days: day + 1,
    count: histogramData.find((data) => data.leadTime === day + 1)?.count || 0,
  }));

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartWidth = windowWidth - 40;

  function calculateXPercentile(data, percentile) {
    const weightedDays = data.flatMap((item) => Array(item.count).fill(item.days));
    const sortedDays = weightedDays.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sortedDays.length) - 1;
    return sortedDays[index] || 0;
  }

  const percentile95X = calculateXPercentile(completeHistogramData, 95);
  const percentile50X = calculateXPercentile(completeHistogramData, 50);

  return (
    <div>
      <h3>Lead Time Histogram</h3>

      <BarChart
        width={chartWidth}
        height={300}
        data={completeHistogramData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 0, 0, 0.1)" />
        <XAxis dataKey="days" label={{ value: 'Lead Time (days)', position: 'bottom' }} />
        <YAxis
          width={40} // устанавливаем фиксированную ширину оси
          label={{
            value: 'Number of Issues',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '10px', textAnchor: 'middle' },
          }}
        />
        <Tooltip content={<CustomTooltip histogramData={histogramData} />} />
        <Bar dataKey="count" fill="#8884d8" name="Number of Tasks" />
        <ReferenceLine
          x={percentile95X}
          stroke="red"
          label={{
            value: 'P95',
            angle: -90,
            position: 'top',
            style: { fontSize: '10px', textAnchor: 'end' },
          }}
        />
        {percentile50X > 1 && (
          <ReferenceLine
            x={percentile50X}
            stroke="blue"
            label={{
              value: 'P50',
              angle: -90,
              position: 'top',
              style: { fontSize: '10px', textAnchor: 'end' },
            }}
          />
        )}
      </BarChart>
    </div>
  );
}

export default Histogram;
