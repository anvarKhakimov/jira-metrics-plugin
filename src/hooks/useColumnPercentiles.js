import { useMemo } from 'react';
import { calculateExactPercentile } from '../utils/utils';

const useColumnPercentiles = (
  cfdData,
  activeColumns,
  displayedTasks,
  percentilesList = [],
  completionCriteria
) => {
  const msInDay = 86400000;
  const allowedPercentiles = [30, 50, 70, 85, 95];
  const percentiles = percentilesList.filter((p) => allowedPercentiles.includes(p));
  percentiles.sort((a, b) => a - b);

  const columnPercentiles = useMemo(() => {
    if (percentiles.length === 0) {
      return [];
    }

    const filteredColumnIndices =
      completionCriteria === 'last' ? activeColumns.slice(0, -1) : [...activeColumns];

    return filteredColumnIndices.map(({ name, index: columnIndex }) => {
      // Сбор детализированных данных о лидтаймах задач
      const taskDetails = Object.entries(displayedTasks).map(([taskId, task]) => {
        let accumulatedTime = 0;
        const detailTimes = [];

        for (let { index, name: columnName } of filteredColumnIndices) {
          const duration = task.durations[index] || 0;
          accumulatedTime += duration;
          detailTimes.push({ columnName, duration });

          if (index === columnIndex) break;
        }

        return {
          taskId,
          accumulatedTime: accumulatedTime / msInDay,
          detailTimes,
        };
      });

      const accumulatedTimes = taskDetails
        .map(({ accumulatedTime }) => accumulatedTime)
        .filter((time) => time > 0)
        .sort((a, b) => a - b);

      const percentileValues = percentiles.map((p) => ({
        percentile: p,
        value: calculateExactPercentile(accumulatedTimes, p),
      }));

      const segments = percentileValues.map((percentileData, index) => ({
        from: index === 0 ? 0 : percentileValues[index - 1].value,
        to: percentileData.value,
        percentile: percentileData.percentile,
        color: getPercentileColor(percentileData.percentile),
      }));

      if (percentileValues.length > 0) {
        const lastPercentileValue = percentileValues[percentileValues.length - 1].value;
        segments.push({
          from: lastPercentileValue,
          to: 9999,
          percentile: `Above ${percentiles[percentiles.length - 1]}`,
          color: '#FF9AA2',
        });
      }

      return {
        column: columnIndex,
        name,
        segments,
        sortedAccumulatedTimes: accumulatedTimes, // Отсортированные и отфильтрованные значения для отладки
        percentileCalculations: percentileValues,
        taskDetails,
      };
    });
  }, [cfdData.columns, displayedTasks, activeColumns, percentiles, completionCriteria]);

  function getPercentileColor(percentile) {
    if (percentile === 30) return '#8EDFC2';
    if (percentile === 50) return '#B5EBD7';
    if (percentile === 70) return '#FFDAA8';
    if (percentile === 85) return '#FFC4A8';
    if (percentile === 95) return '#FFB4BA';
    return '#FF9AA2'; // Default color for >95 percentile
  }

  return columnPercentiles;
};

export default useColumnPercentiles;
