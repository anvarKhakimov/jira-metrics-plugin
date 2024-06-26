import React, { useState, useEffect } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import CustomTooltip from './CustomTooltip';

function Histogram({ histogramData }) {
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const chartWidth = windowWidth - 50;

  // Расчет накопленного среднего
  const accumulatedAverageData = histogramData.reduce(
    (acc, curr, index) => {
      if (curr.count > 0) {
        const totalThroughput = acc.totalThroughput + curr.count;
        const averageThroughput = totalThroughput / (acc.count + 1);
        acc.data.push({ ...curr, accumulatedAverage: averageThroughput });
        acc.totalThroughput = totalThroughput;
        acc.count++;
      } else {
        acc.data.push({
          ...curr,
          accumulatedAverage: acc.count > 0 ? acc.totalThroughput / acc.count : null,
        });
      }
      return acc;
    },
    { data: [], totalThroughput: 0, count: 0 }
  ).data;

  return (
    <div>
      <h3>Throughput Chart</h3>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          width={chartWidth}
          height={300}
          data={accumulatedAverageData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 0, 0, 0.1)" />
          <XAxis dataKey="interval" label={{ value: '', position: 'bottom' }} />
          <YAxis
            yAxisId="left"
            width={40}
            label={{
              value: 'Number of Issues',
              angle: -90,
              position: 'insideLeft',
              style: { fontSize: '10px', textAnchor: 'middle' },
            }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            width={40}
            label={{
              value: 'Accumulated Average',
              angle: 90,
              position: 'insideRight',
              style: { fontSize: '10px', textAnchor: 'middle' },
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="count" fill="#8884d8" name="Number of Issues" yAxisId="left" />

          <Line
            type="monotone"
            dataKey="accumulatedAverage"
            stroke="#ff7300"
            strokeWidth={1}
            dot={false}
            name="Accumulated Average"
            connectNulls
            yAxisId="right"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Histogram;
