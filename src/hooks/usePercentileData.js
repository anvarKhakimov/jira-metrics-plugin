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
          color: '#000000',
        },
      },
      color: '#000000',
      dashStyle: 'Dot',
      width: 2,
      value: percentileValues[index],
      zIndex: 3,
    }));
  }, [displayedTasks]);

  return percentileData;
};

export default usePercentileData;
