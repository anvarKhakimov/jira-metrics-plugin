import { useMemo } from 'react';
import { calculatePercentile } from '../utils/utils'; // функция для расчета X-го процентиля

const useColumnPercentiles = (cfdData, selectedColumns, displayedTasks) => {
  const msInDay = 86400000;

  const columnPercentiles = useMemo(() => {
    // Получаем индексы выбранных колонок и их названия
    const filteredColumnIndices = cfdData.columns
      .map((col, index) => ({ name: col.name, index }))
      .filter((col) => selectedColumns.includes(col.name));

    return filteredColumnIndices.map(({ name, index: columnIndex }) => {
      // Для каждой выбранной колонки считаем накопленное время
      const accumulatedTimes = Object.values(displayedTasks).map((task) => {
        let accumulatedTime = 0;
        // Накапливаем время до текущей колонки включительно
        for (let { index } of filteredColumnIndices) {
          if (task.durations[index] !== undefined) {
            accumulatedTime += task.durations[index];
            if (index === columnIndex) break;
          }
        }
        return accumulatedTime / msInDay; // Преобразуем в дни
      });

      // Расчет процентилей для времен
      const percentiles = [30, 50, 70, 85, 95];
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

      return {
        column: columnIndex,
        name,
        segments,
      };
    });
  }, [cfdData.columns, displayedTasks, selectedColumns]);

  // Helper function to assign colors to percentiles
  function getPercentileColor(percentile) {
    if (percentile === 30) return 'rgba(0, 128, 0, 0.5)';
    if (percentile === 50) return 'rgba(173, 255, 47, 0.5)';
    if (percentile === 70) return 'rgba(255, 165, 0, 0.5)';
    if (percentile === 85) return 'rgba(250, 128, 114, 0.5)';
    if (percentile === 95) return 'rgba(255, 0, 0, 0.5)';
    return 'rgba(139, 0, 0, 0.5)'; // Default color for >95 percentile
  }

  return columnPercentiles;
};

export default useColumnPercentiles;
