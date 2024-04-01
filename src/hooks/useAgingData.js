import { useMemo } from 'react';
import { convertTimeToResolution, getColumnIndexByName, calculateLeadTime } from '../utils/utils';

const useAgingData = (cfdData, selectedColumns, tasks, timeframeFrom, timeframeTo) => {
  const agingData = useMemo(() => {
    const selectedColumnIndices = selectedColumns.map((columnName) =>
      getColumnIndexByName(cfdData.columns, columnName)
    );

    return cfdData.columns
      .filter((col) => selectedColumns.includes(col.name))
      .map((col, colIndex) => {
        const taskDots = Object.values(tasks)
          .map((task) => ({
            ...task,
            leadTime: calculateLeadTime(task, selectedColumnIndices), // Добавляем расчёт leadTime
          }))
          .filter((task) => {
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
            return isInCurrentColumn; // && lastStartDate >= timeframeFrom && lastStartDate <= timeframeTo
          })
          .map((task) => {
            const agingTime = convertTimeToResolution(task.leadTime);
            return {
              x: colIndex,
              y: agingTime,
              taskKey: task.key,
              agingTime,
            };
          });

        const groupedTaskDots = taskDots.reduce((acc, dot) => {
          const existingGroup = acc.find((group) => Math.abs(group.y - dot.y) <= 5);
          if (existingGroup) {
            existingGroup.taskCount++;
            existingGroup.tasks.push({ taskKey: dot.taskKey, agingTime: dot.agingTime });
          } else {
            acc.push({
              ...dot,
              taskCount: 1,
              tasks: [{ taskKey: dot.taskKey, agingTime: dot.agingTime }],
            });
          }
          return acc;
        }, []);

        return {
          name: col.name,
          data: groupedTaskDots,
        };
      });
  }, [cfdData, selectedColumns, tasks, timeframeFrom, timeframeTo]);

  return agingData;
};

export default useAgingData;
