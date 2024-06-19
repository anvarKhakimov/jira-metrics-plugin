import React, { useState, useEffect } from 'react';
import { BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar } from 'recharts';
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

  console.log('histogramData', histogramData);

  return (
    <div>
      <h3>Throughput Histogram</h3>

      <BarChart
        width={chartWidth}
        height={300}
        data={histogramData}
        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="2 2" stroke="rgba(0, 0, 0, 0.1)" />
        <XAxis dataKey="interval" label={{ value: 'Interval', position: 'bottom' }} />
        <YAxis
          width={40}
          label={{
            value: 'Number of Tasks',
            angle: -90,
            position: 'insideLeft',
            style: { fontSize: '10px', textAnchor: 'middle' },
          }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" fill="#8884d8" name="Number of Tasks" />
      </BarChart>
    </div>
  );
}

export default Histogram;
