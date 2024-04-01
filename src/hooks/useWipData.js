// hooks/useWipData.js
import { useMemo } from 'react';

const useWipData = (cfdData, selectedColumns, displayedTasks, timeframeFrom, timeframeTo) => {
  const wipData = useMemo(
    () =>
      cfdData.columns
        .filter((col) => selectedColumns.includes(col.name))
        .map((col, colIndex) => {
          const taskDots = Object.values(displayedTasks).filter((task) => {
            const currentColumnIndex = cfdData.columns.findIndex((c) => c.name === col.name);
            const startTimes = task.starts[currentColumnIndex] || [];
            const endTimes = task.ends[currentColumnIndex] || [];
            const lastStartTime = startTimes.length > 0 ? Math.max(...startTimes) : null;
            const isInCurrentColumn =
              lastStartTime !== null &&
              (endTimes.length === 0 || lastStartTime >= endTimes[endTimes.length - 1]);
            const lastStartDate = lastStartTime
              ? new Date(lastStartTime).toISOString().split('T')[0]
              : null;
            return (
              isInCurrentColumn && lastStartDate >= timeframeFrom && lastStartDate <= timeframeTo
            );
          });

          return {
            x: colIndex,
            y: 0,
            label: `WIP: ${taskDots.length}`,
          };
        }),
    [cfdData, selectedColumns, displayedTasks, timeframeFrom, timeframeTo]
  );

  return wipData;
};

export default useWipData;
