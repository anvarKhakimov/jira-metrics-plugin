// hooks/usePercentileData.js
import { useMemo } from 'react';
import { prepareHistogramArray, calculateXPercentile } from '../utils/utils'; // Предполагается, что эти функции экспортируются из utils

const usePercentileData = (displayedTasks) => {
  const percentileData = useMemo(() => {
    const histogramData = prepareHistogramArray(displayedTasks);
    const maxDay =
      histogramData.length > 0 ? Math.max(...histogramData.map((data) => data.leadTime)) : 0;
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

  // Helper function to assign colors to percentiles
  function getPercentileColor(percentile) {
    if (percentile === 30) return 'green';
    if (percentile === 50) return 'yellowgreen';
    if (percentile === 70) return 'orange';
    if (percentile === 85) return 'salmon';
    if (percentile === 95) return 'red';
  }

  return percentileData;
};

export default usePercentileData;
