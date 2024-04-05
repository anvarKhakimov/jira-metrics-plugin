import { useMemo } from 'react';
import { calculatePercentile } from '../utils/utils'; // функция для расчета X-го процентиля

const useColumnPercentiles = (cfdData, selectedColumns, displayedTasks, percentilesList = []) => {
  const msInDay = 86400000;

  // Проверяем, переданы ли допустимые процентили
  const allowedPercentiles = [30, 50, 70, 85, 95];
  const percentiles = percentilesList.filter((p) => allowedPercentiles.includes(p));
  percentiles.sort((a, b) => a - b);

  const columnPercentiles = useMemo(() => {
    // Если процентили не переданы, возвращаем пустой массив
    if (percentiles.length === 0) {
      return [];
    }

    const filteredColumnIndices = cfdData.columns
      .map((col, index) => ({ name: col.name, index }))
      .filter((col) => selectedColumns.includes(col.name));

    return filteredColumnIndices.map(({ name, index: columnIndex }) => {
      const accumulatedTimes = Object.values(displayedTasks).map((task) => {
        let accumulatedTime = 0;
        for (let { index } of filteredColumnIndices) {
          if (task.durations[index] !== undefined) {
            accumulatedTime += task.durations[index];
            if (index === columnIndex) break;
          }
        }
        return accumulatedTime / msInDay;
      });

      // Расчет процентилей для времен только для указанных процентилей
      const percentileValues = percentiles.map((p) => ({
        percentile: p,
        value: calculatePercentile(accumulatedTimes.filter(Boolean), p),
      }));

      // Формирование сегментов на основе процентилей
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
      };
    });
  }, [cfdData.columns, displayedTasks, selectedColumns, percentiles]);

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
